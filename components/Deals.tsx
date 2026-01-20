
import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Deal, DealStage, DealSide, Expense, ExpenseType } from '../types';
import { Plus, X, Fuel, Trash2, AlertTriangle, Calculator, Calendar } from 'lucide-react';
import { DEAL_STAGES } from '../constants/dealStages';
import { LEAD_SOURCES } from '../constants/leadSources';

// Probability Helper (mapped to new stages)
const getAutoProbability = (stage: string): number => {
    switch (stage) {
        case 'LEAD': return 1000; // 10%
        case 'INITIAL_CONTACT': return 2000; // 20%
        case 'SHOWING_OR_ACTIVE': return 5000; // 50%
        case 'UNDER_CONTRACT': return 9000; // 90%
        case 'PENDING_CLOSE': return 9500; // 95%
        case 'CLOSED': return 10000; // 100%
        default: return 1000;
    }
};

export const Deals = () => {
  const { deals, addDeal, updateDeal, deleteDeal, getDealNetCommission, getDealExpenses, deleteExpense } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  
  // Filters
  const [filterStage, setFilterStage] = useState<string>('All');
  const [filterSource, setFilterSource] = useState<string>('All');
  
  // Delete Modal State
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // Form State
  const initialFormState: Partial<Deal> = {
    name: '',
    dealSide: 'BUYER',
    stage: DealStage.LEAD,
    stageEnteredAt: new Date().toISOString(),
    expectedGci: 0,
    actualGci: 0,
    closeProbabilityBps: 1000,
    leadSource: '',
    otherLeadSource: '',
    notes: '',
    // Seller Fields
    listPrice: null,
    commissionRatePct: null,
    expectedCommission: null,
    listingDate: null,
    closedPrice: null,
    daysOnMarket: null,
    priceVariance: null
  };
  const [formData, setFormData] = useState(initialFormState);

  // Auto-calc Seller Commission
  useEffect(() => {
      if (formData.dealSide === 'SELLER' && formData.listPrice && formData.commissionRatePct) {
          const comm = formData.listPrice * (formData.commissionRatePct / 100);
          setFormData(prev => ({
              ...prev,
              expectedCommission: comm,
              expectedGci: Math.round(comm) // Sync to main GCI field
          }));
      }
  }, [formData.listPrice, formData.commissionRatePct, formData.dealSide]);

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

  const handleStageChange = (newStage: DealStage) => {
      const updates: any = {
          stage: newStage,
          closeProbabilityBps: getAutoProbability(newStage)
      };

      // Rule: Set Listing Date if entering Active
      if (newStage === DealStage.SHOWING_OR_ACTIVE && !formData.listingDate && formData.dealSide === 'SELLER') {
          updates.listingDate = new Date().toISOString();
      }

      // Rule: Calculations on Close
      if (newStage === DealStage.CLOSED && formData.dealSide === 'SELLER') {
          if (formData.listingDate) {
              const start = new Date(formData.listingDate).getTime();
              const end = new Date().getTime();
              const diffTime = Math.abs(end - start);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              updates.daysOnMarket = diffDays;
          }
          if (formData.closedPrice && formData.listPrice) {
              updates.priceVariance = formData.closedPrice - formData.listPrice;
          }
      }

      setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    if (!formData.name) return alert('Deal Name is required');
    
    // Validation
    if (formData.dealSide === 'SELLER' && formData.stage === DealStage.CLOSED) {
        if (!formData.listPrice || !formData.commissionRatePct) {
            return alert('Closed seller deals require List Price and Commission Rate.');
        }
    }

    if (formData.stage === DealStage.CLOSED && !formData.closedAt) {
        formData.closedAt = new Date().toISOString();
    }
    
    // Clean up 'Other' source if not selected
    if (formData.leadSource !== 'Other') {
        formData.otherLeadSource = undefined;
    }

    // Convert Partial<Deal> to Deal (casting for ID/created which we handle)
    const payload = { ...formData };
    
    if (selectedDeal) {
      updateDeal({ ...selectedDeal, ...payload } as Deal);
    } else {
      addDeal({
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      } as Deal);
    }
    setIsModalOpen(false);
  };

  const initiateDelete = (deal: Deal) => {
    setDealToDelete(deal);
    setDeleteConfirmationInput('');
  };

  const confirmDelete = () => {
    if (!dealToDelete) return;
    if (dealToDelete.stage === DealStage.CLOSED && deleteConfirmationInput !== 'DELETE') return;

    deleteDeal(dealToDelete.id);
    setDealToDelete(null);
    setIsModalOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
      if (window.confirm("Remove expense?")) deleteExpense(id);
  };

  // Filter Logic
  const filteredDeals = deals.filter(d => {
      const matchStage = filterStage === 'All' || d.stage === filterStage;
      const matchSource = filterSource === 'All' || d.leadSource === filterSource;
      return matchStage && matchSource;
  });
  
  const activeDeals = deals.filter(d => d.stage !== DealStage.CLOSED).length;
  const closedDeals = deals.filter(d => d.stage === DealStage.CLOSED).length;

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
      <div className="space-y-4">
          {/* Stage Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
                onClick={() => setFilterStage('All')}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm border whitespace-nowrap transition-colors ${
                filterStage === 'All'
                    ? 'bg-navy dark:bg-white/10 text-white border-navy dark:border-white/10'
                    : 'bg-white dark:bg-dark-surface text-slate-500 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-white/20'
                }`}
            >
                All Stages
            </button>
            {DEAL_STAGES.map((stage) => (
            <button
                key={stage.value}
                onClick={() => setFilterStage(stage.value)}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm border whitespace-nowrap transition-colors ${
                filterStage === stage.value
                    ? 'bg-navy dark:bg-white/10 text-white border-navy dark:border-white/10'
                    : 'bg-white dark:bg-dark-surface text-slate-500 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-white/20'
                }`}
            >
                {stage.label}
            </button>
            ))}
          </div>
          
          {/* Source Filter */}
          <div className="w-full md:w-64">
             <select
                 value={filterSource}
                 onChange={(e) => setFilterSource(e.target.value)}
                 className="w-full text-xs font-semibold uppercase tracking-wider bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-3 py-2 rounded-sm text-slate-500 dark:text-dark-text-secondary focus:outline-none"
             >
                 <option value="All">All Sources</option>
                 {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
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
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4 text-right">Exp. GCI</th>
                <th className="px-6 py-4 text-right">Act. GCI</th>
                <th className="px-6 py-4 text-right">Net Comm.</th>
                <th className="px-6 py-4 text-right">Prob %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredDeals.map((deal) => {
                 const net = getDealNetCommission(deal);
                 const stageLabel = DEAL_STAGES.find(s => s.value === deal.stage)?.label || deal.stage;

                 return (
                <tr 
                    key={deal.id} 
                    onClick={() => handleOpenModal(deal)}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-navy dark:text-dark-text-primary font-sans">{deal.name}</div>
                    <div className="text-xs text-slate-500 dark:text-dark-text-muted mt-1 inline-flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${deal.dealSide === 'BUYER' ? 'bg-navy dark:bg-white' : 'bg-gold'}`}></span>
                        <span className="uppercase tracking-wide text-[10px] font-medium">{deal.dealSide}</span>
                        <span className="text-[10px] text-slate-400">• {deal.leadSource || 'No Source'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border
                      ${deal.stage === DealStage.CLOSED ? 'bg-slate-100 dark:bg-white/10 text-navy dark:text-white border-slate-200 dark:border-white/10' : 
                        deal.stage === DealStage.LEAD ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/20' :
                        'bg-white dark:bg-dark-surface text-slate-500 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border'}`}>
                      {stageLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-dark-text-secondary">
                    ${(deal.expectedGci || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-navy dark:text-dark-text-primary">
                    {deal.actualGci ? `$${deal.actualGci.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-navy dark:text-dark-text-primary font-serif">
                     ${net.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-dark-text-secondary">
                     {(deal.closeProbabilityBps / 100).toFixed(0)}%
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
              <h3 className="text-lg font-bold text-navy dark:text-dark-text-primary font-serif">
                {selectedDeal ? 'Edit Deal' : 'New Deal'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 dark:text-dark-text-muted hover:text-navy dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 pb-32 space-y-8">
              
              <div className="grid grid-cols-2 gap-6">
                
                {/* Deal Side */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Deal Side</label>
                    <select
                        value={formData.dealSide}
                        onChange={(e) => setFormData({...formData, dealSide: e.target.value as DealSide})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                    >
                        <option value="BUYER">BUYER</option>
                        <option value="SELLER">SELLER</option>
                    </select>
                </div>

                {/* Stage */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Stage</label>
                    <select
                        value={formData.stage}
                        onChange={(e) => handleStageChange(e.target.value as DealStage)}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                    >
                        {DEAL_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>

                {/* Name / Address */}
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                        {formData.dealSide === 'SELLER' ? 'Property Address' : 'Client Name / Search Area'}
                    </label>
                    <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                        placeholder={formData.dealSide === 'SELLER' ? "e.g. 123 Maple Avenue" : "e.g. John Smith / Downtown"}
                    />
                </div>
                
                {/* Lead Source */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Lead Source</label>
                    <select
                        value={formData.leadSource || ''}
                        onChange={(e) => setFormData({...formData, leadSource: e.target.value})}
                         className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                    >
                        <option value="" disabled>Select Source</option>
                        {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Other Source Input */}
                {formData.leadSource === 'Other' && (
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Specify Source</label>
                        <input
                            type="text"
                            value={formData.otherLeadSource || ''}
                            onChange={(e) => setFormData({...formData, otherLeadSource: e.target.value})}
                            className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                        />
                    </div>
                )}
                
                {/* Probability Display */}
                <div className="col-span-2 md:col-span-1 flex items-end">
                     <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-dark-border px-4 py-2.5 rounded-sm flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Probability</span>
                        <span className="font-bold text-navy dark:text-white font-mono">{(formData.closeProbabilityBps! / 100).toFixed(0)}%</span>
                     </div>
                </div>

                {/* --- SELLER SPECIFIC FIELDS --- */}
                {formData.dealSide === 'SELLER' ? (
                    <div className="col-span-2 bg-slate-50 dark:bg-white/5 p-4 rounded-sm border border-slate-100 dark:border-dark-border space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calculator size={14} className="text-gold" />
                            <span className="text-xs font-bold text-navy dark:text-dark-text-primary uppercase tracking-wider">Listing Agreement Details</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">List Price ($)</label>
                                <input 
                                    type="number" 
                                    value={formData.listPrice || ''}
                                    onChange={(e) => setFormData({...formData, listPrice: parseFloat(e.target.value) || 0})}
                                    className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-sm text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">Comm. Rate (%)</label>
                                <input 
                                    type="number" 
                                    value={formData.commissionRatePct || ''}
                                    onChange={(e) => setFormData({...formData, commissionRatePct: parseFloat(e.target.value) || 0})}
                                    placeholder="3.0"
                                    className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-sm text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">Calculated Expected Commission</label>
                                <div className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-sm text-navy dark:text-dark-text-primary bg-slate-100 dark:bg-white/10 rounded-sm font-bold font-mono">
                                    ${(formData.expectedCommission || 0).toLocaleString()}
                                </div>
                            </div>
                             {/* Listing Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">Listing Date</label>
                                <input 
                                    type="date"
                                    value={formData.listingDate ? formData.listingDate.split('T')[0] : ''}
                                    onChange={(e) => setFormData({...formData, listingDate: new Date(e.target.value).toISOString()})}
                                    className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-sm text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                                />
                            </div>
                            {/* Closed Price (Conditional) */}
                            {['UNDER_CONTRACT', 'PENDING_CLOSE', 'CLOSED'].includes(formData.stage!) && (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">Closed/Sale Price ($)</label>
                                    <input 
                                        type="number" 
                                        value={formData.closedPrice || ''}
                                        onChange={(e) => setFormData({...formData, closedPrice: parseFloat(e.target.value) || 0})}
                                        className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-sm text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // BUYER SIMPLE FIELDS
                    <div className="col-span-2 bg-slate-50 dark:bg-white/5 p-4 rounded-sm border border-slate-100 dark:border-dark-border">
                         <div className="flex items-center gap-2 mb-2">
                            <Calculator size={14} className="text-gold" />
                            <span className="text-xs font-bold text-navy dark:text-dark-text-primary uppercase tracking-wider">Estimated Value</span>
                        </div>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">Expected GCI ($)</label>
                            <input
                                type="number"
                                value={formData.expectedGci || ''}
                                onChange={(e) => setFormData({...formData, expectedGci: parseFloat(e.target.value) || 0})}
                                className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-sm text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface font-bold"
                            />
                        </div>
                    </div>
                )}

                 <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Actual GCI (Closed)</label>
                    <input
                        type="number"
                        value={formData.actualGci || 0}
                        onChange={(e) => setFormData({...formData, actualGci: parseFloat(e.target.value) || 0})}
                         className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface transition-colors"
                         disabled={formData.stage !== DealStage.CLOSED}
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Notes</label>
                    <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm h-24 resize-none bg-white dark:bg-dark-surface"
                    />
                </div>
              </div>

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

                    {dealToDelete.stage === DealStage.CLOSED && (
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
                            disabled={dealToDelete.stage === DealStage.CLOSED && deleteConfirmationInput !== 'DELETE'}
                            className={`px-5 py-2 text-sm font-medium text-white rounded-sm shadow-sm transition-colors
                                ${dealToDelete.stage === DealStage.CLOSED && deleteConfirmationInput !== 'DELETE' 
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
