import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Expense, ExpenseType, ExpenseCategory, Deal } from '../types';
import { Plus, Trash2, Fuel } from 'lucide-react';

export const Expenses = () => {
  const { expenses, addExpense, deleteExpense, settings, deals } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Standard' | 'Mileage'>('Standard');

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
  }, [activeTab, settings]);

  // Calculations
  const gallonsUsed = formData.milesDriven / (formData.mpg || 1);
  const fuelCost = gallonsUsed * formData.gasPrice;
  const standardTotal = formData.quantity * formData.costPerUnit;
  
  const currentTotalCost = activeTab === 'Mileage' ? fuelCost : standardTotal;

  const handleSave = () => {
    if (currentTotalCost <= 0) return alert("Total cost must be greater than 0");
    if (activeTab === 'Mileage' && formData.milesDriven <= 0) return alert("Miles driven must be > 0");

    const linkedDeal = deals.find(d => d.id === formData.dealId);

    const newExpense: Expense = {
        ...formData,
        id: crypto.randomUUID(),
        dealType: linkedDeal?.type, // Derived from linked deal
        gallonsUsed: activeTab === 'Mileage' ? gallonsUsed : 0,
        fuelCost: activeTab === 'Mileage' ? fuelCost : 0,
        totalCost: currentTotalCost,
        // Ensure notes are only saved for allowed categories
        notes: (formData.category === ExpenseCategory.MARKETING || formData.category === ExpenseCategory.OTHER) 
               ? formData.notes 
               : undefined
    };
    addExpense(newExpense);
    setIsModalOpen(false);
    setFormData(initialFormState); // reset
  };

  // Check if notes field should be shown
  const showNotes = formData.category === ExpenseCategory.MARKETING || formData.category === ExpenseCategory.OTHER;

  return (
    <div className="space-y-6">
       <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Expenses</h2>
          <p className="text-slate-500 mt-1 font-normal">Track costs and auto-calculate mileage.</p>
        </div>
        <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 text-sm font-medium rounded-sm hover:bg-navy-light transition-colors shadow-none"
          >
            <Plus size={16} />
            Log Expense
          </button>
      </header>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        {expenses.length === 0 ? (
           <div className="p-12 text-center text-slate-400">
             <p>No expenses logged yet.</p>
           </div>
        ) : (
            <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-400 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category / Type</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Deal</th>
                <th className="px-6 py-4 text-right">Cost</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {[...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => {
                    const linkedDeal = deals.find(d => d.id === exp.dealId);
                    return (
                        <tr key={exp.id} className="hover:bg-slate-50 group">
                            <td className="px-6 py-4 text-slate-500">{exp.date}</td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-navy">{exp.category}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    {exp.type === ExpenseType.MILEAGE && <Fuel size={10} />}
                                    {exp.type}
                                </div>
                                {exp.notes && (
                                  <div className="text-xs text-slate-400 mt-1 italic max-w-xs truncate">
                                    "{exp.notes}"
                                  </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                                {exp.type === ExpenseType.MILEAGE ? (
                                    <span>{exp.milesDriven} mi @ {exp.mpg} mpg</span>
                                ) : (
                                    <span>{exp.quantity} qty @ ${exp.costPerUnit}</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {linkedDeal ? (
                                    <span className="inline-block max-w-[150px] truncate text-xs px-2 py-1 rounded-sm border bg-slate-50 text-slate-600 border-slate-200">
                                        {linkedDeal.name}
                                    </span>
                                ) : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-navy">
                                ${exp.totalCost.toFixed(2)}
                            </td>
                             <td className="px-6 py-4 text-right">
                                <button onClick={() => deleteExpense(exp.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/20 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-navy">Log Expense</h3>
            </div>
            
            <div className="flex border-b border-slate-100">
                <button 
                    onClick={() => setActiveTab('Standard')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Standard' ? 'border-navy text-navy' : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-navy'}`}
                >
                    Standard Expense
                </button>
                <button 
                    onClick={() => setActiveTab('Mileage')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Mileage' ? 'border-navy text-navy' : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-navy'}`}
                >
                    Mileage (Fuel)
                </button>
            </div>

            <div className="p-8 space-y-6">
                
                {/* Common Fields */}
                <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                            disabled={activeTab === 'Mileage'}
                            className={`w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white
                                ${activeTab === 'Mileage' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        >
                            {Object.values(ExpenseCategory).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                     <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Link to Deal (Optional)</label>
                        <select
                            value={formData.dealId}
                            onChange={(e) => setFormData({...formData, dealId: e.target.value})}
                            className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white"
                        >
                            <option value="">-- No Deal Linked --</option>
                            {deals.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                            ))}
                        </select>
                    </div>

                    {showNotes && (
                      <div className="col-span-2">
                         <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
                         <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({...formData, notes: e.target.value.slice(0, 500)})}
                            className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white h-20 resize-none"
                            placeholder="Add details..."
                         />
                      </div>
                    )}
                </div>

                {/* Specific Fields */}
                {activeTab === 'Standard' ? (
                     <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 border border-slate-200 rounded-sm">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                                className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cost Per Unit</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.costPerUnit}
                                onChange={(e) => setFormData({...formData, costPerUnit: parseFloat(e.target.value) || 0})}
                                className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white"
                            />
                        </div>
                     </div>
                ) : (
                    <div className="space-y-4 bg-slate-50 p-6 border border-slate-200 rounded-sm">
                         <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Miles Driven</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.milesDriven}
                                onChange={(e) => setFormData({...formData, milesDriven: parseFloat(e.target.value) || 0})}
                                className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white"
                                placeholder="0"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">MPG</label>
                                <input
                                    type="number"
                                    readOnly
                                    value={formData.mpg}
                                    className="w-full border border-slate-200 px-4 py-2.5 text-slate-500 bg-slate-100 cursor-not-allowed focus:outline-none rounded-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gas Price ($)</label>
                                <input
                                    type="number"
                                    readOnly
                                    value={formData.gasPrice}
                                    className="w-full border border-slate-200 px-4 py-2.5 text-slate-500 bg-slate-100 cursor-not-allowed focus:outline-none rounded-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Total Display */}
                <div className="flex justify-between items-center bg-navy text-white p-6 rounded-sm">
                    <span className="uppercase tracking-wider text-xs font-bold text-slate-400">Total Calculated Cost</span>
                    <span className="text-2xl font-bold">${currentTotalCost.toFixed(2)}</span>
                </div>

            </div>

             <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-navy">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium bg-navy text-white hover:bg-navy-light rounded-sm shadow-none transition-colors">
                Save Expense
              </button>
            </div>
          </div>
        </div>
       )}

    </div>
  );
};