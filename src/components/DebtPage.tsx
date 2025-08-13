import React from 'react';
import { CreditCard, TrendingDown, Calendar, AlertTriangle, Target } from 'lucide-react';
import { PersonalFinancialData, SimulationProgress, HistoricalDataPoint } from '../types/simulation';
import { SimulationControls } from './SimulationControls';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth' | 'bank' | 'debt' | 'reports';

interface TaxInfo {
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

interface DebtPageProps {
  personalData: PersonalFinancialData;
  setPersonalData: (updater: (prev: PersonalFinancialData) => PersonalFinancialData) => void;
  setCurrentMode: React.Dispatch<React.SetStateAction<SimulationMode>>;
  currentAnnualExpenses: number;
  taxInfo: TaxInfo;
  hasStarted: boolean;
  simulationState: 'setup' | 'running' | 'paused' | 'completed';
  simulationProgress: SimulationProgress;
  historicalData: HistoricalDataPoint[];
  
  // Simulation controls
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onEditProfile: () => void;
}

export const DebtPage: React.FC<DebtPageProps> = ({
  personalData,
  setPersonalData,
  setCurrentMode,
  currentAnnualExpenses,
  taxInfo,
  hasStarted,
  simulationState,
  simulationProgress,
  historicalData,
  onStart,
  onPause,
  onReset,
  onEditProfile
}) => {
  // For now, we'll use the existing debtAmount and debtInterestRate fields
  // In the future, we can expand to support multiple debts
  const totalDebt = personalData.debtAmount || 0;
  const averageInterestRate = personalData.debtInterestRate || 0;

  // Calculate debt metrics
  const monthlyInterest = totalDebt * (averageInterestRate / 100) / 12;
  const minimumPayment = Math.max(totalDebt * 0.02, 25); // 2% of balance or $25 minimum
  const payoffTimeMonths = totalDebt > 0 && minimumPayment > monthlyInterest 
    ? Math.ceil(Math.log(1 + (totalDebt * (averageInterestRate / 100 / 12)) / (minimumPayment - monthlyInterest)) / Math.log(1 + (averageInterestRate / 100 / 12)))
    : 0;

  // Debt-to-income ratio (using current salary)
  const debtToIncomeRatio = personalData.currentSalary > 0 ? (totalDebt / personalData.currentSalary) * 100 : 0;

  const updateDebtAmount = (amount: number) => {
    setPersonalData(prev => ({
      ...prev,
      debtAmount: Math.max(0, amount)
    }));
  };

  const updateInterestRate = (rate: number) => {
    setPersonalData(prev => ({
      ...prev,
      debtInterestRate: Math.max(0, Math.min(50, rate)) // Cap at 50%
    }));
  };

  const getDebtRiskLevel = (ratio: number) => {
    if (ratio === 0) return { level: 'none', color: 'text-green-600', bg: 'bg-green-50' };
    if (ratio < 20) return { level: 'low', color: 'text-green-600', bg: 'bg-green-50' };
    if (ratio < 40) return { level: 'moderate', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'high', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const riskLevel = getDebtRiskLevel(debtToIncomeRatio);

  return (
    <div className="space-y-8">
      {/* Persistent Simulation Controls */}
      <SimulationControls
        hasStarted={hasStarted}
        simulationState={simulationState}
        simulationProgress={simulationProgress}
        personalData={personalData}
        onStart={onStart}
        onPause={onPause}
        onReset={onReset}
        onEditProfile={onEditProfile}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setCurrentMode('personal')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Debt Management</h1>
              <p className="text-gray-600">Track and manage your debts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-2">
            <CreditCard className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Total Debt</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">${totalDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          <p className="text-sm text-gray-500">Outstanding balance</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-2">
            <TrendingDown className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Monthly Interest</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">${monthlyInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          <p className="text-sm text-gray-500">Interest cost per month</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-2">
            <Calendar className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Payoff Time</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {payoffTimeMonths > 0 ? `${Math.floor(payoffTimeMonths / 12)}y ${payoffTimeMonths % 12}m` : 'N/A'}
          </p>
          <p className="text-sm text-gray-500">At minimum payments</p>
        </div>

        <div className={`rounded-lg shadow-lg p-6 ${riskLevel.bg}`}>
          <div className="flex items-center mb-2">
            <AlertTriangle className={`h-6 w-6 mr-2 ${riskLevel.color}`} />
            <h3 className="text-lg font-semibold text-gray-800">Debt Ratio</h3>
          </div>
          <p className={`text-3xl font-bold ${riskLevel.color}`}>{debtToIncomeRatio.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 capitalize">{riskLevel.level} risk</p>
        </div>
      </div>

      {/* Debt Input Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Debt Details</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Debt Amount</label>
            <input
              type="number"
              value={totalDebt || ''}
              onChange={(e) => updateDebtAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter total debt amount"
              className="w-full p-3 border border-gray-300 rounded-lg text-lg"
              min="0"
              step="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">Total outstanding debt balance</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Average Interest Rate (%)</label>
            <input
              type="number"
              value={averageInterestRate || ''}
              onChange={(e) => updateInterestRate(parseFloat(e.target.value) || 0)}
              placeholder="Enter average interest rate"
              className="w-full p-3 border border-gray-300 rounded-lg text-lg"
              min="0"
              max="50"
              step="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">Weighted average across all debts</p>
          </div>
        </div>
      </div>

      {/* Interactive Debt Payment Plans */}
      {totalDebt > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">💡 Debt Payment Plans</h2>
          
          {/* Payment Plan Selection */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Select Your Payment Plan:</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setPersonalData(prev => ({ ...prev, debtPaymentPlan: 'none' }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  personalData.debtPaymentPlan === 'none'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                🚫 No Payment Plan
              </button>
              <button
                onClick={() => setPersonalData(prev => ({ ...prev, debtPaymentPlan: '30-year' }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  personalData.debtPaymentPlan === '30-year'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-red-600 hover:bg-red-50 border border-red-300'
                }`}
              >
                🐌 30-Year Plan
              </button>
              <button
                onClick={() => setPersonalData(prev => ({ ...prev, debtPaymentPlan: '15-year' }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  personalData.debtPaymentPlan === '15-year'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-yellow-600 hover:bg-yellow-50 border border-yellow-300'
                }`}
              >
                ⚖️ 15-Year Plan
              </button>
              <button
                onClick={() => setPersonalData(prev => ({ ...prev, debtPaymentPlan: '5-year' }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  personalData.debtPaymentPlan === '5-year'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-green-600 hover:bg-green-50 border border-green-300'
                }`}
              >
                🚀 5-Year Plan
              </button>
            </div>
            
            {personalData.debtPaymentPlan !== 'none' && (
              <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  ✅ <strong>Active Plan:</strong> {
                    personalData.debtPaymentPlan === '30-year' ? '30-Year Plan - Debt payments will be deducted from your savings during simulation' :
                    personalData.debtPaymentPlan === '15-year' ? '15-Year Plan - Debt payments will be deducted from your savings during simulation' :
                    personalData.debtPaymentPlan === '5-year' ? '5-Year Plan - Debt payments will be deducted from your savings during simulation' :
                    'Custom Plan - Debt payments will be deducted from your savings during simulation'
                  }
                </p>
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Plan 1: 30-Year Plan */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🐌</span>
                </div>
                <h3 className="text-lg font-bold text-red-800">30-Year Plan</h3>
                <p className="text-sm text-red-600">Pay off debt over 30 years</p>
              </div>
              
              {(() => {
                const monthsIn30Years = 30 * 12; // 360 months
                const monthlyRate = averageInterestRate / 100 / 12;
                const payment30Year = totalDebt > 0 && monthlyRate > 0 
                  ? (totalDebt * monthlyRate * Math.pow(1 + monthlyRate, monthsIn30Years)) / (Math.pow(1 + monthlyRate, monthsIn30Years) - 1)
                  : totalDebt / monthsIn30Years;
                const totalInterest30Year = (payment30Year * monthsIn30Years) - totalDebt;
                
                return (
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Monthly Payment</p>
                      <p className="text-xl font-bold text-red-600">${payment30Year.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    </div>
                    
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Payoff Time</p>
                      <p className="text-lg font-bold text-red-800">30 years</p>
                    </div>
                    
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Total Interest</p>
                      <p className="text-lg font-bold text-red-800">
                        ${totalInterest30Year.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    
                    <div className="mt-4 p-2 bg-red-100 rounded text-center">
                      <p className="text-xs text-red-700">⚠️ Lowest payment but most interest paid</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Plan 2: 15-Year Plan */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">⚖️</span>
                </div>
                <h3 className="text-lg font-bold text-yellow-800">15-Year Plan</h3>
                <p className="text-sm text-yellow-600">Pay off debt over 15 years</p>
              </div>
              
              {(() => {
                const monthsIn15Years = 15 * 12; // 180 months
                const monthlyRate = averageInterestRate / 100 / 12;
                const payment15Year = totalDebt > 0 && monthlyRate > 0 
                  ? (totalDebt * monthlyRate * Math.pow(1 + monthlyRate, monthsIn15Years)) / (Math.pow(1 + monthlyRate, monthsIn15Years) - 1)
                  : totalDebt / monthsIn15Years;
                const totalInterest15Year = (payment15Year * monthsIn15Years) - totalDebt;
                const payment30Year = totalDebt > 0 && monthlyRate > 0 
                  ? (totalDebt * monthlyRate * Math.pow(1 + monthlyRate, 360)) / (Math.pow(1 + monthlyRate, 360) - 1)
                  : totalDebt / 360;
                const totalInterest30Year = (payment30Year * 360) - totalDebt;
                
                return (
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Monthly Payment</p>
                      <p className="text-xl font-bold text-yellow-600">${payment15Year.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    </div>
                    
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Payoff Time</p>
                      <p className="text-lg font-bold text-yellow-800">15 years</p>
                    </div>
                    
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Total Interest</p>
                      <p className="text-lg font-bold text-yellow-800">
                        ${totalInterest15Year.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    
                    <div className="mt-4 p-2 bg-yellow-100 rounded text-center">
                      <p className="text-xs text-yellow-700">
                        💰 Saves ${(totalInterest30Year - totalInterest15Year).toLocaleString('en-US', { maximumFractionDigits: 0 })} vs 30-year plan
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Plan 3: 5-Year Plan */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-lg font-bold text-green-800">5-Year Plan</h3>
                <p className="text-sm text-green-600">Pay off debt over 5 years</p>
              </div>
              
              {(() => {
                const monthsIn5Years = 5 * 12; // 60 months
                const monthlyRate = averageInterestRate / 100 / 12;
                const payment5Year = totalDebt > 0 && monthlyRate > 0 
                  ? (totalDebt * monthlyRate * Math.pow(1 + monthlyRate, monthsIn5Years)) / (Math.pow(1 + monthlyRate, monthsIn5Years) - 1)
                  : totalDebt / monthsIn5Years;
                const totalInterest5Year = (payment5Year * monthsIn5Years) - totalDebt;
                const payment30Year = totalDebt > 0 && monthlyRate > 0 
                  ? (totalDebt * monthlyRate * Math.pow(1 + monthlyRate, 360)) / (Math.pow(1 + monthlyRate, 360) - 1)
                  : totalDebt / 360;
                const totalInterest30Year = (payment30Year * 360) - totalDebt;
                
                return (
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Monthly Payment</p>
                      <p className="text-xl font-bold text-green-600">${payment5Year.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    </div>
                    
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Payoff Time</p>
                      <p className="text-lg font-bold text-green-800">5 years</p>
                    </div>
                    
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Total Interest</p>
                      <p className="text-lg font-bold text-green-800">
                        ${totalInterest5Year.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    
                    <div className="mt-4 p-2 bg-green-100 rounded text-center">
                      <p className="text-xs text-green-700">
                        🎯 Saves ${(totalInterest30Year - totalInterest5Year).toLocaleString('en-US', { maximumFractionDigits: 0 })} vs 30-year plan
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* Custom Payment Calculator */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4">🎛️ Custom Payment Calculator</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">Monthly Payment Amount</label>
                <input
                  type="number"
                  placeholder="Enter custom payment"
                  className="w-full p-3 border border-blue-300 rounded-lg"
                  min="1"
                  step="50"
                  onChange={(e) => {
                    const customPayment = parseFloat(e.target.value) || 0;
                    const monthlyRate = averageInterestRate / 100 / 12;
                    
                    if (customPayment > monthlyInterest && monthlyRate > 0) {
                      // Calculate months using amortization formula
                      const customMonths = Math.ceil(
                        -Math.log(1 - (totalDebt * monthlyRate) / customPayment) / Math.log(1 + monthlyRate)
                      );
                      const customInterest = (customPayment * customMonths) - totalDebt;
                      
                      // Compare with 30-year plan
                      const payment30Year = totalDebt > 0 && monthlyRate > 0 
                        ? (totalDebt * monthlyRate * Math.pow(1 + monthlyRate, 360)) / (Math.pow(1 + monthlyRate, 360) - 1)
                        : totalDebt / 360;
                      const totalInterest30Year = (payment30Year * 360) - totalDebt;
                      
                      // Update display dynamically
                      const resultDiv = document.getElementById('custom-result');
                      if (resultDiv) {
                        resultDiv.innerHTML = `
                          <div class="bg-white rounded p-4">
                            <div class="grid grid-cols-2 gap-4 text-center">
                              <div>
                                <p class="text-sm text-gray-600">Payoff Time</p>
                                <p class="text-lg font-bold text-blue-600">${Math.floor(customMonths / 12)}y ${customMonths % 12}m</p>
                              </div>
                              <div>
                                <p class="text-sm text-gray-600">Total Interest</p>
                                <p class="text-lg font-bold text-blue-600">$${customInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                              </div>
                            </div>
                            <div class="mt-3 p-2 bg-blue-100 rounded text-center">
                              <p class="text-xs text-blue-700">💡 Interest savings vs 30-year plan: $${(totalInterest30Year - customInterest).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                          </div>
                        `;
                      }
                    } else {
                      const resultDiv = document.getElementById('custom-result');
                      if (resultDiv) {
                        resultDiv.innerHTML = `
                          <div class="h-full flex items-center justify-center text-red-600">
                            <p class="text-sm">Payment must be greater than monthly interest ($${monthlyInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })})</p>
                          </div>
                        `;
                      }
                    }
                  }}
                />
                <p className="text-sm text-blue-600 mt-1">Minimum: $${monthlyInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })} (monthly interest)</p>
              </div>
              
              <div className="md:col-span-2">
                <div id="custom-result" className="h-full flex items-center justify-center text-blue-600">
                  <p className="text-sm">Enter a payment amount to see results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Analysis */}
      {totalDebt > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Debt Analysis</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Payment Scenarios</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">📊 Minimum Payment</h4>
                <p className="text-lg font-bold text-blue-600">${minimumPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}/month</p>
                <p className="text-sm text-gray-600">
                  Payoff time: {payoffTimeMonths > 0 ? `${Math.floor(payoffTimeMonths / 12)} years, ${payoffTimeMonths % 12} months` : 'Cannot pay off'}
                </p>
                <p className="text-sm text-gray-600">
                  Total interest: ${payoffTimeMonths > 0 ? ((minimumPayment * payoffTimeMonths) - totalDebt).toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'N/A'}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">🚀 Aggressive Payment</h4>
                {(() => {
                  const aggressivePayment = minimumPayment * 2;
                  const aggressiveMonths = totalDebt > 0 && aggressivePayment > monthlyInterest 
                    ? Math.ceil(Math.log(1 + (totalDebt * (averageInterestRate / 100 / 12)) / (aggressivePayment - monthlyInterest)) / Math.log(1 + (averageInterestRate / 100 / 12)))
                    : 0;
                  return (
                    <>
                      <p className="text-lg font-bold text-green-600">${aggressivePayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}/month</p>
                      <p className="text-sm text-gray-600">
                        Payoff time: {aggressiveMonths > 0 ? `${Math.floor(aggressiveMonths / 12)} years, ${aggressiveMonths % 12} months` : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Interest saved: ${payoffTimeMonths > 0 && aggressiveMonths > 0 ? (((minimumPayment * payoffTimeMonths) - totalDebt) - ((aggressivePayment * aggressiveMonths) - totalDebt)).toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'N/A'}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Debt Strategy Tips</h3>
              
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800 text-sm">💡 Debt Avalanche</h4>
                  <p className="text-sm text-blue-700">Pay minimums on all debts, extra on highest interest rate</p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm">⚡ Debt Snowball</h4>
                  <p className="text-sm text-purple-700">Pay minimums on all debts, extra on smallest balance</p>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 text-sm">🔄 Balance Transfer</h4>
                  <p className="text-sm text-yellow-700">Consider 0% APR cards for high-interest debt</p>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm">📈 Side Income</h4>
                  <p className="text-sm text-green-700">Use extra income exclusively for debt payments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Guidelines */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Healthy Debt Guidelines</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Good (0-20%)</h3>
            <p className="text-sm text-gray-600">Manageable debt load with good repayment capacity</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Caution (20-40%)</h3>
            <p className="text-sm text-gray-600">Monitor closely and avoid taking on more debt</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">High Risk (40%+)</h3>
            <p className="text-sm text-gray-600">Focus on debt reduction before new investments</p>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-dashed border-blue-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🚀 Coming Soon</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Multiple Debt Tracking</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Credit cards</li>
              <li>• Student loans</li>
              <li>• Auto loans</li>
              <li>• Personal loans</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-purple-800 mb-2">Advanced Features</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Payment strategy comparison</li>
              <li>• Debt consolidation analysis</li>
              <li>• Refinancing recommendations</li>
              <li>• Credit score impact modeling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
