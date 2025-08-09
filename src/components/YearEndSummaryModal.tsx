import React from 'react';
import { X, TrendingUp, Award, Lightbulb, Calendar, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { YearlySummary } from '../types/yearlySummary';

interface YearEndSummaryModalProps {
  summary: YearlySummary;
  allYearlySummaries: YearlySummary[]; // Add historical data for chart
  isOpen: boolean;
  onClose: () => void;
  onContinueSimulation: () => void;
  onViewFullReport?: () => void;
}

export const YearEndSummaryModal: React.FC<YearEndSummaryModalProps> = ({
  summary,
  allYearlySummaries,
  isOpen,
  onClose,
  onContinueSimulation,
  onViewFullReport
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Prepare chart data
  const chartData = React.useMemo(() => {
    // Start with Year 0 (starting point)
    const data = [{
      year: 0,
      netWorth: allYearlySummaries.length > 0 ? allYearlySummaries[0].financial.startingNetWorth : 0,
      age: summary.age - summary.year
    }];
    
    // Add all completed years
    allYearlySummaries.forEach((yearSummary) => {
      data.push({
        year: yearSummary.year,
        netWorth: yearSummary.financial.endingNetWorth,
        age: yearSummary.age
      });
    });

    return data;
  }, [allYearlySummaries, summary.age, summary.year]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Year {summary.year} Summary</h2>
              <p className="text-gray-600">Age {summary.age} • Financial Year in Review</p>
              {/* Simulation paused indicator */}
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-orange-600 font-medium">Simulation Paused</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-800">Net Worth Growth</h3>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(summary.financial.netWorthChange)}
              </p>
              <p className="text-sm text-green-700">
                {formatPercentage(summary.financial.netWorthChangePercentage)} growth
              </p>
              <p className="text-xs text-green-600 mt-1">
                Now worth {formatCurrency(summary.financial.endingNetWorth)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="h-6 w-6 bg-blue-600 rounded mr-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                <h3 className="font-semibold text-blue-800">Cash Saved</h3>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {formatCurrency(summary.financial.cashFlowToSavings)}
              </p>
              <p className="text-sm text-blue-700">Annual surplus</p>
              <p className="text-xs text-blue-600 mt-1">
                Total cash: {formatCurrency(summary.financial.bankAccounts.totalCash)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="h-6 w-6 bg-purple-600 rounded mr-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">%</span>
                </div>
                <h3 className="font-semibold text-purple-800">Interest Earned</h3>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {formatCurrency(summary.financial.interestEarned.total)}
              </p>
              <p className="text-sm text-purple-700">From bank accounts</p>
              <p className="text-xs text-purple-600 mt-1">
                HYSA: {formatCurrency(summary.financial.interestEarned.hysa)}
              </p>
            </div>
          </div>

          {/* Net Worth Growth Chart */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">📈 Net Worth Growth Over Time</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Net Worth', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name === 'netWorth' ? 'Net Worth' : name]}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netWorth" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-sm text-gray-600 text-center">
              {chartData.length > 1 && (
                <span>
                  Total growth: {formatCurrency(chartData[chartData.length - 1].netWorth - chartData[0].netWorth)} 
                  {chartData.length > 2 && ` over ${chartData.length - 1} years`}
                </span>
              )}
            </div>
          </div>

          {/* Financial Flow Summary */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Where Your Money Went</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Income & Cash Flow</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Take-Home Pay:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(summary.financial.takeHomePay)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Living Expenses:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(summary.financial.totalExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investment Contributions:</span>
                    <span className="font-medium text-blue-600">
                      -{formatCurrency(summary.financial.totalInvestmentContributions)}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-700">Net Cash Flow:</span>
                    <span className={summary.financial.cashFlowToSavings >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(summary.financial.cashFlowToSavings)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Account Balances</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Savings Account:</span>
                    <span className="font-medium">
                      {formatCurrency(summary.financial.bankAccounts.savings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Checking Account:</span>
                    <span className="font-medium">
                      {formatCurrency(summary.financial.bankAccounts.checking)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">HYSA:</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(summary.financial.bankAccounts.hysa)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Investments:</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(summary.financial.investments.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          {summary.achievements.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Award className="h-6 w-6 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-orange-800">🏆 Achievements This Year</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {summary.achievements.slice(0, 4).map((achievement) => (
                  <div key={achievement.id} className="flex items-start space-x-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <h4 className="font-medium text-orange-800">{achievement.title}</h4>
                      <p className="text-sm text-orange-700">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Recommendations */}
          {summary.recommendations.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Lightbulb className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">💡 Smart Recommendations</h3>
              </div>
              <div className="space-y-4">
                {summary.recommendations
                  .filter(rec => rec.priority === 'high')
                  .slice(0, 2)
                  .map((recommendation) => (
                    <div key={recommendation.id} className="flex items-start space-x-3">
                      <span className="text-xl">{recommendation.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-800">{recommendation.title}</h4>
                        <p className="text-sm text-blue-700">{recommendation.description}</p>
                        {recommendation.actionable && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            Actionable
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Economic Context */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 Economic Context</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600">Inflation Rate</p>
                <p className="font-semibold text-orange-600">
                  {(summary.economic.inflationRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Stock Market</p>
                <p className={`font-semibold ${summary.economic.stockMarketGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(summary.economic.stockMarketGrowth * 100)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Economic Cycle</p>
                <p className="font-semibold text-purple-600 capitalize">
                  {summary.economic.economicCycle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Your simulation is paused. Use ✖ to close and keep paused, or "Continue Simulation" to resume.
          </p>
          <div className="flex space-x-3">
            {onViewFullReport && (
              <button
                onClick={onViewFullReport}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <span>View Full Report</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            )}
            <button
              onClick={onContinueSimulation}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Continue Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
