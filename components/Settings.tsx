import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { KPISettings } from '../types';
import { Save, RefreshCw } from 'lucide-react';

export const Settings = () => {
  const { settings, updateSettings } = useApp();
  const [formData, setFormData] = useState<KPISettings>(settings);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateSettings(formData);
    setIsDirty(false);
  };

  // Math
  const reqDealsYear = formData.annualGCIGoal / ((formData.avgBuyerCommission + formData.avgSellerCommission) / 2 || 1);
  const reqDealsMonth = reqDealsYear / 12;
  const reqApptsYear = reqDealsYear / (formData.targetCloseRate / 100 || 1);
  const reqApptsMonth = reqApptsYear / 12;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-navy">KPI Settings</h2>
          <p className="text-slate-500 mt-1 font-normal">Global assumptions and goals.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-sm transition-all shadow-none ${
            isDirty 
              ? 'bg-navy text-white hover:bg-navy-light' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Save size={16} />
          Save Changes
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="space-y-8">
          
          <section className="bg-white p-6 border border-slate-200 rounded-sm">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Annual Goals</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Annual GCI Goal ($)</label>
                <input
                  type="number"
                  name="annualGCIGoal"
                  value={formData.annualGCIGoal}
                  onChange={handleChange}
                  className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm transition-colors bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Close Rate (%)</label>
                <input
                  type="number"
                  name="targetCloseRate"
                  value={formData.targetCloseRate}
                  onChange={handleChange}
                  className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm transition-colors bg-white"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 border border-slate-200 rounded-sm">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Commission Assumptions</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Buyer Comm ($)</label>
                <input
                  type="number"
                  name="avgBuyerCommission"
                  value={formData.avgBuyerCommission}
                  onChange={handleChange}
                  className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm transition-colors bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Seller Comm ($)</label>
                <input
                  type="number"
                  name="avgSellerCommission"
                  value={formData.avgSellerCommission}
                  onChange={handleChange}
                  className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm transition-colors bg-white"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 border border-slate-200 rounded-sm">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Global Defaults</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default MPG</label>
                <input
                  type="number"
                  name="defaultMPG"
                  value={formData.defaultMPG}
                  onChange={handleChange}
                  className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm transition-colors bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gas Price ($/gal)</label>
                <input
                  type="number"
                  name="defaultGasPrice"
                  value={formData.defaultGasPrice}
                  onChange={handleChange}
                  className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm transition-colors bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Est. Tax Rate (%)</label>
                <input
                  type="number"
                  name="estimatedTaxRate"
                  value={formData.estimatedTaxRate}
                  onChange={handleChange}
                  className="w-full border border-slate-200 px-4 py-2.5 text-navy focus:outline-none focus:border-navy rounded-sm transition-colors bg-white"
                />
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Calculated Requirements */}
        <div className="bg-navy text-white p-8 rounded-sm shadow-none h-fit sticky top-6">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <RefreshCw className="text-gold" size={24} />
            <h3 className="text-xl font-bold tracking-tight">Required Activity</h3>
          </div>
          
          <div className="space-y-8">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Required Deals</p>
              <div className="flex justify-between items-baseline">
                <span className="text-4xl font-bold tracking-tight text-white">{Math.ceil(reqDealsYear)}</span>
                <span className="text-slate-400 text-sm">per year</span>
              </div>
              <div className="flex justify-between items-baseline mt-2 pt-3 border-t border-white/5">
                <span className="text-2xl font-semibold text-gold">{reqDealsMonth.toFixed(1)}</span>
                <span className="text-slate-400 text-sm">per month</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Required Appointments</p>
              <div className="flex justify-between items-baseline">
                <span className="text-4xl font-bold tracking-tight text-white">{Math.ceil(reqApptsYear)}</span>
                <span className="text-slate-400 text-sm">per year</span>
              </div>
               <div className="flex justify-between items-baseline mt-2 pt-3 border-t border-white/5">
                <span className="text-2xl font-semibold text-gold">{Math.ceil(reqApptsMonth)}</span>
                <span className="text-slate-400 text-sm">per month</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-sm text-sm text-slate-300 leading-relaxed border border-white/5">
              Based on an average commission of <span className="text-white font-bold">${((formData.avgBuyerCommission + formData.avgSellerCommission) / 2).toLocaleString()}</span> and a close rate of <span className="text-white font-bold">{formData.targetCloseRate}%</span>.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};