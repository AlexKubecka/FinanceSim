import { useState, useEffect, useCallback, useMemo } from 'react';

export interface InvestmentInputs {
  initialAmount: number;
  monthlyContribution: number;
  annualReturn: number;
  timeHorizon: number;
}

export interface InvestmentResult {
  year: number;
  balance: number;
  contributions: number;
  earnings: number;
  totalContributions: number;
}

export interface FinalInvestmentResult {
  totalBalance: number;
  totalContributions: number;
  totalEarnings: number;
}

export const useInvestmentCalculations = (inputs: InvestmentInputs) => {
  const [results, setResults] = useState<InvestmentResult[]>([]);
  
  const calculateInvestment = useCallback(() => {
    const { initialAmount, monthlyContribution, annualReturn, timeHorizon } = inputs;
    const monthlyRate = annualReturn / 100 / 12;
    const results: InvestmentResult[] = [];
    
    let balance = initialAmount;
    let totalContributions = initialAmount;
    
    // Add year 0
    results.push({
      year: 0,
      balance: initialAmount,
      contributions: initialAmount,
      earnings: 0,
      totalContributions: initialAmount
    });

    // Optimize calculation with efficient loops
    for (let year = 1; year <= timeHorizon; year++) {
      let yearContributions = 0;
      
      // Calculate monthly growth and contributions
      for (let month = 1; month <= 12; month++) {
        // Add monthly contribution
        balance += monthlyContribution;
        yearContributions += monthlyContribution;
        totalContributions += monthlyContribution;
        
        // Apply monthly growth
        balance *= (1 + monthlyRate);
      }
      
      const earnings = balance - totalContributions;
      
      results.push({
        year,
        balance: Math.round(balance),
        contributions: Math.round(yearContributions),
        earnings: Math.round(earnings),
        totalContributions: Math.round(totalContributions)
      });
    }
    
    setResults(results);
  }, [inputs]);

  useEffect(() => {
    calculateInvestment();
  }, [calculateInvestment]);

  // Memoize final result calculation
  const finalResult = useMemo((): FinalInvestmentResult => {
    if (results.length === 0) {
      return { totalBalance: 0, totalContributions: 0, totalEarnings: 0 };
    }
    
    const final = results[results.length - 1];
    return {
      totalBalance: final.balance,
      totalContributions: final.totalContributions,
      totalEarnings: final.earnings
    };
  }, [results]);

  // Memoize chart data preparation
  const chartData = useMemo(() => 
    results.map(result => ({
      year: result.year,
      'Total Balance': result.balance,
      'Total Contributions': result.totalContributions,
      'Investment Earnings': result.earnings
    })), [results]
  );

  return {
    results,
    finalResult,
    chartData,
    recalculate: calculateInvestment
  };
};
