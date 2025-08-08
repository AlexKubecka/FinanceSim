// Core simulation types
export type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth';

export type SimulationState = 'setup' | 'running' | 'paused' | 'completed';

export type EconomicCycle = 'expansion' | 'peak' | 'recession' | 'trough' | 'depression';

export type CareerField = '' | 'Tech' | 'Government' | 'Service';

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

export type Contribution401kType = 'traditional' | 'roth';

export type MaritalStatus = 'single' | 'married-jointly' | 'married-separately';

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
  cashBonus: number;
  stockBonus: number;
  savings: number;
  investments: number;
  debtAmount: number;
  debtInterestRate: number;
  retirementAge: number;
  retirementGoal: number;
  emergencyFundMonths: number;
  riskTolerance: RiskTolerance;
  monthlyInvestment: number;
  plannedPurchases: PlannedPurchase[];
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
  simulateEconomicStep: (currentEconomic: EconomicState, previousYearIndex: number) => EconomicState;
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
