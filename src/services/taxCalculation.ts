import { TaxCalculationResult } from '../types/simulation';
import { get401kLimit } from '../utils/financialCalculations';

/**
 * Tax Calculation Service
 * Handles complex tax calculations including federal, state, and payroll taxes
 */

/**
 * Federal tax brackets for 2025 (single filer)
 */
const FEDERAL_TAX_BRACKETS = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 }
];

/**
 * State tax rates (simplified average rates)
 */
const STATE_TAX_RATES: { [key: string]: number } = {
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

/**
 * Social Security wage base for current year
 */
const SOCIAL_SECURITY_WAGE_BASE = 160200;

/**
 * Medicare additional tax threshold
 */
const MEDICARE_ADDITIONAL_TAX_THRESHOLD = 200000;

/**
 * Calculates comprehensive tax information including federal, state, and payroll taxes
 * Uses 2025 tax brackets (single filer)
 */
export const calculateTaxes = (
  annualSalary: number, 
  state: string = '', 
  contribution401kTraditional: number = 0, 
  contribution401kRoth: number = 0, 
  iraTraditionalContribution: number = 0,
  iraRothContribution: number = 0,
  year?: number
): TaxCalculationResult => {
  if (annualSalary <= 0) {
    return { 
      totalTax: 0, 
      afterTaxIncome: 0, 
      effectiveRate: 0,
      federalTax: 0,
      stateTax: 0,
      socialSecurity: 0,
      medicare: 0,
      miscDeductions: 0,
      contribution401kTraditional: 0,
      contribution401kRoth: 0,
      totalContribution401k: 0,
      iraTraditionalContribution: 0,
      iraRothContribution: 0,
      totalIraContribution: 0,
      taxableIncome: 0
    };
  }

  // Enforce 401k contribution limits
  const current401kLimit = get401kLimit(year);
  const totalContribution401k = contribution401kTraditional + contribution401kRoth;
  const cappedTotalContribution = Math.min(totalContribution401k, current401kLimit);
  
  // Proportionally reduce contributions if they exceed the limit
  const reductionFactor = totalContribution401k > 0 ? cappedTotalContribution / totalContribution401k : 1;
  const cappedTraditional = contribution401kTraditional * reductionFactor;
  const cappedRoth = contribution401kRoth * reductionFactor;

  // Calculate taxable income - Traditional 401k and Traditional IRA reduce taxable income, Roth does not
  const taxableIncome = annualSalary - cappedTraditional - iraTraditionalContribution;

  // Calculate federal tax using progressive brackets
  let federalTax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of FEDERAL_TAX_BRACKETS) {
    if (remainingIncome <= 0) break;
    
    const taxableAtThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    federalTax += taxableAtThisBracket * bracket.rate;
    remainingIncome -= taxableAtThisBracket;
  }

  // Calculate state tax (also on taxable income)
  const stateRate = STATE_TAX_RATES[state] || 0;
  const stateTax = taxableIncome * stateRate;

  // Calculate Social Security and Medicare (on gross salary, not reduced by 401k)
  const socialSecurity = Math.min(annualSalary, SOCIAL_SECURITY_WAGE_BASE) * 0.062;
  const medicare = annualSalary * 0.0145 + Math.max(0, annualSalary - MEDICARE_ADDITIONAL_TAX_THRESHOLD) * 0.009;
  const miscDeductions = annualSalary * 0.005;

  const totalTax = federalTax + stateTax + socialSecurity + medicare + miscDeductions;
  
  // After-tax income calculation: subtract taxes and all 401k contributions
  const afterTaxIncome = annualSalary - totalTax - cappedTotalContribution;
  
  const effectiveRate = annualSalary > 0 ? ((totalTax + cappedTotalContribution) / annualSalary) * 100 : 0;

  return { 
    totalTax, 
    afterTaxIncome, 
    effectiveRate, 
    federalTax, 
    stateTax, 
    socialSecurity, 
    medicare, 
    miscDeductions,
    contribution401kTraditional: cappedTraditional,
    contribution401kRoth: cappedRoth,
    totalContribution401k: cappedTotalContribution,
    iraTraditionalContribution,
    iraRothContribution,
    totalIraContribution: iraTraditionalContribution + iraRothContribution,
    taxableIncome
  };
};

/**
 * Calculates just the effective tax rate as a percentage
 */
export const calculateEffectiveTaxRate = (
  annualSalary: number, 
  state: string = '', 
  contribution401kTraditional: number = 0, 
  contribution401kRoth: number = 0, 
  year?: number
): number => {
  const result = calculateTaxes(annualSalary, state, contribution401kTraditional, contribution401kRoth, year);
  return result.effectiveRate;
};

/**
 * Calculates take-home pay after all taxes and contributions
 */
export const calculateTakeHomePay = (
  annualSalary: number, 
  state: string = '', 
  contribution401kTraditional: number = 0, 
  contribution401kRoth: number = 0, 
  year?: number
): number => {
  const result = calculateTaxes(annualSalary, state, contribution401kTraditional, contribution401kRoth, year);
  return result.afterTaxIncome;
};
