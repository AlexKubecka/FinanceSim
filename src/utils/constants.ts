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
    trough: 0.5,
    vShapedRecovery: 0.3,
    extendedRecession: 0.19,
    depression: 0.01
  },
  trough: {
    expansion: 0.8,
    extendedTrough: 0.2
  },
  depression: {
    trough: 0.6,
    extendedDepression: 0.3,
    directRecovery: 0.1
  }
};

// Inflation rates by economic cycle
export const INFLATION_BY_CYCLE = {
  expansion: { base: 0.025, variance: 0.02 }, // 2.5-4.5%
  peak: { base: 0.025, variance: 0.03 }, // 2.5-5.5%
  recession: { base: 0.025, variance: -0.015 }, // 1.0-2.5%
  trough: { base: 0.025, variance: -0.02 }, // 0.5-2.5%
  depression: { base: 0.025, variance: -0.05 } // -2% to 2.5%
};

// Stock market growth by economic cycle
export const STOCK_GROWTH_BY_CYCLE = {
  expansion: { base: 0.12, variance: 0.08 }, // 12-20%
  peak: { base: 0.05, variance: 0.10 }, // 5-15%
  recession: { base: -0.15, variance: 0.10 }, // -15% to -5%
  trough: { base: -0.10, variance: 0.15 }, // -10% to +5%
  depression: { base: -0.40, variance: 0.15 } // -40% to -25%
};

// Market volatility
export const MARKET_VOLATILITY = 0.20; // 20%

// Salary inflation adjustment factor
export const SALARY_INFLATION_FACTOR = 0.8; // 80% of inflation

// Federal tax brackets for 2025 (single filer)
export const FEDERAL_TAX_BRACKETS: FederalTaxBracket[] = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 }
];

// State tax rates (simplified average rates)
export const STATE_TAX_RATES: StateCostData = {
  'Alabama': 0.035, 'Alaska': 0, 'Arizona': 0.025, 'Arkansas': 0.0295, 'California': 0.067,
  'Colorado': 0.044, 'Connecticut': 0.045, 'Delaware': 0.044, 'District of Columbia': 0.074,
  'Florida': 0, 'Georgia': 0.0539, 'Hawaii': 0.062, 'Idaho': 0.05695, 'Illinois': 0.0495,
  'Indiana': 0.03, 'Iowa': 0.038, 'Kansas': 0.054, 'Kentucky': 0.04, 'Louisiana': 0.03,
  'Maine': 0.065, 'Maryland': 0.039, 'Massachusetts': 0.07, 'Michigan': 0.0425,
  'Minnesota': 0.076, 'Mississippi': 0.044, 'Missouri': 0.035, 'Montana': 0.053,
  'Nebraska': 0.038, 'Nevada': 0, 'New Hampshire': 0, 'New Jersey': 0.061, 'New Mexico': 0.037,
  'New York': 0.075, 'North Carolina': 0.0425, 'North Dakota': 0.0225, 'Ohio': 0.031,
  'Oklahoma': 0.025, 'Oregon': 0.073, 'Pennsylvania': 0.0307, 'Rhode Island': 0.049,
  'South Carolina': 0.031, 'South Dakota': 0, 'Tennessee': 0, 'Texas': 0, 'Utah': 0.0455,
  'Vermont': 0.061, 'Virginia': 0.039, 'Washington': 0, 'West Virginia': 0.035,
  'Wisconsin': 0.056, 'Wyoming': 0
};

// State rent data (average monthly rent by state)
export const STATE_RENT_DATA: StateCostData = {
  'Massachusetts': 2837,
  'New York': 2739,
  'Hawaii': 2668,
  'California': 2587,
  'District of Columbia': 2474,
  'New Jersey': 2337,
  'Vermont': 2152,
  'Rhode Island': 2129,
  'New Hampshire': 2112,
  'Connecticut': 2044,
  'Washington': 2020,
  'Virginia': 1972,
  'Maine': 1971,
  'Florida': 1955,
  'Illinois': 1944,
  'Colorado': 1884,
  'Maryland': 1859,
  'Oregon': 1757,
  'Pennsylvania': 1730,
  'Delaware': 1646,
  'Georgia': 1608,
  'Idaho': 1607,
  'Montana': 1605,
  'Utah': 1597,
  'South Carolina': 1594,
  'Arizona': 1575,
  'Minnesota': 1558,
  'Wisconsin': 1548,
  'Nevada': 1525,
  'North Carolina': 1524,
  'Tennessee': 1494,
  'Alaska': 1482,
  'Texas': 1449,
  'New Mexico': 1389,
  'Michigan': 1346,
  'Wyoming': 1332,
  'Mississippi': 1305,
  'Indiana': 1293,
  'Alabama': 1288,
  'Kentucky': 1287,
  'Nebraska': 1285,
  'Ohio': 1279,
  'West Virginia': 1275,
  'Missouri': 1273,
  'Kansas': 1243,
  'Louisiana': 1235,
  'Iowa': 1220,
  'South Dakota': 1127,
  'Arkansas': 1093,
  'North Dakota': 1077,
  'Oklahoma': 1035
};

// State grocery data (average weekly grocery costs by state)
export const STATE_GROCERY_DATA: StateCostData = {
  'Hawaii': 333.88,
  'Alaska': 328.71,
  'California': 297.72,
  'Nevada': 294.76,
  'Mississippi': 290.64,
  'Washington': 287.67,
  'Florida': 287.27,
  'New Mexico': 286.39,
  'Texas': 286.19,
  'Louisiana': 282.95,
  'Colorado': 279.98,
  'Oklahoma': 279.16,
  'Utah': 278.41,
  'Georgia': 278.32,
  'New Jersey': 274.69,
  'Massachusetts': 271.98,
  'Arizona': 271.84,
  'Alabama': 271.64,
  'Tennessee': 270.45,
  'Illinois': 269.47,
  'New York': 266.40,
  'North Carolina': 266.23,
  'Maryland': 266.11,
  'Connecticut': 265.90,
  'North Dakota': 265.11,
  'Arkansas': 260.91,
  'Virginia': 259.76,
  'Idaho': 257.54,
  'South Dakota': 256.48,
  'Rhode Island': 255.86,
  'District of Columbia': 254.70,
  'Kentucky': 254.57,
  'South Carolina': 254.36,
  'Wyoming': 254.24,
  'Ohio': 253.74,
  'Kansas': 250.88,
  'Minnesota': 250.56,
  'Maine': 249.91,
  'Oregon': 249.38,
  'Vermont': 249.38,
  'Pennsylvania': 249.09,
  'Montana': 246.42,
  'Delaware': 246.21,
  'Missouri': 244.43,
  'New Hampshire': 239.33,
  'West Virginia': 239.24,
  'Indiana': 239.11,
  'Michigan': 236.38,
  'Nebraska': 235.12,
  'Iowa': 227.32,
  'Wisconsin': 221.46
};

// Simulation timing
export const SIMULATION_CONFIG = {
  YEAR_DURATION_MS: 5000, // 5 seconds per year
  DAYS_PER_YEAR: 365,
  MONTHS_PER_YEAR: 12,
  WEEKS_PER_YEAR: 52
};

// Career action multipliers
export const CAREER_ACTIONS = {
  PROMOTION_INCREASE: 0.15, // 15%
  DEMOTION_DECREASE: 0.10, // 10%
  MAX_RECENT_EVENTS: 5
};

// Default values
export const DEFAULTS = {
  PERSONAL_DATA: {
    retirementAge: 65,
    retirementGoal: 1000000,
    emergencyFundMonths: 6,
    riskTolerance: 'moderate' as const
  }
};
