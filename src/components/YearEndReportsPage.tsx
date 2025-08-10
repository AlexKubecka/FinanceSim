import React, { useState } from 'react';
import { FileText, TrendingUp, Calendar, Download, Filter, BarChart3 } from 'lucide-react';
import { YearlySummary } from '../types/yearlySummary';
import { calculateYearOverYearChanges } from '../utils/yearlySummaryGenerator';
import { SimulationControls } from './SimulationControls';
import { PersonalFinancialData, SimulationProgress } from '../types/simulation';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth' | 'bank' | 'reports';

interface YearEndReportsPageProps {
  // Core data
  personalData: PersonalFinancialData;
  
  // Simulation state
  hasStarted: boolean;
  simulationState: 'setup' | 'running' | 'paused' | 'completed';
  simulationProgress: SimulationProgress;
  
  // Reports data
  yearlySummaries: YearlySummary[];
  
  // Navigation and actions
  setCurrentMode: React.Dispatch<React.SetStateAction<SimulationMode>>;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  handleEditProfile: () => void;
}

export const YearEndReportsPage: React.FC<YearEndReportsPageProps> = ({
  personalData,
  hasStarted,
  simulationState,
  simulationProgress,
  yearlySummaries,
  setCurrentMode,
  startSimulation,
  pauseSimulation,
  resetSimulation,
  handleEditProfile
}) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(
    yearlySummaries.length > 0 ? yearlySummaries[yearlySummaries.length - 1].year : null
  );
  
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

  const selectedSummary = yearlySummaries.find(s => s.year === selectedYear);
  const previousSummary = selectedYear 
    ? yearlySummaries.find(s => s.year === selectedYear - 1)
    : undefined;

  const yearOverYearChanges = selectedSummary 
    ? calculateYearOverYearChanges(selectedSummary, previousSummary)
    : null;

  // Calculate portfolio performance
  const calculatePortfolioPerformance = () => {
    if (yearlySummaries.length < 2) return null;
    
    const firstYear = yearlySummaries[0];
    const lastYear = yearlySummaries[yearlySummaries.length - 1];
    
    const totalGrowth = lastYear.financial.endingNetWorth - firstYear.financial.startingNetWorth;
    const totalReturn = firstYear.financial.startingNetWorth > 0 
      ? (totalGrowth / firstYear.financial.startingNetWorth) * 100 
      : 0;
    
    const years = yearlySummaries.length;
    const annualizedReturn = years > 1 
      ? (Math.pow(lastYear.financial.endingNetWorth / firstYear.financial.startingNetWorth, 1/years) - 1) * 100
      : 0;

    return {
      totalGrowth,
      totalReturn,
      annualizedReturn,
      years
    };
  };

  const portfolioPerformance = calculatePortfolioPerformance();

  if (yearlySummaries.length === 0) {
    return (
      <div className="space-y-8">
        {/* Persistent Simulation Controls */}
        <SimulationControls
          hasStarted={hasStarted}
          simulationState={simulationState}
          simulationProgress={simulationProgress}
          personalData={personalData}
          onStart={startSimulation}
          onPause={pauseSimulation}
          onReset={resetSimulation}
          onEditProfile={handleEditProfile}
        />

        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentMode('personal')}
            className="flex items-center text-purple-600 hover:text-purple-800 mr-4"
          >
            ← Back to Dashboard
          </button>
          <FileText className="h-8 w-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Year-End Reports</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Reports Available</h2>
          <p className="text-gray-600 mb-6">
            Start and run your financial simulation for at least one year to generate yearly reports.
          </p>
          <button
            onClick={() => setCurrentMode('personal')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Start Simulation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Persistent Simulation Controls */}
      <SimulationControls
        hasStarted={hasStarted}
        simulationState={simulationState}
        simulationProgress={simulationProgress}
        personalData={personalData}
        onStart={startSimulation}
        onPause={pauseSimulation}
        onReset={resetSimulation}
        onEditProfile={handleEditProfile}
      />

      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentMode('personal')}
          className="flex items-center text-purple-600 hover:text-purple-800 mr-4"
        >
          ← Back to Dashboard
        </button>
        <FileText className="h-8 w-8 text-purple-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Year-End Reports</h1>
      </div>

      {/* Year Selector and Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <label className="text-sm font-medium text-gray-700">Select Year:</label>
            </div>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              {yearlySummaries.map(summary => (
                <option key={summary.year} value={summary.year}>
                  Year {summary.year} (Age {summary.age})
                </option>
              ))}
            </select>
          </div>
          
          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>

        {/* Portfolio Performance Summary */}
        {portfolioPerformance && (
          <div className="grid md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Growth</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(portfolioPerformance.totalGrowth)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Return</p>
              <p className="text-xl font-bold text-purple-600">
                {formatPercentage(portfolioPerformance.totalReturn)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Annualized Return</p>
              <p className="text-xl font-bold text-blue-600">
                {formatPercentage(portfolioPerformance.annualizedReturn)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Years Simulated</p>
              <p className="text-xl font-bold text-gray-700">
                {portfolioPerformance.years}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Year Details */}
      {selectedSummary && (
        <>
          {/* Financial Performance */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
              Year {selectedSummary.year} Financial Performance
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Net Worth</h3>
                <p className="text-3xl font-bold text-green-900">
                  {formatCurrency(selectedSummary.financial.endingNetWorth)}
                </p>
                <p className="text-sm text-green-700">
                  {formatPercentage(selectedSummary.financial.netWorthChangePercentage)} growth
                </p>
                {yearOverYearChanges && (
                  <p className="text-xs text-green-600 mt-1">
                    {formatCurrency(yearOverYearChanges.netWorth)} vs previous year
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Total Savings</h3>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(selectedSummary.financial.bankAccounts.totalCash)}
                </p>
                <p className="text-sm text-blue-700">
                  {formatCurrency(selectedSummary.financial.cashFlowToSavings)} added this year
                </p>
                {yearOverYearChanges && (
                  <p className="text-xs text-blue-600 mt-1">
                    {formatCurrency(yearOverYearChanges.savings)} vs previous year
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Total Investments</h3>
                <p className="text-3xl font-bold text-purple-900">
                  {formatCurrency(selectedSummary.financial.investments.total)}
                </p>
                <p className="text-sm text-purple-700">
                  {formatCurrency(selectedSummary.financial.totalInvestmentContributions)} contributed
                </p>
                {yearOverYearChanges && (
                  <p className="text-xs text-purple-600 mt-1">
                    {formatCurrency(yearOverYearChanges.investments)} vs previous year
                  </p>
                )}
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">💰 Cash Flow Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Take-Home Pay:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedSummary.financial.takeHomePay)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Living Expenses:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(selectedSummary.financial.totalExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investment Contributions:</span>
                    <span className="font-medium text-blue-600">
                      -{formatCurrency(selectedSummary.financial.totalInvestmentContributions)}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-700">Net Cash Flow:</span>
                    <span className={selectedSummary.financial.cashFlowToSavings >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(selectedSummary.financial.cashFlowToSavings)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">🏦 Account Balances</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Savings Account:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedSummary.financial.bankAccounts.savings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Checking Account:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedSummary.financial.bankAccounts.checking)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">HYSA:</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(selectedSummary.financial.bankAccounts.hysa)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest Earned:</span>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(selectedSummary.financial.interestEarned.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements and Recommendations */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Achievements */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                🏆 Achievements
              </h3>
              {selectedSummary.achievements.length > 0 ? (
                <div className="space-y-3">
                  {selectedSummary.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <span className="text-xl">{achievement.icon}</span>
                      <div>
                        <h4 className="font-medium text-yellow-800">{achievement.title}</h4>
                        <p className="text-sm text-yellow-700">{achievement.description}</p>
                        <span className="inline-block px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full mt-1 capitalize">
                          {achievement.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No achievements this year</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                💡 Recommendations
              </h3>
              {selectedSummary.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {selectedSummary.recommendations.map((recommendation) => (
                    <div key={recommendation.id} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-xl">{recommendation.icon}</span>
                      <div>
                        <h4 className="font-medium text-blue-800">{recommendation.title}</h4>
                        <p className="text-sm text-blue-700">{recommendation.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            recommendation.priority === 'high' ? 'bg-red-200 text-red-800' :
                            recommendation.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {recommendation.priority} priority
                          </span>
                          {recommendation.actionable && (
                            <span className="inline-block px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                              Actionable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recommendations this year</p>
              )}
            </div>
          </div>

          {/* Economic Context */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
              Economic Context
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Inflation Rate</h4>
                <p className="text-2xl font-bold text-orange-600">
                  {(selectedSummary.economic.inflationRate * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-orange-700">Annual inflation</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Stock Market</h4>
                <p className={`text-2xl font-bold ${selectedSummary.economic.stockMarketGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(selectedSummary.economic.stockMarketGrowth * 100)}
                </p>
                <p className="text-sm text-green-700">Annual return</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">Economic Cycle</h4>
                <p className="text-2xl font-bold text-purple-600 capitalize">
                  {selectedSummary.economic.economicCycle}
                </p>
                <p className="text-sm text-purple-700">Market phase</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
