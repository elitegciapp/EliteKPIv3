
import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Expense, ExpenseType, ExpenseCategory, Deal, KPISettings } from '../types';
import { Plus, Trash2, Fuel, AlertTriangle } from 'lucide-react';

interface ExpenseTableProps {
  expenses: Expense[];
  deals: Deal[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, deals, onDelete, onEdit }) => {
  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-dark-border text-xs uppercase text-slate-400 dark:text-dark-text-muted font-bold tracking-wider font-sans">
        <tr>
          <th className="px-6 py-4">Date</th>
          <th className="px-6 py-4">Category / Type</th>
          <th className="px-6 py-4">Details</th>
          {!expenses.every(e => !!e.dealId) && <th className="px-6 py-4">Deal</th>}
          <th className="px-6 py-4 text-right">Cost</th>
          <th className="px-6 py-4 w-10"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {[...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => {
              const linkedDeal = deals.find(d => d.id === exp.dealId);
              return (
                  <tr 
                      key={exp.id} 
                      onClick={() => onEdit(exp)}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 group cursor-pointer transition-colors"
                  >
                      <td className="px-6 py-4 text-slate-500 dark:text-dark-text-secondary whitespace-nowrap">{exp.date}</td>
                      <td className="px-6 py-4">
                          <div className="font-medium text-navy dark:text-dark-text-primary">{exp.category}</div>
                          <div className="text-[10px] text-slate-400 dark:text-dark-text-muted flex items-center gap-1 mt-0.5 uppercase tracking-wider font-bold">
                              {exp.type === ExpenseType.MILEAGE && <Fuel size={10} />}
                              {exp.type}
                          </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-dark-text-secondary">
                          {exp.type === ExpenseType.MILEAGE ? (
                              <span className="text-xs">{exp.milesDriven} mi @ {exp.mpg} mpg</span>
                          ) : (
                              <span className="text-xs">{exp.quantity} qty @ ${exp.costPerUnit}</span>
                          )}
                      </td>
                      {!expenses.every(e => !!e.dealId) && (
                        <td className="px-6 py-4">
                          {linkedDeal ? (
                              <span className="inline-block max-w-[150px] truncate text-[10px] font-bold px-2 py-1 rounded-sm border bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border uppercase">
                                  {linkedDeal.name}
                              </span>
                          ) : <span className="text-slate-300 dark:text-white/20">-</span>}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right font-bold text-navy dark:text-dark-text-primary font-serif">
                          ${exp.totalCost.toFixed(2)}
                      </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(exp.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={16} />
                          </button>
                      </td>
                  </tr>
              )
          })}
      </tbody>
    </table>
  );
};

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>, id?: string) => void;
  deals: Deal[];
  settings: KPISettings;
  editingExpense: Expense | null;
  lockedDealId?: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSave, deals, settings, editingExpense, lockedDealId }) => {
  const [activeTab, setActiveTab] = useState<'Standard' | 'Mileage'>('Standard');
  
  const initialFormState: Omit<Expense, 'id' | 'gallonsUsed' | 'fuelCost' | 'totalCost'> = {
    type: ExpenseType.STANDARD,
    category: ExpenseCategory.PHOTOGRAPHY,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    quantity: 1,
    costPerUnit: 0,
    milesDriven: 0,
    mpg: settings.defaultMPG,
    gasPrice: settings.defaultGasPrice,
    dealId: lockedDealId || '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (editingExpense) {
      setActiveTab(editingExpense.type === ExpenseType.MILEAGE ? 'Mileage' : 'Standard');
      setFormData({
        type: editingExpense.type,
        category: editingExpense.category,
        date: editingExpense.date,
        notes: editingExpense.notes || '',
        quantity: editingExpense.quantity,
        costPerUnit: editingExpense.costPerUnit,
        milesDriven: editingExpense.milesDriven,
        mpg: editingExpense.mpg,
        gasPrice: editingExpense.gasPrice,
        dealId: editingExpense.dealId || lockedDealId || '',
      });
    } else {
      setFormData(prev => ({ 
        ...initialFormState, 
        dealId: lockedDealId || '',
        type: activeTab === 'Mileage' ? ExpenseType.MILEAGE : ExpenseType.STANDARD,
        category: activeTab === 'Mileage' ? ExpenseCategory.MILEAGE : ExpenseCategory.PHOTOGRAPHY
      }));
    }
  }, [editingExpense, isOpen, activeTab, lockedDealId]);

  if (!isOpen) return null;

  const gallonsUsed = formData.milesDriven / (formData.mpg || 1);
  const fuelCost = gallonsUsed * formData.gasPrice;
  const standardTotal = formData.quantity * formData.costPerUnit;
  const currentTotalCost = activeTab === 'Mileage' ? fuelCost : standardTotal;

  const handleSaveInternal = () => {
    if (currentTotalCost <= 0) return alert("Total cost must be greater than 0");
    const linkedDeal = deals.find(d => d.id === formData.dealId);
    
    onSave({
      ...formData,
      dealSide: linkedDeal?.dealSide,
      gallonsUsed: activeTab === 'Mileage' ? gallonsUsed : 0,
      fuelCost: activeTab === 'Mileage' ? fuelCost : 0,
      totalCost: currentTotalCost,
    }, editingExpense?.id);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/20 dark:bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-sm shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up border border-slate-200 dark:border-dark-border overflow-hidden">
        <div className="flex-none flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-dark-border">
          <h3 className="text-lg font-bold text-navy dark:text-dark-text-primary font-serif">{editingExpense ? 'Edit Expense' : 'Log Expense'}</h3>
        </div>
        
        {!editingExpense && (
            <div className="flex-none flex border-b border-slate-100 dark:border-dark-border">
                {['Standard', 'Mileage'].map(tab => (
                  <button 
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab ? 'border-gold text-navy dark:text-white' : 'border-transparent text-slate-400 hover:text-navy dark:hover:text-white'}`}
                  >
                      {tab === 'Standard' ? 'Standard Expense' : 'Mileage (Fuel)'}
                  </button>
                ))}
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Date</label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface font-sans"
                    />
                </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Category</label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                        disabled={activeTab === 'Mileage'}
                        className={`w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface
                            ${activeTab === 'Mileage' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {Object.values(ExpenseCategory).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                  {!lockedDealId && (
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Link to Deal (Optional)</label>
                      <select
                        value={formData.dealId}
                        onChange={(e) => setFormData({...formData, dealId: e.target.value})}
                          className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                      >
                        <option value="">-- No Deal Linked --</option>
                        {deals.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.dealSide})</option>
                        ))}
                      </select>
                    </div>
                  )}
            </div>

            {activeTab === 'Standard' ? (
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-sm border border-slate-100 dark:border-dark-border grid grid-cols-2 gap-4">
                    <div>
                          <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Cost ($)</label>
                          <input
                            type="number"
                            value={formData.costPerUnit || ''}
                            onChange={(e) => setFormData({...formData, costPerUnit: parseFloat(e.target.value) || 0})}
                            className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface font-mono"
                          />
                    </div>
                    <div>
                          <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Qty</label>
                          <input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 1})}
                            className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface font-mono"
                          />
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-sm border border-slate-100 dark:border-dark-border space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Miles Driven</label>
                          <input
                            type="number"
                            value={formData.milesDriven || ''}
                            onChange={(e) => setFormData({...formData, milesDriven: parseFloat(e.target.value) || 0})}
                            className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface font-bold text-lg font-mono"
                            placeholder="e.g. 25"
                          />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">Vehicle MPG</label>
                            <input
                                type="number"
                                value={formData.mpg}
                                onChange={(e) => setFormData({...formData, mpg: parseFloat(e.target.value) || 0})}
                                className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-sm text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">Gas Price ($)</label>
                            <input
                                type="number"
                                value={formData.gasPrice}
                                onChange={(e) => setFormData({...formData, gasPrice: parseFloat(e.target.value) || 0})}
                                className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-sm text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface font-mono"
                            />
                          </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-dark-text-secondary font-sans">Calculated Fuel Cost</span>
                        <span className="text-lg font-bold text-navy dark:text-white font-serif">${fuelCost.toFixed(2)}</span>
                    </div>
                </div>
            )}
            
            <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Notes</label>
                <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface h-24 resize-none"
                />
            </div>
        </div>

        <div className="flex-none px-8 py-6 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-dark-border flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-500 dark:text-dark-text-secondary hover:text-navy dark:hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSaveInternal} className="px-6 py-2.5 text-sm font-medium bg-navy dark:bg-gold text-white dark:text-navy hover:bg-navy-light dark:hover:bg-gold-hover rounded-sm shadow-none transition-colors">
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
};

export const Expenses = () => {
  const { expenses, addExpense, deleteExpense, updateExpense, settings, deals } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleSave = (data: Omit<Expense, 'id'>, id?: string) => {
    if (id) {
      updateExpense({ ...data, id } as Expense);
    } else {
      addExpense({ ...data, id: crypto.randomUUID() } as Expense);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
       <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-dark-text-primary font-serif">Expenses</h2>
          <p className="text-slate-500 dark:text-dark-text-secondary mt-2 font-normal">Track costs and auto-calculate mileage.</p>
        </div>
        <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-navy dark:bg-gold text-white dark:text-navy px-5 py-2.5 text-sm font-medium rounded-sm hover:bg-navy-light dark:hover:bg-gold-hover transition-colors shadow-none"
          >
            <Plus size={16} />
            Log Expense
          </button>
      </header>

      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-sm overflow-hidden overflow-x-auto">
        {expenses.length === 0 ? (
           <div className="p-12 text-center text-slate-400 dark:text-dark-text-muted font-sans">
             <p>No expenses logged yet.</p>
           </div>
        ) : (
            <ExpenseTable 
              expenses={expenses} 
              deals={deals} 
              onDelete={(id) => setExpenseToDelete(id)} 
              onEdit={handleOpenEdit} 
            />
        )}
      </div>

      <ExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        deals={deals} 
        settings={settings} 
        editingExpense={editingExpense} 
      />

       {expenseToDelete && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 dark:bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-dark-border">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold font-serif text-navy dark:text-white mb-2">Delete Expense?</h3>
                    <p className="text-slate-500 dark:text-dark-text-secondary text-sm mb-6 font-sans">
                        This will permanently remove this expense record.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setExpenseToDelete(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-dark-text-secondary hover:text-navy dark:hover:text-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => { deleteExpense(expenseToDelete); setExpenseToDelete(null); }}
                            className="px-5 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-sm shadow-sm transition-colors"
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
