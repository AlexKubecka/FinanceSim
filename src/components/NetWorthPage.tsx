import React from 'react';
import { TrendingUp, Wallet, CreditCard, PiggyBank, BarChart3 } from 'lucide-react';
import { 
  PersonalFinancialData, 
  SimulationProgress, 
  FinancialState, 
  HistoricalDataPoint 
} from '../types/simulation';
import { SimulationControls } from './SimulationControls';
import { calculateInvestmentBreakdown } from '../utils/investmentCalculations';

// Interactive Net Worth Chart Component
interface NetWorthChartProps {
  data: HistoricalDataPoint[];
}

const NetWorthChart: React.FC<NetWorthChartProps> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = React.useState<HistoricalDataPoint | null>(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (point: HistoricalDataPoint) => {
    return `Age ${point.age}`;
  };

  // Calculate chart dimensions and scales
  const chartWidth = 800; // pixels for wide chart
  const chartHeight = 300; // pixels
  const padding = { top: 20, right: 20, bottom: 40, left: 80 };

  const minNetWorth = Math.min(...data.map(d => d.netWorth));
  const maxNetWorth = Math.max(...data.map(d => d.netWorth));
  const netWorthRange = maxNetWorth - minNetWorth || 1;

  // Generate SVG path for the line
  const generatePath = () => {
    if (data.length < 2) return '';

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
      const y = chartHeight - padding.bottom - ((point.netWorth - minNetWorth) / netWorthRange) * (chartHeight - padding.top - padding.bottom);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * chartWidth;
    const y = ((event.clientY - rect.top) / rect.height) * chartHeight;

    // Find closest point
    let closestPoint: HistoricalDataPoint | null = null;
    let minDistance = Infinity;

    data.forEach((point, index) => {
      const chartX = (index / (data.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
      const chartY = chartHeight - padding.bottom - ((point.netWorth - minNetWorth) / netWorthRange) * (chartHeight - padding.top - padding.bottom);
      
      const distance = Math.sqrt(Math.pow(x - chartX, 2) + Math.pow(y - chartY, 2));
      if (distance < minDistance && distance < 10) { // 10px threshold
        minDistance = distance;
        closestPoint = point;
      }
    });

    setHoveredPoint(closestPoint);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Calculate Y-axis ticks
  const yTicks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const value = minNetWorth + (netWorthRange * i / tickCount);
    const y = chartHeight - padding.bottom - (i / tickCount) * (chartHeight - padding.top - padding.bottom);
    yTicks.push({ value, y });
  }

  // Calculate X-axis ticks
  const xTicks = [];
  const maxTicks = Math.min(data.length, 8);
  for (let i = 0; i < maxTicks; i++) {
    const dataIndex = Math.floor((i / (maxTicks - 1)) * (data.length - 1));
    const point = data[dataIndex];
    const x = (dataIndex / (data.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
    xTicks.push({ label: `Age ${point.age}`, x });
  }

  return (
    <div className="relative">
      <div className="h-80 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          {yTicks.map((tick, index) => (
            <line
              key={index}
              x1={padding.left}
              y1={tick.y}
              x2={chartWidth - padding.right}
              y2={tick.y}
              stroke="#e5e7eb"
              strokeWidth="0.5"
              strokeDasharray={index === 0 ? "none" : "2,2"}
            />
          ))}

          {/* Y-axis labels */}
          {yTicks.map((tick, index) => (
            <text
              key={index}
              x={padding.left - 5}
              y={tick.y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#6b7280"
            >
              {formatCurrency(tick.value)}
            </text>
          ))}

          {/* X-axis labels */}
          {xTicks.map((tick, index) => (
            <text
              key={index}
              x={tick.x}
              y={chartHeight - padding.bottom + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {tick.label}
            </text>
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area under the curve */}
          {data.length > 1 && (
            <path
              d={`${generatePath()} L ${chartWidth - padding.right},${chartHeight - padding.bottom} L ${padding.left},${chartHeight - padding.bottom} Z`}
              fill="url(#netWorthGradient)"
            />
          )}

          {/* Main line */}
          {data.length > 1 && (
            <path
              d={generatePath()}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
            const y = chartHeight - padding.bottom - ((point.netWorth - minNetWorth) / netWorthRange) * (chartHeight - padding.top - padding.bottom);
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={hoveredPoint === point ? "4" : "3"}
                fill={hoveredPoint === point ? "#6d28d9" : "#8b5cf6"}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
              />
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 80,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-sm font-semibold text-gray-800">
            {formatDate(hoveredPoint)}
          </div>
          <div className="text-lg font-bold text-purple-600">
            {formatCurrency(hoveredPoint.netWorth)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Salary: {formatCurrency(hoveredPoint.salary)}
          </div>
          <div className="text-xs text-gray-600">
            Investments: {formatCurrency(hoveredPoint.investments)}
          </div>
        </div>
      )}

      {/* Chart Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Starting Net Worth</div>
          <div className="font-semibold text-gray-800">{formatCurrency(data[0]?.netWorth || 0)}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-sm text-purple-600">Current Net Worth</div>
          <div className="font-semibold text-purple-800">{formatCurrency(data[data.length - 1]?.netWorth || 0)}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm text-green-600">Total Growth</div>
          <div className="font-semibold text-green-800">
            {formatCurrency((data[data.length - 1]?.netWorth || 0) - (data[0]?.netWorth || 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth';

interface NetWorthPageProps {
  // Core data
  personalData: PersonalFinancialData;
  financials: FinancialState;
  
  // Simulation state
  hasStarted: boolean;
  simulationState: 'setup' | 'running' | 'paused' | 'completed';
  simulationProgress: SimulationProgress;
  
  // Historical data for trends
  historicalData: HistoricalDataPoint[];
  
  // Navigation
  setCurrentMode: React.Dispatch<React.SetStateAction<SimulationMode>>;
  
  // Simulation controls
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onEditProfile: () => void;
}

export const NetWorthPage: React.FC<NetWorthPageProps> = ({
  personalData,
  financials,
  hasStarted,
  simulationState,
  simulationProgress,
  historicalData,
  setCurrentMode,
  onStart,
  onPause,
  onReset,
  onEditProfile
}) => {
  // Calculate investment breakdown using centralized utility
  const investmentBreakdown = calculateInvestmentBreakdown(personalData, financials.investmentAccountValue || 0);

  // Calculate net worth components
  const assets = {
    cash: personalData.savings || 0,
    investments: financials.investmentAccountValue || 0, // Use current investment value, not initial
    retirement: 0, // Could be calculated from 401k contributions over time
    other: 0
  };

  const liabilities = {
    debt: personalData.debtAmount || 0,
    creditCards: 0, // Future enhancement
    loans: 0, // Future enhancement
    other: 0
  };

  const totalAssets = Object.values(assets).reduce((sum, value) => sum + value, 0);
  const totalLiabilities = Object.values(liabilities).reduce((sum, value) => sum + value, 0);
  
  // Calculate net worth properly: Total Assets - Total Liabilities
  const netWorth = totalAssets - totalLiabilities;

  // Calculate net worth trend
  const getNetWorthTrend = () => {
    if (historicalData.length < 2) return { change: 0, percentage: 0 };
    
    const current = historicalData[historicalData.length - 1]?.netWorth || 0;
    const previous = historicalData[historicalData.length - 2]?.netWorth || 0;
    
    if (previous === 0) return { change: current, percentage: 0 };
    
    const change = current - previous;
    const percentage = (change / Math.abs(previous)) * 100;
    
    return { change, percentage };
  };

  const trend = getNetWorthTrend();

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
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentMode('personal')}
          className="flex items-center text-purple-600 hover:text-purple-800 mr-4"
        >
          ← Back to Dashboard
        </button>
        <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Net Worth Analysis</h1>
      </div>

      {/* Net Worth Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <Wallet className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-800">Total Assets</h3>
            </div>
            <p className="text-3xl font-bold text-green-900">${totalAssets.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <CreditCard className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">Total Liabilities</h3>
            </div>
            <p className="text-3xl font-bold text-red-900">${totalLiabilities.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-purple-800">Net Worth</h3>
            </div>
            <p className="text-3xl font-bold text-purple-900">${netWorth.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            {hasStarted && historicalData.length > 1 && (
              <p className={`text-sm mt-1 ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.change >= 0 ? '+' : ''}${trend.change.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({trend.percentage >= 0 ? '+' : ''}{trend.percentage.toFixed(1)}%) YoY
              </p>
            )}
            {hasStarted && historicalData.length <= 1 && (
              <p className="text-sm mt-1 text-gray-500">
                Need 2+ years of data for YoY growth
              </p>
            )}
            {!hasStarted && (
              <p className="text-sm mt-1 text-gray-500">
                Start simulation to track growth
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Net Worth History Chart */}
      {hasStarted && historicalData.length > 1 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <BarChart3 className="h-6 w-6 text-purple-600 mr-2" />
            Net Worth History
          </h2>
          <NetWorthChart 
            data={historicalData}
          />
        </div>
      )}

      {/* Assets Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <PiggyBank className="h-6 w-6 text-green-600 mr-2" />
          Assets Breakdown
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Cash & Savings</h3>
            <p className="text-2xl font-bold text-blue-900">${assets.cash.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-blue-700">{totalAssets > 0 ? ((assets.cash / totalAssets) * 100).toFixed(1) : 0}% of assets</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Total Investments</h3>
            <p className="text-2xl font-bold text-green-900">${assets.investments.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-green-700">{totalAssets > 0 ? ((assets.investments / totalAssets) * 100).toFixed(1) : 0}% of assets</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Retirement (401k)</h3>
            <p className="text-2xl font-bold text-purple-900">${assets.retirement.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-purple-700">{totalAssets > 0 ? ((assets.retirement / totalAssets) * 100).toFixed(1) : 0}% of assets</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Other Assets</h3>
            <p className="text-2xl font-bold text-gray-900">${assets.other.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-gray-700">{totalAssets > 0 ? ((assets.other / totalAssets) * 100).toFixed(1) : 0}% of assets</p>
          </div>
        </div>
      </div>

      {/* Investment Account Details */}
      {assets.investments > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <BarChart3 className="h-6 w-6 text-purple-600 mr-2" />
            Investment Account Breakdown
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">401(k) Traditional</h3>
              <p className="text-xl font-bold text-blue-900">${investmentBreakdown.traditional401kBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-blue-700">{assets.investments > 0 ? ((investmentBreakdown.traditional401kBalance / assets.investments) * 100).toFixed(1) : 0}% of investments</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">401(k) Roth</h3>
              <p className="text-xl font-bold text-green-900">${investmentBreakdown.roth401kBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-green-700">{assets.investments > 0 ? ((investmentBreakdown.roth401kBalance / assets.investments) * 100).toFixed(1) : 0}% of investments</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Traditional IRA</h3>
              <p className="text-xl font-bold text-purple-900">${investmentBreakdown.traditionalIraBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-purple-700">{assets.investments > 0 ? ((investmentBreakdown.traditionalIraBalance / assets.investments) * 100).toFixed(1) : 0}% of investments</p>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-800 mb-2">Roth IRA</h3>
              <p className="text-xl font-bold text-indigo-900">${investmentBreakdown.rothIraBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-indigo-700">{assets.investments > 0 ? ((investmentBreakdown.rothIraBalance / assets.investments) * 100).toFixed(1) : 0}% of investments</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">Taxable Account</h3>
              <p className="text-xl font-bold text-orange-900">${investmentBreakdown.taxableBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-orange-700">{assets.investments > 0 ? ((investmentBreakdown.taxableBalance / assets.investments) * 100).toFixed(1) : 0}% of investments</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
              <h3 className="font-semibold text-gray-800 mb-2">Total Verification</h3>
              <p className="text-xl font-bold text-gray-900">${(investmentBreakdown.traditional401kBalance + investmentBreakdown.roth401kBalance + investmentBreakdown.traditionalIraBalance + investmentBreakdown.rothIraBalance + investmentBreakdown.taxableBalance).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-gray-700">Sum of all accounts</p>
              <p className="text-xs text-gray-600 mt-1">
                Should match: ${assets.investments.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Investment Allocation Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="text-center">
                <p className="font-medium text-blue-800">Traditional 401(k)</p>
                <p className="text-blue-600">{assets.investments > 0 ? ((investmentBreakdown.traditional401kBalance / assets.investments) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-green-800">Roth 401(k)</p>
                <p className="text-green-600">{assets.investments > 0 ? ((investmentBreakdown.roth401kBalance / assets.investments) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-purple-800">Traditional IRA</p>
                <p className="text-purple-600">{assets.investments > 0 ? ((investmentBreakdown.traditionalIraBalance / assets.investments) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-indigo-800">Roth IRA</p>
                <p className="text-indigo-600">{assets.investments > 0 ? ((investmentBreakdown.rothIraBalance / assets.investments) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-orange-800">Taxable</p>
                <p className="text-orange-600">{assets.investments > 0 ? ((investmentBreakdown.taxableBalance / assets.investments) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liabilities Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <CreditCard className="h-6 w-6 text-red-600 mr-2" />
          Liabilities Breakdown
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">General Debt</h3>
            <p className="text-2xl font-bold text-red-900">${liabilities.debt.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-red-700">
              {personalData.debtInterestRate ? `${personalData.debtInterestRate}% interest` : 'No interest rate set'}
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Credit Cards</h3>
            <p className="text-2xl font-bold text-orange-900">${liabilities.creditCards.toLocaleString()}</p>
            <p className="text-sm text-orange-700">Coming soon</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Loans</h3>
            <p className="text-2xl font-bold text-yellow-900">${liabilities.loans.toLocaleString()}</p>
            <p className="text-sm text-yellow-700">Coming soon</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Other Liabilities</h3>
            <p className="text-2xl font-bold text-gray-900">${liabilities.other.toLocaleString()}</p>
            <p className="text-sm text-gray-700">Coming soon</p>
          </div>
        </div>
      </div>

      {/* Financial Health Indicators */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Financial Health Indicators</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Debt-to-Asset Ratio</h3>
            <p className="text-3xl font-bold text-purple-600">
              {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {totalAssets > 0 && (totalLiabilities / totalAssets) < 0.3 ? 'Excellent' : 
               totalAssets > 0 && (totalLiabilities / totalAssets) < 0.5 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Investment Allocation</h3>
            <p className="text-3xl font-bold text-green-600">
              {totalAssets > 0 ? ((assets.investments / totalAssets) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {totalAssets > 0 && (assets.investments / totalAssets) >= 0.6 ? 'Excellent' : 
               totalAssets > 0 && (assets.investments / totalAssets) >= 0.3 ? 'Good' : 'Consider Increasing'}
            </p>
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Liquidity Ratio</h3>
            <p className="text-3xl font-bold text-blue-600">
              {totalAssets > 0 ? ((assets.cash / totalAssets) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {totalAssets > 0 && (assets.cash / totalAssets) >= 0.1 && (assets.cash / totalAssets) <= 0.3 ? 'Balanced' : 
               totalAssets > 0 && (assets.cash / totalAssets) < 0.1 ? 'Low Liquidity' : 'High Cash Holdings'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
