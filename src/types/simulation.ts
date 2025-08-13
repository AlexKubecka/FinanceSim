// Import yearly summary types
import type { YearlySummary } from './yearlySummary';

// Core simulation types
export type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth' | 'bank' | 'debt' | 'reports';

export type SimulationState = 'setup' | 'running' | 'paused' | 'completed';

export type EconomicCycle = 'expansion' | 'peak' | 'recession' | 'trough' | 'depression';

export type CareerField = '' | 'Tech' | 'Government' | 'Service';

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

export type Contribution401kType = 'traditional' | 'roth';

export type MaritalStatus = 'single' | 'married-jointly' | 'married-separately';

export type InvestmentType = 'sp500' | 'tech' | 'treasuries' | 'bonds';

// Personal financial data interface
export interface PersonalFinancialData {
  age: number;
  currentSalary: number;
  state: string;
  careerField: CareerField;
  maritalStatus: MaritalStatus;
  match401k: number;
  contributions401k: number; // DEPRECATED
  contributions401kTraditional: number;
  contributions401kRoth: number;
  contribution401kType: Contribution401kType; // DEPRECATED
  iraTraditionalContribution: number;
  iraRothContribution: number;
  // Enhanced expense tracking
  monthlyRent?: number; // Optional, falls back to state average
  weeklyGroceries?: number; // Optional, falls back to state average
  // Enhanced retirement account tracking
  iraTraditionalHoldings: number; // Current traditional IRA balance (SP500)
  iraTraditionalTechHoldings: number; // Current traditional IRA tech holdings
  iraRothHoldings: number; // Current Roth IRA balance (SP500)
  iraRothTechHoldings: number; // Current Roth IRA tech holdings
  the401kTraditionalHoldings: number; // Current traditional 401k balance (SP500)
  the401kTraditionalTechHoldings: number; // Current traditional 401k tech holdings
  the401kRothHoldings: number; // Current Roth 401k balance (SP500)
  the401kRothTechHoldings: number; // Current Roth 401k tech holdings
  // Investment account cash balances
  personalInvestmentCash: number; // Cash balance in personal investment account
  iraTraditionalCash: number; // Cash balance in traditional IRA
  iraRothCash: number; // Cash balance in Roth IRA
  the401kTraditionalCash: number; // Cash balance in traditional 401k
  the401kRothCash: number; // Cash balance in Roth 401k
  cashBonus: number;
  stockBonus: number;
  savings: number; // DEPRECATED - keeping for backwards compatibility
  // Enhanced bank account system
  savingsAccount: number; // Traditional savings account (0.05% APY)
  checkingAccount: number; // Checking account (0% APY)
  hysaAccount: number; // High Yield Savings Account (4% APY)
  investments: number;
  techStockHoldings: number; // Tech stock holdings (for stock options/tech investments)
  debtAmount: number;
  debtInterestRate: number;
  debtPaymentPlan: 'none' | '30-year' | '15-year' | '5-year' | 'custom';
  customDebtPayment: number; // For custom payment plans
  retirementAge: number;
  retirementGoal: number;
  emergencyFundMonths: number;
  riskTolerance: RiskTolerance;
  monthlyInvestment: number;
  plannedPurchases: PlannedPurchase[];
  // Yearly summaries for historical tracking
  yearlySummaries: YearlySummary[];
  // Track if simulation was running before modal appeared
  wasRunningBeforeModal?: boolean;
}

// Planned purchase interface
export interface PlannedPurchase {
  item: string;
  cost: number;
  targetYear: number;
}

// Simulation progress tracking
export interface SimulationProgress {
  currentDate: Date;
  startDate: Date;
  currentAge: number;
  yearsElapsed: number;
  monthsElapsed: number;
  daysElapsed: number;
  speedMultiplier: number;
}

// Economic state for simulation
export interface EconomicState {
  currentInflationRate: number;
  cumulativeInflation: number;
  // Investment returns by type (annual percentage)
  investmentReturns: {
    sp500: number;      // S&P 500 - 7%
    tech: number;       // Tech stocks - 0-20% random
    treasuries: number; // Treasuries - 4%
    bonds: number;      // Bonds - 4%
  };
  // Legacy fields for backward compatibility
  stockMarketIndex: number;
  stockMarketGrowth: number;
  economicCycle: EconomicCycle;
  yearsInCurrentCycle: number;
}

// Historical data point for charts
export interface HistoricalDataPoint {
  age: number;
  netWorth: number;
  salary: number;
  investments: number;
  debt: number;
  debtPayment: number; // Annual debt payment amount
  timestamp: Date;
  inflation: number;
  stockMarketValue: number;
}

// Financial state tracking
export interface FinancialState {
  currentSalary: number;
  netWorth: number;
  annualExpenses: number;
  investments: number;
  investmentAccountValue: number;
}

// Event notification
export interface EventNotification {
  type: string;
  description: string;
  timestamp: Date;
  id: string;
}

// Tax calculation result
export interface TaxCalculationResult {
  totalTax: number;
  afterTaxIncome: number;
  effectiveRate: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  miscDeductions: number;
  contribution401kTraditional: number;
  contribution401kRoth: number;
  totalContribution401k: number;
  iraTraditionalContribution: number;
  iraRothContribution: number;
  totalIraContribution: number;
  taxableIncome: number;
}

// Federal tax bracket
export interface FederalTaxBracket {
  min: number;
  max: number;
  rate: number;
}

// Economic transition probability
export interface EconomicTransition {
  fromCycle: EconomicCycle;
  toCycle: EconomicCycle;
  probability: number;
  description: string;
}

// State cost data
export interface StateCostData {
  [state: string]: number;
}

// Custom hooks return types
export interface UseSimulationReturn {
  // State
  simulationState: SimulationState;
  simulationProgress: SimulationProgress;
  hasStarted: boolean;
  
  // Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  runSimulationStep: () => void;
}

export interface UseEconomicStateReturn {
  economicState: EconomicState;
  simulateEconomicStep: (currentEconomic: EconomicState) => EconomicState;
  resetEconomicState: () => void;
}

export interface UseFinancialsReturn {
  financials: FinancialState;
  calculateNetWorth: () => number;
  updateFinancials: (updates: Partial<FinancialState>) => void;
}

export interface UseExpensesReturn {
  // Rent management
  getCurrentRent: (state: string) => number;
  handleEditRent: () => void;
  handleSaveRent: () => void;
  handleCancelEditRent: () => void;
  handleResetRent: () => void;
  isCustomRent: (state: string) => boolean;
  
  // Grocery management
  getCurrentGrocery: (state: string) => number;
  handleEditGrocery: () => void;
  handleSaveGrocery: () => void;
  handleCancelEditGrocery: () => void;
  handleResetGrocery: () => void;
  isCustomGrocery: (state: string) => boolean;
  
  // Calculations
  calculateAnnualExpenses: () => number;
  
  // State
  editingRent: boolean;
  tempRentValue: string;
  editingGrocery: boolean;
  tempGroceryValue: string;
}

export interface UseTaxCalculationReturn {
  calculateTaxes: (
    annualSalary: number,
    state?: string,
    contribution401kTraditional?: number,
    contribution401kRoth?: number,
    iraTraditionalContribution?: number,
    iraRothContribution?: number,
    year?: number
  ) => TaxCalculationResult;
  get401kLimit: (year?: number) => number;
}
