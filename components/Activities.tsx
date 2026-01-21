
import React, { useState } from 'react';
import { useApp } from '../context';
import { Activity, ActivityCategory, Deal } from '../types';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface ActivityTableProps {
  activities: Activity[];
  deals: Deal[];
  onDelete: (id: string) => void;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({ activities, deals, onDelete }) => {
  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-dark-border text-xs uppercase text-slate-400 dark:text-dark-text-muted font-bold tracking-wider font-sans">
        <tr>
          <th className="px-6 py-4">Date</th>
          <th className="px-6 py-4">Category</th>
          {!activities.every(a => !!a.dealId) && <th className="px-6 py-4">Linked Deal</th>}
          <th className="px-6 py-4">Notes</th>
          <th className="px-6 py-4 w-10"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
        {[...activities].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(act => {
          const linkedDeal = deals.find(d => d.id === act.dealId);
          return (
            <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-white/5 group transition-colors">
              <td className="px-6 py-4 text-slate-500 dark:text-dark-text-secondary whitespace-nowrap">{act.date}</td>
              <td className="px-6 py-4 font-medium text-navy dark:text-dark-text-primary">
                  {act.category}
              </td>
              {!activities.every(a => !!a.dealId) && (
                <td className="px-6 py-4">
                  {linkedDeal ? (
                    <span className="inline-block max-w-[200px] truncate text-xs px-2 py-1 rounded-sm border bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border">
                      {linkedDeal.name}
                    </span>
                  ) : <span className="text-slate-300 dark:text-white/20">-</span>}
                </td>
              )}
              <td className="px-6 py-4 text-slate-400 dark:text-dark-text-muted italic truncate max-w-xs">
                  {act.notes || '-'}
              </td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => onDelete(act.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Omit<Activity, 'id'>) => void;
  deals: Deal[];
  lockedDealId?: string;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, onSave, deals, lockedDealId }) => {
  const initialFormState: Omit<Activity, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    category: ActivityCategory.BUYER_MEETING,
    notes: '',
    dealId: lockedDealId || '',
  };

  const [formData, setFormData] = useState(initialFormState);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/20 dark:bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-surface w-full max-w-md rounded-sm shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up border border-slate-200 dark:border-dark-border overflow-hidden">
        <div className="flex-none flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-dark-border">
          <h3 className="text-lg font-bold text-navy dark:text-dark-text-primary font-serif font-serif">Log Activity</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Activity Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value as ActivityCategory})}
              className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface"
            >
              {Object.values(ActivityCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {!lockedDealId && (
            <div>
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

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full border border-slate-200 dark:border-dark-border px-4 py-2.5 text-navy dark:text-dark-text-primary focus:outline-none focus:border-gold rounded-sm bg-white dark:bg-dark-surface h-24 resize-none"
              placeholder="Details..."
            />
          </div>
        </div>

        <div className="flex-none px-8 py-6 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-dark-border flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-500 dark:text-dark-text-secondary hover:text-navy dark:hover:text-white transition-colors">Cancel</button>
          <button 
            onClick={() => onSave(formData)} 
            className="px-6 py-2.5 text-sm font-medium bg-navy dark:bg-gold text-white dark:text-navy hover:bg-navy-light dark:hover:bg-gold-hover rounded-sm shadow-none"
          >
            Save Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export const Activities = () => {
  const { activities, addActivity, deleteActivity, deals } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  const handleSave = (data: Omit<Activity, 'id'>) => {
    const linkedDeal = deals.find(d => d.id === data.dealId);
    addActivity({
      ...data,
      id: crypto.randomUUID(),
      dealSide: linkedDeal?.dealSide
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-dark-text-primary font-serif">Activities</h2>
          <p className="text-slate-500 dark:text-dark-text-secondary mt-2 font-normal">Meetings, inspections, and showings.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-navy dark:bg-gold text-white dark:text-navy px-5 py-2.5 text-sm font-medium rounded-sm hover:bg-navy-light dark:hover:bg-gold-hover transition-colors shadow-none"
        >
          <Plus size={16} />
          Log Activity
        </button>
      </header>

      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-sm overflow-hidden overflow-x-auto">
        {activities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-dark-text-muted font-sans">
            <p>No activities logged yet.</p>
          </div>
        ) : (
          <ActivityTable 
            activities={activities} 
            deals={deals} 
            onDelete={(id) => setActivityToDelete(id)} 
          />
        )}
      </div>

      <ActivityModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        deals={deals} 
      />

      {activityToDelete && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 dark:bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-sm shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-dark-border">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold font-serif text-navy dark:text-white mb-2">Delete Activity?</h3>
                    <p className="text-slate-500 dark:text-dark-text-secondary text-sm mb-6 font-sans">
                        This will permanently remove this activity. Linked deals will remain unchanged.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setActivityToDelete(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-dark-text-secondary hover:text-navy dark:hover:text-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => { deleteActivity(activityToDelete); setActivityToDelete(null); }}
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
