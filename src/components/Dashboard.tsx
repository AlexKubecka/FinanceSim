import React from 'react';
import { User, TrendingUp, DollarSign, Receipt, Globe, BarChart3, PiggyBank, FileText } from 'lucide-react';
import { 
  PersonalFinancialData, 
  SimulationProgress, 
  FinancialState, 
  EconomicState, 
  HistoricalDataPoint, 
  EventNotification 
} from '../types/simulation';
import { SimulationControls } from './SimulationControls';
import { ProgressTimeline } from './ProgressTimeline';
import { LifeProgressBar } from './LifeProgressBar';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth' | 'bank' | 'reports';

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

interface DashboardProps {
  // Core data
  personalData: PersonalFinancialData;
  financials: FinancialState;
  
  // Current calculated values (for accurate display)
  currentAnnualExpenses: number;
  
  // Simulation state
  hasStarted: boolean;
  simulationState: 'setup' | 'running' | 'paused' | 'completed';
  simulationProgress: SimulationProgress;
  
  // Historical and economic data
  historicalData: HistoricalDataPoint[];
  economicState: EconomicState;
  
  // Events
  recentEvents: EventNotification[];
  
  // Tax information
  taxInfo: TaxInfo;
  
  // Navigation and actions
  setCurrentMode: React.Dispatch<React.SetStateAction<SimulationMode>>;
  setSetupCompleted: (completed: boolean) => void;
  setSetupStep: (step: number) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  handleEditProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  personalData,
  financials,
  currentAnnualExpenses,
  hasStarted,
  simulationState,
  simulationProgress,
  historicalData,
  economicState,
  recentEvents,
  taxInfo,
  setCurrentMode,
  setSetupCompleted,
  setSetupStep,
  startSimulation,
  pauseSimulation,
  resetSimulation,
  handleEditProfile
}) => {
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

      {/* Life Progress Bar */}
      {hasStarted && (
        <LifeProgressBar
          personalData={personalData}
          currentAge={simulationProgress.currentDate.getFullYear() - (new Date().getFullYear() - personalData.age)}
          netWorth={financials.netWorth}
        />
      )}
      
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => {
            setSetupCompleted(false);
            setSetupStep(1);
            setCurrentMode('selection');
          }}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
        >
          ← Back to Selection
        </button>
        <User className="h-8 w-8 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Personal Financial Dashboard</h1>
      </div>

      {/* Simulation Progress (appears when simulation is running) */}
      {hasStarted && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Life Simulation Progress</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-blue-800 mb-1">Current Age</h3>
              <p className="text-2xl font-bold text-blue-900">{simulationProgress.currentAge}</p>
              <p className="text-sm text-blue-700">years old</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-green-800 mb-1">Years Simulated</h3>
              <p className="text-2xl font-bold text-green-900">{simulationProgress.yearsElapsed}</p>
              <p className="text-sm text-green-700">years passed</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-purple-800 mb-1">Years to Retirement</h3>
              <p className="text-2xl font-bold text-purple-900">{Math.max(0, personalData.retirementAge - simulationProgress.currentAge)}</p>
              <p className="text-sm text-purple-700">years remaining</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-orange-800 mb-1">Simulation State</h3>
              <p className="text-lg font-bold text-orange-900 capitalize">{simulationState}</p>
              <p className="text-sm text-orange-700">1 year per 5 seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      {recentEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Life Events</h2>
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div key={event.id} className={`p-3 rounded-lg flex items-center justify-between ${
                event.type === 'promotion' ? 'bg-green-50 border-l-4 border-green-400' :
                event.type === 'demotion' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                event.type === 'layoff' ? 'bg-red-50 border-l-4 border-red-400' :
                event.type === 'bonus' ? 'bg-blue-50 border-l-4 border-blue-400' :
                'bg-gray-50 border-l-4 border-gray-400'
              }`}>
                <div>
                  <p className="text-sm font-medium text-gray-800">{event.description}</p>
                  <p className="text-xs text-gray-500">{event.timestamp.toLocaleTimeString()}</p>
                </div>
                <div className="text-lg">
                  {event.type === 'promotion' && '🎉'}
                  {event.type === 'demotion' && '⬇️'}
                  {event.type === 'layoff' && '🚫'}
                  {event.type === 'bonus' && '💰'}
                  {event.type === 'medical' && '🏥'}
                  {event.type === 'car_repair' && '🔧'}
                  {event.type === 'emergency' && '🚨'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Net Worth Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
             onClick={() => setCurrentMode('networth')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Net Worth</h3>
              <p className="text-sm text-gray-600">Assets - Liabilities</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            ${financials.netWorth.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          
          {/* YoY Growth Indicator */}
          {historicalData.length >= 2 && (
            <div className="flex items-center mb-2">
              {(() => {
                const currentValue = historicalData[historicalData.length - 1]?.netWorth || 0;
                const previousValue = historicalData[historicalData.length - 2]?.netWorth || 0;
                const growth = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
                const isPositive = growth >= 0;
                
                return (
                  <>
                    <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{growth.toFixed(1)}% YoY
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({isPositive ? '+' : ''}${(currentValue - previousValue).toLocaleString('en-US', { maximumFractionDigits: 0 })})
                    </span>
                  </>
                );
              })()}
            </div>
          )}
          
          <p className="text-sm text-gray-500">Cash + Investments (Click to view breakdown)</p>
          
          {/* Mini Line Chart */}
          <div className="mt-4 h-16 bg-purple-50 rounded p-2">
            {historicalData.length > 1 ? (
              <svg width="100%" height="100%" viewBox="0 0 300 48" className="overflow-visible">
                <defs>
                  <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                {(() => {
                  const maxValue = Math.max(...historicalData.map(d => d.netWorth), 0);
                  const minValue = Math.min(...historicalData.map(d => d.netWorth), 0);
                  const range = Math.max(maxValue - minValue, 1000); // Minimum range for better scaling
                  
                  const points = historicalData.map((d, i) => {
                    const x = (i / Math.max(historicalData.length - 1, 1)) * 280 + 10;
                    const y = 40 - ((d.netWorth - minValue) / range) * 32;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  const pathPoints = historicalData.map((d, i) => {
                    const x = (i / Math.max(historicalData.length - 1, 1)) * 280 + 10;
                    const y = 40 - ((d.netWorth - minValue) / range) * 32;
                    return `${x},${y}`;
                  });
                  
                  const pathData = pathPoints.length > 1 
                    ? `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')} L ${pathPoints[pathPoints.length - 1].split(',')[0]},40 L ${pathPoints[0].split(',')[0]},40 Z`
                    : '';
                  
                  return (
                    <g>
                      {pathData && <path d={pathData} fill="url(#netWorthGradient)" />}
                      <polyline
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        points={points}
                      />
                      {historicalData.map((d, i) => {
                        const x = (i / Math.max(historicalData.length - 1, 1)) * 280 + 10;
                        const y = 40 - ((d.netWorth - minValue) / range) * 32;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="2"
                            fill="#8b5cf6"
                          />
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full">
                <BarChart3 className="h-6 w-6 text-purple-400" />
                <span className="ml-2 text-sm text-purple-600">Start simulation to see chart</span>
              </div>
            )}
          </div>
        </div>

        {/* Annual Salary Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
             onClick={() => setCurrentMode('salary')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Annual Salary</h3>
              <p className="text-sm text-gray-600">Gross income & taxes</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            ${financials.currentSalary.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-sm text-gray-500">Click for tax breakdown</p>
          
          {/* Mini Chart Placeholder */}
          <div className="mt-4 h-16 bg-green-50 rounded flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-green-400" />
            <span className="ml-2 text-sm text-green-600">Tax analysis</span>
          </div>
        </div>

        {/* Annual Expenses Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
             onClick={() => setCurrentMode('expenses')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <Receipt className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Annual Expenses</h3>
              <p className="text-sm text-gray-600">Housing, food & more</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-2">
            ${currentAnnualExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-sm text-gray-500">Click to manage expenses</p>
          
          {/* Mini Chart Placeholder */}
          <div className="mt-4 h-16 bg-orange-50 rounded flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-orange-400" />
            <span className="ml-2 text-sm text-orange-600">Expense breakdown</span>
          </div>
        </div>

        {/* Economic Dashboard Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
             onClick={() => setCurrentMode('economy')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Economy & Markets</h3>
              <p className="text-sm text-gray-600 capitalize">{economicState.economicCycle} cycle</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-gray-600">Inflation</p>
              <p className="text-lg font-bold text-blue-600">
                {(economicState.currentInflationRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">S&P 500</p>
              <p className="text-lg font-bold text-green-600">
                {economicState.stockMarketIndex.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {historicalData.length > 1 && (
                <p className={`text-xs font-medium ${
                  economicState.stockMarketGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {economicState.stockMarketGrowth >= 0 ? '+' : ''}{(economicState.stockMarketGrowth * 100).toFixed(1)}% YTD
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">Market performance this year</p>
          
          {/* Mini S&P 500 Chart */}
          <div className="mt-4 h-16 bg-blue-50 rounded p-2">
            {historicalData.length > 1 ? (
              <svg width="100%" height="100%" viewBox="0 0 300 48" className="overflow-visible">
                <defs>
                  <linearGradient id="stockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                {(() => {
                  const maxValue = Math.max(...historicalData.map(d => d.stockMarketValue), 5000);
                  const minValue = Math.min(...historicalData.map(d => d.stockMarketValue), 4000);
                  const range = Math.max(maxValue - minValue, 1000);
                  
                  const points = historicalData.map((d, i) => {
                    const x = (i / Math.max(historicalData.length - 1, 1)) * 280 + 10;
                    const y = 40 - ((d.stockMarketValue - minValue) / range) * 32;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  const pathPoints = historicalData.map((d, i) => {
                    const x = (i / Math.max(historicalData.length - 1, 1)) * 280 + 10;
                    const y = 40 - ((d.stockMarketValue - minValue) / range) * 32;
                    return `${x},${y}`;
                  });
                  
                  const pathData = pathPoints.length > 1 
                    ? `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')} L ${pathPoints[pathPoints.length - 1].split(',')[0]},40 L ${pathPoints[0].split(',')[0]},40 Z`
                    : '';
                  
                  return (
                    <g>
                      {pathData && <path d={pathData} fill="url(#stockGradient)" />}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        points={points}
                      />
                      {historicalData.map((d, i) => {
                        const x = (i / Math.max(historicalData.length - 1, 1)) * 280 + 10;
                        const y = 40 - ((d.stockMarketValue - minValue) / range) * 32;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill="#10b981"
                          />
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Globe className="h-6 w-6 text-green-400" />
                <span className="ml-2 text-sm text-green-600">S&P 500 chart</span>
              </div>
            )}
          </div>
        </div>

        {/* Investments Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
             onClick={() => setCurrentMode('investments')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Investments</h3>
              <p className="text-sm text-gray-600">401k & portfolio</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-gray-600">Total Invested</p>
              <p className="text-lg font-bold text-purple-600">
                ${(financials.investmentAccountValue || personalData.investments || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">YoY Growth</p>
              <p className="text-lg font-bold text-purple-600">
                {(() => {
                  if (historicalData.length < 2) return '+0.0%';
                  const currentValue = historicalData[historicalData.length - 1]?.investments || 0;
                  const previousValue = historicalData[historicalData.length - 2]?.investments || 0;
                  if (previousValue === 0) return '+0.0%';
                  const growth = ((currentValue - previousValue) / previousValue) * 100;
                  const sign = growth >= 0 ? '+' : '';
                  return `${sign}${growth.toFixed(1)}%`;
                })()}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">Investment planning</p>
          
          {/* Mini Investment Chart */}
          <div className="mt-4 h-16 bg-purple-50 rounded flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-purple-400" />
            <span className="ml-2 text-sm text-purple-600">Portfolio growth</span>
          </div>
        </div>

        {/* Bank Account Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
             onClick={() => setCurrentMode('bank')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <PiggyBank className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Bank Account</h3>
              <p className="text-sm text-gray-600">Cash & savings</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            ${(() => {
              const legacySavings = personalData.savings || 0;
              const savingsAccount = personalData.savingsAccount ?? 0;
              const checkingAccount = personalData.checkingAccount ?? 0;
              const hysaAccount = personalData.hysaAccount ?? 0;
              const totalBankBalance = savingsAccount + checkingAccount + hysaAccount + legacySavings;
              return totalBankBalance.toLocaleString('en-US', { maximumFractionDigits: 0 });
            })()}
          </div>
          
          {/* Savings Rate */}
          <div className="mb-3">
            <p className="text-sm text-gray-600">Monthly Surplus</p>
            <p className={`text-lg font-bold ${((taxInfo.afterTaxIncome - currentAnnualExpenses) / 12) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(((taxInfo.afterTaxIncome - currentAnnualExpenses) / 12)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          
          <p className="text-sm text-gray-500 mb-3">Liquid assets & emergency fund</p>
          
          {/* Emergency Fund Indicator */}
          <div className="mt-4 h-16 bg-blue-50 rounded p-2 flex flex-col justify-center">
            {(() => {
              const monthlyExpenses = currentAnnualExpenses / 12;
              const emergencyFundGoal = monthlyExpenses * (personalData.emergencyFundMonths || 6);
              const legacySavings = personalData.savings || 0;
              const savingsAccount = personalData.savingsAccount ?? 0;
              const checkingAccount = personalData.checkingAccount ?? 0;
              const hysaAccount = personalData.hysaAccount ?? 0;
              const totalBankBalance = savingsAccount + checkingAccount + hysaAccount + legacySavings;
              const coverageMonths = monthlyExpenses > 0 ? totalBankBalance / monthlyExpenses : 0;
              const goalMet = totalBankBalance >= emergencyFundGoal;
              
              return (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Emergency Fund</span>
                    <span className={`text-xs font-medium ${goalMet ? 'text-green-600' : 'text-orange-600'}`}>
                      {coverageMonths.toFixed(1)} months
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${goalMet ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((totalBankBalance / emergencyFundGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center mt-1">
                    <span className="text-xs text-gray-500">
                      Goal: {personalData.emergencyFundMonths || 6} months (${emergencyFundGoal.toLocaleString('en-US', { maximumFractionDigits: 0 })})
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Yearly Reports Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
             onClick={() => setCurrentMode('reports')}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Yearly Reports</h3>
              <p className="text-sm text-gray-600">Historical analysis</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {personalData.yearlySummaries.length}
          </div>
          
          <p className="text-sm text-gray-500 mb-3">
            {personalData.yearlySummaries.length === 0 
              ? "No reports yet" 
              : personalData.yearlySummaries.length === 1 
              ? "1 year completed" 
              : `${personalData.yearlySummaries.length} years completed`}
          </p>
          
          {/* Reports Preview */}
          <div className="mt-4 h-16 bg-indigo-50 rounded p-2 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
            <span className="ml-2 text-sm text-indigo-600">
              {personalData.yearlySummaries.length > 0 ? "View detailed reports" : "Start simulation to generate"}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      {hasStarted && historicalData.length > 0 && (
        <ProgressTimeline
          historicalData={historicalData}
          personalData={personalData}
          currentAge={simulationProgress.currentDate.getFullYear() - (new Date().getFullYear() - personalData.age)}
        />
      )}

      {/* Quick Financial Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Financial Summary</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Take-Home Pay</p>
            <p className="text-2xl font-bold text-blue-600">${taxInfo.afterTaxIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Monthly Surplus</p>
            <p className={`text-2xl font-bold ${((taxInfo.afterTaxIncome - currentAnnualExpenses) / 12) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              ${(((taxInfo.afterTaxIncome - currentAnnualExpenses) / 12)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Economic Cycle</p>
            <p className="text-2xl font-bold text-blue-600 capitalize">{economicState.economicCycle}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Current Inflation</p>
            <p className="text-2xl font-bold text-orange-600">{(economicState.currentInflationRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
