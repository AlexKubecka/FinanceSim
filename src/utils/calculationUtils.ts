// Financial calculation utilities for testing
export interface PersonalData {
  state: string;
  currentSalary: number;
  monthlyRent?: number;
  weeklyGroceries?: number;
  contributions401kTraditional: number;
  contributions401kRoth: number;
  iraTraditionalContribution: number;
  iraRothContribution: number;
  savingsAccount: number;
  checkingAccount: number;
  hysaAccount: number;
  investments: number;
  techStockHoldings: number;
  iraTraditionalHoldings: number;
  iraRothHoldings: number;
  debtAmount: number;
  age: number;
}

export interface TaxInfo {
  totalTax: number;
  afterTaxIncome: number;
  effectiveRate: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  miscDeductions: number;
  contribution401kTraditional: number;
  contribution401kRoth: number;
  totalContribution401k: number;
  taxableIncome: number;
}

// Mock state data for testing
export const mockStateRentData: Record<string, number> = {
  'California': 2500,
  'Texas': 1500,
  'New York': 2200,
  'Florida': 1800,
};

export const mockStateGroceryData: Record<string, number> = {
  'California': 150,
  'Texas': 120,
  'New York': 140,
  'Florida': 130,
};

// Test utility functions
export const testGetCurrentRent = (state: string, customRent?: number): number => {
  if (customRent !== undefined && customRent !== null) {
    return customRent;
  }
  return mockStateRentData[state] ?? 0;
};

export const testGetCurrentGrocery = (state: string, customGrocery?: number): number => {
  if (customGrocery !== undefined && customGrocery !== null) {
    return customGrocery;
  }
  return mockStateGroceryData[state] ?? 0;
};

export const calculateAnnualExpenses = (personalData: PersonalData): number => {
  const monthlyRent = testGetCurrentRent(personalData.state, personalData.monthlyRent);
  const annualRent = monthlyRent * 12;
  
  const weeklyGroceries = testGetCurrentGrocery(personalData.state, personalData.weeklyGroceries);
  const annualGrocery = weeklyGroceries * 52;
  
  return annualRent + annualGrocery;
};

export const calculateTaxes = (
  annualSalary: number, 
  state: string = 'California', 
  contribution401kTraditional: number = 0, 
  contribution401kRoth: number = 0
): TaxInfo => {
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
      contribution401kTraditional,
      contribution401kRoth,
      totalContribution401k: contribution401kTraditional + contribution401kRoth,
      taxableIncome: 0
    };
  }

  // Calculate taxable income (after pre-tax 401k contributions)
  const taxableIncome = Math.max(0, annualSalary - contribution401kTraditional);
  
  // 2025 Federal Tax Brackets (Single)
  let federalTax = 0;
  const brackets = [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197050, rate: 0.24 },
    { min: 197050, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 }
  ];

  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
      federalTax += taxableInBracket * bracket.rate;
    }
  }

  // State taxes (simplified - flat rates for testing)
  const stateTaxRates: Record<string, number> = {
    'California': 0.08,
    'Texas': 0.00,
    'New York': 0.065,
    'Florida': 0.00,
  };
  const stateTax = taxableIncome * (stateTaxRates[state] ?? 0.05);

  // FICA taxes (on full salary, not reduced by 401k)
  const socialSecurity = Math.min(annualSalary, 176100) * 0.062; // 2025 SS wage base
  const medicare = annualSalary * 0.0145;

  const totalTax = federalTax + stateTax + socialSecurity + medicare;
  const afterTaxIncome = annualSalary - totalTax - contribution401kRoth; // Roth is after-tax
  const effectiveRate = (totalTax / annualSalary) * 100;

  return {
    totalTax,
    afterTaxIncome,
    effectiveRate,
    federalTax,
    stateTax,
    socialSecurity,
    medicare,
    miscDeductions: 0,
    contribution401kTraditional,
    contribution401kRoth,
    totalContribution401k: contribution401kTraditional + contribution401kRoth,
    taxableIncome
  };
};

export const calculateNetWorth = (personalData: PersonalData): number => {
  const totalInvestmentValue = personalData.investments + 
    (personalData.iraTraditionalHoldings || 0) + 
    (personalData.iraRothHoldings || 0) +
    (personalData.techStockHoldings || 0);
  
  const totalBankBalance = (personalData.savingsAccount ?? 0) + 
                          (personalData.checkingAccount ?? 0) + 
                          (personalData.hysaAccount ?? 0);
  
  const totalAssets = totalBankBalance + totalInvestmentValue;
  const totalLiabilities = personalData.debtAmount;
  
  return totalAssets - totalLiabilities;
};

export const calculateMonthlyBudget = (personalData: PersonalData): {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNetCashFlow: number;
  monthlyInvestments: number;
} => {
  const taxInfo = calculateTaxes(
    personalData.currentSalary, 
    personalData.state,
    personalData.currentSalary * personalData.contributions401kTraditional / 100,
    personalData.currentSalary * personalData.contributions401kRoth / 100
  );
  
  const monthlyIncome = taxInfo.afterTaxIncome / 12;
  const annualExpenses = calculateAnnualExpenses(personalData);
  const monthlyExpenses = annualExpenses / 12;
  
  const monthlyTraditionalIra = personalData.iraTraditionalContribution / 12;
  const monthlyRothIra = personalData.iraRothContribution / 12;
  const monthlyInvestments = monthlyTraditionalIra + monthlyRothIra;
  
  const monthlyNetCashFlow = monthlyIncome - monthlyExpenses - monthlyInvestments;
  
  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyNetCashFlow,
    monthlyInvestments
  };
};
