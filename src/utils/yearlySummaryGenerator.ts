import { YearlySummary, Achievement, Recommendation } from '../types/yearlySummary';
import { HistoricalDataPoint, PersonalFinancialData, FinancialState, EconomicState, TaxCalculationResult } from '../types/simulation';
import { calculateInvestmentBreakdown } from './investmentCalculations';

export const generateYearlySummary = (
  currentYear: number,
  startingData: HistoricalDataPoint,
  endingData: HistoricalDataPoint,
  personalData: PersonalFinancialData,
  financialState: FinancialState,
  economicState: EconomicState,
  taxInfo: TaxCalculationResult,
  previousSummary?: YearlySummary
): YearlySummary => {
  
  // Calculate investment breakdown
  const investmentBreakdown = calculateInvestmentBreakdown(personalData, endingData.investments);
  
  // Calculate bank account totals
  const bankAccounts = {
    savings: personalData.savingsAccount ?? 0,
    checking: personalData.checkingAccount ?? 0,
    hysa: personalData.hysaAccount ?? 0,
    totalCash: (personalData.savingsAccount ?? 0) + (personalData.checkingAccount ?? 0) + (personalData.hysaAccount ?? 0)
  };
  
  // Calculate net worth change
  const netWorthChange = endingData.netWorth - startingData.netWorth;
  const netWorthChangePercentage = startingData.netWorth > 0 
    ? (netWorthChange / Math.abs(startingData.netWorth)) * 100 
    : 0;
  
  // Calculate interest earned this year
  const interestEarned = {
    savings: bankAccounts.savings * 0.0005, // 0.05% APY
    hysa: bankAccounts.hysa * 0.04, // 4% APY
    total: (bankAccounts.savings * 0.0005) + (bankAccounts.hysa * 0.04)
  };
  
  // Calculate cash flow (simplified - would need more detailed tracking in real implementation)
  const takeHomePay = taxInfo.afterTaxIncome || 0;
  const totalExpenses = financialState.annualExpenses || 0;
  const totalInvestmentContributions = (personalData.monthlyInvestment * 12) + 
    (personalData.iraTraditionalContribution || 0) + (personalData.iraRothContribution || 0);
  const cashFlowToSavings = takeHomePay - totalExpenses - totalInvestmentContributions;
  
  // Generate achievements
  const achievements = generateAchievements(
    endingData,
    bankAccounts,
    netWorthChange,
    personalData,
    previousSummary
  );
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    personalData,
    bankAccounts,
    investmentBreakdown,
    netWorthChange
  );
  
  return {
    year: currentYear,
    age: endingData.age,
    startDate: startingData.timestamp,
    endDate: endingData.timestamp,
    
    financial: {
      startingNetWorth: startingData.netWorth,
      endingNetWorth: endingData.netWorth,
      netWorthChange,
      netWorthChangePercentage,
      
      takeHomePay,
      totalExpenses,
      totalInvestmentContributions,
      cashFlowToSavings,
      
      bankAccounts,
      
      investments: {
        total: endingData.investments,
        traditional401k: investmentBreakdown.traditional401kBalance,
        roth401k: investmentBreakdown.roth401kBalance,
        traditionalIra: investmentBreakdown.traditionalIraBalance,
        rothIra: investmentBreakdown.rothIraBalance,
        taxable: investmentBreakdown.taxableBalance
      },
      
      interestEarned
    },
    
    achievements,
    recommendations,
    
    economic: {
      inflationRate: economicState.currentInflationRate,
      stockMarketGrowth: economicState.stockMarketGrowth,
      economicCycle: economicState.economicCycle
    }
  };
};

const generateAchievements = (
  endingData: HistoricalDataPoint,
  bankAccounts: any,
  netWorthChange: number,
  personalData: PersonalFinancialData,
  previousSummary?: YearlySummary
): Achievement[] => {
  const achievements: Achievement[] = [];
  
  // Net worth milestones
  const netWorthMilestones = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  for (const milestone of netWorthMilestones) {
    if (endingData.netWorth >= milestone && 
        (!previousSummary || previousSummary.financial.endingNetWorth < milestone)) {
      achievements.push({
        id: `networth_${milestone}`,
        title: `Net Worth Milestone!`,
        description: `Reached $${milestone.toLocaleString()} net worth`,
        category: 'milestone',
        icon: '🎯',
        value: milestone,
        isNewThisYear: true
      });
    }
  }
  
  // Positive net worth growth
  if (netWorthChange > 0) {
    achievements.push({
      id: 'positive_growth',
      title: 'Wealth Builder',
      description: `Increased net worth by $${netWorthChange.toLocaleString()}`,
      category: 'savings',
      icon: '📈',
      value: netWorthChange,
      isNewThisYear: true
    });
  }
  
  // Emergency fund milestones (3, 6, 12 months of expenses)
  const monthlyExpenses = (personalData.monthlyRent || 0) + ((personalData.weeklyGroceries || 0) * 4.33);
  const emergencyFundMonths = monthlyExpenses > 0 ? bankAccounts.totalCash / monthlyExpenses : 0;
  
  if (emergencyFundMonths >= 3 && 
      (!previousSummary || (previousSummary.financial.bankAccounts.totalCash / monthlyExpenses) < 3)) {
    achievements.push({
      id: 'emergency_fund_3',
      title: '3-Month Emergency Fund',
      description: 'Built a solid financial safety net',
      category: 'emergency_fund',
      icon: '🛡️',
      isNewThisYear: true
    });
  }
  
  // HYSA optimization
  if (bankAccounts.hysa > bankAccounts.savings + bankAccounts.checking) {
    achievements.push({
      id: 'hysa_optimizer',
      title: 'Rate Optimizer',
      description: 'Smart money placement in high-yield savings',
      category: 'optimization',
      icon: '🏆',
      isNewThisYear: true
    });
  }
  
  return achievements;
};

const generateRecommendations = (
  personalData: PersonalFinancialData,
  bankAccounts: any,
  investmentBreakdown: any,
  netWorthChange: number
): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  
  // HYSA recommendation
  if (bankAccounts.savings > 1000) {
    const potentialExtraInterest = (bankAccounts.savings * 0.04) - (bankAccounts.savings * 0.0005);
    recommendations.push({
      id: 'move_to_hysa',
      title: 'Maximize Your Interest',
      description: `Move $${bankAccounts.savings.toLocaleString()} from Savings to HYSA to earn $${potentialExtraInterest.toLocaleString()} more per year`,
      priority: 'high',
      category: 'optimization',
      actionable: true,
      icon: '💰'
    });
  }
  
  // Emergency fund recommendation
  const monthlyExpenses = (personalData.monthlyRent || 0) + ((personalData.weeklyGroceries || 0) * 4.33);
  const emergencyFundMonths = monthlyExpenses > 0 ? bankAccounts.totalCash / monthlyExpenses : 0;
  
  if (emergencyFundMonths < 3) {
    const needed = (monthlyExpenses * 3) - bankAccounts.totalCash;
    recommendations.push({
      id: 'build_emergency_fund',
      title: 'Build Emergency Fund',
      description: `Save $${needed.toLocaleString()} more to reach 3 months of expenses`,
      priority: 'high',
      category: 'strategy',
      actionable: true,
      icon: '🛡️'
    });
  }
  
  // Investment allocation recommendation
  const totalAssets = bankAccounts.totalCash + investmentBreakdown.totalBalance;
  const investmentRatio = totalAssets > 0 ? investmentBreakdown.totalBalance / totalAssets : 0;
  
  if (investmentRatio < 0.6 && emergencyFundMonths >= 3) {
    recommendations.push({
      id: 'increase_investments',
      title: 'Consider More Investing',
      description: 'With a solid emergency fund, consider increasing investment contributions',
      priority: 'medium',
      category: 'strategy',
      actionable: true,
      icon: '📊'
    });
  }
  
  // Economic cycle recommendation
  if (netWorthChange < 0) {
    recommendations.push({
      id: 'stay_course',
      title: 'Stay the Course',
      description: 'Market volatility is normal. Keep investing regularly for long-term growth',
      priority: 'medium',
      category: 'strategy',
      actionable: false,
      icon: '💪'
    });
  }
  
  return recommendations;
};

export const calculateYearOverYearChanges = (
  currentSummary: YearlySummary,
  previousSummary?: YearlySummary
) => {
  if (!previousSummary) {
    return {
      netWorth: currentSummary.financial.netWorthChange,
      savings: currentSummary.financial.bankAccounts.totalCash,
      investments: currentSummary.financial.investments.total,
      expenses: currentSummary.financial.totalExpenses
    };
  }
  
  return {
    netWorth: currentSummary.financial.endingNetWorth - previousSummary.financial.endingNetWorth,
    savings: currentSummary.financial.bankAccounts.totalCash - previousSummary.financial.bankAccounts.totalCash,
    investments: currentSummary.financial.investments.total - previousSummary.financial.investments.total,
    expenses: currentSummary.financial.totalExpenses - previousSummary.financial.totalExpenses
  };
};
