import React from 'react';
import { Target, PiggyBank, TrendingUp } from 'lucide-react';
import { FinalInvestmentResult } from '../../hooks/useInvestmentCalculations';

interface InvestmentSummaryProps {
  finalResult: FinalInvestmentResult;
  formatCurrency: (amount: number) => string;
}

export const InvestmentSummaryCards: React.FC<InvestmentSummaryProps> = React.memo(({
  finalResult,
  formatCurrency
}) => {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center mb-2">
          <Target className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-700">Final Balance</span>
        </div>
        <div className="text-2xl font-bold text-green-800">
          {formatCurrency(finalResult.totalBalance)}
        </div>
      </div>

      <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center mb-2">
          <PiggyBank className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-700">Total Contributed</span>
        </div>
        <div className="text-2xl font-bold text-blue-800">
          {formatCurrency(finalResult.totalContributions)}
        </div>
      </div>

      <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center mb-2">
          <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
          <span className="text-sm font-medium text-purple-700">Investment Earnings</span>
        </div>
        <div className="text-2xl font-bold text-purple-800">
          {formatCurrency(finalResult.totalEarnings)}
        </div>
        <div className="text-xs text-purple-600 mt-1">
          {finalResult.totalContributions > 0 
            ? `${Math.round((finalResult.totalEarnings / finalResult.totalContributions) * 100)}% growth`
            : ''
          }
        </div>
      </div>
    </div>
  );
});
