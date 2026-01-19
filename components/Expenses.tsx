import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Expense, ExpenseType, ExpenseCategory, Deal } from '../types';
import { Plus, Trash2, Fuel, AlertTriangle, Edit2 } from 'lucide-react';

export const Expenses = () => {
  const { expenses, addExpense, deleteExpense, updateExpense, settings, deals } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Standard' | 'Mileage'>('Standard');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete Modal State
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const initialFormState: Omit<Expense, 'id' | 'gallonsUsed' | 'fuelCost' | 'totalCost'> = {
    type: ExpenseType.STANDARD,
    category: ExpenseCategory.PHOTOGRAPHY, // Default
    date: new Date().toISOString().split('T')[0],
    notes: '',
    quantity: 1,
    costPerUnit: 0,
    milesDriven: 0,
    mpg: settings.defaultMPG,
    gasPrice: settings.defaultGasPrice,
    dealId: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Update defaults when modal opens or tab changes
  useEffect(() => {
    if (editingId) return; // Don't override if editing

    if (activeTab === 'Mileage') {
        setFormData(prev => ({
            ...prev,
            type: ExpenseType.MILEAGE,
            category: ExpenseCategory.MILEAGE, // Auto-select Mileage category
            mpg: settings.defaultMPG,
            gasPrice: settings.defaultGasPrice
        }));
    } else {
        setFormData(prev => ({ 
            ...prev, 
            type: ExpenseType.STANDARD,
            category: ExpenseCategory.PHOTOGRAPHY // Reset to first standard category
        }));
    }
  }, [activeTab, settings, editingId]);

  // Calculations
  const gallonsUsed = formData.milesDriven / (formData.mpg || 1);
  const fuelCost = gallonsUsed * formData.gasPrice;
  const standardTotal = formData.quantity * formData.costPerUnit;
  
  const currentTotalCost = activeTab === 'Mileage' ? fuelCost : standardTotal;

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setActiveTab('Standard');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setActiveTab(expense.type === ExpenseType.MILEAGE ? 'Mileage' : 'Standard');
    setFormData({
        type: expense.type,
        category: expense.category,
        date: expense.date,
        notes: expense.notes || '',
        quantity: expense.quantity,
        costPerUnit: expense.costPerUnit,
        milesDriven: expense.milesDriven,
        mpg: expense.mpg,
        gasPrice: expense.gasPrice,
        dealId: expense.dealId || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (currentTotalCost <= 0) return alert("Total cost must be greater than 0");
    if (activeTab === 'Mileage' && formData.milesDriven <= 0) return alert("Miles driven must be > 0");

    const linkedDeal = deals.find(d => d.id === formData.dealId);

    const expensePayload = {
        ...formData,
        dealType: linkedDeal?.type, // Derived from linked deal
        gallonsUsed: activeTab === 'Mileage' ? gallonsUsed : 0,
        fuelCost: activeTab === 'Mileage' ? fuelCost : 0,
        totalCost: currentTotalCost,
        // Ensure notes are only saved for allowed categories
        notes: (formData.category === ExpenseCategory.MARKETING || formData.category === ExpenseCategory.OTHER || formData.category) // Save notes for all to be safe for now or stick to strict logic? Prompt says "edit... Notes".
               ? formData.notes 
               : undefined
    };

    if (editingId) {
        updateExpense({ ...expensePayload, id: editingId } as Expense);
    } else {
        addExpense({ ...expensePayload, id: crypto.randomUUID() } as Expense);
    }

    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
        deleteExpense(expenseToDelete);
        setExpenseToDelete(null);
    }
  };

  // Check if notes field should be shown
  const showNotes = true; // Allow notes for everything for better editing experience as requested

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

      {/* List */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-sm overflow-hidden">
        {expenses.length === 0 ? (
           <div className="p-12 text-center text-slate-400 dark:text-dark-text-muted">
             <p>No expenses logged yet.</p>
           </div>
        ) : (
            <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-dark-border text-xs uppercase text-slate-400 dark:text-dark-text-muted font-bold tracking-wider font-sans">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category / Type</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Deal</th>
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
                            onClick={() => handleOpenEdit(exp)}
                            className="hover:bg-slate-50 dark:hover:bg-white/5 group cursor-pointer"
                        >
                            <td className="px-6 py-4 text-slate-500 dark:text-dark-text-secondary">{exp.date}</td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-navy dark:text-dark-text-primary">{exp.category}</div>
                                <div className="text-xs text-slate-400 dark:text-dark-text-muted flex items-center gap-1 mt-0.5">
                                    {exp.type === ExpenseType.MILEAGE && <Fuel size={10} />}
                                    {exp.type}
                                </div>
                                {exp.notes && (
                                  <div className="text-xs text-slate-400 dark:text-dark-text-muted mt-1 italic max-w-xs truncate">
                                    "{exp.notes}"
                                  </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-dark-text-secondary">
                                {exp.type === ExpenseType.MILEAGE ? (
                                    <span>{exp.milesDriven} mi @ {exp.mpg} mpg</span>
                                ) : (
                                    <span>{exp.quantity} qty @ ${exp.costPerUnit}</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {linkedDeal ? (
                                    <span className="inline-block max-w-[150px] truncate text-xs px-2 py-1 rounded-sm border bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border">
                                        {linkedDeal.name}
                                    </span>
                                ) : <span className="text-slate-300 dark:text-white/20">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-navy dark:text-dark-text-primary font-serif">
                                ${exp.totalCost.toFixed(2)}
                            </td>
                             <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); setExpenseToDelete(exp.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
            </table>
        )}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/20 dark:bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-dark-border">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-dark-border">
              <h3 className="text-lg font-bold text-navy dark:text-dark-text-primary font-serif">{editingId ? 'Edit Expense' : 'Log Expense'}</h3>
            </div>
            
            {!editingId && (
                <div className="flex border-b border-slate-100 dark:border-dark-border">
                    <button 
                        onClick={() => setActiveTab('Standard')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Standard' ? 'border-navy dark:border-gold text-navy dark:text-white' : 'border-transparent text-slate-400 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-white/5 hover:text-navy dark:hover:text-white'}`}
                    >
                        Standard Expense
                    </button>
                    <button 
                        onClick={() => setActiveTab('Mileage')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Mileage' ? 'border-navy dark:border-gold text-navy dark:text-white' : 'border-transparent text-slate-400 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-white/5 hover:text-navy dark:hover:text-white'}`}
                    >
                        Mileage (Fuel)
                    </button>
                </div>
            )}

            <div className="p-8 space-y-6">
                
                {/* Common Fields */}
                <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                            disabled={activeTab === 'Mileage'}
                            className={`w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface
                                ${activeTab === 'Mileage' ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-white/5' : ''}`}
                        >
                            {Object.values(ExpenseCategory).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                     <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Link to Deal (Optional)</label>
                        <select
                            value={formData.dealId}
                            onChange={(e) => setFormData({...formData, dealId: e.target.value})}
                            className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                        >
                            <option value="">-- No Deal Linked --</option>
                            {deals.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                            ))}
                        </select>
                    </div>

                    {showNotes && (
                      <div className="col-span-2">
                         <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Notes</label>
                         <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({...formData, notes: e.target.value.slice(0, 500)})}
                            className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface h-20 resize-none"
                            placeholder="Add details..."
                         />
                      </div>
                    )}
                </div>

                {/* Specific Fields */}
                {activeTab === 'Standard' ? (
                     <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-white/5 p-6 border border-slate-200 dark:border-dark-border rounded-sm">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                                className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Cost Per Unit</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.costPerUnit}
                                onChange={(e) => setFormData({...formData, costPerUnit: parseFloat(e.target.value) || 0})}
                                className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                            />
                        </div>
                     </div>
                ) : (
                    <div className="space-y-4 bg-slate-50 dark:bg-white/5 p-6 border border-slate-200 dark:border-dark-border rounded-sm">
                         <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Miles Driven</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.milesDriven}
                                onChange={(e) => setFormData({...formData, milesDriven: parseFloat(e.target.value) || 0})}
                                className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-navy dark:focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
                                placeholder="0"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">MPG</label>
                                <input
                                    type="number"
                                    readOnly={!editingId} // Locked unless I decide to unlock it. Prompt said: "Allow users to edit... Mileage / MPG". So unlock it in edit.
                                    value={formData.mpg}
                                    onChange={(e) => editingId && setFormData({...formData, mpg: parseFloat(e.target.value) || 0})}
                                    className={`w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-slate-500 dark:text-dark-text-muted focus:outline-none rounded-sm ${editingId ? 'bg-white dark:bg-dark-surface' : 'bg-slate-100 dark:bg-white/10 cursor-not-allowed'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Gas Price ($)</label>
                                <input
                                    type="number"
                                    readOnly={!editingId}
                                    value={formData.gasPrice}
                                    onChange={(e) => editingId && setFormData({...formData, gasPrice: parseFloat(e.target.value) || 0})}
                                    className={`w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-slate-500 dark:text-dark-text-muted focus:outline-none rounded-sm ${editingId ? 'bg-white dark:bg-dark-surface' : 'bg-slate-100 dark:bg-white/10 cursor-not-allowed'}`}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Total Display */}
                <div className="flex justify-between items-center bg-navy dark:bg-white/10 text-white p-6 rounded-sm border border-transparent dark:border-dark-border">
                    <span className="uppercase tracking-wider text-xs font-bold text-slate-400 dark:text-dark-text-secondary">Total Calculated Cost</span>
                    <span className="text-2xl font-bold font-serif">${currentTotalCost.toFixed(2)}</span>
                </div>

            </div>

             <div className="px-8 py-6 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-dark-border flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-500 dark:text-dark-text-secondary hover:text-navy dark:hover:text-white">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium bg-navy dark:bg-gold text-white dark:text-navy hover:bg-navy-light dark:hover:bg-gold-hover rounded-sm shadow-none transition-colors">
                {editingId ? 'Update Expense' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
       )}

       {/* Delete Confirmation Modal */}
       {expenseToDelete && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 dark:bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-dark-border">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold font-serif text-navy dark:text-white mb-2">Delete Expense?</h3>
                    <p className="text-slate-500 dark:text-dark-text-secondary text-sm mb-6">
                        This will permanently remove this expense from your records and update totals.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setExpenseToDelete(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-dark-text-secondary hover:text-navy dark:hover:text-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="px-5 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 rounded-sm shadow-sm transition-colors"
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