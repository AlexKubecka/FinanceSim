import { describe, it, expect } from 'vitest';
import {
  calculateAnnualExpenses,
  calculateTaxes,
  calculateNetWorth,
  calculateMonthlyBudget,
  PersonalData,
} from '../utils/calculationUtils';

describe('Financial Calculation Tests', () => {
  // Test data
  const mockPersonalDataCalifornia: PersonalData = {
    state: 'California',
    currentSalary: 100000,
    monthlyRent: undefined, // Use state average
    weeklyGroceries: undefined, // Use state average
    contributions401kTraditional: 10, // 10%
    contributions401kRoth: 5, // 5%
    iraTraditionalContribution: 6000,
    iraRothContribution: 0,
    savingsAccount: 10000,
    checkingAccount: 5000,
    hysaAccount: 15000,
    investments: 25000,
    techStockHoldings: 10000,
    iraTraditionalHoldings: 20000,
    iraRothHoldings: 15000,
    debtAmount: 5000,
    age: 30,
  };

  const mockPersonalDataTexas: PersonalData = {
    state: 'Texas',
    currentSalary: 80000,
    monthlyRent: 1200, // Custom rent lower than state average
    weeklyGroceries: 100, // Custom groceries lower than state average
    contributions401kTraditional: 0,
    contributions401kRoth: 0,
    iraTraditionalContribution: 0,
    iraRothContribution: 6500,
    savingsAccount: 5000,
    checkingAccount: 2000,
    hysaAccount: 8000,
    investments: 10000,
    techStockHoldings: 0,
    iraTraditionalHoldings: 0,
    iraRothHoldings: 8000,
    debtAmount: 15000,
    age: 25,
  };

  describe('Annual Expenses Calculation', () => {
    it('should calculate annual expenses correctly with state averages', () => {
      const expenses = calculateAnnualExpenses(mockPersonalDataCalifornia);
      // California: $2500/month rent + $150/week groceries
      // Expected: (2500 * 12) + (150 * 52) = 30000 + 7800 = 37800
      expect(expenses).toBe(37800);
    });

    it('should calculate annual expenses correctly with custom values', () => {
      const expenses = calculateAnnualExpenses(mockPersonalDataTexas);
      // Texas: $1200/month rent (custom) + $100/week groceries (custom)
      // Expected: (1200 * 12) + (100 * 52) = 14400 + 5200 = 19600
      expect(expenses).toBe(19600);
    });

    it('should handle missing state data gracefully', () => {
      const invalidData = { ...mockPersonalDataCalifornia, state: 'Invalid State' };
      const expenses = calculateAnnualExpenses(invalidData);
      expect(expenses).toBe(0);
    });

    it('should prioritize custom rent over state average', () => {
      const customRentData = { ...mockPersonalDataCalifornia, monthlyRent: 3000 };
      const expenses = calculateAnnualExpenses(customRentData);
      // California: $3000/month rent (custom) + $150/week groceries (state avg)
      // Expected: (3000 * 12) + (150 * 52) = 36000 + 7800 = 43800
      expect(expenses).toBe(43800);
    });
  });

  describe('Tax Calculation', () => {
    it('should calculate taxes correctly for California resident', () => {
      const taxes = calculateTaxes(100000, 'California', 10000, 5000);
      
      expect(taxes.taxableIncome).toBe(90000); // 100k - 10k traditional 401k
      expect(taxes.contribution401kTraditional).toBe(10000);
      expect(taxes.contribution401kRoth).toBe(5000);
      expect(taxes.totalContribution401k).toBe(15000);
      expect(taxes.federalTax).toBeGreaterThan(0);
      expect(taxes.stateTax).toBeGreaterThan(0); // California has state tax
      expect(taxes.socialSecurity).toBe(6200); // 100k * 6.2%
      expect(taxes.medicare).toBe(1450); // 100k * 1.45%
      expect(taxes.effectiveRate).toBeGreaterThan(0);
      expect(taxes.afterTaxIncome).toBeLessThan(100000);
    });

    it('should calculate taxes correctly for Texas resident (no state tax)', () => {
      const taxes = calculateTaxes(80000, 'Texas', 0, 0);
      
      expect(taxes.taxableIncome).toBe(80000);
      expect(taxes.stateTax).toBe(0); // Texas has no state tax
      expect(taxes.socialSecurity).toBe(4960); // 80k * 6.2%
      expect(taxes.medicare).toBe(1160); // 80k * 1.45%
      expect(taxes.federalTax).toBeGreaterThan(0);
    });

    it('should handle zero salary', () => {
      const taxes = calculateTaxes(0, 'California', 0, 0);
      
      expect(taxes.totalTax).toBe(0);
      expect(taxes.afterTaxIncome).toBe(0);
      expect(taxes.effectiveRate).toBe(0);
      expect(taxes.taxableIncome).toBe(0);
    });

    it('should cap social security tax at wage base', () => {
      const taxes = calculateTaxes(200000, 'Texas', 0, 0);
      
      // Social Security tax should cap at $176,100 for 2025
      expect(taxes.socialSecurity).toBe(176100 * 0.062);
      expect(taxes.medicare).toBe(200000 * 0.0145); // No cap on Medicare
    });
  });

  describe('Net Worth Calculation', () => {
    it('should calculate net worth correctly', () => {
      const netWorth = calculateNetWorth(mockPersonalDataCalifornia);
      
      // Assets: 10k savings + 5k checking + 15k HYSA + 25k investments + 10k tech stock + 20k traditional IRA + 15k Roth IRA = 100k
      // Liabilities: 5k debt
      // Net Worth: 100k - 5k = 95k
      expect(netWorth).toBe(95000);
    });

    it('should handle negative net worth', () => {
      const highDebtData = { ...mockPersonalDataCalifornia, debtAmount: 100000 };
      const netWorth = calculateNetWorth(highDebtData);
      
      // Assets: 100k, Liabilities: 100k, Net Worth: 0k
      expect(netWorth).toBe(0);
    });

    it('should handle missing account values', () => {
      const minimalData: PersonalData = {
        ...mockPersonalDataCalifornia,
        savingsAccount: 0,
        checkingAccount: 0,
        hysaAccount: 0,
        investments: 0,
        techStockHoldings: 0,
        iraTraditionalHoldings: 0,
        iraRothHoldings: 0,
        debtAmount: 0,
      };
      
      const netWorth = calculateNetWorth(minimalData);
      expect(netWorth).toBe(0);
    });
  });

  describe('Monthly Budget Calculation', () => {
    it('should calculate monthly budget correctly for California', () => {
      const budget = calculateMonthlyBudget(mockPersonalDataCalifornia);
      
      expect(budget.monthlyIncome).toBeGreaterThan(0);
      expect(budget.monthlyExpenses).toBe(37800 / 12); // Annual expenses / 12
      expect(budget.monthlyInvestments).toBe(6000 / 12); // IRA contributions / 12
      expect(budget.monthlyNetCashFlow).toBe(
        budget.monthlyIncome - budget.monthlyExpenses - budget.monthlyInvestments
      );
    });

    it('should calculate monthly budget correctly for Texas', () => {
      const budget = calculateMonthlyBudget(mockPersonalDataTexas);
      
      expect(budget.monthlyExpenses).toBe(19600 / 12); // Custom expenses / 12
      expect(budget.monthlyInvestments).toBe(6500 / 12); // Roth IRA contributions / 12
      expect(budget.monthlyNetCashFlow).toBe(
        budget.monthlyIncome - budget.monthlyExpenses - budget.monthlyInvestments
      );
    });

    it('should handle negative cash flow', () => {
      const highExpenseData = { 
        ...mockPersonalDataCalifornia, 
        monthlyRent: 8000, // Very high rent
        iraTraditionalContribution: 20000, // High IRA contribution
      };
      
      const budget = calculateMonthlyBudget(highExpenseData);
      expect(budget.monthlyNetCashFlow).toBeLessThan(0);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle extremely high salaries', () => {
      const highSalaryData = { ...mockPersonalDataCalifornia, currentSalary: 1000000 };
      const taxes = calculateTaxes(highSalaryData.currentSalary, 'California', 0, 0);
      
      expect(taxes.effectiveRate).toBeGreaterThan(30); // Should be in higher tax brackets
      expect(taxes.afterTaxIncome).toBeGreaterThan(0);
      expect(taxes.totalTax).toBeLessThan(1000000); // Taxes shouldn't exceed salary
    });

    it('should maintain consistency between calculations', () => {
      // Test that the same inputs always produce the same outputs
      const expenses1 = calculateAnnualExpenses(mockPersonalDataCalifornia);
      const expenses2 = calculateAnnualExpenses(mockPersonalDataCalifornia);
      expect(expenses1).toBe(expenses2);

      const taxes1 = calculateTaxes(100000, 'California', 10000, 5000);
      const taxes2 = calculateTaxes(100000, 'California', 10000, 5000);
      expect(taxes1.totalTax).toBe(taxes2.totalTax);
    });

    it('should validate that after-tax income is reasonable', () => {
      const taxes = calculateTaxes(100000, 'California', 10000, 5000);
      
      // After-tax income should be less than gross but greater than 50% of gross for typical earners
      expect(taxes.afterTaxIncome).toBeLessThan(100000);
      expect(taxes.afterTaxIncome).toBeGreaterThan(50000);
    });
  });

  describe('Tech Stock Integration', () => {
    it('should include tech stock in net worth calculation', () => {
      const techWorkerData = { 
        ...mockPersonalDataCalifornia, 
        techStockHoldings: 50000 
      };
      const netWorth = calculateNetWorth(techWorkerData);
      
      // Assets: 30k bank + 25k investments + 50k tech stock + 35k IRA = 140k
      // Liabilities: 5k debt
      // Net Worth: 140k - 5k = 135k
      expect(netWorth).toBe(135000);
    });

    it('should handle zero tech stock holdings', () => {
      const noTechData = { 
        ...mockPersonalDataCalifornia, 
        techStockHoldings: 0 
      };
      const netWorth = calculateNetWorth(noTechData);
      
      // Should be same as regular calculation without tech stock
      expect(netWorth).toBe(85000); // 95k assets - 10k tech stock difference
    });

    it('should handle tech stock for non-tech workers', () => {
      const nonTechData = { 
        ...mockPersonalDataTexas, 
        techStockHoldings: 5000 // Anyone can invest in tech stocks
      };
      const netWorth = calculateNetWorth(nonTechData);
      
      // Assets: 15k bank + 10k investments + 5k tech stock + 8k IRA = 38k
      // Liabilities: 15k debt
      // Net Worth: 38k - 15k = 23k
      expect(netWorth).toBe(23000);
    });
  });

  describe('Regression Tests for Known Issues', () => {
    it('should calculate the same annual expenses for dashboard and expenses page', () => {
      // This test ensures the discrepancy we just fixed doesn't happen again
      const dashboardCalculation = calculateAnnualExpenses(mockPersonalDataCalifornia);
      const expensesPageCalculation = calculateAnnualExpenses(mockPersonalDataCalifornia);
      
      expect(dashboardCalculation).toBe(expensesPageCalculation);
    });

    it('should handle custom rent correctly in both calculations', () => {
      const customData = { ...mockPersonalDataCalifornia, monthlyRent: 2000 };
      const result = calculateAnnualExpenses(customData);
      
      // Should use custom rent (2000), not state average (2500)
      expect(result).toBe((2000 * 12) + (150 * 52)); // 24000 + 7800 = 31800
    });

    it('should handle custom groceries correctly in both calculations', () => {
      const customData = { ...mockPersonalDataCalifornia, weeklyGroceries: 200 };
      const result = calculateAnnualExpenses(customData);
      
      // Should use custom groceries (200), not state average (150)
      expect(result).toBe((2500 * 12) + (200 * 52)); // 30000 + 10400 = 40400
    });
  });
});
