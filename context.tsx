
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Deal, Expense, Activity, KPISettings, DealStage } from './types';
import { StorageService, defaultSettings } from './services/storage';
import { APIService } from './services/api';

interface AppContextType {
  deals: Deal[];
  expenses: Expense[];
  activities: Activity[];
  settings: KPISettings;
  theme: 'light' | 'dark';
  isDemo: boolean;
  addDeal: (deal: Deal) => void;
  updateDeal: (deal: Deal) => void;
  deleteDeal: (id: string) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;
  updateSettings: (settings: KPISettings) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  getDealExpenses: (dealId: string) => Expense[];
  getDealNetCommission: (deal: Deal) => number;
  loadDemoData: () => void;
  clearData: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<KPISettings>(defaultSettings);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => StorageService.getTheme());
  const [isDemo, setIsDemo] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const [fetchedDeals, fetchedExpenses, fetchedActivities, demoStatus] = await Promise.all([
        APIService.getDeals(),
        APIService.getExpenses(),
        APIService.getActivities(),
        APIService.isDemoMode()
      ]);
      if (Array.isArray(fetchedDeals)) setDeals(fetchedDeals);
      if (Array.isArray(fetchedExpenses)) setExpenses(fetchedExpenses);
      if (Array.isArray(fetchedActivities)) setActivities(fetchedActivities);
      setIsDemo(demoStatus);
    } catch (err) {
      console.error("Data refresh error:", err);
    }
  }, []);

  useEffect(() => {
    refreshData();
    setSettings(StorageService.getSettings());
    const storedTheme = StorageService.getTheme();
    setThemeState(storedTheme);
    if (storedTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [refreshData]);

  const saveDeals = (newDeals: Deal[]) => {
    setDeals(newDeals);
    APIService.saveDeals(newDeals);
  };

  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    APIService.saveExpenses(newExpenses);
  };

  const saveActivities = (newActivities: Activity[]) => {
    setActivities(newActivities);
    APIService.saveActivities(newActivities);
  };

  const addDeal = (deal: Deal) => saveDeals([...deals, deal]);
  const updateDeal = (updatedDeal: Deal) => saveDeals(deals.map(d => d.id === updatedDeal.id ? updatedDeal : d));
  const deleteDeal = (id: string) => {
    saveExpenses(expenses.filter(e => e.dealId !== id));
    saveActivities(activities.filter(a => a.dealId !== id));
    saveDeals(deals.filter(d => d.id !== id));
  };

  const addExpense = (expense: Expense) => saveExpenses([...expenses, expense]);
  const updateExpense = (updatedExpense: Expense) => saveExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  const deleteExpense = (id: string) => saveExpenses(expenses.filter(e => e.id !== id));

  const addActivity = (activity: Activity) => saveActivities([...activities, activity]);
  const deleteActivity = (id: string) => saveActivities(activities.filter(a => a.id !== id));

  const updateSettings = (newSettings: KPISettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    StorageService.saveTheme(newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const getDealExpenses = (dealId: string) => expenses.filter(e => e.dealId === dealId);

  const getDealNetCommission = (deal: Deal) => {
    const totalExpenses = getDealExpenses(deal.id).reduce((sum, e) => sum + e.totalCost, 0);
    return (deal.commissionEarned || 0) - totalExpenses;
  };

  const loadDemoData = async () => { await APIService.enableDemoMode(); await refreshData(); };
  const clearData = async () => {
    if (isDemo) await APIService.disableDemoMode();
    else { saveDeals([]); saveExpenses([]); saveActivities([]); }
    await refreshData();
  };

  return (
    <AppContext.Provider value={{
      deals, expenses, activities, settings, theme, isDemo,
      addDeal, updateDeal, deleteDeal, addExpense, updateExpense, deleteExpense,
      addActivity, deleteActivity, updateSettings, setTheme,
      getDealExpenses, getDealNetCommission, loadDemoData, clearData, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
