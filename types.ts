export enum DealStatus {
  LEAD = 'Lead',
  
  // Buyer Pipeline
  APPOINTMENT_SET = 'Appointment Set',
  SHOWING = 'Showing',
  OFFER_WRITTEN = 'Offer Written',
  UNDER_CONTRACT = 'Under Contract',
  
  // Seller Pipeline
  LISTING_APPOINTMENT = 'Listing Appointment',
  ACTIVE_LISTING = 'Active Listing',
  PENDING = 'Under Contract / Pending',
  
  // Common
  CLOSED = 'Closed',
  DEAD = 'Dead',
}

export enum DealType {
  BUYER = 'Buyer',
  SELLER = 'Seller',
}

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
  name: string; // Property Address
  type: DealType;
  status: DealStatus;
  grossCommission: number; // Required for closed
  closeDate: string | null; // ISO Date string, required for closed
  leadSource?: string;
  leadSourceDetail?: string; // Specifics if Lead Source is "Other"
  notes?: string;
  createdAt: string;

  // Seller Specific
  listPrice?: number;
  commissionPercentage?: number; // Used to calc gross commission
  listingDate?: string | null; // Required for Active Listing
  underContractDate?: string | null; // Required for Pending
  closedSalePrice?: number; // Required for Closed (Seller)
}

export interface Expense {
  id: string;
  dealId?: string; // Optional link to deal
  dealType?: DealType; // Auto-derived if linked
  type: ExpenseType;
  category: ExpenseCategory;
  date: string;
  notes?: string; // Conditional: Marketing or Other only
  
  // Standard
  quantity: number;
  costPerUnit: number;

  // Mileage
  milesDriven: number;
  mpg: number;
  gasPrice: number;
  
  // Calculated (stored for ease, but derived in logic)
  gallonsUsed: number;
  fuelCost: number;
  totalCost: number;
}

export interface Activity {
  id: string;
  date: string;
  category: ActivityCategory;
  dealId?: string; // Optional
  dealType?: DealType; // Auto-derived if linked
  notes?: string; // Optional
}

export interface KPISettings {
  // Annual Goals
  annualGCIGoal: number;
  targetCloseRate: number; // Percentage 0-100

  // Commission Assumptions
  avgBuyerCommission: number;
  avgSellerCommission: number;

  // Expense & Tax
  estimatedTaxRate: number; // Percentage 0-100

  // Mileage Defaults
  defaultMPG: number;
  defaultGasPrice: number;
}

export interface DashboardMetrics {
  gciYTD: number;
  netIncomeYTD: number;
  dealsClosedYTD: number;
  avgCommission: number;
  closeRate: number;
  dealsClosedTotal: number;
  totalDeals: number;
  offersAccepted: number; // derived from Under Contract + Closed
  offersWritten: number; // derived from status >= Offer Written
  showings: number; // derived from status >= Showing
  appointments: number; // derived from status >= Appointment Set
}