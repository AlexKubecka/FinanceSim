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

  // Total starting IRA holdings
  const totalStartingIraHoldings = (personalData.iraTraditionalHoldings || 0) + (personalData.iraRothHoldings || 0);
  
  // For initial calculation (when currentInvestmentValue equals starting investments + IRA holdings):
  // If currentInvestmentValue equals the sum of starting values, we're at the beginning
  const isInitialState = currentInvestmentValue === (personalData.investments + totalStartingIraHoldings);
  
  // Total investment value available for 401k and taxable accounts (excluding IRA starting balances)
  const non401kInvestmentValue = Math.max(0, currentInvestmentValue - totalStartingIraHoldings);

  // Helper function to calculate account balance based on contribution proportion
  const calculateAccountBalance = (annualContribution: number, totalAnnualContributions: number) => {
    // If we're in initial state and have no other investments, just return 0 for 401k/taxable
    if (isInitialState && personalData.investments === 0) return 0;
    
    // If no available investment value exists, all balances should be 0
    if (non401kInvestmentValue === 0) return 0;
    if (annualContribution === 0 || totalAnnualContributions === 0) return 0;
    
    // Allocate the available investment value proportionally based on annual contributions
    const proportion = annualContribution / totalAnnualContributions;
    return non401kInvestmentValue * proportion;
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
  
  // IRA balances: always show starting holdings, plus any allocated growth
  const traditionalIraBalance = (personalData.iraTraditionalHoldings || 0) + calculateAccountBalance(
    personalData.iraTraditionalContribution, 
    totalAnnualContributions
  );
  
  const rothIraBalance = (personalData.iraRothHoldings || 0) + calculateAccountBalance(
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
