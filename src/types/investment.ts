export type InvestmentType = 'sp500' | 'tech' | 'treasuries' | 'bonds' | 'cash';

export type AccountType = 'personal' | 'ira-traditional' | 'ira-roth' | '401k-traditional' | '401k-roth';

export interface AccountHolding {
  investmentType: InvestmentType;
  shares: number;
  totalValue: number;
}

export interface InvestmentAccount {
  id: AccountType;
  name: string;
  description: string;
  totalValue: number;
  cashBalance: number; // Available cash in this investment account
  holdings: Record<InvestmentType, AccountHolding>;
  taxAdvantaged: boolean;
  contributionLimit?: number;
  penaltyAge?: number;
}

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  symbol: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  annualReturn: number;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  category: string;
}

export interface TransactionHistory {
  id: string;
  type: 'buy' | 'sell';
  accountId: AccountType;
  investmentId: string;
  investmentName: string;
  shares: number;
  price: number;
  total: number;
  date: Date;
}

export interface PortfolioData {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  contributions: number;
  gains: number;
}
