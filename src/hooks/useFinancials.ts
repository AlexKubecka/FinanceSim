import { useState, useEffect } from 'react';
import { PersonalFinancialData } from '../types/simulation';
import { calculateNetWorth } from '../utils/calculationUtils';

interface FinancialState {
  currentSalary: number;
  netWorth: number;
  annualExpenses: number;
  investments: number;
  investmentAccountValue: number;
}

interface UseFinancialsProps {
  personalData: PersonalFinancialData;
  calculateAnnualExpenses: () => number;
}

export const useFinancials = ({ personalData, calculateAnnualExpenses }: UseFinancialsProps) => {
  // Financial tracking
  const [financials, setFinancials] = useState<FinancialState>({
    currentSalary: 0,
    netWorth: 0,
    annualExpenses: 0,
    investments: 0,
    investmentAccountValue: 0
  });

  // Salary actions state
  const [salaryActionTaken, setSalaryActionTaken] = useState(false);

  // Update financials helper
  const updateFinancials = (updates: Partial<FinancialState>) => {
    setFinancials(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Update financials effect - recalculate when any financial data changes
  useEffect(() => {
    const annualExpenses = calculateAnnualExpenses();
    
    setFinancials(prev => {
      // Use the same net worth calculation as everywhere else in the app
      const netWorth = calculateNetWorth(personalData);
      
      return {
        ...prev,
        currentSalary: personalData.currentSalary,
        annualExpenses: annualExpenses,
        netWorth: netWorth
      };
    });
  }, [
    personalData.currentSalary, 
    personalData.savingsAccount,
    personalData.checkingAccount,
    personalData.hysaAccount,
    personalData.investments,
    personalData.iraTraditionalHoldings,
    personalData.iraRothHoldings,
    personalData.techStockHoldings,
    personalData.debtAmount,
    calculateAnnualExpenses
  ]);

  return {
    // State
    financials,
    salaryActionTaken,
    
    // State setters
    setFinancials,
    setSalaryActionTaken,
    updateFinancials
  };
};
