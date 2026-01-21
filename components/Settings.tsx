
import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { KPISettings, DealStage } from '../types';
import { Save, RefreshCw, FileText, Download, Moon, Sun, Database, Trash2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const Settings = () => {
  const { settings, updateSettings, deals, expenses, activities, theme, setTheme, loadDemoData, clearData } = useApp();
  const [formData, setFormData] = useState<KPISettings>(settings);
  const [isDirty, setIsDirty] = useState(false);

  // Export State
  const [exportType, setExportType] = useState<'Month' | 'Quarter' | 'Year' | 'Custom'>('Month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

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

  const handleLoadDemo = () => {
    if (window.confirm("Overwrite existing data with demo data?")) {
        loadDemoData();
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }
  };

  const handleClearData = () => {
      if (window.confirm("WARNING: This will delete ALL data. Continue?")) {
          clearData();
          setTimeout(() => {
            window.location.reload();
          }, 100);
      }
  };

  // Math
  const reqDealsYear = formData.annualGCIGoal / ((formData.avgBuyerCommission + formData.avgSellerCommission) / 2 || 1);
  const reqDealsMonth = reqDealsYear / 12;
  const reqApptsYear = reqDealsYear / (formData.targetCloseRate / 100 || 1);
  const reqApptsMonth = reqApptsYear / 12;

  // --- PDF GENERATION LOGIC ---
  const generatePDF = () => {
    const doc = new jsPDF();
    const themeColor = '#0B1220'; // Navy
    const goldColor = '#C9A24D';

    let start: Date, end: Date, rangeLabel: string;
    
    if (exportType === 'Month') {
        start = new Date(selectedYear, selectedMonth, 1);
        end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
        rangeLabel = start.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    } else if (exportType === 'Quarter') {
        const startMonth = (selectedQuarter - 1) * 3;
        start = new Date(selectedYear, startMonth, 1);
        end = new Date(selectedYear, startMonth + 3, 0, 23, 59, 59);
        rangeLabel = `Q${selectedQuarter} ${selectedYear}`;
    } else if (exportType === 'Year') {
        start = new Date(selectedYear, 0, 1);
        end = new Date(selectedYear, 11, 31, 23, 59, 59);
        rangeLabel = `${selectedYear}`;
    } else {
        if (!customStart || !customEnd) return;
        start = new Date(customStart);
        end = new Date(customEnd);
        end.setHours(23, 59, 59);
        rangeLabel = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }

    const rangeDeals = deals.filter(d => {
        if (d.stage === DealStage.CLOSED && d.closedAt) {
            const dDate = new Date(d.closedAt);
            return dDate >= start && dDate <= end;
        }
        return false;
    });

    const rangeExpenses = expenses.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= start && eDate <= end;
    });

    const rangeActivities = activities.filter(a => {
        const aDate = new Date(a.date);
        return aDate >= start && aDate <= end;
    });

    const gci = rangeDeals.reduce((sum, d) => sum + (d.commissionEarned || 0), 0);
    const totalExpenses = rangeExpenses.reduce((sum, e) => sum + e.totalCost, 0);
    const netIncome = gci - totalExpenses;
    const closedCount = rangeDeals.length;
    const avgComm = closedCount > 0 ? gci / closedCount : 0;

    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(themeColor);
    doc.text("EliteKPI", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("PRIVATE OFFICE INTELLIGENCE", 14, 25);

    doc.setDrawColor(goldColor);
    doc.setLineWidth(0.5);
    doc.line(14, 28, 196, 28);

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(themeColor);
    doc.text("Performance Summary", 14, 40);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${rangeLabel}`, 14, 46);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 51);

    const kpiY = 60;
    const kpiW = 40;
    const kpiH = 25;
    
    const drawKPI = (label: string, value: string, x: number) => {
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(230, 230, 230);
        doc.rect(x, kpiY, kpiW, kpiH, 'FD');
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(label.toUpperCase(), x + 2, kpiY + 8);
        
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.setTextColor(themeColor);
        doc.text(value, x + 2, kpiY + 18);
    };

    drawKPI("GCI", `$${gci.toLocaleString()}`, 14);
    drawKPI("Net Income", `$${netIncome.toLocaleString()}`, 58);
    drawKPI("Deals Closed", closedCount.toString(), 102);
    drawKPI("Avg Comm.", `$${avgComm.toLocaleString(undefined, {maximumFractionDigits:0})}`, 146);

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(themeColor);
    doc.text("Closed Deals", 14, 95);

    const dealsData = rangeDeals.map(d => [
        d.propertyAddress || d.name,
        d.dealSide,
        d.closedAt ? d.closedAt.split('T')[0] : '-',
        `$${(d.commissionEarned || 0).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: 100,
        head: [['Property', 'Side', 'Date', 'Commission']],
        body: dealsData,
        theme: 'plain',
        headStyles: { fillColor: [11, 18, 32], textColor: [255, 255, 255], font: 'times', fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
        columnStyles: { 3: { halign: 'right' } }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(themeColor);
    doc.text("Expense Summary", 14, finalY);

    const expByType: Record<string, number> = {};
    rangeExpenses.forEach(e => {
        expByType[e.category] = (expByType[e.category] || 0) + e.totalCost;
    });

    const expData = Object.entries(expByType)
        .sort((a,b) => b[1] - a[1])
        .map(([cat, amount]) => [cat, `$${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`]);
    expData.push(['TOTAL', `$${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`]);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Category', 'Total Cost']],
        body: expData,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], font: 'times', fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 9 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });

    finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > 250) { doc.addPage(); finalY = 20; }

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(themeColor);
    doc.text("Activity Summary", 14, finalY);

    const actByType: Record<string, number> = {};
    rangeActivities.forEach(a => { actByType[a.category] = (actByType[a.category] || 0) + 1; });
    const actData = Object.entries(actByType).sort((a,b) => b[1] - a[1]).map(([cat, count]) => [cat, count.toString()]);
    actData.push(['TOTAL', rangeActivities.length.toString()]);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Activity Type', 'Count']],
        body: actData,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], font: 'times', fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 9 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} — Generated by EliteKPI`, 105, 290, { align: 'center' });
    }

    doc.save(`EliteKPI_Report_${rangeLabel.replace(/ /g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-dark-text-primary font-serif">KPI Settings</h2>
          <p className="text-slate-500 dark:text-dark-text-secondary mt-2 font-normal font-sans">Global assumptions and goals.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-widest rounded-sm transition-all shadow-none ${
            isDirty 
              ? 'bg-navy dark:bg-gold text-white dark:text-navy hover:bg-navy-light dark:hover:bg-gold-hover' 
              : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-dark-text-muted cursor-not-allowed'
          }`}
        >
          <Save size={16} />
          Save Changes
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <section className="bg-white dark:bg-dark-surface p-6 border border-slate-200 dark:border-dark-border rounded-sm shadow-sm">
             <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-dark-border pb-2">
                 <h3 className="text-sm font-bold text-navy dark:text-dark-text-primary uppercase tracking-wider font-serif">Appearance</h3>
             </div>
             <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2 font-sans">Interface Theme</label>
                  <div className="flex rounded-sm overflow-hidden border border-slate-200 dark:border-dark-border">
                     <button
                         onClick={() => setTheme('light')}
                         className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                             theme === 'light'
                             ? 'bg-navy dark:bg-gold text-white dark:text-navy'
                             : 'bg-white dark:bg-white/5 text-slate-500 dark:text-dark-text-secondary hover:bg-slate-50'
                         }`}
                     >
                         <Sun size={14} />
                         Light
                     </button>
                     <button
                         onClick={() => setTheme('dark')}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                             theme === 'dark'
                             ? 'bg-navy dark:bg-gold text-white dark:text-navy'
                             : 'bg-white dark:bg-white/5 text-slate-500 dark:text-dark-text-secondary hover:bg-slate-50'
                         }`}
                     >
                         <Moon size={14} />
                         Dark
                     </button>
                  </div>
             </div>
          </section>
          
          <section className="bg-white dark:bg-dark-surface p-6 border border-slate-200 dark:border-dark-border rounded-sm shadow-sm">
             <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-dark-border pb-2">
                 <FileText className="text-gold" size={20} />
                 <h3 className="text-sm font-bold text-navy dark:text-dark-text-primary uppercase tracking-wider font-serif">Export Reports (PDF)</h3>
             </div>
             <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2 font-sans">Report Range</label>
                    <div className="flex rounded-sm overflow-hidden border border-slate-200 dark:border-dark-border">
                        {['Month', 'Quarter', 'Year', 'Custom'].map(type => (
                            <button
                                key={type}
                                onClick={() => setExportType(type as any)}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                    exportType === type 
                                    ? 'bg-navy dark:bg-gold text-white dark:text-navy' 
                                    : 'bg-white dark:bg-white/5 text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     {exportType === 'Month' && (
                         <>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2 font-sans">Month</label>
                                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-navy dark:text-dark-text-primary rounded-sm bg-white dark:bg-dark-surface">
                                    {Array.from({length: 12}, (_, i) => (<option key={i} value={i}>{new Date(2000, i, 1).toLocaleString('default', {month: 'long'})}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2 font-sans">Year</label>
                                <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-navy dark:text-dark-text-primary rounded-sm bg-white dark:bg-dark-surface" />
                            </div>
                         </>
                     )}
                     {exportType === 'Quarter' && (
                         <>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2 font-sans">Quarter</label>
                                <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(parseInt(e.target.value))} className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-navy dark:text-dark-text-primary rounded-sm bg-white dark:bg-dark-surface">
                                    <option value={1}>Q1 (Jan-Mar)</option>
                                    <option value={2}>Q2 (Apr-Jun)</option>
                                    <option value={3}>Q3 (Jul-Sep)</option>
                                    <option value={4}>Q4 (Oct-Dec)</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2 font-sans">Year</label>
                                <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full border border-slate-200 dark:border-dark-border px-3 py-2 text-navy dark:text-dark-text-primary rounded-sm bg-white dark:bg-dark-surface" />
                            </div>
                         </>
                     )}
                     {exportType === 'Custom' && (
                         <>
                            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start</label><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full border border-slate-200 px-3 py-2 rounded-sm bg-white dark:bg-dark-surface" /></div>
                            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">End</label><input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full border border-slate-200 px-3 py-2 rounded-sm bg-white dark:bg-dark-surface" /></div>
                         </>
                     )}
                 </div>
                 <button onClick={generatePDF} className="w-full flex items-center justify-center gap-2 bg-navy dark:bg-gold text-white dark:text-navy px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-all"><Download size={18} /> Export PDF</button>
             </div>
          </section>

          <section className="bg-white dark:bg-dark-surface p-6 border border-slate-200 rounded-sm">
            <h3 className="text-sm font-bold text-navy dark:text-dark-text-primary uppercase tracking-wider mb-6 border-b border-slate-100 dark:border-dark-border pb-2 font-serif">Annual Goals</h3>
            <div className="grid grid-cols-1 gap-6">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2 font-sans">Annual GCI Goal ($)</label><input type="number" name="annualGCIGoal" value={formData.annualGCIGoal} onChange={handleChange} className="w-full border border-slate-200 px-4 py-2.5 rounded-sm bg-white dark:bg-dark-surface font-mono" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2 font-sans">Target Close Rate (%)</label><input type="number" name="targetCloseRate" value={formData.targetCloseRate} onChange={handleChange} className="w-full border border-slate-200 px-4 py-2.5 rounded-sm bg-white dark:bg-dark-surface font-mono" /></div>
            </div>
          </section>
        </div>

        <div className="bg-luxury-gradient dark:bg-luxury-gradient-dark text-white p-8 rounded-sm shadow-none h-fit sticky top-6 border border-white/5">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4"><RefreshCw className="text-gold" size={24} /><h3 className="text-xl font-bold tracking-tight font-serif">Required Activity</h3></div>
          <div className="space-y-8 font-sans">
            <div><p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Required Deals</p><div className="flex justify-between items-baseline"><span className="text-4xl font-bold tracking-tight text-white font-serif">{Math.ceil(reqDealsYear)}</span><span className="text-slate-400 text-sm">per year</span></div><div className="flex justify-between items-baseline mt-2 pt-3 border-t border-white/5"><span className="text-2xl font-semibold text-gold font-serif">{reqDealsMonth.toFixed(1)}</span><span className="text-slate-400 text-sm">per month</span></div></div>
            <div><p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Required Appointments</p><div className="flex justify-between items-baseline"><span className="text-4xl font-bold tracking-tight text-white font-serif">{Math.ceil(reqApptsYear)}</span><span className="text-slate-400 text-sm">per year</span></div><div className="flex justify-between items-baseline mt-2 pt-3 border-t border-white/5"><span className="text-2xl font-semibold text-gold font-serif">{Math.ceil(reqApptsMonth)}</span><span className="text-slate-400 text-sm">per month</span></div></div>
          </div>
        </div>
      </div>
    </div>
  );
};
