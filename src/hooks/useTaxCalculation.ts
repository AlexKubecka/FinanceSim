import { TaxCalculationResult } from '../types/simulation';
import {
  RETIREMENT_CONFIG,
  TAX_RATES,
  FEDERAL_TAX_BRACKETS,
  STATE_TAX_RATES
} from '../utils/constants';

export const useTaxCalculation = () => {
  
  // Calculate current year's 401k contribution limit
  const get401kLimit = (year?: number): number => {
    const currentYear = year || new Date().getFullYear();
    
    if (currentYear < RETIREMENT_CONFIG.BASE_YEAR) {
      // For years before base year, use historical limits or approximate
      return RETIREMENT_CONFIG.BASE_401K_LIMIT - (RETIREMENT_CONFIG.ANNUAL_INCREASE * (RETIREMENT_CONFIG.BASE_YEAR - currentYear));
    }
    
    return RETIREMENT_CONFIG.BASE_401K_LIMIT + (RETIREMENT_CONFIG.ANNUAL_INCREASE * (currentYear - RETIREMENT_CONFIG.BASE_YEAR));
  };

  // Tax calculation function using current tax brackets (single filer)
  const calculateTaxes = (
    annualSalary: number, 
    state: string = '', 
    contribution401kTraditional: number = 0, 
    contribution401kRoth: number = 0, 
    year?: number
  ): TaxCalculationResult => {
    if (annualSalary <= 0) return { 
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
      taxableIncome: 0
    };

    // Enforce 401k contribution limits
    const current401kLimit = get401kLimit(year);
    const totalContribution401k = contribution401kTraditional + contribution401kRoth;
    const cappedTotalContribution = Math.min(totalContribution401k, current401kLimit);
    
    // Proportionally reduce contributions if they exceed the limit
    const reductionFactor = totalContribution401k > 0 ? cappedTotalContribution / totalContribution401k : 1;
    const cappedTraditional = contribution401kTraditional * reductionFactor;
    const cappedRoth = contribution401kRoth * reductionFactor;

    // Calculate taxable income - Traditional 401k reduces taxable income, Roth does not
    const taxableIncome = annualSalary - cappedTraditional;

    // Calculate federal tax
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
    const socialSecurity = Math.min(annualSalary, RETIREMENT_CONFIG.SOCIAL_SECURITY_WAGE_BASE) * TAX_RATES.SOCIAL_SECURITY;
    const medicare = annualSalary * TAX_RATES.MEDICARE + Math.max(0, annualSalary - RETIREMENT_CONFIG.MEDICARE_ADDITIONAL_THRESHOLD) * TAX_RATES.MEDICARE_ADDITIONAL;
    const miscDeductions = annualSalary * TAX_RATES.MISC_DEDUCTIONS;

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
      taxableIncome
    };
  };

  return {
    get401kLimit,
    calculateTaxes
  };
};
