/**
 * Financial calculation utilities
 */

import { PersonalFinancialData } from '../types/simulation';

/**
 * Calculate current year's 401k contribution limit
 * @param year - Optional year to calculate limit for, defaults to current year
 * @returns The 401k contribution limit for the specified year
 */
export const get401kLimit = (year?: number): number => {
  const currentYear = year || new Date().getFullYear();
  const baseYear = 2025;
  const baseLimit = 23500;
  const annualIncrease = 500;
  
  if (currentYear < baseYear) {
    // For years before 2025, use historical limits or approximate
    return baseLimit - (annualIncrease * (baseYear - currentYear));
  }
  
  return baseLimit + (annualIncrease * (currentYear - baseYear));
};

/**
 * Calculate total portfolio value across all investment accounts
 * @param data - Personal financial data containing all investment holdings
 * @returns Total portfolio value including all cash balances and holdings
 */
export const calculateTotalPortfolioValue = (data: PersonalFinancialData): number => {
  // Current asset prices
  const sp500Price = 450;
  const techPrice = 180;
  
  // Personal taxable account
  const personalCash = data.personalInvestmentCash || 0;
  const personalSP500 = data.investments || 0;
  const personalTech = data.techStockHoldings || 0;
  
  // Traditional IRA
  const iraTraditionalCash = data.iraTraditionalCash || 0;
  const iraTraditionalSP500 = data.iraTraditionalHoldings || 0;
  const iraTraditionalTech = data.iraTraditionalTechHoldings || 0;
  
  // Roth IRA
  const iraRothCash = data.iraRothCash || 0;
  const iraRothSP500 = data.iraRothHoldings || 0;
  const iraRothTech = data.iraRothTechHoldings || 0;
  
  // Traditional 401k
  const the401kTraditionalCash = data.the401kTraditionalCash || 0;
  const the401kTraditionalSP500 = data.the401kTraditionalHoldings || 0;
  const the401kTraditionalTech = data.the401kTraditionalTechHoldings || 0;
  
  // Roth 401k
  const the401kRothCash = data.the401kRothCash || 0;
  const the401kRothSP500 = data.the401kRothHoldings || 0;
  const the401kRothTech = data.the401kRothTechHoldings || 0;
  
  // Calculate total value
  const totalCash = personalCash + iraTraditionalCash + iraRothCash + the401kTraditionalCash + the401kRothCash;
  const totalSP500 = personalSP500 + iraTraditionalSP500 + iraRothSP500 + the401kTraditionalSP500 + the401kRothSP500;
  const totalTech = personalTech + iraTraditionalTech + iraRothTech + the401kTraditionalTech + the401kRothTech;
  
  return totalCash + totalSP500 + totalTech;
};

/**
 * Calculate non-tech portfolio value (S&P 500 investments + cash)
 * @param data - Personal financial data containing all investment holdings
 * @returns Portfolio value excluding tech stocks
 */
export const calculateNonTechPortfolioValue = (data: PersonalFinancialData): number => {
  // Personal taxable account
  const personalCash = data.personalInvestmentCash || 0;
  const personalSP500 = data.investments || 0;
  
  // Traditional IRA
  const iraTraditionalCash = data.iraTraditionalCash || 0;
  const iraTraditionalSP500 = data.iraTraditionalHoldings || 0;
  
  // Roth IRA
  const iraRothCash = data.iraRothCash || 0;
  const iraRothSP500 = data.iraRothHoldings || 0;
  
  // Traditional 401k
  const the401kTraditionalCash = data.the401kTraditionalCash || 0;
  const the401kTraditionalSP500 = data.the401kTraditionalHoldings || 0;
  
  // Roth 401k
  const the401kRothCash = data.the401kRothCash || 0;
  const the401kRothSP500 = data.the401kRothHoldings || 0;
  
  // Calculate total non-tech value
  const totalCash = personalCash + iraTraditionalCash + iraRothCash + the401kTraditionalCash + the401kRothCash;
  const totalSP500 = personalSP500 + iraTraditionalSP500 + iraRothSP500 + the401kTraditionalSP500 + the401kRothSP500;
  
  return totalCash + totalSP500;
};

/**
 * Calculate total tech stock value across all accounts
 * @param data - Personal financial data containing all investment holdings
 * @returns Total tech stock value
 */
export const calculateTechStockValue = (data: PersonalFinancialData): number => {
  // Personal tech holdings
  const personalTech = data.techStockHoldings || 0;
  
  // IRA tech holdings
  const iraTraditionalTech = data.iraTraditionalTechHoldings || 0;
  const iraRothTech = data.iraRothTechHoldings || 0;
  
  // 401k tech holdings
  const the401kTraditionalTech = data.the401kTraditionalTechHoldings || 0;
  const the401kRothTech = data.the401kRothTechHoldings || 0;
  
  return personalTech + iraTraditionalTech + iraRothTech + the401kTraditionalTech + the401kRothTech;
};

/**
 * Calculate total net worth from PersonalFinancialData
 * @param data - Personal financial data containing all holdings and balances
 * @returns Total net worth (assets - liabilities)
 */
export const calculatePersonalNetWorth = (data: PersonalFinancialData): number => {
  const totalPortfolioValue = calculateTotalPortfolioValue(data);
  
  // Calculate total bank balance
  const totalBankBalance = (data.savingsAccount ?? 0) + 
                          (data.checkingAccount ?? 0) + 
                          (data.hysaAccount ?? 0);
  
  const totalAssets = totalBankBalance + totalPortfolioValue;
  const totalLiabilities = data.debtAmount || 0;
  
  return totalAssets - totalLiabilities;
};
