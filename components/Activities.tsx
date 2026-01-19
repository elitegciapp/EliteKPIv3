import React, { useState } from 'react';
import { useApp } from '../context';
import { Activity, ActivityCategory, Deal } from '../types';
import { Plus, Trash2, CalendarCheck, CheckSquare } from 'lucide-react';

export const Activities = () => {
  const { activities, addActivity, deleteActivity, deals } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialFormState: Omit<Activity, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    category: ActivityCategory.BUYER_MEETING,
    notes: '',
    dealId: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleSave = () => {
    const linkedDeal = deals.find(d => d.id === formData.dealId);

    const newActivity: Activity = {
      ...formData,
      id: crypto.randomUUID(),
      dealType: linkedDeal?.type // Derived from linked deal
    };

    addActivity(newActivity);
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Activities</h2>
          <p className="text-slate-500 mt-1 font-normal">Meetings, inspections, and showings.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 text-sm font-medium rounded-sm hover:bg-navy-light transition-colors shadow-none"
        >
          <Plus size={16} />
          Log Activity
        </button>
      </header>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        {activities.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p>No activities logged yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-400 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Linked Deal</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...activities].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(act => {
                const linkedDeal = deals.find(d => d.id === act.dealId);
                return (
                  <tr key={act.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4 text-slate-500">{act.date}</td>
                    <td className="px-6 py-4 font-medium text-navy">
                        {act.category}
                    </td>
                    <td className="px-6 py-4">
                      {linkedDeal ? (
                        <span className="inline-block max-w-[200px] truncate text-xs px-2 py-1 rounded-sm border bg-slate-50 text-slate-600 border-slate-200">
                          {linkedDeal.name}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-400 italic truncate max-w-xs">
                        {act.notes || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteActivity(act.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/20 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-navy">Log Activity</h3>
            </div>

            <div className="p-8 space-y-6">
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Activity Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as ActivityCategory})}
                  className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white"
                >
                  {Object.values(ActivityCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
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

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm bg-white h-24 resize-none"
                  placeholder="Details..."
                />
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-navy">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium bg-navy text-white hover:bg-navy-light rounded-sm shadow-none">
                Save Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};