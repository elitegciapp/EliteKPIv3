
import React, { useState } from 'react';
import { useApp } from '../context';
import { Deal, DealStage, DealSide, ExpenseType } from '../types';
import { Plus, X, Fuel, Trash2, AlertTriangle, Home, DollarSign, User, ChevronDown } from 'lucide-react';
import { DEAL_STAGES } from '../constants/dealStages';
import { LEAD_SOURCES } from '../constants/leadSources';

export const Deals = () => {
  const { deals, addDeal, updateDeal, deleteDeal, getDealNetCommission, getDealExpenses, deleteExpense } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [filterStage, setFilterStage] = useState<string>('All');
  const [filterSource, setFilterSource] = useState<string>('All');
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  const initialFormState: Partial<Deal> = {
    name: '',
    propertyAddress: '',
    propertyPrice: 0,
    dealSide: 'BUYER',
    stage: DealStage.LEAD,
    commissionEarned: 0,
    closeProbabilityBps: 1000,
    leadSource: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

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
    const probability = newStage === DealStage.CLOSED ? 10000 : 
                       newStage === DealStage.PENDING_CLOSE ? 9500 : 
                       newStage === DealStage.UNDER_CONTRACT ? 9000 : 1000;
    
    setFormData(prev => ({ 
      ...prev, 
      stage: newStage, 
      closeProbabilityBps: probability 
    }));
  };

  const handleSave = () => {
    if (!formData.name) return alert('Client Name is required');
    if (!formData.propertyAddress) return alert('Property Address is required');

    if (formData.stage === DealStage.CLOSED && !formData.closedAt) {
      formData.closedAt = new Date().toISOString();
    }

    const payload = { ...formData };
    if (selectedDeal) {
      updateDeal({ ...selectedDeal, ...payload } as Deal);
    } else {
      addDeal({
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        stageEnteredAt: new Date().toISOString(),
      } as Deal);
    }
    setIsModalOpen(false);
  };

  const filteredDeals = deals.filter(d => {
    const matchStage = filterStage === 'All' || d.stage === filterStage;
    const matchSource = filterSource === 'All' || d.leadSource === filterSource;
    return matchStage && matchSource;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-dark-text-primary font-serif">Deals Pipeline</h2>
          <p className="text-slate-500 dark:text-dark-text-secondary mt-2 font-normal">Manage your transactions with precision.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-navy dark:bg-gold text-white dark:text-navy px-5 py-2.5 text-sm font-medium rounded-sm hover:bg-navy-light dark:hover:bg-gold-hover transition-colors shadow-none"
        >
          <Plus size={16} />
          New Deal
        </button>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 md:items-end">
        <div className="w-full md:w-64">
           <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-widest mb-1.5 ml-0.5">Filter by Stage</label>
           <div className="relative">
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-navy dark:text-dark-text-primary rounded-sm focus:outline-none focus:border-gold transition-colors cursor-pointer shadow-sm pr-10"
              >
                <option value="All">All Stages</option>
                {DEAL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
           </div>
        </div>

        <div className="w-full md:w-64">
           <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-widest mb-1.5 ml-0.5">Filter by Source</label>
           <div className="relative">
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-navy dark:text-dark-text-primary rounded-sm focus:outline-none focus:border-gold transition-colors cursor-pointer shadow-sm pr-10"
              >
                <option value="All">All Sources</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
           </div>
        </div>
      </div>

      {/* List Container - Scrollable on small screens */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-sm overflow-hidden overflow-x-auto">
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No deals found.</div>
        ) : (
          <table className="w-full text-sm text-left table-auto">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-dark-border text-xs uppercase text-slate-400 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 min-w-[200px]">Property / Client</th>
                <th className="px-6 py-4 min-w-[120px]">Stage</th>
                <th className="px-6 py-4 text-right min-w-[100px]">Price</th>
                <th className="px-6 py-4 text-right min-w-[120px]">Commission</th>
                <th className="px-6 py-4 text-right min-w-[120px]">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} onClick={() => handleOpenModal(deal)} className="hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer group transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-semibold text-navy dark:text-dark-text-primary whitespace-normal break-words leading-tight">
                        {deal.propertyAddress || 'No Address Provided'}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 font-bold">
                       <span className={deal.dealSide === 'BUYER' ? 'text-navy dark:text-white' : 'text-gold'}>{deal.dealSide}</span>
                       <span className="opacity-30">•</span>
                       <span className="truncate">{deal.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase border tracking-wider ${
                      deal.stage === DealStage.CLOSED ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-dark-border'
                    }`}>
                      {DEAL_STAGES.find(s => s.value === deal.stage)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right text-slate-500 dark:text-dark-text-secondary font-mono text-xs">
                    ${(deal.propertyPrice || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-right font-medium text-navy dark:text-dark-text-primary whitespace-nowrap">
                    {deal.stage === DealStage.CLOSED ? `$${(deal.commissionEarned || 0).toLocaleString()}` : <span className="opacity-20 text-[10px]">IN PROGRESS</span>}
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-navy dark:text-dark-text-primary font-serif whitespace-nowrap">
                     ${getDealNetCommission(deal).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/20 dark:bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-surface w-full max-w-2xl rounded-sm shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-dark-border overflow-hidden animate-fade-in-up">
            <div className="flex-none flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-dark-border">
              <h3 className="text-xl font-bold text-navy dark:text-dark-text-primary font-serif">{selectedDeal ? 'Edit Deal' : 'New Deal'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-navy transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Deal Side</label>
                  <select
                    value={formData.dealSide}
                    onChange={(e) => setFormData({...formData, dealSide: e.target.value as DealSide})}
                    className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors"
                  >
                    <option value="BUYER">BUYER</option>
                    <option value="SELLER">SELLER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => handleStageChange(e.target.value as DealStage)}
                    className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors"
                  >
                    {DEAL_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Property Address</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      value={formData.propertyAddress || ''}
                      onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})}
                      className="w-full border border-slate-200 dark:border-dark-border pl-12 pr-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors"
                      placeholder="e.g. 123 Luxury Lane, San Francisco"
                    />
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Property Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="number"
                      value={formData.propertyPrice || ''}
                      onChange={(e) => setFormData({...formData, propertyPrice: parseFloat(e.target.value) || 0})}
                      className="w-full border border-slate-200 dark:border-dark-border pl-12 pr-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm font-mono focus:border-gold transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Client Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-slate-200 dark:border-dark-border pl-12 pr-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors"
                      placeholder="e.g. John Smith"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lead Source</label>
                  <select
                    value={formData.leadSource || ''}
                    onChange={(e) => setFormData({...formData, leadSource: e.target.value})}
                    className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors"
                  >
                    <option value="">Select Source</option>
                    {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Realized Commission Logic */}
                {formData.stage === DealStage.CLOSED && (
                  <div className="col-span-2 bg-green-50 dark:bg-green-900/10 p-6 rounded-sm border border-green-100 dark:border-green-900/20">
                    <label className="block text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">Commission Earned ($)</label>
                    <input
                      type="number"
                      value={formData.commissionEarned || ''}
                      onChange={(e) => setFormData({...formData, commissionEarned: parseFloat(e.target.value) || 0})}
                      className="w-full border border-green-200 dark:border-green-900/40 px-4 py-3 text-2xl font-bold text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm shadow-inner focus:border-green-500 transition-colors"
                      placeholder="0.00"
                      autoFocus
                    />
                    <p className="text-[10px] text-green-600 dark:text-green-400 mt-2 font-medium italic">Enter final realized income for this deal.</p>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm h-24 resize-none focus:border-gold transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex-none px-8 py-6 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-dark-border flex justify-between items-center gap-3">
              {selectedDeal ? (
                <button onClick={() => setDealToDelete(selectedDeal)} className="text-red-500 hover:text-red-700 p-2 transition-colors"><Trash2 size={20} /></button>
              ) : <div />}
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-navy transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-8 py-2.5 text-sm font-bold bg-navy dark:bg-gold text-white dark:text-navy rounded-sm hover:opacity-90 transition-all">Save Deal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {dealToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-surface w-full max-w-md p-8 rounded-sm shadow-2xl border border-slate-200 dark:border-dark-border">
            <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangle /> Delete Deal?</h3>
            <p className="text-slate-600 dark:text-dark-text-secondary mb-6 text-sm">Deleting this transaction will permanently remove all linked expenses and activity. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDealToDelete(null)} className="px-4 py-2 text-sm text-slate-500">Cancel</button>
              <button onClick={() => { deleteDeal(dealToDelete.id); setDealToDelete(null); setIsModalOpen(false); }} className="px-6 py-2 text-sm font-bold bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
