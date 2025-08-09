// Yearly summary types for financial reporting
export interface YearlySummary {
  year: number;
  age: number;
  startDate: Date;
  endDate: Date;
  
  // Financial snapshots
  financial: {
    startingNetWorth: number;
    endingNetWorth: number;
    netWorthChange: number;
    netWorthChangePercentage: number;
    
    // Income and cash flow
    takeHomePay: number;
    totalExpenses: number;
    totalInvestmentContributions: number;
    cashFlowToSavings: number;
    
    // Account balances (end of year)
    bankAccounts: {
      savings: number;
      checking: number;
      hysa: number;
      totalCash: number;
    };
    
    investments: {
      total: number;
      traditional401k: number;
      roth401k: number;
      traditionalIra: number;
      rothIra: number;
      taxable: number;
    };
    
    // Interest earned
    interestEarned: {
      savings: number;
      hysa: number;
      total: number;
    };
  };
  
  // Key events and milestones
  achievements: Achievement[];
  
  // Smart recommendations based on financial behavior
  recommendations: Recommendation[];
  
  // Economic context
  economic: {
    inflationRate: number;
    stockMarketGrowth: number;
    economicCycle: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'savings' | 'investment' | 'debt' | 'milestone' | 'emergency_fund' | 'optimization';
  icon: string;
  value?: number;
  isNewThisYear: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'optimization' | 'strategy' | 'risk' | 'opportunity';
  actionable: boolean;
  icon: string;
}

// Utility type for year-over-year comparison
export interface YearOverYearComparison {
  currentYear: YearlySummary;
  previousYear?: YearlySummary;
  changes: {
    netWorth: number;
    savings: number;
    investments: number;
    expenses: number;
  };
}
