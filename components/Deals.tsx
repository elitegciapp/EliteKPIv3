import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Deal, DealStatus, DealType } from '../types';
import { Plus, Search, Filter, X, ChevronRight, DollarSign, Calendar, Clock, Percent } from 'lucide-react';

// Helper to calculate DOM based on status
const calculateDOM = (deal: Partial<Deal>): number | null => {
  if (deal.type !== DealType.SELLER || !deal.listingDate) return null;

  const start = new Date(deal.listingDate).getTime();
  let end = new Date().getTime(); // Default to today for Active

  if (deal.status === DealStatus.PENDING && deal.underContractDate) {
    end = new Date(deal.underContractDate).getTime();
  } else if (deal.status === DealStatus.CLOSED && deal.closeDate) {
    end = new Date(deal.closeDate).getTime();
  } else if (deal.status === DealStatus.ACTIVE_LISTING) {
    // end remains today
  } else {
    // For other statuses (Lead, Appointment), DOM usually doesn't apply or isn't calculated yet
    return null;
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays >= 0 ? diffDays : 0;
};

// Helper to calculate Sale-to-List Ratio
const calculateSaleToListRatio = (deal: Partial<Deal>): number | null => {
  if (deal.type !== DealType.SELLER || deal.status !== DealStatus.CLOSED || !deal.closedSalePrice || !deal.listPrice) {
    return null;
  }
  return (deal.closedSalePrice / deal.listPrice) * 100;
};

const BuyerStatuses = [
  DealStatus.LEAD,
  DealStatus.APPOINTMENT_SET,
  DealStatus.SHOWING,
  DealStatus.OFFER_WRITTEN,
  DealStatus.UNDER_CONTRACT,
  DealStatus.CLOSED,
  DealStatus.DEAD
];

const SellerStatuses = [
  DealStatus.LEAD,
  DealStatus.LISTING_APPOINTMENT,
  DealStatus.ACTIVE_LISTING,
  DealStatus.PENDING,
  DealStatus.CLOSED,
  DealStatus.DEAD
];

export const Deals = () => {
  const { deals, addDeal, updateDeal, getDealNetCommission, expenses } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Form State
  const initialFormState: Omit<Deal, 'id' | 'createdAt'> = {
    name: '',
    type: DealType.BUYER,
    status: DealStatus.LEAD,
    grossCommission: 0,
    closeDate: null,
    notes: '',
    // Seller Fields
    listPrice: 0,
    commissionPercentage: 0,
    listingDate: null,
    underContractDate: null,
    closedSalePrice: 0,
  };
  const [formData, setFormData] = useState(initialFormState);

  // Update Status options when Type changes
  useEffect(() => {
    // Reset status if it's invalid for the new type
    if (formData.type === DealType.BUYER && !BuyerStatuses.includes(formData.status)) {
        setFormData(prev => ({ ...prev, status: DealStatus.LEAD }));
    } else if (formData.type === DealType.SELLER && !SellerStatuses.includes(formData.status)) {
        setFormData(prev => ({ ...prev, status: DealStatus.LEAD }));
    }
  }, [formData.type]);

  const handleOpenModal = (deal?: Deal) => {
    if (deal) {
      setSelectedDeal(deal);
      setFormData({ ...deal });
    } else {
      setSelectedDeal(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Core Validation
    if (!formData.name) return alert('Deal Name / Address is required');
    
    // Seller Validation
    if (formData.type === DealType.SELLER) {
        if (formData.status === DealStatus.ACTIVE_LISTING) {
            if (!formData.listPrice || !formData.listingDate) {
                return alert('Active Listings require a List Price and Listing Date.');
            }
        }
        if (formData.status === DealStatus.PENDING) {
             if (!formData.underContractDate) {
                return alert('Pending deals require an Under Contract Date to calculate DOM.');
             }
             // Implicitly requires listing date too if we want DOM, but we check specific required transition fields
             if (!formData.listingDate) {
                 return alert('Missing Listing Date. Please enter when this property was listed.');
             }
        }
    }

    // Closed Validation (Both)
    if (formData.status === DealStatus.CLOSED) {
        if (!formData.grossCommission || !formData.closeDate) {
            return alert('Closed deals require Commission Amount and Close Date');
        }
        if (formData.type === DealType.SELLER && !formData.closedSalePrice) {
            return alert('Closed Seller deals require a Closed Sale Price.');
        }
    }

    if (selectedDeal) {
      updateDeal({ ...selectedDeal, ...formData });
    } else {
      addDeal({
        ...formData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  const filteredDeals = deals.filter(d => filterStatus === 'All' || d.status === filterStatus);
  const activeStatuses = formData.type === DealType.BUYER ? BuyerStatuses : SellerStatuses;

  // Stats for the header
  const activeDeals = deals.filter(d => d.status !== DealStatus.CLOSED && d.status !== DealStatus.DEAD).length;
  const closedDeals = deals.filter(d => d.status === DealStatus.CLOSED).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Deals Pipeline</h2>
          <p className="text-slate-500 mt-1 font-normal">Active transactions and history.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-sm text-sm font-medium text-slate-500">
                Active: <span className="text-navy font-bold ml-1">{activeDeals}</span>
            </div>
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-sm text-sm font-medium text-slate-500">
                Closed: <span className="text-navy font-bold ml-1">{closedDeals}</span>
            </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 text-sm font-medium rounded-sm hover:bg-navy-light transition-colors shadow-none"
          >
            <Plus size={16} />
            New Deal
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', ...new Set([...BuyerStatuses, ...SellerStatuses])].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm border whitespace-nowrap transition-colors ${
              filterStatus === status
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-navy'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p>No deals found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-400 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Property / Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Gross Comm.</th>
                <th className="px-6 py-4 text-right">Expenses</th>
                <th className="px-6 py-4 text-right">Net Comm.</th>
                <th className="px-6 py-4 text-right">Close Date</th>
                <th className="px-6 py-4 text-center">DOM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeals.map((deal) => {
                 const net = getDealNetCommission(deal);
                 const totalExp = deal.grossCommission - net;
                 const dom = calculateDOM(deal);
                 
                 return (
                <tr 
                    key={deal.id} 
                    onClick={() => handleOpenModal(deal)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-navy">{deal.name}</div>
                    <div className="text-xs text-slate-500 mt-1 inline-flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${deal.type === DealType.BUYER ? 'bg-navy' : 'bg-gold'}`}></span>
                        <span className="uppercase tracking-wide text-[10px] font-medium">{deal.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border
                      ${deal.status === DealStatus.CLOSED ? 'bg-slate-100 text-navy border-slate-200' : 
                        deal.status === DealStatus.DEAD ? 'bg-red-50 text-red-700 border-red-100' : 
                        deal.status === DealStatus.ACTIVE_LISTING ? 'bg-white text-gold-600 border-gold-muted' :
                        'bg-white text-slate-500 border-slate-200'}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-navy">
                    {deal.grossCommission > 0 ? `$${deal.grossCommission.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400">
                    {totalExp > 0 ? `($${totalExp.toLocaleString()})` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-navy">
                     {deal.status === DealStatus.CLOSED ? `$${net.toLocaleString()}` : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">
                    {deal.closeDate || '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500">
                    {deal.type === DealType.SELLER && dom !== null ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-400">
                             {dom}
                        </span>
                    ) : '-'}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/20 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-navy">{selectedDeal ? 'Edit Deal' : 'New Deal'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-navy transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-8">
              
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deal Name / Address</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white transition-colors"
                        placeholder="e.g. 123 Maple Avenue"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deal Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as DealType})}
                        className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white transition-colors"
                    >
                        {Object.values(DealType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as DealStatus})}
                        className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white transition-colors"
                    >
                        {activeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
              </div>

              {/* Seller Specific Fields */}
              {formData.type === DealType.SELLER && (
                <div className="bg-slate-50 p-6 border border-slate-200 rounded-sm">
                    <h4 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                        Listing Details
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                List Price {formData.status === DealStatus.ACTIVE_LISTING && <span className="text-gold">*</span>}
                            </label>
                            <input
                                type="number"
                                value={formData.listPrice || ''}
                                onChange={(e) => {
                                    const price = parseFloat(e.target.value) || 0;
                                    const pct = formData.commissionPercentage || 0;
                                    const gross = price * (pct / 100);
                                    setFormData({...formData, listPrice: price, grossCommission: gross});
                                }}
                                className="w-full border border-slate-200 px-3 py-2 text-navy focus:outline-none focus:border-gold rounded-sm bg-white"
                                placeholder="$"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Commission %
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.commissionPercentage || ''}
                                    onChange={(e) => {
                                        const pct = parseFloat(e.target.value) || 0;
                                        const price = formData.listPrice || 0;
                                        const gross = price * (pct / 100);
                                        setFormData({...formData, commissionPercentage: pct, grossCommission: gross});
                                    }}
                                    className="w-full border border-slate-200 px-3 py-2 text-navy focus:outline-none focus:border-gold rounded-sm bg-white pr-8"
                                    placeholder="%"
                                />
                                <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Listing Date {formData.status === DealStatus.ACTIVE_LISTING && <span className="text-gold">*</span>}
                            </label>
                            <input
                                type="date"
                                value={formData.listingDate || ''}
                                onChange={(e) => setFormData({...formData, listingDate: e.target.value})}
                                className="w-full border border-slate-200 px-3 py-2 text-navy focus:outline-none focus:border-gold rounded-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Under Contract Date {formData.status === DealStatus.PENDING && <span className="text-gold">*</span>}
                            </label>
                            <input
                                type="date"
                                value={formData.underContractDate || ''}
                                onChange={(e) => setFormData({...formData, underContractDate: e.target.value})}
                                className="w-full border border-slate-200 px-3 py-2 text-navy focus:outline-none focus:border-gold rounded-sm bg-white"
                            />
                        </div>
                         {/* Read-only Metrics */}
                         <div className="flex flex-col justify-end col-span-2">
                            <div className="bg-white border border-slate-200 px-4 py-3 text-sm rounded-sm">
                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Days on Market</span>
                                <span className="font-mono font-bold text-navy text-lg mt-1">
                                    {calculateDOM(formData) !== null ? `${calculateDOM(formData)} Days` : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {/* Financials & Closing */}
              <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Gross Commission ($) {formData.status === DealStatus.CLOSED && <span className="text-gold">*</span>}
                    </label>
                    <input
                        type="number"
                        value={formData.grossCommission}
                        onChange={(e) => setFormData({...formData, grossCommission: parseFloat(e.target.value) || 0})}
                        className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Close Date {formData.status === DealStatus.CLOSED && <span className="text-gold">*</span>}
                    </label>
                    <input
                        type="date"
                        value={formData.closeDate || ''}
                        onChange={(e) => setFormData({...formData, closeDate: e.target.value})}
                        className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white"
                    />
                </div>

                {formData.type === DealType.SELLER && (
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Closed Sale Price {formData.status === DealStatus.CLOSED && <span className="text-gold">*</span>}
                        </label>
                        <input
                            type="number"
                            value={formData.closedSalePrice || ''}
                            onChange={(e) => setFormData({...formData, closedSalePrice: parseFloat(e.target.value) || 0})}
                            className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white"
                        />
                    </div>
                )}
                
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
                    <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm h-24 resize-none bg-white"
                    />
                </div>
              </div>

              {/* Financial Summary */}
              {selectedDeal && (
                 <div className="bg-slate-50 p-6 border border-slate-200 mt-4 rounded-sm">
                    <h4 className="text-sm font-bold text-navy mb-4">Deal Performance (Read-Only)</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold">Gross</span>
                            <span className="font-mono font-medium text-navy mt-1 block">${formData.grossCommission.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold">Net Income</span>
                            <span className="font-mono font-bold text-navy mt-1 block">${getDealNetCommission(selectedDeal).toLocaleString()}</span>
                        </div>
                         {formData.type === DealType.SELLER && calculateSaleToListRatio(formData) && (
                             <div className="col-span-2">
                                <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold">Sale-to-List</span>
                                <span className="font-mono font-bold text-navy mt-1 block">
                                    {calculateSaleToListRatio(formData)?.toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                 </div>
              )}

            </div>
            
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-navy transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium bg-navy text-white hover:bg-navy-light rounded-sm shadow-none transition-colors">
                Save Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};