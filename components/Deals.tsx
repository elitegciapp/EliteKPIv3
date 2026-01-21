
import React, { useState } from 'react';
import { useApp } from '../context';
import { Deal, DealStage, DealSide, Expense, Activity } from '../types';
import { Plus, X, Trash2, AlertTriangle, Home, DollarSign, User, ChevronDown, CheckCircle, Wallet, Info } from 'lucide-react';
import { DEAL_STAGES } from '../constants/dealStages';
import { LEAD_SOURCES } from '../constants/leadSources';
import { ActivityTable, ActivityModal } from './Activities';
import { ExpenseTable, ExpenseModal } from './Expenses';

type ModalTab = 'Overview' | 'Activities' | 'Expenses';

export const Deals = () => {
  const { 
    deals, addDeal, updateDeal, deleteDeal, 
    getDealNetCommission, getDealExpenses, deleteExpense, 
    activities, addActivity, deleteActivity, 
    expenses, addExpense, updateExpense,
    settings 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('Overview');
  
  const [filterStage, setFilterStage] = useState<string>('All');
  const [filterSource, setFilterSource] = useState<string>('All');
  
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  
  // Nested Modal States
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'activity' | 'expense', id: string } | null>(null);

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
    setActiveTab('Overview');
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

  const handleSaveDeal = () => {
    if (!formData.name) return alert('Client Name is required');
    if (!formData.propertyAddress) return alert('Property Address is required');

    if (formData.stage === DealStage.CLOSED && !formData.closedAt) {
      formData.closedAt = new Date().toISOString();
    }

    const payload = { ...formData };
    if (selectedDeal) {
      updateDeal({ ...selectedDeal, ...payload } as Deal);
    } else {
      const newId = crypto.randomUUID();
      const newDeal = {
        ...payload,
        id: newId,
        createdAt: new Date().toISOString(),
        stageEnteredAt: new Date().toISOString(),
      } as Deal;
      addDeal(newDeal);
      setSelectedDeal(newDeal); // Immediately set so tabs unlock
    }
  };

  const filteredDeals = deals.filter(d => {
    const matchStage = filterStage === 'All' || d.stage === filterStage;
    const matchSource = filterSource === 'All' || d.leadSource === filterSource;
    return matchStage && matchSource;
  });

  // Embedded Data Filtering
  const dealActivities = activities.filter(a => a.dealId === selectedDeal?.id);
  const dealExpenses = expenses.filter(e => e.dealId === selectedDeal?.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-dark-text-primary font-serif">Deals Pipeline</h2>
          <p className="text-slate-500 dark:text-dark-text-secondary mt-2 font-normal font-sans">Manage your transactions with precision.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-navy dark:bg-gold text-white dark:text-navy px-5 py-2.5 text-sm font-bold rounded-sm hover:bg-navy-light dark:hover:bg-gold-hover transition-colors uppercase tracking-widest shadow-sm"
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
                className="w-full appearance-none bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-navy dark:text-dark-text-primary rounded-sm focus:outline-none focus:border-gold transition-colors cursor-pointer shadow-sm pr-10 font-sans"
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
                className="w-full appearance-none bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-navy dark:text-dark-text-primary rounded-sm focus:outline-none focus:border-gold transition-colors cursor-pointer shadow-sm pr-10 font-sans"
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

      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-sm overflow-hidden overflow-x-auto">
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-sans">No deals found.</div>
        ) : (
          <table className="w-full text-sm text-left table-auto">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-dark-border text-xs uppercase text-slate-400 font-bold tracking-wider font-sans">
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
                    <div className="font-semibold text-navy dark:text-dark-text-primary whitespace-normal break-words leading-tight font-sans">
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
                  <td className="px-6 py-5 text-right font-medium text-navy dark:text-dark-text-primary whitespace-nowrap font-mono">
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

      {/* Main Deal Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/20 dark:bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-surface w-full max-w-4xl rounded-sm shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-dark-border overflow-hidden animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="flex-none flex flex-col">
              <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-dark-border">
                <div>
                  <h3 className="text-2xl font-bold text-navy dark:text-dark-text-primary font-serif">
                    {selectedDeal ? (selectedDeal.propertyAddress || 'Deal Details') : 'New Deal'}
                  </h3>
                  {selectedDeal && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {selectedDeal.name} • {selectedDeal.dealSide}
                    </p>
                  )}
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-navy transition-colors"><X size={24} /></button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-white/5">
                {[
                  { id: 'Overview', icon: Info },
                  { id: 'Activities', icon: CheckCircle },
                  { id: 'Expenses', icon: Wallet }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isDisabled = !selectedDeal && tab.id !== 'Overview';
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isDisabled && setActiveTab(tab.id as ModalTab)}
                      disabled={isDisabled}
                      title={isDisabled ? "Save the deal to log activities and expenses." : ""}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all relative ${
                        isActive 
                          ? 'text-navy dark:text-white bg-white dark:bg-dark-surface' 
                          : 'text-slate-400 hover:text-navy dark:hover:text-white'
                      } ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />}
                      <Icon size={14} className={isActive ? 'text-gold' : ''} />
                      {tab.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-dark-surface">
              {activeTab === 'Overview' && (
                <div className="p-8 space-y-8 animate-fade-in">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-sans">Deal Side</label>
                      <select
                        value={formData.dealSide}
                        onChange={(e) => setFormData({...formData, dealSide: e.target.value as DealSide})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors font-sans"
                      >
                        <option value="BUYER">BUYER</option>
                        <option value="SELLER">SELLER</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-sans">Stage</label>
                      <select
                        value={formData.stage}
                        onChange={(e) => handleStageChange(e.target.value as DealStage)}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors font-sans"
                      >
                        {DEAL_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-sans">Property Address</label>
                      <div className="relative">
                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          value={formData.propertyAddress || ''}
                          onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})}
                          className="w-full border border-slate-200 dark:border-dark-border pl-12 pr-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors font-sans"
                          placeholder="e.g. 123 Luxury Lane, San Francisco"
                        />
                      </div>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-sans">Property Price ($)</label>
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-sans">Client Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full border border-slate-200 dark:border-dark-border pl-12 pr-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors font-sans"
                          placeholder="e.g. John Smith"
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-sans">Lead Source</label>
                      <select
                        value={formData.leadSource || ''}
                        onChange={(e) => setFormData({...formData, leadSource: e.target.value})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm focus:border-gold transition-colors font-sans"
                      >
                        <option value="">Select Source</option>
                        {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {formData.stage === DealStage.CLOSED && (
                      <div className="col-span-2 bg-green-50 dark:bg-green-900/10 p-6 rounded-sm border border-green-100 dark:border-green-900/20">
                        <label className="block text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2 font-sans">Commission Earned ($)</label>
                        <input
                          type="number"
                          value={formData.commissionEarned || ''}
                          onChange={(e) => setFormData({...formData, commissionEarned: parseFloat(e.target.value) || 0})}
                          className="w-full border border-green-200 dark:border-green-900/40 px-4 py-3 text-2xl font-bold text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm shadow-inner focus:border-green-500 transition-colors font-mono"
                          placeholder="0.00"
                        />
                        <p className="text-[10px] text-green-600 dark:text-green-400 mt-2 font-medium italic font-sans">Enter final realized income for this deal.</p>
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-sans">Notes</label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-white bg-white dark:bg-dark-surface rounded-sm h-24 resize-none focus:border-gold transition-colors font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Activities' && selectedDeal && (
                <div className="p-8 space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-navy dark:text-dark-text-primary font-serif">Deal Activities</h4>
                    <button 
                      onClick={() => setIsActivityModalOpen(true)}
                      className="bg-navy dark:bg-gold text-white dark:text-navy px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm"
                    >Log Activity</button>
                  </div>
                  <div className="border border-slate-100 dark:border-dark-border rounded-sm overflow-hidden">
                    {dealActivities.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-sans">No activities logged for this deal.</div>
                    ) : (
                      <ActivityTable 
                        activities={dealActivities} 
                        deals={deals} 
                        onDelete={(id) => setItemToDelete({ type: 'activity', id })} 
                      />
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Expenses' && selectedDeal && (
                <div className="p-8 space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-navy dark:text-dark-text-primary font-serif">Deal Expenses</h4>
                    <button 
                      onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
                      className="bg-navy dark:bg-gold text-white dark:text-navy px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm"
                    >Log Expense</button>
                  </div>
                  <div className="border border-slate-100 dark:border-dark-border rounded-sm overflow-hidden">
                    {dealExpenses.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-sans">No expenses logged for this deal.</div>
                    ) : (
                      <ExpenseTable 
                        expenses={dealExpenses} 
                        deals={deals} 
                        onDelete={(id) => setItemToDelete({ type: 'expense', id })} 
                        onEdit={(exp) => { setEditingExpense(exp); setIsExpenseModalOpen(true); }} 
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Overview Only) */}
            <div className="flex-none px-8 py-6 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-dark-border flex justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                {selectedDeal && activeTab === 'Overview' && (
                  <button onClick={() => setDealToDelete(selectedDeal)} className="text-red-500 hover:text-red-700 p-2 transition-colors"><Trash2 size={20} /></button>
                )}
                {!selectedDeal && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic animate-pulse">
                    Save deal to unlock all tabs
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-navy transition-colors font-sans">Close</button>
                {activeTab === 'Overview' && (
                  <button onClick={handleSaveDeal} className="px-8 py-2.5 text-sm font-bold bg-navy dark:bg-gold text-white dark:text-navy rounded-sm hover:opacity-90 transition-all uppercase tracking-widest shadow-sm">
                    {selectedDeal ? 'Update Deal' : 'Save Deal'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linked Modals */}
      {selectedDeal && (
        <>
          <ActivityModal 
            isOpen={isActivityModalOpen} 
            onClose={() => setIsActivityModalOpen(false)} 
            onSave={(data) => {
              addActivity({ ...data, id: crypto.randomUUID(), dealSide: selectedDeal.dealSide });
              setIsActivityModalOpen(false);
            }} 
            deals={deals} 
            lockedDealId={selectedDeal.id}
          />
          <ExpenseModal 
            isOpen={isExpenseModalOpen} 
            onClose={() => setIsExpenseModalOpen(false)} 
            onSave={(data, id) => {
              if (id) updateExpense({ ...data, id } as Expense);
              else addExpense({ ...data, id: crypto.randomUUID() } as Expense);
              setIsExpenseModalOpen(false);
            }} 
            deals={deals} 
            settings={settings} 
            editingExpense={editingExpense} 
            lockedDealId={selectedDeal.id}
          />
        </>
      )}

      {/* Global Confirmation Modals */}
      {dealToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-surface w-full max-w-md p-8 rounded-sm shadow-2xl border border-slate-200 dark:border-dark-border">
            <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangle /> Delete Deal?</h3>
            <p className="text-slate-600 dark:text-dark-text-secondary mb-6 text-sm font-sans">Deleting this transaction will permanently remove all linked expenses and activity. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDealToDelete(null)} className="px-4 py-2 text-sm text-slate-500 font-sans">Cancel</button>
              <button onClick={() => { deleteDeal(dealToDelete.id); setDealToDelete(null); setIsModalOpen(false); }} className="px-6 py-2 text-sm font-bold bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors uppercase tracking-widest">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {itemToDelete && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 dark:bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-dark-border">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold font-serif text-navy dark:text-white mb-2 uppercase tracking-wide">Delete {itemToDelete.type}?</h3>
                    <p className="text-slate-500 dark:text-dark-text-secondary text-sm mb-6 font-sans">
                        This record will be permanently removed.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setItemToDelete(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-dark-text-secondary hover:text-navy dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => { 
                              if (itemToDelete.type === 'activity') deleteActivity(itemToDelete.id);
                              else deleteExpense(itemToDelete.id);
                              setItemToDelete(null); 
                            }}
                            className="px-5 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-sm shadow-sm transition-colors uppercase tracking-widest"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
         </div>
       )}
    </div>
  );
};
