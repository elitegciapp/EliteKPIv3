import { Deal, Expense, Activity, KPISettings } from '../types';

const KEYS = {
  DEALS: 'realtor_kpi_deals',
  EXPENSES: 'realtor_kpi_expenses',
  ACTIVITIES: 'realtor_kpi_activities',
  SETTINGS: 'realtor_kpi_settings',
  THEME: 'realtor_kpi_theme',
};

export const defaultSettings: KPISettings = {
  annualGCIGoal: 100000,
  targetCloseRate: 20,
  avgBuyerCommission: 8000,
  avgSellerCommission: 10000,
  estimatedTaxRate: 30,
  defaultMPG: 25,
  defaultGasPrice: 3.50,
};

export const StorageService = {
  getDeals: (): Deal[] => {
    const data = localStorage.getItem(KEYS.DEALS);
    return data ? JSON.parse(data) : [];
  },
  saveDeals: (deals: Deal[]) => {
    localStorage.setItem(KEYS.DEALS, JSON.stringify(deals));
  },
  getExpenses: (): Expense[] => {
    const data = localStorage.getItem(KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },
  saveExpenses: (expenses: Expense[]) => {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  },
  getActivities: (): Activity[] => {
    const data = localStorage.getItem(KEYS.ACTIVITIES);
    return data ? JSON.parse(data) : [];
  },
  saveActivities: (activities: Activity[]) => {
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(activities));
  },
  getSettings: (): KPISettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : defaultSettings;
  },
  saveSettings: (settings: KPISettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
  getTheme: (): 'light' | 'dark' => {
    const data = localStorage.getItem(KEYS.THEME);
    return (data === 'dark' || data === 'light') ? data : 'light';
  },
  saveTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(KEYS.THEME, theme);
  }
};