
import { Deal, Expense, Activity } from '../types';
import { StorageService } from './storage';
import { mockData } from './mockData';
import { DemoState } from './demoState';

export const APIService = {
  // --- Control Endpoints ---

  enableDemoMode: async (): Promise<boolean> => {
    // POST /api/demo/enable
    DemoState.enable();
    return true;
  },

  disableDemoMode: async (): Promise<boolean> => {
    // POST /api/demo/disable
    DemoState.disable();
    return true;
  },

  isDemoMode: async (): Promise<boolean> => {
    // GET /api/demo/status
    return DemoState.isActive();
  },

  // --- Data Endpoints ---

  getDeals: async (): Promise<Deal[]> => {
    // GET /api/deals
    if (DemoState.isActive()) {
      return mockData.deals as unknown as Deal[];
    }
    return StorageService.getDeals();
  },

  saveDeals: async (deals: Deal[]): Promise<void> => {
    // POST /api/deals
    if (DemoState.isActive()) {
      console.warn('[API] Write operation blocked in Demo Mode');
      return; 
    }
    StorageService.saveDeals(deals);
  },

  getExpenses: async (): Promise<Expense[]> => {
    // GET /api/expenses
    if (DemoState.isActive()) {
      return mockData.expenses as unknown as Expense[];
    }
    return StorageService.getExpenses();
  },

  saveExpenses: async (expenses: Expense[]): Promise<void> => {
    // POST /api/expenses
    if (DemoState.isActive()) return;
    StorageService.saveExpenses(expenses);
  },

  getActivities: async (): Promise<Activity[]> => {
    // GET /api/activities
    if (DemoState.isActive()) {
      return mockData.activities as unknown as Activity[];
    }
    return StorageService.getActivities();
  },

  saveActivities: async (activities: Activity[]): Promise<void> => {
    // POST /api/activities
    if (DemoState.isActive()) return;
    StorageService.saveActivities(activities);
  },
  
  // Settings are usually local to the user/browser even in demo apps,
  // but could be mocked if strict purity is required. 
  // For now, we allow settings persistence to remain local.
};
