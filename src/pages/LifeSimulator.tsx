import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, BarChart3, TrendingUp, DollarSign, User, Target, Receipt, Globe, RotateCcw } from 'lucide-react';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses';

interface PersonalFinancialData {
  // Basic Info
  age: number;
  currentSalary: number;
  state: string;
  
  // Assets
  savings: number;
  investments: number;
  
  // Debts
  debtAmount: number;
  debtInterestRate: number;
  
  // Goals
  retirementAge: number;
  retirementGoal: number;
  emergencyFundMonths: number;
  
  // Investment settings
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  monthlyInvestment: number;
  
  // Life events
  plannedPurchases: {
    item: string;
    cost: number;
    targetYear: number;
  }[];
}

type SimulationState = 'setup' | 'running' | 'paused' | 'completed';

interface SimulationProgress {
  currentDate: Date;
  startDate: Date;
  currentAge: number;
  yearsElapsed: number;
  monthsElapsed: number;
  daysElapsed: number;
  speedMultiplier: number;
}

interface HistoricalDataPoint {
  age: number;
  netWorth: number;
  salary: number;
  investments: number;
  debt: number;
  timestamp: Date;
}

export const LifeSimulator: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<SimulationMode>('selection');
  const [personalData, setPersonalData] = useState<PersonalFinancialData>({
    age: 0,
    currentSalary: 0,
    state: '',
    savings: 0,
    investments: 0,
    debtAmount: 0,
    debtInterestRate: 0,
    retirementAge: 65,
    retirementGoal: 1000000,
    emergencyFundMonths: 6,
    riskTolerance: 'moderate',
    monthlyInvestment: 0,
    plannedPurchases: []
  });

  // Simulation state
  const [simulationState, setSimulationState] = useState<SimulationState>('setup');
  const [simulationProgress, setSimulationProgress] = useState<SimulationProgress>({
    currentDate: new Date(),
    startDate: new Date(),
    currentAge: 0,
    yearsElapsed: 0,
    monthsElapsed: 0,
    daysElapsed: 0,
    speedMultiplier: 1
  });

  // Chart state
  const [showDetailChart, setShowDetailChart] = useState<string | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState<string>('all');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Financial tracking
  const [financials, setFinancials] = useState({
    currentSalary: 0,
    netWorth: 0,
    annualExpenses: 0
  });

  // Track if simulation has ever been started
  const [hasStarted, setHasStarted] = useState(false);
  
  // Salary actions state
  const [salaryActionTaken, setSalaryActionTaken] = useState(false);

  // Event notifications state
  const [recentEvents, setRecentEvents] = useState<Array<{
    type: string;
    description: string;
    timestamp: Date;
    id: string;
  }>>([]);

  // User's custom rent data
  const [userRentData, setUserRentData] = useState<{ [key: string]: number }>({});
  
  // User's custom grocery data
  const [userGroceryData, setUserGroceryData] = useState<{ [key: string]: number }>({});
  
  // Rent editing state
  const [editingRent, setEditingRent] = useState(false);
  const [tempRentValue, setTempRentValue] = useState<string>('');
  
  // Grocery editing state
  const [editingGrocery, setEditingGrocery] = useState(false);
  const [tempGroceryValue, setTempGroceryValue] = useState<string>('');

  const intervalRef = useRef<number | null>(null);

  // Main simulation step function
  const runSimulationStep = () => {
    let newAge = simulationProgress.currentAge;
    let newSavings = personalData.savings;
    
    setSimulationProgress(prev => {
      const newDate = new Date(prev.currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // Add exactly 1 year
      const yearsElapsed = Math.floor((newDate.getTime() - prev.startDate.getTime()) / (365 * 24 * 60 * 60 * 1000));
      const monthsElapsed = yearsElapsed * 12;
      const currentAge = personalData.age + yearsElapsed;
      newAge = currentAge;

      return {
        ...prev,
        currentDate: newDate,
        currentAge,
        yearsElapsed,
        monthsElapsed,
        daysElapsed: Math.floor((newDate.getTime() - prev.startDate.getTime()) / (24 * 60 * 60 * 1000))
      };
    });

    // Update financials
    setPersonalData(prev => {
      let newData = { ...prev };
      
      // Annual salary (after taxes, simplified)
      const annualSalaryAfterTax = prev.currentSalary * 0.75; // Rough after-tax
      
      // Annual expenses
      const annualExpenses = financials.annualExpenses;
      
      // Annual savings (just track the difference)
      const annualSavings = annualSalaryAfterTax - annualExpenses;
      
      // Update savings (simple accumulation)
      newData.savings = prev.savings + annualSavings;
      newSavings = newData.savings;

      return newData;
    });

    // Update net worth (simplified)
    setFinancials(prev => ({
      ...prev,
      netWorth: newSavings
    }));

    // Record historical data with the updated values
    setHistoricalData(prev => {
      const newPoint: HistoricalDataPoint = {
        age: newAge,
        netWorth: newSavings,
        salary: personalData.currentSalary,
        investments: 0,
        debt: 0,
        timestamp: new Date()
      };
      return [...prev, newPoint];
    });

    // Check if simulation should end
    if (newAge >= personalData.retirementAge) {
      stopSimulation();
    }
  };

  // Simulation controls
  const startSimulation = () => {
    setSimulationState('running');
    
    // Only reset simulation progress if this is the very first start
    if (!hasStarted) {
      setHasStarted(true);
      setSimulationProgress(prev => ({
        ...prev,
        startDate: new Date(),
        currentDate: new Date(),
        currentAge: personalData.age,
        yearsElapsed: 0,
        monthsElapsed: 0,
        daysElapsed: 0
      }));
      
      // Initialize historical data with the starting point
      setHistoricalData([{
        age: personalData.age,
        netWorth: personalData.savings,
        salary: personalData.currentSalary,
        investments: 0,
        debt: 0,
        timestamp: new Date()
      }]);
    }
    
    intervalRef.current = window.setInterval(() => {
      runSimulationStep();
    }, 5000); // Fixed 5 seconds per year
  };

  const pauseSimulation = () => {
    setSimulationState('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopSimulation = () => {
    setSimulationState('setup');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Career action functions
  const handlePromotion = () => {
    const salaryIncrease = 0.15; // 15% increase
    setPersonalData(prev => ({
      ...prev,
      currentSalary: prev.currentSalary * (1 + salaryIncrease)
    }));
    setFinancials(prev => ({
      ...prev,
      currentSalary: prev.currentSalary * (1 + salaryIncrease)
    }));
    setSalaryActionTaken(true);
    
    // Add to events
    setRecentEvents(prev => {
      const newEvent = {
        type: 'promotion',
        description: 'You got promoted with a 15% salary increase!',
        timestamp: new Date(),
        id: Math.random().toString(36).substr(2, 9)
      };
      return [newEvent, ...prev].slice(0, 5);
    });
  };

  const handleDemotion = () => {
    const salaryDecrease = 0.10; // 10% decrease
    setPersonalData(prev => ({
      ...prev,
      currentSalary: prev.currentSalary * (1 - salaryDecrease)
    }));
    setFinancials(prev => ({
      ...prev,
      currentSalary: prev.currentSalary * (1 - salaryDecrease)
    }));
    setSalaryActionTaken(true);
    
    // Add to events
    setRecentEvents(prev => {
      const newEvent = {
        type: 'demotion',
        description: 'You were demoted with a 10% salary decrease',
        timestamp: new Date(),
        id: Math.random().toString(36).substr(2, 9)
      };
      return [newEvent, ...prev].slice(0, 5);
    });
  };

  const handleQuitJob = () => {
    setPersonalData(prev => ({
      ...prev,
      currentSalary: 0
    }));
    setFinancials(prev => ({
      ...prev,
      currentSalary: 0
    }));
    setSalaryActionTaken(true);
    
    // Add to events
    setRecentEvents(prev => {
      const newEvent = {
        type: 'layoff',
        description: 'You quit your job and are now unemployed',
        timestamp: new Date(),
        id: Math.random().toString(36).substr(2, 9)
      };
      return [newEvent, ...prev].slice(0, 5);
    });
  };

  const handleNewJob = () => {
    const newSalary = prompt('Enter your new job salary:');
    if (newSalary && !isNaN(Number(newSalary))) {
      const salary = Number(newSalary);
      setPersonalData(prev => ({
        ...prev,
        currentSalary: salary
      }));
      setFinancials(prev => ({
        ...prev,
        currentSalary: salary
      }));
      setSalaryActionTaken(true);
      
      // Add to events
      setRecentEvents(prev => {
        const newEvent = {
          type: 'bonus',
          description: `You got a new job with salary $${salary.toLocaleString()}!`,
          timestamp: new Date(),
          id: Math.random().toString(36).substr(2, 9)
        };
        return [newEvent, ...prev].slice(0, 5);
      });
    }
  };

  // Reset salary action flag when simulation is reset
  const resetSimulation = () => {
    stopSimulation();
    setSimulationProgress({
      currentDate: new Date(),
      startDate: new Date(),
      currentAge: personalData.age,
      yearsElapsed: 0,
      monthsElapsed: 0,
      daysElapsed: 0,
      speedMultiplier: 1
    });
    setHistoricalData([]);
    setHasStarted(false);
    setSalaryActionTaken(false);
    setRecentEvents([]);
    
    // Reset savings to 0
    setPersonalData(prev => ({
      ...prev,
      savings: 0
    }));
    
    setFinancials(prev => ({
      ...prev,
      netWorth: 0
    }));
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // State rent data (average monthly rent by state)
  const stateRentData: { [key: string]: number } = {
    'Massachusetts': 2837,
    'New York': 2739,
    'Hawaii': 2668,
    'California': 2587,
    'District of Columbia': 2474,
    'New Jersey': 2337,
    'Vermont': 2152,
    'Rhode Island': 2129,
    'New Hampshire': 2112,
    'Connecticut': 2044,
    'Washington': 2020,
    'Virginia': 1972,
    'Maine': 1971,
    'Florida': 1955,
    'Illinois': 1944,
    'Colorado': 1884,
    'Maryland': 1859,
    'Oregon': 1757,
    'Pennsylvania': 1730,
    'Delaware': 1646,
    'Georgia': 1608,
    'Idaho': 1607,
    'Montana': 1605,
    'Utah': 1597,
    'South Carolina': 1594,
    'Arizona': 1575,
    'Minnesota': 1558,
    'Wisconsin': 1548,
    'Nevada': 1525,
    'North Carolina': 1524,
    'Tennessee': 1494,
    'Alaska': 1482,
    'Texas': 1449,
    'New Mexico': 1389,
    'Michigan': 1346,
    'Wyoming': 1332,
    'Mississippi': 1305,
    'Indiana': 1293,
    'Alabama': 1288,
    'Kentucky': 1287,
    'Nebraska': 1285,
    'Ohio': 1279,
    'West Virginia': 1275,
    'Missouri': 1273,
    'Kansas': 1243,
    'Louisiana': 1235,
    'Iowa': 1220,
    'South Dakota': 1127,
    'Arkansas': 1093,
    'North Dakota': 1077,
    'Oklahoma': 1035
  };

  // State grocery data (average weekly grocery costs by state)
  const stateGroceryData: { [key: string]: number } = {
    'Hawaii': 333.88,
    'Alaska': 328.71,
    'California': 297.72,
    'Nevada': 294.76,
    'Mississippi': 290.64,
    'Washington': 287.67,
    'Florida': 287.27,
    'New Mexico': 286.39,
    'Texas': 286.19,
    'Louisiana': 282.95,
    'Colorado': 279.98,
    'Oklahoma': 279.16,
    'Utah': 278.41,
    'Georgia': 278.32,
    'New Jersey': 274.69,
    'Massachusetts': 271.98,
    'Arizona': 271.84,
    'Alabama': 271.64,
    'Tennessee': 270.45,
    'Illinois': 269.47,
    'New York': 266.40,
    'North Carolina': 266.23,
    'Maryland': 266.11,
    'Connecticut': 265.90,
    'North Dakota': 265.11,
    'Arkansas': 260.91,
    'Virginia': 259.76,
    'Idaho': 257.54,
    'South Dakota': 256.48,
    'Rhode Island': 255.86,
    'District of Columbia': 254.70,
    'Kentucky': 254.57,
    'South Carolina': 254.36,
    'Wyoming': 254.24,
    'Ohio': 253.74,
    'Kansas': 250.88,
    'Minnesota': 250.56,
    'Maine': 249.91,
    'Oregon': 249.38,
    'Vermont': 249.38,
    'Pennsylvania': 249.09,
    'Montana': 246.42,
    'Delaware': 246.21,
    'Missouri': 244.43,
    'New Hampshire': 239.33,
    'West Virginia': 239.24,
    'Indiana': 239.11,
    'Michigan': 236.38,
    'Nebraska': 235.12,
    'Iowa': 227.32,
    'Wisconsin': 221.46
  };

  // Rent management functions
  const getCurrentRent = (state: string): number => {
    return userRentData[state] ?? stateRentData[state] ?? 0;
  };

  const handleEditRent = () => {
    if (!personalData.state) return;
    const currentRent = getCurrentRent(personalData.state);
    setTempRentValue(currentRent.toString());
    setEditingRent(true);
  };

  const handleSaveRent = () => {
    if (!personalData.state) return;
    const newRentValue = parseInt(tempRentValue) || 0;
    setUserRentData(prev => ({
      ...prev,
      [personalData.state]: newRentValue
    }));
    setEditingRent(false);
    setTempRentValue('');
  };

  const handleCancelEditRent = () => {
    setEditingRent(false);
    setTempRentValue('');
  };

  const handleResetRent = () => {
    if (!personalData.state) return;
    setUserRentData(prev => {
      const newData = { ...prev };
      delete newData[personalData.state];
      return newData;
    });
  };

  const isCustomRent = (state: string): boolean => {
    return userRentData.hasOwnProperty(state);
  };

  // Grocery management functions
  const getCurrentGrocery = (state: string): number => {
    return userGroceryData[state] ?? stateGroceryData[state] ?? 0;
  };

  const handleEditGrocery = () => {
    if (!personalData.state) return;
    const currentGrocery = getCurrentGrocery(personalData.state);
    setTempGroceryValue(currentGrocery.toString());
    setEditingGrocery(true);
  };

  const handleSaveGrocery = () => {
    if (!personalData.state) return;
    const newGroceryValue = parseFloat(tempGroceryValue) || 0;
    setUserGroceryData(prev => ({
      ...prev,
      [personalData.state]: newGroceryValue
    }));
    setEditingGrocery(false);
    setTempGroceryValue('');
  };

  const handleCancelEditGrocery = () => {
    setEditingGrocery(false);
    setTempGroceryValue('');
  };

  const handleResetGrocery = () => {
    if (!personalData.state) return;
    setUserGroceryData(prev => {
      const newData = { ...prev };
      delete newData[personalData.state];
      return newData;
    });
  };

  const isCustomGrocery = (state: string): boolean => {
    return userGroceryData.hasOwnProperty(state);
  };

  // Calculate total annual expenses
  const calculateAnnualExpenses = (): number => {
    const currentStateRent = personalData.state ? getCurrentRent(personalData.state) : 0;
    const annualRent = currentStateRent * 12;
    
    const currentStateGrocery = personalData.state ? getCurrentGrocery(personalData.state) : 0;
    const annualGrocery = currentStateGrocery * 52; // Weekly to annual
    
    return annualRent + annualGrocery;
  };

  // Tax calculation function using 2025 tax brackets (single filer)
  const calculateTaxes = (annualSalary: number, state: string = personalData.state): { 
    totalTax: number; 
    afterTaxIncome: number; 
    effectiveRate: number;
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    miscDeductions: number;
  } => {
    if (annualSalary <= 0) return { 
      totalTax: 0, 
      afterTaxIncome: 0, 
      effectiveRate: 0,
      federalTax: 0,
      stateTax: 0,
      socialSecurity: 0,
      medicare: 0,
      miscDeductions: 0
    };

    // Federal tax brackets for 2025
    const federalBrackets = [
      { min: 0, max: 11925, rate: 0.10 },
      { min: 11925, max: 48475, rate: 0.12 },
      { min: 48475, max: 103350, rate: 0.22 },
      { min: 103350, max: 197300, rate: 0.24 },
      { min: 197300, max: 250525, rate: 0.32 },
      { min: 250525, max: 626350, rate: 0.35 },
      { min: 626350, max: Infinity, rate: 0.37 }
    ];

    // State tax rates (simplified average rates)
    const stateTaxRates: { [key: string]: number } = {
      'Alabama': 0.035, 'Alaska': 0, 'Arizona': 0.025, 'Arkansas': 0.0295, 'California': 0.067,
      'Colorado': 0.044, 'Connecticut': 0.045, 'Delaware': 0.044, 'District of Columbia': 0.074,
      'Florida': 0, 'Georgia': 0.0539, 'Hawaii': 0.062, 'Idaho': 0.05695, 'Illinois': 0.0495,
      'Indiana': 0.03, 'Iowa': 0.038, 'Kansas': 0.054, 'Kentucky': 0.04, 'Louisiana': 0.03,
      'Maine': 0.065, 'Maryland': 0.039, 'Massachusetts': 0.07, 'Michigan': 0.0425,
      'Minnesota': 0.076, 'Mississippi': 0.044, 'Missouri': 0.035, 'Montana': 0.053,
      'Nebraska': 0.038, 'Nevada': 0, 'New Hampshire': 0, 'New Jersey': 0.061, 'New Mexico': 0.037,
      'New York': 0.075, 'North Carolina': 0.0425, 'North Dakota': 0.0225, 'Ohio': 0.031,
      'Oklahoma': 0.025, 'Oregon': 0.073, 'Pennsylvania': 0.0307, 'Rhode Island': 0.049,
      'South Carolina': 0.031, 'South Dakota': 0, 'Tennessee': 0, 'Texas': 0, 'Utah': 0.0455,
      'Vermont': 0.061, 'Virginia': 0.039, 'Washington': 0, 'West Virginia': 0.035,
      'Wisconsin': 0.056, 'Wyoming': 0
    };

    // Calculate federal tax
    let federalTax = 0;
    let remainingIncome = annualSalary;

    for (const bracket of federalBrackets) {
      if (remainingIncome <= 0) break;
      
      const taxableAtThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      federalTax += taxableAtThisBracket * bracket.rate;
      remainingIncome -= taxableAtThisBracket;
    }

    // Calculate state tax
    const stateRate = stateTaxRates[state] || 0;
    const stateTax = annualSalary * stateRate;

    // Calculate Social Security and Medicare
    const socialSecurityWageBase = 160200;
    const socialSecurity = Math.min(annualSalary, socialSecurityWageBase) * 0.062;
    const medicare = annualSalary * 0.0145 + Math.max(0, annualSalary - 200000) * 0.009;
    const miscDeductions = annualSalary * 0.005;

    const totalTax = federalTax + stateTax + socialSecurity + medicare + miscDeductions;
    const afterTaxIncome = annualSalary - totalTax;
    const effectiveRate = annualSalary > 0 ? (totalTax / annualSalary) * 100 : 0;

    return { 
      totalTax, 
      afterTaxIncome, 
      effectiveRate, 
      federalTax, 
      stateTax, 
      socialSecurity, 
      medicare, 
      miscDeductions 
    };
  };

  // Update financials effect
  useEffect(() => {
    const annualExpenses = calculateAnnualExpenses();
    setFinancials(prev => ({
      ...prev,
      currentSalary: personalData.currentSalary,
      annualExpenses: annualExpenses
    }));
  }, [personalData.currentSalary, personalData.state, userRentData, userGroceryData]);

  const renderExpensesPage = () => {
    const currentStateRent = personalData.state ? getCurrentRent(personalData.state) : 0;
    const annualRent = currentStateRent * 12;
    const isUsingCustomRent = personalData.state ? isCustomRent(personalData.state) : false;
    const defaultStateRent = personalData.state ? stateRentData[personalData.state] ?? 0 : 0;

    const currentStateGrocery = personalData.state ? getCurrentGrocery(personalData.state) : 0;
    const annualGrocery = currentStateGrocery * 52;
    const isUsingCustomGrocery = personalData.state ? isCustomGrocery(personalData.state) : false;
    const defaultStateGrocery = personalData.state ? stateGroceryData[personalData.state] ?? 0 : 0;

    const totalAnnualExpenses = annualRent + annualGrocery;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentMode('personal')}
            className="flex items-center text-orange-600 hover:text-orange-800 mr-4"
          >
            ← Back to Dashboard
          </button>
          <Receipt className="h-8 w-8 text-orange-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
        </div>

        {/* State Selection */}
        {!personalData.state && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Your State</h2>
            <select
              value={personalData.state}
              onChange={(e) => setPersonalData(prev => ({ ...prev, state: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="">Choose your state...</option>
              {Object.keys(stateRentData).sort().map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        )}

        {/* State Rent Information */}
        {personalData.state && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Housing Costs - {personalData.state}
              </h2>
              <div className="flex items-center space-x-2">
                {isUsingCustomRent && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Custom
                  </span>
                )}
                {!editingRent ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditRent}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Edit Rent
                    </button>
                    {isUsingCustomRent && (
                      <button
                        onClick={handleResetRent}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={tempRentValue}
                      onChange={(e) => setTempRentValue(e.target.value)}
                      placeholder="Monthly rent"
                      className="w-32 p-2 border border-gray-300 rounded text-sm"
                      min="0"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveRent}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditRent}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Monthly Rent</h3>
                <p className="text-2xl font-bold text-blue-900">${currentStateRent.toLocaleString()}</p>
                <p className="text-sm text-blue-700">
                  {isUsingCustomRent ? 'Your custom amount' : 'State average'}
                </p>
                {isUsingCustomRent && defaultStateRent > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    State avg: ${defaultStateRent.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Annual Housing Cost</h3>
                <p className="text-2xl font-bold text-green-900">${annualRent.toLocaleString()}</p>
                <p className="text-sm text-green-700">Per year</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Housing % of Salary</h3>
                <p className="text-2xl font-bold text-purple-900">
                  {financials.currentSalary > 0 ? ((annualRent / financials.currentSalary) * 100).toFixed(1) : '0'}%
                </p>
                <p className="text-sm text-purple-700">Housing cost ratio</p>
              </div>
            </div>
          </div>
        )}

        {/* State Grocery Information */}
        {personalData.state && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Food Costs - {personalData.state}
              </h2>
              <div className="flex items-center space-x-2">
                {isUsingCustomGrocery && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Custom
                  </span>
                )}
                {!editingGrocery ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditGrocery}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Edit Groceries
                    </button>
                    {isUsingCustomGrocery && (
                      <button
                        onClick={handleResetGrocery}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={tempGroceryValue}
                      onChange={(e) => setTempGroceryValue(e.target.value)}
                      placeholder="Weekly groceries"
                      className="w-32 p-2 border border-gray-300 rounded text-sm"
                      min="0"
                      step="0.01"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveGrocery}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditGrocery}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Weekly Groceries</h3>
                <p className="text-2xl font-bold text-green-900">${currentStateGrocery.toFixed(2)}</p>
                <p className="text-sm text-green-700">
                  {isUsingCustomGrocery ? 'Your custom amount' : 'State average'}
                </p>
                {isUsingCustomGrocery && defaultStateGrocery > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    State avg: ${defaultStateGrocery.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Annual Food Cost</h3>
                <p className="text-2xl font-bold text-yellow-900">${annualGrocery.toLocaleString()}</p>
                <p className="text-sm text-yellow-700">Per year</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Food % of Salary</h3>
                <p className="text-2xl font-bold text-red-900">
                  {financials.currentSalary > 0 ? ((annualGrocery / financials.currentSalary) * 100).toFixed(1) : '0'}%
                </p>
                <p className="text-sm text-red-700">Food cost ratio</p>
              </div>
            </div>
          </div>
        )}

        {/* Total Expenses Summary */}
        {personalData.state && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Annual Expense Summary
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">Total Annual Expenses</h3>
                <p className="text-3xl font-bold text-orange-900">${totalAnnualExpenses.toLocaleString()}</p>
                <p className="text-sm text-orange-700">Housing + Food costs</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-indigo-800 mb-2">Expense % of Salary</h3>
                <p className="text-3xl font-bold text-indigo-900">
                  {financials.currentSalary > 0 ? ((totalAnnualExpenses / financials.currentSalary) * 100).toFixed(1) : '0'}%
                </p>
                <p className="text-sm text-indigo-700">Total expense ratio</p>
              </div>
            </div>

            {/* Salary input for testing */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Salary for Calculations</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={personalData.currentSalary || ''}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, currentSalary: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter annual salary"
                  className="p-3 border border-gray-300 rounded-lg"
                  min="0"
                />
                <span className="text-gray-600">Annual Salary</span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Expense Categories */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Additional Expense Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Transportation</h3>
              <p className="text-lg font-bold text-gray-900">Coming Soon</p>
              <p className="text-sm text-gray-600">Car payments, insurance, gas</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Healthcare</h3>
              <p className="text-lg font-bold text-gray-900">Coming Soon</p>
              <p className="text-sm text-gray-600">Insurance, medical expenses</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Entertainment</h3>
              <p className="text-lg font-bold text-gray-900">Coming Soon</p>
              <p className="text-sm text-gray-600">Dining out, subscriptions, hobbies</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Utilities</h3>
              <p className="text-lg font-bold text-gray-900">Coming Soon</p>
              <p className="text-sm text-gray-600">Electricity, water, internet</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Savings Goals</h3>
              <p className="text-lg font-bold text-gray-900">Coming Soon</p>
              <p className="text-sm text-gray-600">Emergency fund, retirement</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Miscellaneous</h3>
              <p className="text-lg font-bold text-gray-900">Coming Soon</p>
              <p className="text-sm text-gray-600">Clothing, personal care</p>
            </div>
          </div>
        </div>
      </div>
    );
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
      icon: Globe,
      description: 'Experience common financial challenges and learn from them',
      features: [
        'Market crashes and booms',
        'Unexpected expenses',
        'Job changes and promotions',
        'Economic events'
      ],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      id: 'custom',
      title: 'Custom Simulation',
      icon: Target,
      description: 'Create your own scenarios with specific parameters',
      features: [
        'Custom market conditions',
        'Specific life events',
        'Variable income streams',
        'Complex investment strategies'
      ],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  const renderSelectionPage = () => (
    <div className="p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Life Financial Simulator</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Explore different financial scenarios, plan your future, and learn through realistic simulations.
          Choose a mode below to begin your financial journey.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 ${mode.bgColor} border-2 border-transparent hover:border-gray-200`}
          >
            <div className="flex items-center mb-4">
              <mode.icon className="h-8 w-8 text-gray-700 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">{mode.title}</h2>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {mode.description}
            </p>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Features:</h3>
              <ul className="space-y-2">
                {mode.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setCurrentMode(mode.id as SimulationMode)}
              className={`w-full bg-gradient-to-r ${mode.color} text-white py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center font-semibold`}
              disabled={mode.id !== 'personal'}
            >
              <mode.icon className="h-5 w-5 mr-2" />
              {mode.id === 'personal' ? 'Start Planning' : 'Coming Soon'}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Access Tools */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Access Tools</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-800">Salary Calculator</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Calculate your take-home pay with detailed tax breakdowns for any state.
            </p>
            <button
              onClick={() => setCurrentMode('salary')}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Calculate Taxes
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <Receipt className="h-8 w-8 text-orange-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-800">Expense Tracker</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Track and manage your expenses with real-world data by state.
            </p>
            <button
              onClick={() => setCurrentMode('expenses')}
              className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Track Expenses
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPersonalMode = () => {
    const taxInfo = calculateTaxes(financials.currentSalary, personalData.state);

    // If basic info not complete, show setup screen
    if (!personalData.age || !personalData.currentSalary || !personalData.state) {
      return (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => setCurrentMode('selection')}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              ← Back to Selection
            </button>
            <User className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Personal Financial Setup</h1>
          </div>

          {/* Basic Information Setup */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Tell us about yourself</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Age</label>
                <input
                  type="number"
                  value={personalData.age || ''}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter your age"
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                  min="18"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Salary</label>
                <input
                  type="number"
                  value={personalData.currentSalary || ''}
                  onChange={(e) => {
                    const salary = parseInt(e.target.value) || 0;
                    setPersonalData(prev => ({ ...prev, currentSalary: salary }));
                    setFinancials(prev => ({ ...prev, currentSalary: salary }));
                  }}
                  placeholder="Enter your annual salary"
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={personalData.state}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                >
                  <option value="">Choose your state...</option>
                  {Object.keys(stateRentData).sort().map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  // Basic validation
                  if (personalData.age && personalData.currentSalary && personalData.state) {
                    // Setup is complete, this will trigger the dashboard view
                  }
                }}
                disabled={!personalData.age || !personalData.currentSalary || !personalData.state}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Dashboard view when setup is complete
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentMode('selection')}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              ← Back to Selection
            </button>
            <User className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Personal Financial Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Simulation Controls */}
            {!hasStarted ? (
              <button
                onClick={startSimulation}
                className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Life Simulation
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {simulationState === 'running' ? (
                  <button
                    onClick={pauseSimulation}
                    className="flex items-center bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={startSimulation}
                    className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </button>
                )}
                <button
                  onClick={resetSimulation}
                  className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </button>
              </div>
            )}
            
            {/* Edit Profile Button */}
            <button
              onClick={() => {
                setPersonalData(prev => ({ ...prev, age: 0, currentSalary: 0, state: '' }));
                setFinancials(prev => ({ ...prev, currentSalary: 0 }));
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
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
        <div className="grid md:grid-cols-3 gap-8">
          {/* Net Worth Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
               onClick={() => alert('Net Worth details coming soon!')}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Net Worth</h3>
                <p className="text-sm text-gray-600">Accumulated savings</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              ${personalData.savings.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500">Click to view breakdown</p>
            
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
              ${financials.currentSalary.toLocaleString()}
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
              ${financials.annualExpenses.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500">Click to manage expenses</p>
            
            {/* Mini Chart Placeholder */}
            <div className="mt-4 h-16 bg-orange-50 rounded flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-orange-400" />
              <span className="ml-2 text-sm text-orange-600">Expense breakdown</span>
            </div>
          </div>
        </div>

        {/* Quick Financial Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Financial Summary</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Take-Home Pay</p>
              <p className="text-2xl font-bold text-blue-600">${taxInfo.afterTaxIncome.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Monthly Net Income</p>
              <p className="text-2xl font-bold text-green-600">${(taxInfo.afterTaxIncome / 12).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Monthly Expenses</p>
              <p className="text-2xl font-bold text-orange-600">${(financials.annualExpenses / 12).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Monthly Surplus</p>
              <p className={`text-2xl font-bold ${((taxInfo.afterTaxIncome - financials.annualExpenses) / 12) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                ${(((taxInfo.afterTaxIncome - financials.annualExpenses) / 12)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSalaryPage = () => {
    const taxInfo = calculateTaxes(personalData.currentSalary, personalData.state);

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentMode('personal')}
            className="flex items-center text-green-600 hover:text-green-800 mr-4"
          >
            ← Back to Dashboard
          </button>
          <DollarSign className="h-8 w-8 text-green-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Salary & Income Management</h1>
        </div>

        {/* Career Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Career Actions</h2>
          <p className="text-sm text-gray-600 mb-4">Simulate career events that affect your salary</p>
          <div className="grid md:grid-cols-4 gap-4">
            <button
              onClick={handlePromotion}
              className="flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg transition-colors font-medium"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Get Promotion
            </button>
            <button
              onClick={handleDemotion}
              className="flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg transition-colors font-medium"
            >
              <TrendingUp className="h-5 w-5 mr-2 transform rotate-180" />
              Get Demoted
            </button>
            <button
              onClick={handleQuitJob}
              className="flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg transition-colors font-medium"
            >
              <Square className="h-5 w-5 mr-2" />
              Quit Job
            </button>
            <button
              onClick={handleNewJob}
              className="flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-3 rounded-lg transition-colors font-medium"
            >
              <User className="h-5 w-5 mr-2" />
              New Job
            </button>
          </div>
          {salaryActionTaken && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Career action taken! Your new salary is ${personalData.currentSalary.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Tax Calculation Results */}
        {personalData.currentSalary > 0 && personalData.state ? (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Tax Calculation for ${personalData.currentSalary.toLocaleString()} 
                {personalData.state && ` in ${personalData.state}`}
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Gross Salary</h3>
                  <p className="text-2xl font-bold text-gray-900">${personalData.currentSalary.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Before taxes</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Total Taxes</h3>
                  <p className="text-2xl font-bold text-red-900">${taxInfo.totalTax.toLocaleString()}</p>
                  <p className="text-sm text-red-700">{taxInfo.effectiveRate.toFixed(1)}% effective rate</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Take-Home Pay</h3>
                  <p className="text-2xl font-bold text-green-900">${taxInfo.afterTaxIncome.toLocaleString()}</p>
                  <p className="text-sm text-green-700">After all taxes</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Monthly Net</h3>
                  <p className="text-2xl font-bold text-blue-900">${(taxInfo.afterTaxIncome / 12).toLocaleString()}</p>
                  <p className="text-sm text-blue-700">Per month</p>
                </div>
              </div>
            </div>

            {/* Visual Tax Breakdown Chart & Paystub Side by Side */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Tax Breakdown Visualization & Paystub</h3>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Side - Pie Chart */}
                <div className="flex flex-col items-center">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Tax Distribution</h4>
                  
                  {/* CSS-Only Pie Chart */}
                  <div className="relative w-64 h-64 mx-auto">
                    <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Calculate angles for each segment */}
                      {(() => {
                        const total = personalData.currentSalary;
                        const segments = [
                          { value: taxInfo.afterTaxIncome, color: '#10b981', label: 'Take Home' },
                          { value: taxInfo.federalTax, color: '#ef4444', label: 'Federal Tax' },
                          { value: taxInfo.stateTax, color: '#3b82f6', label: 'State Tax' },
                          { value: taxInfo.socialSecurity, color: '#eab308', label: 'Social Security' },
                          { value: taxInfo.medicare, color: '#a855f7', label: 'Medicare' },
                          { value: taxInfo.miscDeductions, color: '#6b7280', label: 'Other' }
                        ];
                        
                        let currentAngle = 0;
                        const radius = 40;
                        const circumference = 2 * Math.PI * radius;
                        
                        return segments.map((segment, index) => {
                          const percentage = (segment.value / total) * 100;
                          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                          const strokeDashoffset = -currentAngle * circumference / 100;
                          currentAngle += percentage;
                          
                          return (
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="transparent"
                              stroke={segment.color}
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-300 hover:stroke-opacity-80"
                            />
                          );
                        });
                      })()}
                    </svg>
                    
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-600">Total Salary</div>
                        <div className="text-lg font-bold text-gray-800">${personalData.currentSalary.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                      <span>Take Home ({((taxInfo.afterTaxIncome / personalData.currentSalary) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                      <span>Federal ({((taxInfo.federalTax / personalData.currentSalary) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      <span>State ({((taxInfo.stateTax / personalData.currentSalary) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                      <span>Social Security ({((taxInfo.socialSecurity / personalData.currentSalary) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                      <span>Medicare ({((taxInfo.medicare / personalData.currentSalary) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
                      <span>Other ({((taxInfo.miscDeductions / personalData.currentSalary) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
                
                {/* Right Side - Compact Paystub */}
                <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm">
                  {/* Paystub Header */}
                  <div className="text-center mb-4 pb-3 border-b-2 border-gray-300">
                    <h4 className="text-base font-bold text-gray-800">EARNINGS STATEMENT</h4>
                    <p className="text-xs text-gray-600">Annual Summary</p>
                    {personalData.state && <p className="text-xs text-gray-600">State: {personalData.state}</p>}
                  </div>

                  {/* Earnings */}
                  <div className="mb-4">
                    <h5 className="font-bold text-gray-800 mb-2 text-sm">EARNINGS</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Regular Pay:</span>
                        <span className="font-semibold">${personalData.currentSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-semibold">GROSS PAY:</span>
                        <span className="font-bold">${personalData.currentSalary.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="mb-4">
                    <h5 className="font-bold text-gray-800 mb-2 text-sm">DEDUCTIONS</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Federal Tax:</span>
                        <span className="font-semibold">-${taxInfo.federalTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>State Tax:</span>
                        <span className="font-semibold">-${taxInfo.stateTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Social Security:</span>
                        <span className="font-semibold">-${taxInfo.socialSecurity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medicare:</span>
                        <span className="font-semibold">-${taxInfo.medicare.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other:</span>
                        <span className="font-semibold">-${taxInfo.miscDeductions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-semibold">TOTAL DEDUCTIONS:</span>
                        <span className="font-bold text-red-600">-${taxInfo.totalTax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="bg-green-100 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-800">NET PAY:</span>
                      <span className="text-xl font-bold text-green-900">${taxInfo.afterTaxIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs">
                      <span className="text-green-700">Monthly:</span>
                      <span className="font-semibold text-green-800">${(taxInfo.afterTaxIncome / 12).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-green-700">Bi-weekly:</span>
                      <span className="font-semibold text-green-800">${(taxInfo.afterTaxIncome / 26).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">No Salary Information Available</h2>
              <p className="text-gray-600 mb-4">
                Please set up your salary and state information from the main dashboard to view tax calculations.
              </p>
              <button
                onClick={() => setCurrentMode('personal')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard Setup
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentMode = () => {
    switch (currentMode) {
      case 'personal':
        return renderPersonalMode();
      case 'salary':
        return renderSalaryPage();
      case 'expenses':
        return renderExpensesPage();
      case 'realistic':
        return renderRealisticMode();
      case 'custom':
        return renderCustomMode();
      default:
        return renderSelectionPage();
    }
  };

  const renderRealisticMode = () => (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentMode('selection')}
          className="flex items-center text-green-600 hover:text-green-800 mr-4"
        >
          ← Back to Selection
        </button>
        <Globe className="h-8 w-8 text-green-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Realistic Financial Scenarios</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon!</h2>
        <p className="text-lg text-gray-600 mb-6">
          Experience real-world financial challenges including market crashes, economic recessions, 
          unexpected expenses, and learn how to navigate them successfully.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">Market Crashes</h3>
            <p className="text-sm text-red-600">Learn to weather economic downturns</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Job Loss</h3>
            <p className="text-sm text-blue-600">Navigate unemployment periods</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Medical Emergencies</h3>
            <p className="text-sm text-yellow-600">Handle unexpected health costs</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Windfalls</h3>
            <p className="text-sm text-green-600">Manage sudden wealth responsibly</p>
          </div>
        </div>
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
          ← Back to Selection
        </button>
        <Target className="h-8 w-8 text-purple-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Custom Financial Simulation</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Advanced Simulations Coming Soon!</h2>
        <p className="text-lg text-gray-600 mb-6">
          Create custom scenarios with specific market conditions, life events, and complex investment strategies.
          Design your own financial challenges and test different approaches.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Custom Market Conditions</h3>
            <p className="text-sm text-purple-600">Set specific economic scenarios</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Life Event Designer</h3>
            <p className="text-sm text-indigo-600">Create specific challenges</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <h3 className="font-semibold text-pink-800 mb-2">Investment Strategies</h3>
            <p className="text-sm text-pink-600">Test complex portfolios</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {renderCurrentMode()}
    </div>
  );
};
