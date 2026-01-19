import React from 'react';
import { ChevronRight, BarChart3, PieChart, Wallet } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg font-sans text-navy dark:text-dark-text-primary selection:bg-gold selection:text-white">
      {/* Hero Section */}
      <div className="bg-luxury-gradient dark:bg-luxury-gradient-dark text-white pt-24 pb-32 px-6 border-b border-white/5">
         <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
             {/* Logo Mark */}
             <div className="flex justify-center mb-12">
                 <div className="px-6 h-14 border border-white/10 flex items-center justify-center rounded-sm backdrop-blur-sm bg-white/5">
                    <span className="font-serif font-bold text-xl tracking-tighter text-gold">EliteKPI</span>
                 </div>
             </div>
             
             <h1 className="font-serif text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1]">
                Know Your Numbers <br/> Every Deal.
             </h1>
             
             <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
                Built for disciplined agents who treat their business like a private equity portfolio. 
                Your GCI, net income, and pipeline—measured with precision.
             </p>

             <div className="pt-10">
                <button 
                    onClick={onEnter}
                    className="group bg-white text-navy px-10 py-4 text-xs font-bold tracking-[0.15em] uppercase hover:bg-slate-100 transition-all duration-300 flex items-center gap-4 mx-auto rounded-sm"
                >
                    Enter Private Office
                    <ChevronRight size={16} className="text-gold group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
         </div>
      </div>

      {/* Feature Cards Section */}
      <div className="max-w-6xl mx-auto px-6 -mt-20 pb-24 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={BarChart3}
            title="Pipeline Intelligence"
            description="Track every deal from lead to close. Visualize conversion rates and forecast revenue with uncompromising accuracy."
          />
          <FeatureCard 
            icon={Wallet}
            title="Expense & Net Income"
            description="Automated mileage calculations and precise expense tracking. Know your true net income in real-time."
          />
          <FeatureCard 
            icon={PieChart}
            title="Strategic KPIs"
            description="Set annual goals and track progress against target close rates and commission averages."
          />
      </div>

      {/* Footer / Trust */}
      <div className="text-center pb-12 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
        EliteKPI — Luxury Real Estate Intelligence
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: any) => (
    <div className="bg-white dark:bg-dark-surface p-8 border border-slate-200 dark:border-dark-border shadow-sm rounded-sm space-y-4 hover:border-gold/30 dark:hover:border-gold/30 transition-colors duration-300">
        <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 flex items-center justify-center rounded-sm text-gold border border-slate-100 dark:border-white/10">
            <Icon size={22} strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-xl font-bold text-navy dark:text-dark-text-primary">{title}</h3>
        <p className="text-slate-500 dark:text-dark-text-secondary text-sm leading-relaxed font-light">{description}</p>
    </div>
);