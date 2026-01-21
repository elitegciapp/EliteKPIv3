
export enum DealStage {
  LEAD = 'LEAD',
  INITIAL_CONTACT = 'INITIAL_CONTACT',
  SHOWING_OR_ACTIVE = 'SHOWING_OR_ACTIVE',
  UNDER_CONTRACT = 'UNDER_CONTRACT',
  PENDING_CLOSE = 'PENDING_CLOSE',
  CLOSED = 'CLOSED'
}

export type DealSide = 'BUYER' | 'SELLER';

export enum ExpenseType {
  STANDARD = 'Standard Expense',
  MILEAGE = 'Mileage (Fuel)',
}

export enum ExpenseCategory {
  PHOTOGRAPHY = 'Professional Photography',
  PHOTO_VIDEO = 'Photography + Video',
  STAGING = 'Professional Staging',
  MARKETING = 'Marketing & Advertising',
  CLIENT_MEALS = 'Client Meals',
  EQUIPMENT = 'Equipment Rental',
  CLEAN_OUT = 'Clean Out Crew',
  FOOD = 'Food',
  MILEAGE = 'Mileage (Fuel)',
  OTHER = 'Other Expense'
}

export enum ActivityCategory {
  SEPTIC_INSPECTION = 'Septic Inspection',
  HOME_INSPECTION = 'Home Inspection',
  WALKTHROUGH = 'Walkthrough',
  CLOSING = 'Closing',
  BUYER_MEETING = 'Buyer Meeting',
  SELLER_MEETING = 'Seller Meeting',
  SHOWING = 'Property Showing',
  OPEN_HOUSE = 'Open House',
  NEGOTIATION = 'Negotiation',
  PAPERWORK = 'Paperwork',
  OTHER = 'Other Activity'
}

export interface Deal {
  id: string;
  name: string; // Client Name
  propertyAddress: string;
  propertyPrice: number;
  dealSide: DealSide;
  stage: DealStage;
  
  stageEnteredAt: string; // ISO string
  closeProbabilityBps: number; // 0-10000
  
  commissionEarned: number; // Final realized revenue (only for CLOSED)
  
  createdAt: string; // ISO string
  closedAt?: string; // ISO string (only for CLOSED)

  leadSource: string | null;
  otherLeadSource?: string;
  notes?: string;

  // Metadata for Seller
  listingDate?: string | null;
  daysOnMarket?: number | null;
}

export interface Expense {
  id: string;
  dealId?: string;
  dealSide?: DealSide;
  type: ExpenseType;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  quantity: number;
  costPerUnit: number;
  milesDriven: number;
  mpg: number;
  gasPrice: number;
  gallonsUsed: number;
  fuelCost: number;
  totalCost: number;
}

export interface Activity {
  id: string;
  date: string;
  category: ActivityCategory;
  dealId?: string;
  dealSide?: DealSide;
  notes?: string;
}

export interface KPISettings {
  annualGCIGoal: number;
  targetCloseRate: number;
  avgBuyerCommission: number;
  avgSellerCommission: number;
  estimatedTaxRate: number;
  defaultMPG: number;
  defaultGasPrice: number;
}
