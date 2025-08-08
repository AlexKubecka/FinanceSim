import React from 'react';
import { TrendingUp } from 'lucide-react';
import { PersonalFinancialData, SimulationState, SimulationProgress } from '../types/simulation';
import { getIraLimit, getMaxRothIraContribution } from '../utils/constants';
import { calculateInvestmentBreakdown } from '../utils/investmentCalculations';
import { SimulationControls } from './SimulationControls';

interface InvestmentsPageProps {
  data: PersonalFinancialData;
  setData: React.Dispatch<React.SetStateAction<PersonalFinancialData>>;
  navigate: (page: string) => void;
  formatCurrency: (amount: number) => string;
  hasStarted?: boolean;
  simulationState?: SimulationState;
  simulationProgress?: SimulationProgress;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onEditProfile?: () => void;
  financials?: {
    currentSalary: number;
    netWorth: number;
    annualExpenses: number;
    investments: number;
    investmentAccountValue: number;
  };
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ 
  data, 
  setData, 
  navigate, 
  formatCurrency,
  hasStarted,
  simulationState,
  simulationProgress,
  onStart,
  onPause,
  onReset,
  onEditProfile,
  financials
}) => {
  // Get the current total investment value - use financials.investmentAccountValue if available, otherwise fall back to data.investments
  const currentInvestmentValue = financials?.investmentAccountValue ?? data.investments;
  
  // Use centralized calculation for investment account breakdown
  const investmentBreakdown = calculateInvestmentBreakdown(data, currentInvestmentValue);
  return (
    <div className="space-y-8">
      {/* Persistent Simulation Controls */}
      <SimulationControls
        hasStarted={hasStarted || false}
        simulationState={simulationState || 'setup'}
        simulationProgress={simulationProgress || {
          currentDate: new Date(),
          startDate: new Date(),
          currentAge: 0,
          yearsElapsed: 0,
          monthsElapsed: 0,
          daysElapsed: 0,
          speedMultiplier: 1
        }}
        personalData={data}
        onStart={onStart || (() => {})}
        onPause={onPause || (() => {})}
        onReset={onReset || (() => {})}
        onEditProfile={onEditProfile || (() => {})}
      />
      
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('personal')}
          className="flex items-center text-purple-600 hover:text-purple-800 mr-4"
        >
          ← Back to Dashboard
        </button>
        <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Investment Planning</h1>
      </div>

      {/* Investment Portfolio Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <div className="w-1 h-8 bg-purple-600 rounded mr-3"></div>
          Investment Portfolio Summary
        </h2>
        
        {data.currentSalary > 0 ? (
          <div className="space-y-6">
            {/* Annual Contributions Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">401(k) Traditional</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(data.currentSalary * data.contributions401kTraditional / 100)}
                    </p>
                    <p className="text-sm text-gray-500">{data.contributions401kTraditional}% of salary</p>
                    <p className="text-xs text-gray-400">Annual contribution</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-lg font-semibold text-blue-800">
                      {formatCurrency(investmentBreakdown.traditional401kBalance)}
                    </p>
                    <p className="text-xs text-gray-500">Current balance</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">401(k) Roth</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-blue-400">
                      {formatCurrency(data.currentSalary * data.contributions401kRoth / 100)}
                    </p>
                    <p className="text-sm text-gray-500">{data.contributions401kRoth}% of salary</p>
                    <p className="text-xs text-gray-400">Annual contribution</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(investmentBreakdown.roth401kBalance)}
                    </p>
                    <p className="text-xs text-gray-500">Current balance</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Traditional IRA</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(data.iraTraditionalContribution)}
                    </p>
                    <p className="text-sm text-gray-500">Fixed amount</p>
                    <p className="text-xs text-gray-400">Annual contribution</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-lg font-semibold text-orange-700">
                      {formatCurrency(investmentBreakdown.traditionalIraBalance)}
                    </p>
                    <p className="text-xs text-gray-500">Current balance</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Roth IRA</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(data.iraRothContribution)}
                    </p>
                    <p className="text-sm text-gray-500">Fixed amount</p>
                    <p className="text-xs text-gray-400">Annual contribution</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-lg font-semibold text-purple-700">
                      {formatCurrency(investmentBreakdown.rothIraBalance)}
                    </p>
                    <p className="text-xs text-gray-500">Current balance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employer Match & Non-Retirement Investments */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Employer Match</h3>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(Math.min(
                      data.currentSalary * (data.contributions401kTraditional + data.contributions401kRoth) / 100,
                      data.currentSalary * data.match401k / 100
                    ))}
                  </p>
                  <p className="text-sm text-gray-500">Up to {data.match401k}% match</p>
                  <p className="text-xs text-gray-400">Free money!</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Monthly Investment</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(data.monthlyInvestment)}
                    </p>
                    <p className="text-sm text-gray-500">{formatCurrency(data.monthlyInvestment * 12)} annually</p>
                    <p className="text-xs text-gray-400">Non-retirement investing</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-lg font-semibold text-indigo-700">
                      {formatCurrency(investmentBreakdown.taxableBalance)}
                    </p>
                    <p className="text-xs text-gray-500">Taxable account balance</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Portfolio Value</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatCurrency(currentInvestmentValue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {data.currentSalary > 0 ? 
                        ((currentInvestmentValue / data.currentSalary) * 100).toFixed(1) + '% of salary'
                        : '0% of salary'
                      }
                    </p>
                    <p className="text-xs text-gray-400">Current total holdings</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-lg font-semibold text-purple-800">
                      {formatCurrency(
                        (data.currentSalary * (data.contributions401kTraditional + data.contributions401kRoth) / 100) +
                        Math.min(
                          data.currentSalary * (data.contributions401kTraditional + data.contributions401kRoth) / 100,
                          data.currentSalary * data.match401k / 100
                        ) +
                        data.iraTraditionalContribution +
                        data.iraRothContribution +
                        (data.monthlyInvestment * 12)
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Annual additions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Breakdown Visualization */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Annual Investment Breakdown</h3>
              <div className="space-y-4">
                {(() => {
                  // Use centralized calculation
                  const breakdown = investmentBreakdown;
                  const totalInvestment = breakdown.totalAnnualContributions;

                  if (totalInvestment === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>No investments configured yet</p>
                        <p className="text-sm mt-2">Set up your contributions to see the breakdown</p>
                      </div>
                    );
                  }

                  const investments = [
                    { name: '401(k) Traditional', amount: breakdown.annual401kTraditional, color: 'bg-blue-500', percentage: (breakdown.annual401kTraditional / totalInvestment) * 100 },
                    { name: '401(k) Roth', amount: breakdown.annual401kRoth, color: 'bg-blue-300', percentage: (breakdown.annual401kRoth / totalInvestment) * 100 },
                    { name: 'Employer Match', amount: breakdown.employerMatch, color: 'bg-green-500', percentage: (breakdown.employerMatch / totalInvestment) * 100 },
                    { name: 'Traditional IRA', amount: data.iraTraditionalContribution, color: 'bg-orange-500', percentage: (data.iraTraditionalContribution / totalInvestment) * 100 },
                    { name: 'Roth IRA', amount: data.iraRothContribution, color: 'bg-purple-500', percentage: (data.iraRothContribution / totalInvestment) * 100 },
                    { name: 'Monthly Investing', amount: breakdown.annualTaxableInvestment, color: 'bg-indigo-500', percentage: (breakdown.annualTaxableInvestment / totalInvestment) * 100 }
                  ].filter(investment => investment.amount > 0);

                  return (
                    <div className="space-y-4">
                      {/* Visual bar chart */}
                      <div className="flex h-8 rounded-lg overflow-hidden">
                        {investments.map((investment, index) => (
                          <div
                            key={index}
                            className={investment.color}
                            style={{ width: `${investment.percentage}%` }}
                            title={`${investment.name}: ${formatCurrency(investment.amount)} (${investment.percentage.toFixed(1)}%)`}
                          />
                        ))}
                      </div>

                      {/* Legend with amounts */}
                      <div className="grid md:grid-cols-3 gap-3">
                        {investments.map((investment, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded ${investment.color}`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800">{investment.name}</div>
                              <div className="text-xs text-gray-600">
                                {formatCurrency(investment.amount)} ({investment.percentage.toFixed(1)}%)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Lifetime totals */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Projected Lifetime Contributions</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-600">From age {data.age} to {data.retirementAge}</div>
                            <div className="text-lg font-bold text-gray-800">
                              {formatCurrency(totalInvestment * (data.retirementAge - data.age))}
                            </div>
                            <div className="text-xs text-gray-500">Total contributions over {data.retirementAge - data.age} years</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-600">Monthly investment rate</div>
                            <div className="text-lg font-bold text-gray-800">
                              {formatCurrency(totalInvestment / 12)}
                            </div>
                            <div className="text-xs text-gray-500">Average per month</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Salary Information</h3>
              <p className="text-sm text-gray-500 mb-4">
                Enter your salary information in the profile to see your investment breakdown
              </p>
              <button
                onClick={() => navigate('personal')}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Complete Profile Setup
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 401(k) Planning */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">401(k) Retirement Planning</h2>
        
        {/* Retirement Charts */}
        {data.currentSalary > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Retirement Contributions Breakdown Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Annual Retirement Contributions</h3>
              <div className="space-y-4">
                {(() => {
                  // Use centralized calculation
                  const breakdown = investmentBreakdown;
                  const yourTotalContribution = breakdown.annual401kTraditional + breakdown.annual401kRoth;
                  const employerMatch = breakdown.employerMatch;
                  const maxPossibleMatch = data.currentSalary * data.match401k / 100;
                  const missedMatch = maxPossibleMatch - employerMatch;
                  const totalContribution = yourTotalContribution + employerMatch;

                  if (totalContribution === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>No contributions yet</p>
                        <p className="text-sm mt-2">Start contributing to see breakdown</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Donut Chart Representation */}
                      <div className="flex items-center justify-center">
                        <div className="relative w-48 h-48">
                          <svg width="192" height="192" className="transform -rotate-90">
                            {/* Background circle */}
                            <circle
                              cx="96"
                              cy="96"
                              r="80"
                              stroke="#e5e7eb"
                              strokeWidth="16"
                              fill="transparent"
                            />
                            
                            {/* Your contribution arc */}
                            <circle
                              cx="96"
                              cy="96"
                              r="80"
                              stroke="#3b82f6"
                              strokeWidth="16"
                              fill="transparent"
                              strokeDasharray={`${(yourTotalContribution / totalContribution) * 502.65} 502.65`}
                              strokeDashoffset="0"
                            />
                            
                            {/* Employer match arc */}
                            <circle
                              cx="96"
                              cy="96"
                              r="80"
                              stroke="#10b981"
                              strokeWidth="16"
                              fill="transparent"
                              strokeDasharray={`${(employerMatch / totalContribution) * 502.65} 502.65`}
                              strokeDashoffset={`-${(yourTotalContribution / totalContribution) * 502.65}`}
                            />
                          </svg>
                          
                          {/* Center text */}
                          <div className="absolute inset-0 flex items-center justify-center text-center">
                            <div>
                              <div className="text-xl font-bold text-gray-800">
                                {formatCurrency(totalContribution)}
                              </div>
                              <div className="text-sm text-gray-600">Total Annual</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                          <span className="text-sm">
                            Your Traditional: {formatCurrency(breakdown.annual401kTraditional)} ({data.contributions401kTraditional}%)
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-300 rounded mr-3"></div>
                          <span className="text-sm">
                            Your Roth: {formatCurrency(breakdown.annual401kRoth)} ({data.contributions401kRoth}%)
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                          <span className="text-sm">
                            Employer Match: {formatCurrency(employerMatch)}
                          </span>
                        </div>
                        {missedMatch > 0 && (
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                            <span className="text-sm text-red-600">
                              Missed Match: {formatCurrency(missedMatch)} ⚠️
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Key stats */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalContribution * (data.retirementAge - data.age))}
                          </div>
                          <div className="text-sm text-gray-600">Total contributions by retirement</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {((totalContribution / data.currentSalary) * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Of current salary</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 401(k) Balance Projection Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">401(k) Growth Projection</h3>
              <div className="space-y-4">
                {(() => {
                  // Use centralized calculation
                  const breakdown = investmentBreakdown;
                  const annualContribution = breakdown.annual401kTraditional + breakdown.annual401kRoth;
                  const employerMatch = breakdown.employerMatch;
                  const totalAnnualContribution = annualContribution + employerMatch;
                  const yearsToRetirement = data.retirementAge - data.age;
                  const assumedReturn = data.riskTolerance === 'conservative' ? 0.06 : 
                                       data.riskTolerance === 'moderate' ? 0.08 : 0.10;

                  if (totalAnnualContribution === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>Start contributing to see projections</p>
                      </div>
                    );
                  }

                  // Calculate future value of annuity
                  const futureValue = totalAnnualContribution * (((1 + assumedReturn) ** yearsToRetirement - 1) / assumedReturn);
                  const totalContributions = totalAnnualContribution * yearsToRetirement;
                  const investmentGrowth = futureValue - totalContributions;

                  return (
                    <div className="space-y-6">
                      {/* Bar chart representation */}
                      <div className="relative h-64 bg-gray-100 rounded-lg p-4">
                        <div className="h-full flex items-end justify-center space-x-8">
                          {/* Current age bar */}
                          <div className="flex flex-col items-center">
                            <div className="bg-blue-500 w-8 rounded-t" style={{height: '20px'}}></div>
                            <span className="text-xs mt-2 text-center">Age {data.age}</span>
                            <span className="text-xs text-gray-600">$0</span>
                          </div>
                          
                          {/* Midpoint bar */}
                          <div className="flex flex-col items-center">
                            <div className="bg-blue-500 w-8 rounded-t" style={{height: `${Math.min((futureValue / 2) / futureValue * 200, 200)}px`}}></div>
                            <span className="text-xs mt-2 text-center">Age {Math.round((data.age + data.retirementAge) / 2)}</span>
                            <span className="text-xs text-gray-600">{formatCurrency(futureValue / 2)}</span>
                          </div>
                          
                          {/* Retirement bar */}
                          <div className="flex flex-col items-center">
                            <div className="bg-green-500 w-8 rounded-t" style={{height: '200px'}}></div>
                            <span className="text-xs mt-2 text-center">Age {data.retirementAge}</span>
                            <span className="text-xs text-gray-600 font-bold">{formatCurrency(futureValue)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium">Total Contributions</span>
                          <span className="font-bold text-blue-600">{formatCurrency(totalContributions)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="text-sm font-medium">Investment Growth</span>
                          <span className="font-bold text-green-600">{formatCurrency(investmentGrowth)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                          <span className="text-sm font-medium">Total at Retirement</span>
                          <span className="font-bold text-purple-600 text-lg">{formatCurrency(futureValue)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 text-center">
                        *Projection assumes {(assumedReturn * 100).toFixed(0)}% annual return ({data.riskTolerance} risk tolerance)
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Enter your salary information to see 401(k) planning details</p>
          </div>
        )}

        {/* 401(k) Configuration */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              401(k) Traditional Contribution (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={data.contributions401kTraditional}
              onChange={(e) => setData({...data, contributions401kTraditional: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <small className="text-gray-600">Pre-tax contribution</small>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              401(k) Roth Contribution (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={data.contributions401kRoth}
              onChange={(e) => setData({...data, contributions401kRoth: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <small className="text-gray-600">After-tax contribution</small>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Match (%)
            </label>
            <input
              type="number"
              min="0"
              max="15"
              step="0.25"
              value={data.match401k}
              onChange={(e) => setData({...data, match401k: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <small className="text-gray-600">Employer matches up to {data.match401k}%</small>
          </div>
        </div>
      </div>

      {/* IRA Section with Beautiful Design */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Individual Retirement Account (IRA)</h2>
        
        {/* IRA Charts */}
        {data.currentSalary > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* IRA Contribution Breakdown Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Annual IRA Contributions</h3>
              <div className="space-y-4">
                {(() => {
                  const iraLimit = getIraLimit(data.age);
                  const maxRothContribution = getMaxRothIraContribution(data.currentSalary, data.age, data.maritalStatus);
                  const totalIraContribution = data.iraTraditionalContribution + data.iraRothContribution;
                  const isOverLimit = totalIraContribution > iraLimit;
                  const isRothLimited = data.iraRothContribution > maxRothContribution;

                  if (totalIraContribution === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>No IRA contributions yet</p>
                        <p className="text-sm mt-2">Start contributing to see breakdown</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Bar Chart Representation */}
                      <div className="flex items-end justify-center space-x-4 h-40">
                        {/* Traditional IRA Bar */}
                        <div className="flex flex-col items-center">
                          <div 
                            className="bg-orange-500 w-12 rounded-t" 
                            style={{height: `${Math.min((data.iraTraditionalContribution / iraLimit) * 160, 160)}px`}}
                          />
                          <span className="text-xs mt-2 text-center">Traditional</span>
                          <span className="text-xs text-gray-600">{formatCurrency(data.iraTraditionalContribution)}</span>
                        </div>
                        
                        {/* Roth IRA Bar */}
                        <div className="flex flex-col items-center">
                          <div 
                            className="bg-purple-500 w-12 rounded-t" 
                            style={{height: `${Math.min((data.iraRothContribution / iraLimit) * 160, 160)}px`}}
                          />
                          <span className="text-xs mt-2 text-center">Roth</span>
                          <span className="text-xs text-gray-600">{formatCurrency(data.iraRothContribution)}</span>
                        </div>
                        
                        {/* Limit Line */}
                        <div className="flex flex-col items-center">
                          <div className="w-1 h-40 bg-gray-300 rounded" />
                          <span className="text-xs mt-2 text-center">Limit</span>
                          <span className="text-xs text-gray-600">{formatCurrency(iraLimit)}</span>
                        </div>
                      </div>

                      {/* Legend and Stats */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                          <span className="text-sm">
                            Traditional IRA: {formatCurrency(data.iraTraditionalContribution)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                          <span className="text-sm">
                            Roth IRA: {formatCurrency(data.iraRothContribution)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-300 rounded mr-3"></div>
                          <span className="text-sm">
                            {data.age >= 50 ? 'Age 50+' : 'Under 50'} Limit: {formatCurrency(iraLimit)}
                          </span>
                        </div>
                      </div>

                      {/* Warnings */}
                      {isRothLimited && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Roth IRA limited to {formatCurrency(maxRothContribution)} based on your income ({formatCurrency(data.currentSalary)})
                          </p>
                        </div>
                      )}
                      {isOverLimit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            ⚠️ Total IRA contribution exceeds annual limit!
                          </p>
                        </div>
                      )}
                      {maxRothContribution === 0 && data.iraRothContribution > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            ⚠️ Income too high for Roth IRA contributions
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* IRA Growth Projection Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">IRA Growth Projection</h3>
              <div className="space-y-4">
                {(() => {
                  const totalIraContribution = data.iraTraditionalContribution + data.iraRothContribution;
                  const yearsToRetirement = data.retirementAge - data.age;
                  const assumedReturn = data.riskTolerance === 'conservative' ? 0.06 : 
                                       data.riskTolerance === 'moderate' ? 0.08 : 0.10;

                  if (totalIraContribution === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>Start contributing to see IRA projections</p>
                      </div>
                    );
                  }

                  // Calculate future value of annuity
                  const futureValue = totalIraContribution * (((1 + assumedReturn) ** yearsToRetirement - 1) / assumedReturn);
                  const totalContributions = totalIraContribution * yearsToRetirement;
                  const investmentGrowth = futureValue - totalContributions;

                  return (
                    <div className="space-y-6">
                      {/* Projection Chart */}
                      <div className="relative h-64 bg-gradient-to-t from-purple-50 to-orange-50 rounded-lg p-4">
                        <div className="h-full flex items-end justify-center space-x-8">
                          {/* Current age */}
                          <div className="flex flex-col items-center">
                            <div className="bg-purple-500 w-8 rounded-t" style={{height: '20px'}}></div>
                            <span className="text-xs mt-2 text-center">Age {data.age}</span>
                            <span className="text-xs text-gray-600">$0</span>
                          </div>
                          
                          {/* Midpoint */}
                          <div className="flex flex-col items-center">
                            <div className="bg-purple-500 w-8 rounded-t" style={{height: `${Math.min((futureValue / 2) / futureValue * 200, 200)}px`}}></div>
                            <span className="text-xs mt-2 text-center">Age {Math.round((data.age + data.retirementAge) / 2)}</span>
                            <span className="text-xs text-gray-600">{formatCurrency(futureValue / 2)}</span>
                          </div>
                          
                          {/* Retirement */}
                          <div className="flex flex-col items-center">
                            <div className="bg-orange-500 w-8 rounded-t" style={{height: '200px'}}></div>
                            <span className="text-xs mt-2 text-center">Age {data.retirementAge}</span>
                            <span className="text-xs text-gray-600 font-bold">{formatCurrency(futureValue)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                          <span className="text-sm font-medium">Total IRA Contributions</span>
                          <span className="font-bold text-orange-600">{formatCurrency(totalContributions)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="text-sm font-medium">Investment Growth</span>
                          <span className="font-bold text-purple-600">{formatCurrency(investmentGrowth)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                          <span className="text-sm font-medium">Total IRA at Retirement</span>
                          <span className="font-bold text-indigo-600 text-lg">{formatCurrency(futureValue)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 text-center">
                        *Projection assumes {(assumedReturn * 100).toFixed(0)}% annual return ({data.riskTolerance} risk tolerance)
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Enter your salary information to see IRA planning details</p>
          </div>
        )}

        {/* IRA Configuration */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marital Status
            </label>
            <select
              value={data.maritalStatus}
              onChange={(e) => setData({...data, maritalStatus: e.target.value as 'single' | 'married-jointly' | 'married-separately'})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="single">Single</option>
              <option value="married-jointly">Married Filing Jointly</option>
              <option value="married-separately">Married Filing Separately</option>
            </select>
            <small className="text-gray-600">Affects Roth IRA income limits</small>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Traditional IRA Contribution (Annual)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={data.iraTraditionalContribution}
              onChange={(e) => setData({...data, iraTraditionalContribution: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <small className="text-gray-600">Tax-deductible contributions</small>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roth IRA Contribution (Annual)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={data.iraRothContribution}
              onChange={(e) => setData({...data, iraRothContribution: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <small className="text-gray-600">After-tax contributions</small>
          </div>
        </div>
      </div>

      {/* Additional Investment Strategy */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Investment Strategy</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Tolerance
            </label>
            <select
              value={data.riskTolerance}
              onChange={(e) => setData({...data, riskTolerance: e.target.value as 'conservative' | 'moderate' | 'aggressive'})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="conservative">Conservative (Lower risk, stable returns)</option>
              <option value="moderate">Moderate (Balanced risk/reward)</option>
              <option value="aggressive">Aggressive (Higher risk, higher potential)</option>
            </select>
            <small className="text-gray-600">Affects projected returns</small>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Investment (Non-retirement)
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={data.monthlyInvestment}
              onChange={(e) => setData({...data, monthlyInvestment: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <small className="text-gray-600">Additional investing beyond retirement accounts</small>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retirement Goal
            </label>
            <input
              type="number"
              min="0"
              step="50000"
              value={data.retirementGoal}
              onChange={(e) => setData({...data, retirementGoal: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <small className="text-gray-600">Target retirement savings</small>
          </div>
        </div>

        {/* Investment Recommendations */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Investment Recommendations</h3>
          <div className="space-y-2">
            {(data.contributions401kTraditional + data.contributions401kRoth) < data.match401k && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-sm text-blue-700">
                  <strong>Increase 401(k) contribution to {data.match401k}%</strong> to get full employer match. 
                  You're leaving {formatCurrency((data.currentSalary * data.match401k / 100) - Math.min(
                    data.currentSalary * (data.contributions401kTraditional + data.contributions401kRoth) / 100,
                    data.currentSalary * data.match401k / 100
                  ))} on the table!
                </p>
              </div>
            )}
            
            {(() => {
              const iraLimit = getIraLimit(data.age);
              const totalIraContribution = data.iraTraditionalContribution + data.iraRothContribution;
              const remainingIraRoom = iraLimit - totalIraContribution;
              
              if (remainingIraRoom > 0) {
                return (
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-sm text-blue-700">
                      You can contribute {formatCurrency(remainingIraRoom)} more to reach the IRA limit of {formatCurrency(iraLimit)}.
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-blue-700">
                Build an emergency fund of {formatCurrency((data.currentSalary / 12) * data.emergencyFundMonths)} 
                ({data.emergencyFundMonths} months expenses) before increasing investments.
              </p>
            </div>

            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-blue-700">
                Consider diversified index funds for your {data.riskTolerance} risk profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentsPage;
