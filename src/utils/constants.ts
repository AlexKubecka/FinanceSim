import { StateCostData, FederalTaxBracket } from '../types/simulation';

// Initial economic state
export const INITIAL_ECONOMIC_STATE = {
  currentInflationRate: 0.025, // 2.5% inflation
  cumulativeInflation: 1.0,
  stockMarketIndex: 5000, // S&P 500-like level
  stockMarketGrowth: 0.10, // 10% average annual growth
  economicCycle: 'expansion' as const,
  yearsInCurrentCycle: 0
};

// 401k limits and configuration
export const RETIREMENT_CONFIG = {
  BASE_YEAR: 2025,
  BASE_401K_LIMIT: 23500,
  ANNUAL_INCREASE: 500,
  SOCIAL_SECURITY_WAGE_BASE: 160200,
  MEDICARE_ADDITIONAL_THRESHOLD: 200000
};

// Function to get 401k contribution limit by year
export const get401kLimit = (year?: number): number => {
  const currentYear = year || new Date().getFullYear();
  const baseYear = RETIREMENT_CONFIG.BASE_YEAR;
  const baseLimit = RETIREMENT_CONFIG.BASE_401K_LIMIT;
  const annualIncrease = RETIREMENT_CONFIG.ANNUAL_INCREASE;
  
  if (currentYear < baseYear) {
    // For years before 2025, use historical limits or approximate
    return baseLimit - (annualIncrease * (baseYear - currentYear));
  }
  
  return baseLimit + (annualIncrease * (currentYear - baseYear));
};

// Tax rates
export const TAX_RATES = {
  SOCIAL_SECURITY: 0.062,
  MEDICARE: 0.0145,
  MEDICARE_ADDITIONAL: 0.009,
  MISC_DEDUCTIONS: 0.005
};

// Economic cycle durations (in years)
export const ECONOMIC_CYCLE_DURATIONS = {
  expansion: { min: 2, max: 4 }, // Shortened for testing (normally 6-10)
  peak: { min: 1, max: 1 },
  recession: { min: 1, max: 3 },
  trough: { min: 1, max: 1 },
  depression: { min: 2, max: 5 }
};

// Economic cycle transition probabilities
export const ECONOMIC_TRANSITIONS = {
  expansion: {
    peak: 0.7,
    extendedExpansion: 0.2,
    suddenRecession: 0.1
  },
  peak: {
    recession: 0.55,
    softLanding: 0.3,
    extendedPeak: 0.13,
    depression: 0.02
  },
  recession: {
    trough: 0.4,
    recovery: 0.35,
    deeperRecession: 0.2,
    depression: 0.05,
    vShapedRecovery: 0.15,
    extendedRecession: 0.10
  },
  trough: {
    expansion: 0.8,
    extendedTrough: 0.2
  },
  depression: {
    trough: 0.6,
    recovery: 0.3,
    continueDepression: 0.1,
    extendedDepression: 0.05
  }
};

// Stock market volatility by economic cycle
export const STOCK_MARKET_VOLATILITY = {
  expansion: { min: 0.05, max: 0.15 },
  peak: { min: 0.10, max: 0.20 },
  recession: { min: 0.20, max: 0.40 },
  trough: { min: 0.15, max: 0.30 },
  depression: { min: 0.30, max: 0.50 }
};

// Market volatility (alias for compatibility)
export const MARKET_VOLATILITY = STOCK_MARKET_VOLATILITY;

// Inflation rates by economic cycle
export const INFLATION_BY_CYCLE = {
  expansion: { min: 0.02, max: 0.04 },
  peak: { min: 0.03, max: 0.06 },
  recession: { min: -0.01, max: 0.02 },
  trough: { min: -0.02, max: 0.01 },
  depression: { min: -0.05, max: -0.01 }
};

// Stock growth rates by economic cycle
export const STOCK_GROWTH_BY_CYCLE = {
  expansion: { min: 0.08, max: 0.15 },
  peak: { min: 0.05, max: 0.12 },
  recession: { min: -0.30, max: 0.05 },
  trough: { min: -0.20, max: 0.08 },
  depression: { min: -0.50, max: -0.10 }
};

// Investment returns by risk tolerance
export const INVESTMENT_RETURNS = {
  conservative: {
    base: 0.04,
    volatility: 0.05
  },
  moderate: {
    base: 0.07,
    volatility: 0.10
  },
  aggressive: {
    base: 0.10,
    volatility: 0.18
  }
};

// Federal tax brackets for 2025 (approximate)
export const FEDERAL_TAX_BRACKETS: FederalTaxBracket[] = [
  { min: 0, max: 14200, rate: 0.10 },
  { min: 14200, max: 54550, rate: 0.12 },
  { min: 54550, max: 116675, rate: 0.22 },
  { min: 116675, max: 204400, rate: 0.24 },
  { min: 204400, max: 273200, rate: 0.32 },
  { min: 273200, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 }
];

// State income tax rates (approximate)
export const STATE_TAX_RATES: StateCostData = {
  'Alabama': 0.05,
  'Alaska': 0.00,
  'Arizona': 0.045,
  'Arkansas': 0.065,
  'California': 0.133,
  'Colorado': 0.0455,
  'Connecticut': 0.069,
  'Delaware': 0.066,
  'Florida': 0.00,
  'Georgia': 0.0575,
  'Hawaii': 0.11,
  'Idaho': 0.0695,
  'Illinois': 0.0495,
  'Indiana': 0.0323,
  'Iowa': 0.0853,
  'Kansas': 0.057,
  'Kentucky': 0.05,
  'Louisiana': 0.06,
  'Maine': 0.0715,
  'Maryland': 0.0575,
  'Massachusetts': 0.05,
  'Michigan': 0.0425,
  'Minnesota': 0.0985,
  'Mississippi': 0.05,
  'Missouri': 0.054,
  'Montana': 0.069,
  'Nebraska': 0.0684,
  'Nevada': 0.00,
  'New Hampshire': 0.05,
  'New Jersey': 0.1075,
  'New Mexico': 0.059,
  'New York': 0.1082,
  'North Carolina': 0.0475,
  'North Dakota': 0.029,
  'Ohio': 0.039,
  'Oklahoma': 0.05,
  'Oregon': 0.099,
  'Pennsylvania': 0.0307,
  'Rhode Island': 0.0599,
  'South Carolina': 0.07,
  'South Dakota': 0.00,
  'Tennessee': 0.00,
  'Texas': 0.00,
  'Utah': 0.0495,
  'Vermont': 0.0875,
  'Virginia': 0.0575,
  'Washington': 0.00,
  'West Virginia': 0.065,
  'Wisconsin': 0.0765,
  'Wyoming': 0.00
};

// State rent cost data (average monthly rent)
export const STATE_RENT_DATA: StateCostData = {
  'Alabama': 800,
  'Alaska': 1200,
  'Arizona': 1100,
  'Arkansas': 700,
  'California': 2800,
  'Colorado': 1500,
  'Connecticut': 1600,
  'Delaware': 1300,
  'Florida': 1400,
  'Georgia': 1100,
  'Hawaii': 2200,
  'Idaho': 900,
  'Illinois': 1200,
  'Indiana': 800,
  'Iowa': 700,
  'Kansas': 800,
  'Kentucky': 700,
  'Louisiana': 900,
  'Maine': 1000,
  'Maryland': 1700,
  'Massachusetts': 2100,
  'Michigan': 900,
  'Minnesota': 1100,
  'Mississippi': 700,
  'Missouri': 800,
  'Montana': 900,
  'Nebraska': 800,
  'Nevada': 1200,
  'New Hampshire': 1200,
  'New Jersey': 1800,
  'New Mexico': 900,
  'New York': 2400,
  'North Carolina': 1000,
  'North Dakota': 800,
  'Ohio': 800,
  'Oklahoma': 700,
  'Oregon': 1400,
  'Pennsylvania': 1100,
  'Rhode Island': 1300,
  'South Carolina': 900,
  'South Dakota': 700,
  'Tennessee': 900,
  'Texas': 1200,
  'Utah': 1100,
  'Vermont': 1200,
  'Virginia': 1300,
  'Washington': 1600,
  'West Virginia': 600,
  'Wisconsin': 900,
  'Wyoming': 800
};

// State grocery cost data (monthly average per person)
export const STATE_GROCERY_DATA: StateCostData = {
  'Alabama': 300,
  'Alaska': 450,
  'Arizona': 320,
  'Arkansas': 280,
  'California': 400,
  'Colorado': 350,
  'Connecticut': 380,
  'Delaware': 340,
  'Florida': 320,
  'Georgia': 310,
  'Hawaii': 500,
  'Idaho': 300,
  'Illinois': 330,
  'Indiana': 290,
  'Iowa': 280,
  'Kansas': 290,
  'Kentucky': 280,
  'Louisiana': 300,
  'Maine': 350,
  'Maryland': 370,
  'Massachusetts': 390,
  'Michigan': 310,
  'Minnesota': 320,
  'Mississippi': 280,
  'Missouri': 290,
  'Montana': 320,
  'Nebraska': 290,
  'Nevada': 330,
  'New Hampshire': 350,
  'New Jersey': 380,
  'New Mexico': 300,
  'New York': 400,
  'North Carolina': 300,
  'North Dakota': 310,
  'Ohio': 300,
  'Oklahoma': 280,
  'Oregon': 350,
  'Pennsylvania': 320,
  'Rhode Island': 360,
  'South Carolina': 290,
  'South Dakota': 280,
  'Tennessee': 290,
  'Texas': 310,
  'Utah': 320,
  'Vermont': 370,
  'Virginia': 330,
  'Washington': 360,
  'West Virginia': 270,
  'Wisconsin': 310,
  'Wyoming': 320
};

// Life events that can occur during simulation
export const LIFE_EVENTS = [
  {
    id: 'job_promotion',
    name: 'Job Promotion',
    probability: 0.15, // 15% chance per year
    salaryIncrease: { min: 0.10, max: 0.25 },
    description: 'You received a promotion with a salary increase!'
  },
  {
    id: 'job_loss',
    name: 'Job Loss',
    probability: 0.05, // 5% chance per year
    salaryIncrease: { min: -1.0, max: -1.0 }, // 100% salary loss
    duration: { min: 3, max: 12 }, // 3-12 months to find new job
    description: 'You lost your job and need to find new employment.'
  },
  {
    id: 'market_crash',
    name: 'Market Crash',
    probability: 0.08, // 8% chance per year
    investmentImpact: { min: -0.40, max: -0.20 },
    description: 'A major market crash affected your investments.'
  },
  {
    id: 'market_boom',
    name: 'Market Boom',
    probability: 0.10, // 10% chance per year
    investmentImpact: { min: 0.15, max: 0.35 },
    description: 'A market boom significantly increased your investments!'
  },
  {
    id: 'medical_expense',
    name: 'Major Medical Expense',
    probability: 0.12, // 12% chance per year
    expenseAmount: { min: 5000, max: 50000 },
    description: 'An unexpected medical expense occurred.'
  },
  {
    id: 'home_repair',
    name: 'Major Home Repair',
    probability: 0.08, // 8% chance per year
    expenseAmount: { min: 3000, max: 25000 },
    description: 'Your home needed a major repair.'
  }
];

// Achievement system
export const ACHIEVEMENTS = [
  {
    id: 'emergency_fund',
    name: 'Emergency Fund Champion',
    description: 'Build an emergency fund of 6 months expenses',
    condition: 'emergency_fund_complete'
  },
  {
    id: 'debt_free',
    name: 'Debt Free Hero',
    description: 'Pay off all debt',
    condition: 'zero_debt'
  },
  {
    id: 'millionaire',
    name: 'Millionaire',
    description: 'Reach a net worth of $1,000,000',
    condition: 'net_worth_million'
  },
  {
    id: 'retirement_ready',
    name: 'Retirement Ready',
    description: 'Reach your retirement goal',
    condition: 'retirement_goal_met'
  }
];
