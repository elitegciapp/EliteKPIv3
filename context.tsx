import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Deal, Expense, Activity, KPISettings, DealStatus, ExpenseType } from './types';
import { StorageService, defaultSettings } from './services/storage';

interface AppContextType {
  deals: Deal[];
  expenses: Expense[];
  activities: Activity[];
  settings: KPISettings;
  theme: 'light' | 'dark';
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<KPISettings>(defaultSettings);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => StorageService.getTheme());

  useEffect(() => {
    setDeals(StorageService.getDeals());
    setExpenses(StorageService.getExpenses());
    setActivities(StorageService.getActivities());
    setSettings(StorageService.getSettings());
    
    // Initial Theme Application
    const storedTheme = StorageService.getTheme();
    setThemeState(storedTheme);
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const saveDeals = (newDeals: Deal[]) => {
    setDeals(newDeals);
    StorageService.saveDeals(newDeals);
  };

  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    StorageService.saveExpenses(newExpenses);
  };

  const saveActivities = (newActivities: Activity[]) => {
    setActivities(newActivities);
    StorageService.saveActivities(newActivities);
  };

  const addDeal = (deal: Deal) => {
    saveDeals([...deals, deal]);
  };

  const updateDeal = (updatedDeal: Deal) => {
    saveDeals(deals.map(d => d.id === updatedDeal.id ? updatedDeal : d));
  };

  const deleteDeal = (id: string) => {
    // Cascading delete: Remove all expenses and activities linked to this deal
    const updatedExpenses = expenses.filter(e => e.dealId !== id);
    const updatedActivities = activities.filter(a => a.dealId !== id);
    const updatedDeals = deals.filter(d => d.id !== id);

    saveExpenses(updatedExpenses);
    saveActivities(updatedActivities);
    saveDeals(updatedDeals);
  };

  const addExpense = (expense: Expense) => {
    saveExpenses([...expenses, expense]);
  };

  const updateExpense = (updatedExpense: Expense) => {
    saveExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const deleteExpense = (id: string) => {
    saveExpenses(expenses.filter(e => e.id !== id));
  };

  const addActivity = (activity: Activity) => {
    saveActivities([...activities, activity]);
  };

  const deleteActivity = (id: string) => {
    saveActivities(activities.filter(a => a.id !== id));
  };

  const updateSettings = (newSettings: KPISettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    StorageService.saveTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getDealExpenses = (dealId: string) => {
    return expenses.filter(e => e.dealId === dealId);
  };

  const getDealNetCommission = (deal: Deal) => {
    const dealExpenses = getDealExpenses(deal.id);
    const totalExpenses = dealExpenses.reduce((sum, e) => sum + e.totalCost, 0);
    return deal.grossCommission - totalExpenses;
  };

  return (
    <AppContext.Provider value={{
      deals,
      expenses,
      activities,
      settings,
      theme,
      addDeal,
      updateDeal,
      deleteDeal,
      addExpense,
      updateExpense,
      deleteExpense,
      addActivity,
      deleteActivity,
      updateSettings,
      setTheme,
      getDealExpenses,
      getDealNetCommission,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};