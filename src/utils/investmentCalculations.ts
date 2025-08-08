import { PersonalFinancialData } from '../types/simulation';

export interface InvestmentBreakdown {
  annual401kTraditional: number;
  annual401kRoth: number;
  employerMatch: number;
  annualTaxableInvestment: number;
  totalAnnualContributions: number;
  traditional401kBalance: number;
  roth401kBalance: number;
  traditionalIraBalance: number;
  rothIraBalance: number;
  taxableBalance: number;
}

/**
 * Calculate investment account balances and contributions
 * Centralizes the logic used across NetWorthPage and InvestmentsPage
 */
export const calculateInvestmentBreakdown = (
  personalData: PersonalFinancialData,
  currentInvestmentValue: number
): InvestmentBreakdown => {
  // Calculate annual contributions
  const annual401kTraditional = personalData.currentSalary * personalData.contributions401kTraditional / 100;
  const annual401kRoth = personalData.currentSalary * personalData.contributions401kRoth / 100;
  
  // Employer match always goes into traditional 401k (pre-tax)
  const employerMatch = Math.min(
    annual401kTraditional + annual401kRoth,
    personalData.currentSalary * personalData.match401k / 100
  );
  
  const annualTaxableInvestment = personalData.monthlyInvestment * 12;
  
  const totalAnnualContributions = annual401kTraditional + annual401kRoth + employerMatch + 
                                   personalData.iraTraditionalContribution + personalData.iraRothContribution + 
                                   annualTaxableInvestment;

  // Helper function to calculate account balance based on contribution proportion
  const calculateAccountBalance = (annualContribution: number, totalAnnualContributions: number) => {
    // If no starting investment value exists, all balances should be 0
    if (currentInvestmentValue === 0) return 0;
    if (annualContribution === 0 || totalAnnualContributions === 0) return 0;
    
    // Allocate the total investment value proportionally based on annual contributions
    const proportion = annualContribution / totalAnnualContributions;
    return currentInvestmentValue * proportion;
  };

  // Calculate individual account balances
  // Traditional 401k gets employee traditional contributions + ALL employer match
  const traditional401kBalance = calculateAccountBalance(
    annual401kTraditional + employerMatch, 
    totalAnnualContributions
  );
  
  // Roth 401k gets only employee Roth contributions, no employer match
  const roth401kBalance = calculateAccountBalance(
    annual401kRoth, 
    totalAnnualContributions
  );
  
  const traditionalIraBalance = calculateAccountBalance(
    personalData.iraTraditionalContribution, 
    totalAnnualContributions
  );
  
  const rothIraBalance = calculateAccountBalance(
    personalData.iraRothContribution, 
    totalAnnualContributions
  );
  
  const taxableBalance = calculateAccountBalance(
    annualTaxableInvestment, 
    totalAnnualContributions
  );

  return {
    annual401kTraditional,
    annual401kRoth,
    employerMatch,
    annualTaxableInvestment,
    totalAnnualContributions,
    traditional401kBalance,
    roth401kBalance,
    traditionalIraBalance,
    rothIraBalance,
    taxableBalance
  };
};
