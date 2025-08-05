import React, { useState, useEffect, useRef } from 'react';
import { User, Shuffle, Settings, ArrowRight, LifeBuoy, Sparkles, TrendingUp, Calculator, Play, Pause, Clock, X, Check, BarChart3, LineChart, TrendingDown } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom';

interface PersonalFinancialData {
  // Basic Info
  age: number;
  currentSalary: number;
  
  // Assets
  savings: number;
  investments: number;
  
  // Debts
  debtAmount: number;
  debtInterestRate: number;
}

type SimulationSpeed = 'day' | 'week' | 'month' | 'year';
type SimulationState = 'setup' | 'running' | 'paused' | 'completed';

interface SimulationProgress {
  currentDate: Date;
  startDate: Date;
  currentAge: number;
  yearsElapsed: number;
  monthsElapsed: number;
  daysElapsed: number;
}

interface HistoricalDataPoint {
  age: number;
  netWorth: number;
  salary: number;
  investments: number;
  debt: number;
}

export const LifeSimulator: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<SimulationMode>('selection');
  const [personalData, setPersonalData] = useState<PersonalFinancialData>({
    age: 22,
    currentSalary: 45000,
    savings: 2000,
    investments: 0,
    debtAmount: 25000,
    debtInterestRate: 6.5
  });

  // Simulation state
  const [simulationState, setSimulationState] = useState<SimulationState>('setup');
  const [simulationSpeed, setSimulationSpeed] = useState<SimulationSpeed>('month');
  const [simulationProgress, setSimulationProgress] = useState<SimulationProgress>({
    currentDate: new Date(),
    startDate: new Date(),
    currentAge: 22,
    yearsElapsed: 0,
    monthsElapsed: 0,
    daysElapsed: 0
  });

  // Chart state
  const [showDetailChart, setShowDetailChart] = useState<string | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState<string>('all');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Financial tracking
  const [financials, setFinancials] = useState({
    currentSalary: 45000,
    currentInvestments: 0,
    remainingDebt: 25000,
    netWorth: -23000,
    monthlyPayment: 300
  });

  // Track last salary increase year
  const [lastSalaryIncreaseYear, setLastSalaryIncreaseYear] = useState<number>(0);

  const intervalRef = useRef<number | null>(null);

  // Track historical data for charts - only record at integer ages for consistent scale
  useEffect(() => {
    if (simulationState === 'running') {
      const currentAgeInt = Math.floor(simulationProgress.currentAge);
      const lastRecordedAge = historicalData[historicalData.length - 1]?.age || 0;
      
      // Only record data when we cross into a new integer age
      if (currentAgeInt > lastRecordedAge && currentAgeInt >= Math.floor(personalData.age)) {
        setHistoricalData(prev => [...prev, {
          age: currentAgeInt,
          netWorth: Math.round(financials.netWorth),
          salary: Math.round(financials.currentSalary),
          investments: Math.round(financials.currentInvestments),
          debt: Math.round(financials.remainingDebt)
        }]);
      }
    }
  }, [simulationProgress.currentAge, financials, simulationState, personalData.age]);

  // Filter historical data based on time range
  const getFilteredData = () => {
    if (!historicalData.length) return [];
    
    const currentAge = Math.floor(simulationProgress.currentAge);
    
    switch (chartTimeRange) {
      case 'week':
        // Show last few data points (since we record at integer ages, show last 2-3 years)
        return historicalData.slice(-3);
      case 'month':
        // Show last several data points (show last 6 years)
        return historicalData.slice(-6);
      case 'year':
        // Show last year's worth of data (show last 10 years)
        return historicalData.slice(-10);
      case 'ytd':
        // Show from start of current year (floor of current age)
        return historicalData.filter((d: HistoricalDataPoint) => d.age >= currentAge);
      case 'all':
      default:
        return historicalData;
    }
  };

  // Simulation logic
  useEffect(() => {
    if (simulationState === 'running') {
      const speeds = {
        day: 100,
        week: 300,
        month: 500,
        year: 1000
      };

      intervalRef.current = setInterval(() => {
        setSimulationProgress(prev => {
          const newAge = prev.currentAge + (simulationSpeed === 'year' ? 1 : 
                                          simulationSpeed === 'month' ? 1/12 :
                                          simulationSpeed === 'week' ? 1/52 : 1/365);
          
          if (newAge >= 90) {
            setSimulationState('completed');
            return prev;
          }

          return {
            ...prev,
            currentAge: newAge,
            yearsElapsed: Math.floor(newAge - personalData.age),
            monthsElapsed: Math.floor((newAge - personalData.age) * 12),
            daysElapsed: Math.floor((newAge - personalData.age) * 365)
          };
        });

        // Update financials
        setFinancials(prev => {
          const monthlyGrowth = simulationSpeed === 'month' ? 1 : 
                               simulationSpeed === 'year' ? 12 :
                               simulationSpeed === 'week' ? 0.25 : 1/30;

          // Check if we've passed into a new year for salary increase
          const currentYear = Math.floor(simulationProgress.currentAge);
          const newYear = Math.floor(simulationProgress.currentAge + (simulationSpeed === 'year' ? 1 : 
                                                                      simulationSpeed === 'month' ? 1/12 :
                                                                      simulationSpeed === 'week' ? 1/52 : 1/365));
          
          let newSalary = prev.currentSalary;
          if (newYear > currentYear) {
            // Apply 3% annual salary increase only when crossing into a new year
            newSalary = prev.currentSalary * 1.03;
          }

          const investmentGrowth = Math.pow(1.07, monthlyGrowth / 12);
          const newInvestments = prev.currentInvestments * investmentGrowth + (newSalary * 0.1 / 12 * monthlyGrowth);
          const monthlyDebtPayment = prev.monthlyPayment * monthlyGrowth;
          const newDebt = Math.max(0, prev.remainingDebt - monthlyDebtPayment);

          return {
            ...prev,
            currentSalary: newSalary,
            currentInvestments: newInvestments,
            remainingDebt: newDebt,
            netWorth: newInvestments - newDebt
          };
        });
      }, speeds[simulationSpeed]);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [simulationState, simulationSpeed, personalData.age]);

  const startSimulation = () => {
    setSimulationState('running');
    setLastSalaryIncreaseYear(Math.floor(personalData.age));
    setSimulationProgress({
      currentDate: new Date(),
      startDate: new Date(),
      currentAge: personalData.age,
      yearsElapsed: 0,
      monthsElapsed: 0,
      daysElapsed: 0
    });
    setFinancials({
      currentSalary: personalData.currentSalary,
      currentInvestments: personalData.investments,
      remainingDebt: personalData.debtAmount,
      netWorth: personalData.savings + personalData.investments - personalData.debtAmount,
      monthlyPayment: Math.max(personalData.debtAmount * 0.02, 300)
    });
  };

  const pauseSimulation = () => {
    setSimulationState('paused');
  };

  const resumeSimulation = () => {
    setSimulationState('running');
  };

  const resetSimulation = () => {
    setSimulationState('setup');
    setHistoricalData([]);
    setChartTimeRange('all');
    setLastSalaryIncreaseYear(0);
    setSimulationProgress({
      currentDate: new Date(),
      startDate: new Date(),
      currentAge: personalData.age,
      yearsElapsed: 0,
      monthsElapsed: 0,
      daysElapsed: 0
    });
  };

  const modes = [
    {
      id: 'personal',
      title: 'Personal Mode',
      icon: User,
      description: 'Plan your actual financial future with real goals and timeline',
      features: [
        'Your real age and salary',
        'Actual debt amounts',
        'Personal investment goals',
        'Life event planning'
      ],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'realistic',
      title: 'Realistic Scenarios',
      icon: Shuffle,
      description: 'Experience common financial challenges and learn to navigate them',
      features: [
        'Random life events',
        'Economic ups and downs',
        'Career changes',
        'Emergency situations'
      ],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      disabled: true
    },
    {
      id: 'custom',
      title: 'Custom Scenarios',
      icon: Settings,
      description: 'Design your own financial scenarios and test different strategies',
      features: [
        'Coming Soon!',
        'Build custom economic scenarios',
        'Test extreme market conditions',
        'Compare multiple strategies'
      ],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      disabled: true
    }
  ];

  const renderSelectionPage = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <LifeBuoy className="h-12 w-12 text-blue-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-800">Life Financial Simulator</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose your path to financial wisdom. Whether you want to plan your real future, 
          experience life's financial challenges through simulation, or create custom scenarios.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className={`${mode.bgColor} rounded-xl p-8 border-2 border-gray-200 transition-all duration-300 hover:shadow-lg ${
              mode.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'
            }`}
            onClick={() => !mode.disabled && setCurrentMode(mode.id as SimulationMode)}
          >
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${mode.color} rounded-full text-white mb-4`}>
                <mode.icon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{mode.title}</h3>
              <p className={`${mode.textColor} mb-6`}>{mode.description}</p>
              
              <ul className="space-y-2 mb-6">
                {mode.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {!mode.disabled && (
                <div className="flex items-center justify-center text-blue-600 font-semibold">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPersonalMode = () => {
    const filteredData = getFilteredData();

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentMode('selection')}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Options
          </button>
          <User className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Personal Financial Simulator</h1>
        </div>

        {simulationState === 'setup' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Setup Your Financial Profile</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Age</label>
                <input
                  type="number"
                  value={personalData.age}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, age: parseInt(e.target.value) || 22 }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  min="18"
                  max="65"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Salary</label>
                <input
                  type="number"
                  value={personalData.currentSalary}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, currentSalary: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Savings</label>
                <input
                  type="number"
                  value={personalData.savings}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, savings: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Investments</label>
                <input
                  type="number"
                  value={personalData.investments}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, investments: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Debt</label>
                <input
                  type="number"
                  value={personalData.debtAmount}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, debtAmount: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Debt Interest Rate (%)</label>
                <input
                  type="number"
                  value={personalData.debtInterestRate}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, debtInterestRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  min="0"
                  max="30"
                  step="0.1"
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={startSimulation}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Financial Simulation
              </button>
            </div>
          </div>
        )}

        {(simulationState === 'running' || simulationState === 'paused' || simulationState === 'completed') && (
          <div className="space-y-6">
            {/* Simulation Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Life Progress</h3>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-lg font-bold text-gray-800">
                    Age {Math.floor(simulationProgress.currentAge)}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Simulation Speed</label>
                  <select
                    value={simulationSpeed}
                    onChange={(e) => setSimulationSpeed(e.target.value as SimulationSpeed)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    disabled={simulationState === 'completed'}
                  >
                    <option value="day">Day by Day</option>
                    <option value="week">Week by Week</option>
                    <option value="month">Month by Month</option>
                    <option value="year">Year by Year</option>
                  </select>
                </div>

                <div className="flex items-end space-x-2">
                  {simulationState === 'running' ? (
                    <button
                      onClick={pauseSimulation}
                      className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </button>
                  ) : simulationState === 'paused' ? (
                    <button
                      onClick={resumeSimulation}
                      className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </button>
                  ) : null}
                  
                  <button
                    onClick={resetSimulation}
                    className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Reset Simulation
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Dashboard with Clickable Charts */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Current Financial Status</h3>
              
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                {/* Net Worth Card */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                    financials.netWorth >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                  onClick={() => setShowDetailChart('networth')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${financials.netWorth >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      Net Worth
                    </h4>
                    <BarChart3 className={`h-4 w-4 ${financials.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <p className={`text-xl font-bold ${financials.netWorth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    ${Math.round(financials.netWorth).toLocaleString()}
                  </p>
                  <p className={`text-xs ${financials.netWorth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Assets - Debts
                  </p>
                  {historicalData.length > 1 && (
                    <div className="mt-2 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={historicalData.slice(-10)}>
                          <Line 
                            type="monotone" 
                            dataKey="netWorth" 
                            stroke={financials.netWorth >= 0 ? "#10b981" : "#ef4444"} 
                            strokeWidth={2}
                            dot={false}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Click for details</p>
                </div>

                {/* Annual Salary Card */}
                <div 
                  className="bg-blue-50 p-4 rounded-lg border border-blue-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                  onClick={() => setShowDetailChart('salary')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-800">Annual Salary</h4>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xl font-bold text-blue-900">
                    ${Math.round(financials.currentSalary).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-700">3% annual growth</p>
                  {historicalData.length > 1 && (
                    <div className="mt-2 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={historicalData.slice(-10)}>
                          <Line 
                            type="monotone" 
                            dataKey="salary" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Click for details</p>
                </div>

                {/* Investments Card */}
                <div 
                  className="bg-green-50 p-4 rounded-lg border border-green-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                  onClick={() => setShowDetailChart('investments')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800">Investments</h4>
                    <LineChart className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xl font-bold text-green-900">
                    ${Math.round(financials.currentInvestments).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-700">7% annual return</p>
                  {historicalData.length > 1 && (
                    <div className="mt-2 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={historicalData.slice(-10)}>
                          <Line 
                            type="monotone" 
                            dataKey="investments" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Click for details</p>
                </div>

                {/* Remaining Debt Card */}
                <div 
                  className="bg-purple-50 p-4 rounded-lg border border-purple-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                  onClick={() => setShowDetailChart('debt')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-purple-800">Remaining Debt</h4>
                    <TrendingDown className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-xl font-bold text-purple-900">
                    ${Math.round(financials.remainingDebt).toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-700">
                    {financials.remainingDebt === 0 ? 'Debt Free!' : `$${Math.round(financials.monthlyPayment).toLocaleString()}/month`}
                  </p>
                  {historicalData.length > 1 && (
                    <div className="mt-2 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={historicalData.slice(-10)}>
                          <Line 
                            type="monotone" 
                            dataKey="debt" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Click for details</p>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Time Elapsed</h4>
                  <p className="text-lg font-bold text-gray-900">
                    {simulationProgress.yearsElapsed} years, {simulationProgress.monthsElapsed % 12} months
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-800 mb-2">Progress to Target</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-indigo-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (simulationProgress.currentAge - personalData.age) / (65 - personalData.age) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-indigo-800">
                      {Math.round((simulationProgress.currentAge - personalData.age) / (65 - personalData.age) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 mb-2">Years to Retirement</h4>
                  <p className="text-lg font-bold text-emerald-900">
                    {Math.max(0, Math.floor(65 - simulationProgress.currentAge))} years
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart Detail Modal */}
        {showDetailChart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    {showDetailChart === 'networth' && <BarChart3 className="h-6 w-6 text-green-600" />}
                    {showDetailChart === 'salary' && <TrendingUp className="h-6 w-6 text-blue-600" />}
                    {showDetailChart === 'investments' && <LineChart className="h-6 w-6 text-green-600" />}
                    {showDetailChart === 'debt' && <TrendingDown className="h-6 w-6 text-purple-600" />}
                    <h2 className="text-2xl font-bold text-gray-800">
                      {showDetailChart === 'networth' && 'Net Worth Over Time'}
                      {showDetailChart === 'salary' && 'Annual Salary Growth'}
                      {showDetailChart === 'investments' && 'Investment Portfolio'}
                      {showDetailChart === 'debt' && 'Debt Reduction Progress'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowDetailChart(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Time Range Controls */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'week', label: 'Recent', disabled: historicalData.length < 2 },
                      { value: 'month', label: 'Short Term', disabled: historicalData.length < 2 },
                      { value: 'year', label: 'Long Term', disabled: historicalData.length < 2 },
                      { value: 'ytd', label: 'Current Year', disabled: historicalData.length < 2 },
                      { value: 'all', label: 'All Time', disabled: false }
                    ].map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setChartTimeRange(range.value)}
                        disabled={range.disabled}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          chartTimeRange === range.value
                            ? 'bg-blue-600 text-white'
                            : range.disabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredData.length > 1 ? (
                  <div className="space-y-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={filteredData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="age" 
                            stroke="#666"
                            type="number"
                            scale="linear"
                            domain={['dataMin', 'dataMax']}
                            tickCount={Math.min(10, filteredData.length)}
                            label={{ value: 'Age', position: 'insideBottom', offset: -10 }}
                          />
                          <YAxis 
                            stroke="#666"
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                            labelFormatter={(age) => `Age ${age}`}
                            contentStyle={{ 
                              backgroundColor: '#fff',
                              border: '1px solid #ccc',
                              borderRadius: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey={
                              showDetailChart === 'networth' ? 'netWorth' :
                              showDetailChart === 'salary' ? 'salary' :
                              showDetailChart === 'investments' ? 'investments' : 'debt'
                            }
                            stroke={
                              showDetailChart === 'networth' ? (financials.netWorth >= 0 ? "#10b981" : "#ef4444") :
                              showDetailChart === 'salary' ? "#3b82f6" :
                              showDetailChart === 'investments' ? "#10b981" : "#8b5cf6"
                            }
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Current Value</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          ${Math.round(showDetailChart === 'networth' ? financials.netWorth :
                              showDetailChart === 'salary' ? financials.currentSalary :
                              showDetailChart === 'investments' ? financials.currentInvestments : 
                              financials.remainingDebt).toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Starting Value</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          ${(filteredData[0] ? 
                              Math.round(showDetailChart === 'networth' ? filteredData[0].netWorth :
                               showDetailChart === 'salary' ? filteredData[0].salary :
                               showDetailChart === 'investments' ? filteredData[0].investments : 
                               filteredData[0].debt) : 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Period Change</h4>
                        <p className={`text-2xl font-bold ${
                          (() => {
                            if (!filteredData[0]) return 'text-gray-900';
                            const current = showDetailChart === 'networth' ? financials.netWorth :
                                           showDetailChart === 'salary' ? financials.currentSalary :
                                           showDetailChart === 'investments' ? financials.currentInvestments : 
                                           financials.remainingDebt;
                            const start = showDetailChart === 'networth' ? filteredData[0].netWorth :
                                         showDetailChart === 'salary' ? filteredData[0].salary :
                                         showDetailChart === 'investments' ? filteredData[0].investments : 
                                         filteredData[0].debt;
                            const change = current - start;
                            return showDetailChart === 'debt' 
                              ? (change < 0 ? 'text-green-600' : 'text-red-600')
                              : (change >= 0 ? 'text-green-600' : 'text-red-600');
                          })()
                        }`}>
                          {(() => {
                            if (!filteredData[0]) return '$0';
                            const current = showDetailChart === 'networth' ? financials.netWorth :
                                           showDetailChart === 'salary' ? financials.currentSalary :
                                           showDetailChart === 'investments' ? financials.currentInvestments : 
                                           financials.remainingDebt;
                            const start = showDetailChart === 'networth' ? filteredData[0].netWorth :
                                         showDetailChart === 'salary' ? filteredData[0].salary :
                                         showDetailChart === 'investments' ? filteredData[0].investments : 
                                         filteredData[0].debt;
                            const change = current - start;
                            return `${change >= 0 ? '+' : ''}$${Math.round(change).toLocaleString()}`;
                          })()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Insights</h4>
                      <p className="text-blue-700">
                        {showDetailChart === 'networth' && 
                          `Your net worth represents your total financial position. ${financials.netWorth >= 0 ? 'You\'re building wealth!' : 'Focus on reducing debt and increasing assets.'}`}
                        {showDetailChart === 'salary' && 
                          'Your salary grows 3% annually. Consider skill development to potentially increase growth rate.'}
                        {showDetailChart === 'investments' && 
                          'Your investments compound at 7% annually. Time in the market beats timing the market!'}
                        {showDetailChart === 'debt' && 
                          `${financials.remainingDebt === 0 ? 'Congratulations on being debt-free!' : 'Focus on debt reduction to improve your financial position.'}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Yet</h3>
                    <p className="text-gray-500">
                      Run the simulation for a while to see your financial trends!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRealisticMode = () => (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentMode('selection')}
          className="flex items-center text-green-600 hover:text-green-800 mr-4"
        >
          ← Back to Options
        </button>
        <Shuffle className="h-8 w-8 text-green-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Realistic Life Scenarios</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <Sparkles className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon!</h2>
        <p className="text-gray-600 mb-6">
          Experience realistic financial challenges with random life events, economic fluctuations, and career changes.
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600">
          <li>• Random life events (marriage, children, medical emergencies)</li>
          <li>• Economic ups and downs</li>
          <li>• Unexpected career changes</li>
          <li>• Market volatility effects</li>
        </ul>
      </div>
    </div>
  );

  const renderCustomMode = () => (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentMode('selection')}
          className="flex items-center text-purple-600 hover:text-purple-800 mr-4"
        >
          ← Back to Options
        </button>
        <Settings className="h-8 w-8 text-purple-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Custom Scenarios</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <Calculator className="h-16 w-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon!</h2>
        <p className="text-gray-600 mb-6">
          Design your own financial scenarios and test different strategies in various economic conditions.
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600">
          <li>• Build custom economic scenarios</li>
          <li>• Test extreme market conditions</li>
          <li>• Compare multiple strategies side-by-side</li>
          <li>• Import real market data</li>
        </ul>
      </div>
    </div>
  );

  switch (currentMode) {
    case 'selection':
      return renderSelectionPage();
    case 'personal':
      return renderPersonalMode();
    case 'realistic':
      return renderRealisticMode();
    case 'custom':
      return renderCustomMode();
    default:
      return renderSelectionPage();
  }
};
