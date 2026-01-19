import React from 'react';
import { LayoutDashboard, DollarSign, Briefcase, Settings, LogOut, CheckSquare } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deals', label: 'Deals', icon: Briefcase },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'activities', label: 'Activities', icon: CheckSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar (Navy Background) */}
      <aside className="w-64 bg-navy hidden md:flex flex-col fixed h-full z-10 shadow-none border-r border-navy-light">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-6 h-6 bg-gold rounded-sm"></div>
            RE:TRACK
          </h1>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-wide font-medium">Private Office</p>
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
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold"></div>
                )}
                <Icon size={18} className={isActive ? 'text-gold' : 'text-slate-500'} />
                {item.label === 'Settings' ? 'KPI Settings' : item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 w-full overflow-auto pb-24 md:pb-0 bg-slate-50">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Clean, White, Top Border) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 px-2 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-navy' : 'text-slate-400'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-gold' : ''} />
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-navy' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};