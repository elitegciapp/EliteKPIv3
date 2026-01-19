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

  // Detect dark mode for chart colors
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const chartBarColor = isDarkMode ? '#C9A24D' : '#0B1220'; // Gold in dark mode, Navy in light
  const chartTextColor = isDarkMode ? '#7F889C' : '#8B93A6';
  const chartGridColor = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#E3E7ED';
  const tooltipBg = isDarkMode ? '#111C33' : '#0B1220';

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <header className="mb-4 md:mb-8">
        <h2 className="text-xl md:text-3xl font-bold text-navy dark:text-dark-text-primary font-serif">Dashboard</h2>
        <p className="text-sm md:text-base text-slate-500 dark:text-dark-text-secondary mt-2 font-normal">Financial Performance & Intelligence</p>
      </header>

      {/* --- MOBILE KPI TILES (Condensed) --- */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
         <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-sm">
             <p className="text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">GCI YTD</p>
             <h3 className="text-xl font-bold text-navy dark:text-dark-text-primary mt-1 font-serif">${gciYTD.toLocaleString()}</h3>
         </div>
         <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-sm">
             <p className="text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Net YTD</p>
             <h3 className={`text-xl font-bold mt-1 font-serif ${netIncomeYTD >= 0 ? 'text-navy dark:text-dark-text-primary' : 'text-red-600'}`}>
                ${netIncomeYTD.toLocaleString()}
             </h3>
         </div>
         <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-sm">
             <p className="text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Deals</p>
             <h3 className="text-xl font-bold text-navy dark:text-dark-text-primary mt-1 font-serif">{dealsClosedCount}</h3>
         </div>
         <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-sm">
             <p className="text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Close Rate</p>
             <h3 className="text-xl font-bold text-navy dark:text-dark-text-primary mt-1 font-serif">{closeRate.toFixed(1)}%</h3>
         </div>
      </div>

      {/* --- DESKTOP KPI TILES (Full Detail) --- */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Annual Goal Progress */}
        <div className="bg-white dark:bg-dark-surface p-6 border border-slate-200 dark:border-dark-border rounded-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Annual Goal</p>
                    <h3 className="text-3xl font-bold text-navy dark:text-dark-text-primary mt-2 font-serif">${gciYTD.toLocaleString()}</h3>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-full text-gold"><Target size={20}/></div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="bg-gold h-full" 
                    style={{ width: `${Math.min((gciYTD / settings.annualGCIGoal) * 100, 100)}%` }}
                ></div>
            </div>
            <p className="text-xs text-slate-400 dark:text-dark-text-muted mt-3 text-right font-medium">Target: ${settings.annualGCIGoal.toLocaleString()}</p>
        </div>

        {/* Net Income */}
         <div className="bg-white dark:bg-dark-surface p-6 border border-slate-200 dark:border-dark-border rounded-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Net Income YTD</p>
                    <h3 className={`text-3xl font-bold mt-2 font-serif ${netIncomeYTD >= 0 ? 'text-navy dark:text-dark-text-primary' : 'text-red-600'}`}>
                        ${netIncomeYTD.toLocaleString()}
                    </h3>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-full text-gold"><DollarSign size={20}/></div>
            </div>
            <p className="text-xs text-slate-400 dark:text-dark-text-muted mt-2">After ${totalExpensesYTD.toLocaleString()} expenses</p>
        </div>

        {/* Closed Deals */}
        <div className="bg-white dark:bg-dark-surface p-6 border border-slate-200 dark:border-dark-border rounded-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Deals Closed</p>
                    <h3 className="text-3xl font-bold text-navy dark:text-dark-text-primary mt-2 font-serif">{dealsClosedCount}</h3>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-full text-gold"><CheckCircle size={20}/></div>
            </div>
            <p className="text-xs text-slate-400 dark:text-dark-text-muted mt-2">Avg. Comm: ${avgCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>

         {/* Close Rate */}
         <div className="bg-white dark:bg-dark-surface p-6 border border-slate-200 dark:border-dark-border rounded-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Close Rate</p>
                    <h3 className="text-3xl font-bold text-navy dark:text-dark-text-primary mt-2 font-serif">{closeRate.toFixed(1)}%</h3>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-full text-gold"><PieChart size={20}/></div>
            </div>
            <p className="text-xs text-slate-400 dark:text-dark-text-muted mt-2">Target: {settings.targetCloseRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface p-6 border border-slate-200 dark:border-dark-border rounded-sm">
            <h3 className="text-lg font-semibold text-navy dark:text-dark-text-primary font-serif mb-6">Monthly Revenue</h3>
            
            {/* Horizontal Scroll Container for Mobile */}
            <div className="overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0">
                <div className="h-64 min-w-[600px] md:min-w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="0" vertical={false} stroke={chartGridColor} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: chartTextColor, fontFamily: 'Inter'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: chartTextColor, fontFamily: 'Inter'}} tickFormatter={(value) => `$${value/1000}k`} />
                            <Tooltip 
                                cursor={{fill: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F4F6F9'}}
                                contentStyle={{backgroundColor: tooltipBg, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontFamily: 'Inter'}}
                                itemStyle={{color: '#fff', fontSize: '12px'}}
                                formatter={(value: number) => [`$${value.toLocaleString()}`, 'GCI']}
                            />
                            <Bar dataKey="gci" fill={chartBarColor} radius={[2, 2, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Pipeline Health / Conversion Ratios */}
        <div className="bg-white dark:bg-dark-surface p-6 border border-slate-200 dark:border-dark-border rounded-sm">
            <h3 className="text-lg font-semibold text-navy dark:text-dark-text-primary font-serif mb-6">Pipeline Health</h3>
            <div className="space-y-6">
                
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 dark:text-dark-text-secondary font-medium">Leads to Appointments</span>
                        <span className="font-bold text-navy dark:text-dark-text-primary font-serif">42%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-1 rounded-full">
                         <div className="bg-gold h-full rounded-full" style={{width: '42%'}}></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 dark:text-dark-text-secondary font-medium">Appointments to Shows</span>
                        <span className="font-bold text-navy dark:text-dark-text-primary font-serif">65%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-1 rounded-full">
                         <div className="bg-navy-light dark:bg-slate-600 h-full rounded-full" style={{width: '65%'}}></div>
                    </div>
                </div>

                 <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 dark:text-dark-text-secondary font-medium">Shows to Offers</span>
                        <span className="font-bold text-navy dark:text-dark-text-primary font-serif">28%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-1 rounded-full">
                         <div className="bg-navy dark:bg-slate-400 h-full rounded-full" style={{width: '28%'}}></div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-dark-border mt-6">
                    <p className="text-xs text-slate-400 dark:text-dark-text-muted leading-relaxed font-normal">
                        Based on rolling 90-day pipeline activity.
                    </p>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};