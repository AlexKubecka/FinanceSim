import { useCallback } from 'react';
import { get401kLimit } from '../utils/financialCalculations';
import { PersonalFinancialData } from '../types/simulation';

export const useFinancialCalculations = () => {
  // Memoized formatters
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const formatPercent = useCallback((value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  const formatNumber = useCallback((value: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  }, []);

  // Memoized 401k calculations
  const calculate401kContributions = useCallback((personalData: PersonalFinancialData) => {
    const currentYear = new Date().getFullYear();
    const limit = get401kLimit(currentYear);
    
    const annual401kTraditional = personalData.contributions401kTraditional > 0 ? 
      (personalData.currentSalary * personalData.contributions401kTraditional / 100) : 0;
    const annual401kRoth = personalData.contributions401kRoth > 0 ? 
      (personalData.currentSalary * personalData.contributions401kRoth / 100) : 0;
    
    const total401kEmployeeContribution = Math.min(annual401kTraditional + annual401kRoth, limit);
    const employerMatch = Math.min(
      total401kEmployeeContribution,
      personalData.currentSalary * personalData.match401k / 100
    );
    
    return {
      employeeTraditional: Math.min(annual401kTraditional, limit * (annual401kTraditional / (annual401kTraditional + annual401kRoth))),
      employeeRoth: Math.min(annual401kRoth, limit * (annual401kRoth / (annual401kTraditional + annual401kRoth))),
      employerMatch,
      total: total401kEmployeeContribution + employerMatch,
      isAtLimit: total401kEmployeeContribution >= limit
    };
  }, []);

  // Memoized investment growth calculation
  const calculateInvestmentGrowth = useCallback((
    currentValue: number,
    monthlyContribution: number,
    annualGrowthRate: number,
    months: number = 12
  ) => {
    const monthlyRate = annualGrowthRate / 12;
    let value = currentValue;
    
    for (let month = 0; month < months; month++) {
      value *= (1 + monthlyRate);
      value += monthlyContribution;
    }
    
    return value;
  }, []);

  // Memoized expense calculations
  const calculateAnnualExpenses = useCallback((
    personalData: PersonalFinancialData,
    rentData: { [key: string]: number },
    groceryData: { [key: string]: number }
  ) => {
    const rent = rentData[personalData.state] || 0;
    const groceries = groceryData[personalData.state] || 0;
    const otherExpenses = personalData.currentSalary * 0.3; // Estimate 30% of salary for other expenses
    
    return (rent * 12) + (groceries * 12) + otherExpenses;
  }, []);

  return {
    formatCurrency,
    formatPercent,
    formatNumber,
    calculate401kContributions,
    calculateInvestmentGrowth,
    calculateAnnualExpenses
  };
};
