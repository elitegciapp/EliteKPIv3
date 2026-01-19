import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Deal, Expense, Activity, KPISettings, DealStatus, ExpenseType } from './types';
import { StorageService, defaultSettings } from './services/storage';

interface AppContextType {
  deals: Deal[];
  expenses: Expense[];
  activities: Activity[];
  settings: KPISettings;
  addDeal: (deal: Deal) => void;
  updateDeal: (deal: Deal) => void;
  deleteDeal: (id: string) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;
  updateSettings: (settings: KPISettings) => void;
  getDealExpenses: (dealId: string) => Expense[];
  getDealNetCommission: (deal: Deal) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<KPISettings>(defaultSettings);

  useEffect(() => {
    setDeals(StorageService.getDeals());
    setExpenses(StorageService.getExpenses());
    setActivities(StorageService.getActivities());
    setSettings(StorageService.getSettings());
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
    saveDeals(deals.filter(d => d.id !== id));
  };

  const addExpense = (expense: Expense) => {
    saveExpenses([...expenses, expense]);
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
      addDeal,
      updateDeal,
      deleteDeal,
      addExpense,
      deleteExpense,
      addActivity,
      deleteActivity,
      updateSettings,
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