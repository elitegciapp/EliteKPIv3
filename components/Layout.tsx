
import React from 'react';
import { LayoutDashboard, Settings, LogOut, Briefcase } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deals', label: 'Deals', icon: Briefcase },
    { id: 'settings', label: 'KPI Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text-primary font-sans">
      {/* Desktop Sidebar (Navy Background with Luxury Gradient) */}
      <aside className="w-64 bg-luxury-gradient dark:bg-luxury-gradient-dark hidden md:flex flex-col fixed h-full z-10 shadow-none border-r border-white/5">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3 font-serif">
            <div className="w-6 h-6 bg-gold rounded-sm shadow-sm"></div>
            EliteKPI
          </h1>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-medium opacity-80">Private Office</p>
        </div>
        
        <nav className="flex-1 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium tracking-wide transition-all duration-200 relative ${
                  isActive 
                    ? 'text-white bg-white/5' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold shadow-[0_0_8px_rgba(201,162,77,0.3)]"></div>
                )}
                <Icon size={18} className={isActive ? 'text-gold' : 'text-slate-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 w-full overflow-auto pb-24 md:pb-0 bg-slate-50 dark:bg-dark-bg">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-slate-200 dark:border-dark-border flex justify-around items-center h-16 z-50 px-2 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-navy dark:text-white' : 'text-slate-400 dark:text-dark-text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-gold' : ''} />
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-navy dark:text-white' : 'text-slate-400 dark:text-dark-text-muted'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
