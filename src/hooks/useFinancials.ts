import { useState, useEffect } from 'react';
import { PersonalFinancialData } from '../types/simulation';

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

  // Update financials effect - only recalculate when salary or savings change
  useEffect(() => {
    const annualExpenses = calculateAnnualExpenses();
    
    setFinancials(prev => {
      // Calculate proper net worth: Assets - Liabilities
      // Net worth = Cash savings + Investment accounts + 401k balance - Debt
      const netWorth = personalData.savings + prev.investmentAccountValue; // No debt currently tracked
      
      return {
        ...prev,
        currentSalary: personalData.currentSalary,
        annualExpenses: annualExpenses,
        netWorth: netWorth
      };
    });
  }, [personalData.currentSalary, personalData.savings]);

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
