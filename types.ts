
export enum DealStage {
  LEAD = 'LEAD',
  INITIAL_CONTACT = 'INITIAL_CONTACT',
  SHOWING_OR_ACTIVE = 'SHOWING_OR_ACTIVE',
  UNDER_CONTRACT = 'UNDER_CONTRACT',
  PENDING_CLOSE = 'PENDING_CLOSE',
  CLOSED = 'CLOSED'
}

export type DealSide = 'BUYER' | 'SELLER';

// Expense/Activity enums remain the same for now
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
  name: string;
  dealSide: DealSide;
  stage: DealStage;
  
  // Canonical Pipeline Fields
  stageEnteredAt: string; // ISO string
  closeProbabilityBps: number; // 0-10000 (Basis points)
  
  expectedGci: number;
  actualGci?: number; // Only for CLOSED
  
  createdAt: string; // ISO string
  closedAt?: string; // ISO string (only for CLOSED)

  // Context
  leadSource: string | null;
  otherLeadSource?: string;
  notes?: string;

  // Seller-Specific Fields
  listPrice?: number | null;
  commissionRatePct?: number | null;
  expectedCommission?: number | null;
  listingDate?: string | null; // ISO
  closedPrice?: number | null;
  daysOnMarket?: number | null;
  priceVariance?: number | null;
}

export interface Expense {
  id: string;
  dealId?: string;
  dealSide?: DealSide; // Updated from dealType
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
  dealSide?: DealSide; // Updated from dealType
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
