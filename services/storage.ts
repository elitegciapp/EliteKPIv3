
import { Deal, Expense, Activity, KPISettings } from '../types';

const KEYS = {
  DEALS: 'realtor_kpi_deals',
  EXPENSES: 'realtor_kpi_expenses',
  ACTIVITIES: 'realtor_kpi_activities',
  SETTINGS: 'realtor_kpi_settings',
  THEME: 'realtor_kpi_theme',
  MIGRATION_MSG: 'realtor_kpi_migration_msg_seen',
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

const safeParse = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error parsing key ${key}:`, error);
    return fallback;
  }
};

export const StorageService = {
  getDeals: (): Deal[] => safeParse(KEYS.DEALS, []),
  saveDeals: (deals: Deal[]) => {
    localStorage.setItem(KEYS.DEALS, JSON.stringify(deals));
  },
  
  getExpenses: (): Expense[] => safeParse(KEYS.EXPENSES, []),
  saveExpenses: (expenses: Expense[]) => {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  },
  
  getActivities: (): Activity[] => safeParse(KEYS.ACTIVITIES, []),
  saveActivities: (activities: Activity[]) => {
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(activities));
  },
  
  getSettings: (): KPISettings => safeParse(KEYS.SETTINGS, defaultSettings),
  saveSettings: (settings: KPISettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
  
  getTheme: (): 'light' | 'dark' => {
    const data = localStorage.getItem(KEYS.THEME);
    return (data === 'dark' || data === 'light') ? data : 'light';
  },
  saveTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(KEYS.THEME, theme);
  },

  getMigrationMsgSeen: (): boolean => {
    return localStorage.getItem(KEYS.MIGRATION_MSG) === 'true';
  },
  setMigrationMsgSeen: () => {
    localStorage.setItem(KEYS.MIGRATION_MSG, 'true');
  }
};
