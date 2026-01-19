import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Deal, DealStatus, DealType, Expense, ExpenseType, ExpenseCategory } from '../types';
import { Plus, Search, Filter, X, ChevronRight, DollarSign, Calendar, Clock, Percent, Trash2, AlertTriangle, Edit2, Fuel } from 'lucide-react';

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

const LEAD_SOURCES = [
  "SOI", "FSBO", "Expired", "Open House", "Farming", "Sign Calls", "Ad Calls", 
  "Internal Referral", "Referral", "Referral to Other Agent", "Direct Mail", 
  "Social Media", "Agent Referral", "Zillow", "Zillow Flex", "Zillow NLL", 
  "Zillow Preferred", "UpNest", "Homelight", "OpCity", "OpCity MVIP", 
  "Realtor.com", "FollowUpBoss", "Agent Website", "Relocation Company", "Other"
];

export const Deals = () => {
  const { deals, addDeal, updateDeal, deleteDeal, getDealNetCommission, getDealExpenses, deleteExpense, updateExpense, expenses, settings } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Delete Modal State
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // Expense Edit State (Nested in Deal Modal)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form State
  const initialFormState: Omit<Deal, 'id' | 'createdAt'> = {
    name: '',
    type: DealType.BUYER,
    status: DealStatus.LEAD,
    grossCommission: 0,
    closeDate: null,
    notes: '',
    leadSource: '',
    leadSourceDetail: '',
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
    if (!formData.leadSource) return alert('Lead Source is required');
    
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

  const initiateDelete = (deal: Deal) => {
    setDealToDelete(deal);
    setDeleteConfirmationInput('');
  };

  const confirmDelete = () => {
    if (!dealToDelete) return;

    if (dealToDelete.status === DealStatus.CLOSED) {
        if (deleteConfirmationInput !== 'DELETE') {
            return; // Prevent delete if text doesn't match
        }
    }

    deleteDeal(dealToDelete.id);
    setDealToDelete(null);
    setIsModalOpen(false); // Close main modal if deleting from there
  };

  // ROI Calculator
  const getDealROI = (deal: Deal) => {
      const net = getDealNetCommission(deal);
      const totalExp = deal.grossCommission - net;
      if (totalExp === 0) return null;
      return (net / totalExp) * 100;
  };

  // Expense Handling inside Deal Modal
  const handleEditExpense = (expense: Expense) => {
      setEditingExpense({...expense});
      setIsExpenseModalOpen(true);
  };

  const handleExpenseSave = (updatedExpense: Expense) => {
    updateExpense(updatedExpense);
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
      if (window.confirm("This will remove this expense and update deal totals.")) {
          deleteExpense(id);
      }
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
          <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-dark-text-primary font-serif">Deals Pipeline</h2>
          <p className="text-slate-500 dark:text-dark-text-secondary mt-2 font-normal">Active transactions and history.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-4 py-2 rounded-sm text-sm font-medium text-slate-500 dark:text-dark-text-secondary">
                Active: <span className="text-navy dark:text-dark-text-primary font-bold ml-1 font-serif">{activeDeals}</span>
            </div>
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-4 py-2 rounded-sm text-sm font-medium text-slate-500 dark:text-dark-text-secondary">
                Closed: <span className="text-navy dark:text-dark-text-primary font-bold ml-1 font-serif">{closedDeals}</span>
            </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-navy dark:bg-gold text-white dark:text-navy px-5 py-2.5 text-sm font-medium rounded-sm hover:bg-navy-light dark:hover:bg-gold-hover transition-colors shadow-none"
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
                ? 'bg-navy dark:bg-white/10 text-white border-navy dark:border-white/10'
                : 'bg-white dark:bg-dark-surface text-slate-500 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-white/20 hover:text-navy dark:hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-sm overflow-hidden">
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-dark-text-muted">
            <p>No deals found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-dark-border text-xs uppercase text-slate-400 dark:text-dark-text-muted font-bold tracking-wider font-sans">
              <tr>
                <th className="px-6 py-4">Property / Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Gross Comm.</th>
                <th className="px-6 py-4 text-right">Expenses</th>
                <th className="px-6 py-4 text-right">Net Comm.</th>
                <th className="px-6 py-4 text-right">ROI %</th>
                <th className="px-6 py-4 text-right">Close Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredDeals.map((deal) => {
                 const net = getDealNetCommission(deal);
                 const totalExp = deal.grossCommission - net;
                 const showNet = deal.grossCommission > 0 || totalExp > 0 || deal.status === DealStatus.CLOSED;
                 const roi = getDealROI(deal);

                 return (
                <tr 
                    key={deal.id} 
                    onClick={() => handleOpenModal(deal)}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-navy dark:text-dark-text-primary font-sans">{deal.name}</div>
                    <div className="text-xs text-slate-500 dark:text-dark-text-muted mt-1 inline-flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${deal.type === DealType.BUYER ? 'bg-navy dark:bg-white' : 'bg-gold'}`}></span>
                        <span className="uppercase tracking-wide text-[10px] font-medium">{deal.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border
                      ${deal.status === DealStatus.CLOSED ? 'bg-slate-100 dark:bg-white/10 text-navy dark:text-white border-slate-200 dark:border-white/10' : 
                        deal.status === DealStatus.DEAD ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30' : 
                        deal.status === DealStatus.ACTIVE_LISTING ? 'bg-white dark:bg-dark-surface text-gold-600 dark:text-gold border-gold-muted dark:border-gold/30' :
                        'bg-white dark:bg-dark-surface text-slate-500 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border'}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-navy dark:text-dark-text-primary">
                    {deal.grossCommission > 0 ? `$${deal.grossCommission.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 dark:text-dark-text-muted">
                    {totalExp > 0 ? `($${totalExp.toLocaleString()})` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-navy dark:text-dark-text-primary font-serif">
                     {showNet ? `$${net.toLocaleString()}` : <span className="text-slate-300 dark:text-white/20 font-sans">-</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-dark-text-secondary">
                     {roi !== null ? `${roi.toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-dark-text-secondary">
                    {deal.closeDate || '-'}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/20 dark:bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-dark-border my-8">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-surface z-10">
              <h3 className="text-lg font-bold text-navy dark:text-dark-text-primary font-serif">{selectedDeal ? 'Edit Deal' : 'New Deal'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 dark:text-dark-text-muted hover:text-navy dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 pb-32 space-y-8">
              
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Deal Name / Address</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                        placeholder="e.g. 123 Maple Avenue"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Deal Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as DealType})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                    >
                        {Object.values(DealType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as DealStatus})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                    >
                        {activeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Lead Source <span className="text-gold">*</span></label>
                    <select
                        value={formData.leadSource}
                        onChange={(e) => setFormData({...formData, leadSource: e.target.value})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                    >
                        <option value="">-- Select Source --</option>
                        {LEAD_SOURCES.map(source => <option key={source} value={source}>{source}</option>)}
                    </select>
                </div>

                {formData.leadSource === 'Other' && (
                     <div className="col-span-2 animate-fade-in-up">
                        <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Specify Lead Source</label>
                        <input
                            type="text"
                            value={formData.leadSourceDetail || ''}
                            onChange={(e) => setFormData({...formData, leadSourceDetail: e.target.value})}
                            className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                            placeholder="e.g. Builder referral, local event, past client"
                        />
                    </div>
                )}
              </div>

              {/* Seller Specific Fields */}
              {formData.type === DealType.SELLER && (
                <div className="bg-slate-50 dark:bg-white/5 p-6 border border-slate-200 dark:border-dark-border rounded-sm">
                    <h4 className="text-sm font-bold text-navy dark:text-dark-text-primary mb-4 flex items-center gap-2 font-serif">
                        <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                        Listing Details
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
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
                                className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                                placeholder="$"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
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
                                    className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface pr-8"
                                    placeholder="%"
                                />
                                <span className="absolute right-3 top-2 text-slate-400 dark:text-dark-text-muted text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                                Listing Date {formData.status === DealStatus.ACTIVE_LISTING && <span className="text-gold">*</span>}
                            </label>
                            <input
                                type="date"
                                value={formData.listingDate || ''}
                                onChange={(e) => setFormData({...formData, listingDate: e.target.value})}
                                className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                                Under Contract Date {formData.status === DealStatus.PENDING && <span className="text-gold">*</span>}
                            </label>
                            <input
                                type="date"
                                value={formData.underContractDate || ''}
                                onChange={(e) => setFormData({...formData, underContractDate: e.target.value})}
                                className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                            />
                        </div>
                         {/* Read-only Metrics */}
                         <div className="flex flex-col justify-end col-span-2">
                            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-4 py-3 text-sm rounded-sm">
                                <span className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Days on Market</span>
                                <span className="font-mono font-bold text-navy dark:text-dark-text-primary text-lg mt-1 font-serif">
                                    {calculateDOM(formData) !== null ? `${calculateDOM(formData)} Days` : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {/* Financials & Closing */}
              <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-dark-border">
                <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                        Gross Commission ($) {formData.status === DealStatus.CLOSED && <span className="text-gold">*</span>}
                    </label>
                    <input
                        type="number"
                        value={formData.grossCommission}
                        onChange={(e) => setFormData({...formData, grossCommission: parseFloat(e.target.value) || 0})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                        Close Date {formData.status === DealStatus.CLOSED && <span className="text-gold">*</span>}
                    </label>
                    <input
                        type="date"
                        value={formData.closeDate || ''}
                        onChange={(e) => setFormData({...formData, closeDate: e.target.value})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                    />
                </div>

                {formData.type === DealType.SELLER && (
                     <div>
                        <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                            Closed Sale Price {formData.status === DealStatus.CLOSED && <span className="text-gold">*</span>}
                        </label>
                        <input
                            type="number"
                            value={formData.closedSalePrice || ''}
                            onChange={(e) => setFormData({...formData, closedSalePrice: parseFloat(e.target.value) || 0})}
                            className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                        />
                    </div>
                )}
                
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Notes</label>
                    <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm h-24 resize-none bg-white dark:bg-dark-surface"
                    />
                </div>
              </div>

              {/* Financial Summary */}
              {selectedDeal && (
                 <div className="bg-slate-50 dark:bg-white/5 p-6 border border-slate-200 dark:border-dark-border mt-4 rounded-sm">
                    <h4 className="text-sm font-bold text-navy dark:text-dark-text-primary mb-4 font-serif">Deal Performance (Read-Only)</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="block text-slate-400 dark:text-dark-text-muted text-[10px] uppercase tracking-wider font-bold">Gross</span>
                            <span className="font-mono font-medium text-navy dark:text-dark-text-primary mt-1 block font-serif">${formData.grossCommission.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-slate-400 dark:text-dark-text-muted text-[10px] uppercase tracking-wider font-bold">Net Income</span>
                            <span className="font-mono font-bold text-navy dark:text-dark-text-primary mt-1 block font-serif">${getDealNetCommission(selectedDeal).toLocaleString()}</span>
                        </div>
                        <div>
                             <span className="block text-slate-400 dark:text-dark-text-muted text-[10px] uppercase tracking-wider font-bold">ROI %</span>
                             <span className="font-mono font-bold text-navy dark:text-dark-text-primary mt-1 block font-serif">
                                 {getDealROI(selectedDeal) !== null ? `${getDealROI(selectedDeal)?.toFixed(1)}%` : '—'}
                             </span>
                        </div>
                         {formData.type === DealType.SELLER && calculateSaleToListRatio(formData) && (
                             <div>
                                <span className="block text-slate-400 dark:text-dark-text-muted text-[10px] uppercase tracking-wider font-bold">Sale-to-List</span>
                                <span className="font-mono font-bold text-navy dark:text-dark-text-primary mt-1 block font-serif">
                                    {calculateSaleToListRatio(formData)?.toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                 </div>
              )}

              {/* Linked Expenses Section */}
              {selectedDeal && (
                <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-sm">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-white/5">
                    <h4 className="text-sm font-bold text-navy dark:text-dark-text-primary font-serif">Linked Expenses</h4>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {getDealExpenses(selectedDeal.id).length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs italic">No expenses linked to this deal.</div>
                      ) : (
                          getDealExpenses(selectedDeal.id).map(exp => (
                              <div key={exp.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                  <div>
                                      <div className="font-medium text-sm text-navy dark:text-dark-text-primary flex items-center gap-2">
                                          {exp.category}
                                          {exp.type === ExpenseType.MILEAGE && <Fuel size={12} className="text-slate-400"/>}
                                      </div>
                                      <div className="text-xs text-slate-400 dark:text-dark-text-muted mt-0.5">{exp.date} • {exp.notes || (exp.type === ExpenseType.MILEAGE ? `${exp.milesDriven} miles` : `Qty: ${exp.quantity}`)}</div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <span className="font-mono font-bold text-navy dark:text-dark-text-primary text-sm">${exp.totalCost.toFixed(2)}</span>
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditExpense(exp)} className="text-slate-400 hover:text-navy dark:hover:text-white transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                </div>
              )}

            </div>
            
            <div className="px-8 py-6 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-dark-border flex justify-between gap-3 sticky bottom-0 z-10">
              
              {selectedDeal ? (
                <button 
                  onClick={() => initiateDelete(selectedDeal)} 
                  className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300 rounded-sm transition-colors flex items-center gap-2"
                >
                    <Trash2 size={16} />
                    Delete Deal
                </button>
              ) : <div></div>}

              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-500 dark:text-dark-text-secondary hover:text-navy dark:hover:text-white transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium bg-navy dark:bg-gold text-white dark:text-navy hover:bg-navy-light dark:hover:bg-gold-hover rounded-sm shadow-none transition-colors">
                    Save Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nested Expense Edit Modal */}
      {isExpenseModalOpen && editingExpense && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/20 dark:bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-dark-border">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-dark-border">
                    <h3 className="text-md font-bold text-navy dark:text-dark-text-primary font-serif">Edit Linked Expense</h3>
                </div>
                <div className="p-6 space-y-4">
                     {/* Simplified form re-using state logic logic would be better but direct manipulation is okay for now */}
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
                            <input type="date" value={editingExpense.date} onChange={e => setEditingExpense({...editingExpense, date: e.target.value})} className="w-full border p-2 rounded-sm text-sm bg-white dark:bg-dark-surface dark:border-dark-border dark:text-white"/>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                            <select value={editingExpense.category} onChange={e => setEditingExpense({...editingExpense, category: e.target.value as ExpenseCategory})} className="w-full border p-2 rounded-sm text-sm bg-white dark:bg-dark-surface dark:border-dark-border dark:text-white" disabled={editingExpense.type === ExpenseType.MILEAGE}>
                                {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                         </div>
                         {editingExpense.type === ExpenseType.MILEAGE ? (
                             <>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Miles Driven</label>
                                    <input 
                                        type="number" 
                                        value={editingExpense.milesDriven} 
                                        onChange={e => {
                                            const miles = parseFloat(e.target.value) || 0;
                                            const gallons = miles / editingExpense.mpg;
                                            const cost = gallons * editingExpense.gasPrice;
                                            setEditingExpense({...editingExpense, milesDriven: miles, gallonsUsed: gallons, fuelCost: cost, totalCost: cost});
                                        }}
                                        className="w-full border p-2 rounded-sm text-sm bg-white dark:bg-dark-surface dark:border-dark-border dark:text-white"
                                    />
                                </div>
                             </>
                         ) : (
                             <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantity</label>
                                    <input 
                                        type="number" 
                                        value={editingExpense.quantity} 
                                        onChange={e => {
                                            const qty = parseFloat(e.target.value) || 0;
                                            setEditingExpense({...editingExpense, quantity: qty, totalCost: qty * editingExpense.costPerUnit});
                                        }}
                                        className="w-full border p-2 rounded-sm text-sm bg-white dark:bg-dark-surface dark:border-dark-border dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cost Per Unit</label>
                                    <input 
                                        type="number" 
                                        value={editingExpense.costPerUnit} 
                                        onChange={e => {
                                            const cost = parseFloat(e.target.value) || 0;
                                            setEditingExpense({...editingExpense, costPerUnit: cost, totalCost: editingExpense.quantity * cost});
                                        }}
                                        className="w-full border p-2 rounded-sm text-sm bg-white dark:bg-dark-surface dark:border-dark-border dark:text-white"
                                    />
                                </div>
                             </>
                         )}
                         <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notes</label>
                            <input type="text" value={editingExpense.notes || ''} onChange={e => setEditingExpense({...editingExpense, notes: e.target.value})} className="w-full border p-2 rounded-sm text-sm bg-white dark:bg-dark-surface dark:border-dark-border dark:text-white"/>
                         </div>
                     </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 flex justify-end gap-2">
                     <button onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-xs font-bold uppercase text-slate-500">Cancel</button>
                     <button onClick={() => handleExpenseSave(editingExpense)} className="px-4 py-2 text-xs font-bold uppercase bg-navy text-white rounded-sm">Save Changes</button>
                </div>
            </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      {dealToDelete && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 dark:bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-surface w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-dark-border">
                <div className="p-8">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-4">
                        <AlertTriangle size={24} />
                        <h3 className="text-lg font-bold font-serif">Delete Deal?</h3>
                    </div>
                    
                    <p className="text-slate-600 dark:text-dark-text-secondary mb-6 leading-relaxed">
                        Deleting <strong className="text-navy dark:text-white">{dealToDelete.name}</strong> will also permanently remove all linked <strong className="text-navy dark:text-white">expenses</strong> and <strong className="text-navy dark:text-white">activities</strong>.
                        <br/><br/>
                        This action cannot be undone.
                    </p>

                    {dealToDelete.status === DealStatus.CLOSED && (
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                                To confirm, type "DELETE"
                            </label>
                            <input 
                                type="text" 
                                value={deleteConfirmationInput}
                                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                                className="w-full border border-red-200 dark:border-red-900/50 px-4 py-2.5 text-navy dark:text-white focus:outline-none focus:border-red-500 rounded-sm bg-red-50 dark:bg-red-900/10 placeholder-red-200"
                                placeholder="DELETE"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={() => setDealToDelete(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-dark-text-secondary hover:text-navy dark:hover:text-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete}
                            disabled={dealToDelete.status === DealStatus.CLOSED && deleteConfirmationInput !== 'DELETE'}
                            className={`px-5 py-2 text-sm font-medium text-white rounded-sm shadow-sm transition-colors
                                ${dealToDelete.status === DealStatus.CLOSED && deleteConfirmationInput !== 'DELETE' 
                                    ? 'bg-red-300 dark:bg-red-900/50 cursor-not-allowed' 
                                    : 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500'}`}
                        >
                            Delete Forever
                        </button>
                    </div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};