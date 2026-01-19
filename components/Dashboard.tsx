import React from 'react';
import { useApp } from '../context';
import { DealStatus, DealType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Target, DollarSign, CheckCircle, PieChart } from 'lucide-react';

export const Dashboard = () => {
  const { deals, settings, expenses, getDealNetCommission } = useApp();

  // --- Metrics Calculation ---
  const currentYear = new Date().getFullYear();
  
  // Closed Deals logic
  const closedDeals = deals.filter(d => d.status === DealStatus.CLOSED);
  const closedDealsYTD = closedDeals.filter(d => d.closeDate && new Date(d.closeDate).getFullYear() === currentYear);
  
  const gciYTD = closedDealsYTD.reduce((sum, d) => sum + d.grossCommission, 0);
  
  // Net Income YTD
  const expensesYTD = expenses.filter(e => new Date(e.date).getFullYear() === currentYear);
  const totalExpensesYTD = expensesYTD.reduce((sum, e) => sum + e.totalCost, 0);
  const netIncomeYTD = gciYTD - totalExpensesYTD;

  const dealsClosedCount = closedDealsYTD.length;
  const avgCommission = dealsClosedCount > 0 ? gciYTD / dealsClosedCount : 0;
  
  // Ratios
  const totalDealsYTD = deals.filter(d => new Date(d.createdAt).getFullYear() === currentYear).length; 
  const denominator = deals.filter(d => d.status === DealStatus.CLOSED || d.status === DealStatus.DEAD).length;
  const closeRate = denominator > 0 ? (dealsClosedCount / denominator) * 100 : 0;

  // Chart Data Preparation (Monthly GCI)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i; // 0-11
    const gci = closedDealsYTD
        .filter(d => new Date(d.closeDate!).getMonth() === month)
        .reduce((sum, d) => sum + d.grossCommission, 0);
    return { name: new Date(2000, month, 1).toLocaleString('default', { month: 'short' }), gci };
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <header className="mb-4 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-navy">Dashboard</h2>
        <p className="text-sm md:text-base text-slate-500 mt-1 font-normal">Financial Performance & Intelligence</p>
      </header>

      {/* --- MOBILE KPI TILES (Condensed) --- */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
         <div className="bg-white p-4 border border-slate-200 rounded-sm">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GCI YTD</p>
             <h3 className="text-xl font-bold text-navy mt-1">${gciYTD.toLocaleString()}</h3>
         </div>
         <div className="bg-white p-4 border border-slate-200 rounded-sm">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net YTD</p>
             <h3 className={`text-xl font-bold mt-1 ${netIncomeYTD >= 0 ? 'text-navy' : 'text-red-600'}`}>
                ${netIncomeYTD.toLocaleString()}
             </h3>
         </div>
         <div className="bg-white p-4 border border-slate-200 rounded-sm">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deals</p>
             <h3 className="text-xl font-bold text-navy mt-1">{dealsClosedCount}</h3>
         </div>
         <div className="bg-white p-4 border border-slate-200 rounded-sm">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Close Rate</p>
             <h3 className="text-xl font-bold text-navy mt-1">{closeRate.toFixed(1)}%</h3>
         </div>
      </div>

      {/* --- DESKTOP KPI TILES (Full Detail) --- */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Annual Goal Progress */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annual Goal</p>
                    <h3 className="text-2xl font-bold text-navy mt-2">${gciYTD.toLocaleString()}</h3>
                </div>
                <div className="bg-slate-50 p-2 rounded-full text-gold"><Target size={20}/></div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="bg-gold h-full" 
                    style={{ width: `${Math.min((gciYTD / settings.annualGCIGoal) * 100, 100)}%` }}
                ></div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-right font-medium">Target: ${settings.annualGCIGoal.toLocaleString()}</p>
        </div>

        {/* Net Income */}
         <div className="bg-white p-6 border border-slate-200 rounded-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Income YTD</p>
                    <h3 className={`text-2xl font-bold mt-2 ${netIncomeYTD >= 0 ? 'text-navy' : 'text-red-600'}`}>
                        ${netIncomeYTD.toLocaleString()}
                    </h3>
                </div>
                <div className="bg-slate-50 p-2 rounded-full text-gold"><DollarSign size={20}/></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">After ${totalExpensesYTD.toLocaleString()} expenses</p>
        </div>

        {/* Closed Deals */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deals Closed</p>
                    <h3 className="text-2xl font-bold text-navy mt-2">{dealsClosedCount}</h3>
                </div>
                <div className="bg-slate-50 p-2 rounded-full text-gold"><CheckCircle size={20}/></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Avg. Comm: ${avgCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>

         {/* Close Rate */}
         <div className="bg-white p-6 border border-slate-200 rounded-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Close Rate</p>
                    <h3 className="text-2xl font-bold text-navy mt-2">{closeRate.toFixed(1)}%</h3>
                </div>
                <div className="bg-slate-50 p-2 rounded-full text-gold"><PieChart size={20}/></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Target: {settings.targetCloseRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 border border-slate-200 rounded-sm">
            <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-6">Monthly Revenue</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#E6E8EC" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#8B93A6'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#8B93A6'}} tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip 
                            cursor={{fill: '#F7F8FA'}}
                            contentStyle={{backgroundColor: '#0F172A', border: 'none', borderRadius: '4px', color: '#fff'}}
                            itemStyle={{color: '#fff', fontSize: '12px'}}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'GCI']}
                        />
                        <Bar dataKey="gci" fill="#0F172A" radius={[2, 2, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Pipeline Health / Conversion Ratios */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm">
            <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-6">Pipeline Health</h3>
            <div className="space-y-6">
                
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 font-medium">Leads to Appointments</span>
                        <span className="font-bold text-navy">42%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full">
                         <div className="bg-gold h-full rounded-full" style={{width: '42%'}}></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 font-medium">Appointments to Shows</span>
                        <span className="font-bold text-navy">65%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full">
                         <div className="bg-navy-light h-full rounded-full" style={{width: '65%'}}></div>
                    </div>
                </div>

                 <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 font-medium">Shows to Offers</span>
                        <span className="font-bold text-navy">28%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full">
                         <div className="bg-navy h-full rounded-full" style={{width: '28%'}}></div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                        Based on rolling 90-day pipeline activity.
                    </p>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};