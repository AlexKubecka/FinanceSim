import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, BarChart3, TrendingUp, DollarSign, User, Target, Receipt, Globe, RotateCcw } from 'lucide-react';

// Add Edit3 icon for the edit button

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy';

interface PersonalFinancialData {
  // Basic Info
  age: number;
  currentSalary: number;
  state: string;
  
  // Career details
  careerField: 'Tech' | 'Government' | 'Service' | '';
  match401k: number; // percentage (0-100)
  contributions401k: number; // percentage (0-100) - DEPRECATED: keeping for backward compatibility
  contributions401kTraditional: number; // percentage (0-100)
  contributions401kRoth: number; // percentage (0-100)
  contribution401kType: 'traditional' | 'roth'; // DEPRECATED: keeping for backward compatibility
  cashBonus: number;
  stockBonus: number;
  
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
  inflation: number;
  stockMarketValue: number;
}

interface EconomicState {
  currentInflationRate: number; // Annual inflation rate (e.g., 0.03 for 3%)
  cumulativeInflation: number; // Total inflation since start (multiplier)
  stockMarketIndex: number; // Stock market index value (starts at 100)
  stockMarketGrowth: number; // Annual growth rate
  economicCycle: 'expansion' | 'peak' | 'recession' | 'trough' | 'depression'; // Economic cycle phase
  yearsInCurrentCycle: number; // How long in current cycle
}

export const LifeSimulator: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<SimulationMode>('selection');
  const [personalData, setPersonalData] = useState<PersonalFinancialData>({
    age: 0,
    currentSalary: 0,
    state: '',
    careerField: '',
    match401k: 0,
    contributions401k: 0, // DEPRECATED
    contributions401kTraditional: 0,
    contributions401kRoth: 0,
    contribution401kType: 'traditional', // DEPRECATED
    cashBonus: 0,
    stockBonus: 0,
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
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Economic state
  const [economicState, setEconomicState] = useState<EconomicState>({
    currentInflationRate: 0.025, // Start with 2.5% inflation
    cumulativeInflation: 1.0, // No inflation yet
    stockMarketIndex: 5000, // Start at S&P 500-like level
    stockMarketGrowth: 0.10, // 10% average annual growth (including dividends)
    economicCycle: 'expansion',
    yearsInCurrentCycle: 0
  });

  // Track previous year's stock market value for year-over-year growth calculation
  // Use a ref to track the current stock market value for immediate updates
  const currentStockIndexRef = useRef<number>(5000);
  
  // Track years in current economic cycle with a ref for immediate updates
  const yearsInCurrentCycleRef = useRef<number>(0);
  
  // Track current economic cycle with a ref for immediate updates
  const currentEconomicCycleRef = useRef<'expansion' | 'peak' | 'recession' | 'trough' | 'depression'>('expansion');

  // Store original salary to reset to after inflation adjustments
  const originalSalaryRef = useRef<number>(0);

  // Financial tracking
  const [financials, setFinancials] = useState({
    currentSalary: 0,
    netWorth: 0,
    annualExpenses: 0,
    investments: 0,
    investmentAccountValue: 0
  });

  // Track if simulation has ever been started
  const [hasStarted, setHasStarted] = useState(false);
  
  // Track if user has completed the initial setup
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1: Basic Info, 2: Job Info
  
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
  
  // Inflation-adjusted base costs (starts with state averages, then gets adjusted each year)
  const [inflationAdjustedRentData, setInflationAdjustedRentData] = useState<{ [key: string]: number }>({});
  const [inflationAdjustedGroceryData, setInflationAdjustedGroceryData] = useState<{ [key: string]: number }>({});
  
  // Rent editing state
  const [editingRent, setEditingRent] = useState(false);
  const [tempRentValue, setTempRentValue] = useState<string>('');
  
  // Grocery editing state
  const [editingGrocery, setEditingGrocery] = useState(false);
  const [tempGroceryValue, setTempGroceryValue] = useState<string>('');

  const intervalRef = useRef<number | null>(null);

  // Economic simulation function
  const simulateEconomicStep = (currentEconomic: EconomicState, previousYearIndex: number): EconomicState => {
    let newEconomic = { ...currentEconomic };
    
    // Update years in current cycle FIRST
    newEconomic.yearsInCurrentCycle += 1;
    
    // Economic cycle transitions (realistic business cycle with multiple possible paths)
    // Note: For testing, you can temporarily reduce these durations
    // Use the NEW years count for transition checks
    switch (currentEconomic.economicCycle) {
      case 'expansion':
        // Normal: 6-10 years, Testing: 2-4 years
        if (newEconomic.yearsInCurrentCycle >= 2 + Math.random() * 2) { // Shortened for testing
          const transitionRoll = Math.random();
          if (transitionRoll < 0.7) {
            // 70% chance: Normal progression to peak
            newEconomic.economicCycle = 'peak';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: expansion → peak');
          } else if (transitionRoll < 0.9) {
            // 20% chance: Extended expansion (reset cycle)
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: expansion → extended expansion');
          } else {
            // 10% chance: Sudden recession (economic shock)
            newEconomic.economicCycle = 'recession';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: expansion → sudden recession');
          }
        }
        break;
      case 'peak':
        if (newEconomic.yearsInCurrentCycle >= 1) {
          const transitionRoll = Math.random();
          if (transitionRoll < 0.55) {
            // 55% chance: Normal progression to recession
            newEconomic.economicCycle = 'recession';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: peak → recession');
          } else if (transitionRoll < 0.85) {
            // 30% chance: Back to expansion (soft landing)
            newEconomic.economicCycle = 'expansion';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: peak → soft landing to expansion');
          } else if (transitionRoll < 0.98) {
            // 13% chance: Extended peak
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: peak → extended peak');
          } else {
            // 2% chance: Severe depression (very rare)
            newEconomic.economicCycle = 'depression';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: peak → severe depression (rare event)');
          }
        }
        break;
      case 'recession':
        if (newEconomic.yearsInCurrentCycle >= 1 + Math.random() * 2) { // 1-3 years
          const transitionRoll = Math.random();
          if (transitionRoll < 0.5) {
            // 50% chance: Normal progression to trough
            newEconomic.economicCycle = 'trough';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: recession → trough');
          } else if (transitionRoll < 0.8) {
            // 30% chance: Direct recovery to expansion (V-shaped recovery)
            newEconomic.economicCycle = 'expansion';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: recession → V-shaped recovery to expansion');
          } else if (transitionRoll < 0.99) {
            // 19% chance: Extended recession
            newEconomic.yearsInCurrentCycle = Math.max(0, newEconomic.yearsInCurrentCycle - 1);
            console.log('🔄 Economic cycle transition: recession → extended recession');
          } else {
            // 1% chance: Recession deepens to depression (very rare)
            newEconomic.economicCycle = 'depression';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: recession → depression (rare deepening)');
          }
        }
        break;
      case 'trough':
        if (newEconomic.yearsInCurrentCycle >= 1) {
          const transitionRoll = Math.random();
          if (transitionRoll < 0.8) {
            // 80% chance: Normal progression to expansion
            newEconomic.economicCycle = 'expansion';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: trough → expansion');
          } else {
            // 20% chance: Extended trough (prolonged stagnation)
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: trough → extended trough');
          }
        }
        break;
      case 'depression':
        if (newEconomic.yearsInCurrentCycle >= 2 + Math.random() * 3) { // 2-5 years
          const transitionRoll = Math.random();
          if (transitionRoll < 0.6) {
            // 60% chance: Slow recovery to trough
            newEconomic.economicCycle = 'trough';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: depression → trough (slow recovery)');
          } else if (transitionRoll < 0.9) {
            // 30% chance: Extended depression
            newEconomic.yearsInCurrentCycle = Math.max(0, newEconomic.yearsInCurrentCycle - 1);
            console.log('🔄 Economic cycle transition: depression → extended depression');
          } else {
            // 10% chance: Direct recovery to expansion (rare but possible)
            newEconomic.economicCycle = 'expansion';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: depression → direct recovery to expansion');
          }
        }
        break;
    }
    
    // Calculate inflation based on economic cycle
    let baseInflation = 0.025; // 2.5% base
    switch (newEconomic.economicCycle) {
      case 'expansion':
        newEconomic.currentInflationRate = baseInflation + (Math.random() * 0.02); // 2.5-4.5%
        break;
      case 'peak':
        newEconomic.currentInflationRate = baseInflation + (Math.random() * 0.03); // 2.5-5.5%
        break;
      case 'recession':
        newEconomic.currentInflationRate = Math.max(0, baseInflation - (Math.random() * 0.015)); // 1.0-2.5%
        break;
      case 'trough':
        newEconomic.currentInflationRate = Math.max(0, baseInflation - (Math.random() * 0.02)); // 0.5-2.5%
        break;
      case 'depression':
        newEconomic.currentInflationRate = Math.max(-0.02, baseInflation - (Math.random() * 0.05)); // -2% to 2.5% (deflation possible)
        break;
    }
    
    // Update cumulative inflation
    newEconomic.cumulativeInflation *= (1 + newEconomic.currentInflationRate);
    
    // Calculate stock market growth based on economic cycle (S&P 500 equivalent)
    let stockGrowth = 0.10; // 10% base annual growth (including dividends)
    let volatility = 0.20; // 20% volatility (more realistic for stocks)
    
    switch (newEconomic.economicCycle) {
      case 'expansion':
        stockGrowth = 0.12 + (Math.random() * 0.08); // 12-20% (bull market)
        break;
      case 'peak':
        stockGrowth = 0.05 + (Math.random() * 0.10); // 5-15% (volatile)
        break;
      case 'recession':
        stockGrowth = -0.15 + (Math.random() * 0.10); // -15% to -5% (moderate bear market)
        break;
      case 'trough':
        stockGrowth = -0.10 + (Math.random() * 0.15); // -10% to +5% (recovery)
        break;
      case 'depression':
        stockGrowth = -0.40 + (Math.random() * 0.15); // -40% to -25% (severe bear market)
        break;
    }
    
    // Add some random volatility (monthly variations averaged over the year)
    const randomFactor = (Math.random() - 0.5) * volatility;
    const actualGrowthRate = stockGrowth + randomFactor;
    
    // Calculate the new stock market index value
    const newStockMarketIndex = currentEconomic.stockMarketIndex * (1 + actualGrowthRate);
    
    // Calculate year-over-year growth based on previous year's index
    newEconomic.stockMarketGrowth = previousYearIndex > 0 
      ? (newStockMarketIndex - previousYearIndex) / previousYearIndex
      : actualGrowthRate;
    
    // Debug logging for economic cycle and stock market calculation
    console.log('Economic Cycle Debug:', {
      previousCycle: currentEconomic.economicCycle,
      newCycle: newEconomic.economicCycle,
      yearsInCycle: newEconomic.yearsInCurrentCycle,
      transitionTriggered: currentEconomic.economicCycle !== newEconomic.economicCycle
    });
    
    console.log('Stock Market Debug:', {
      previousYearIndex,
      currentStockIndex: currentEconomic.stockMarketIndex,
      newStockMarketIndex,
      actualGrowthRate,
      calculatedYoYGrowth: newEconomic.stockMarketGrowth,
      economicCycle: newEconomic.economicCycle
    });
    
    // Update stock market index
    newEconomic.stockMarketIndex = newStockMarketIndex;
    
    return newEconomic;
  };

  // Main simulation step function
  const runSimulationStep = () => {
    let newAge = simulationProgress.currentAge;
    
    // Use the current ref value as the previous year for YoY calculation
    const previousYearValue = currentStockIndexRef.current;
    
    // Create updated economic state with current stock market index AND years in cycle AND economic cycle
    const currentEconomicState = {
      ...economicState,
      stockMarketIndex: currentStockIndexRef.current,
      yearsInCurrentCycle: yearsInCurrentCycleRef.current,
      economicCycle: currentEconomicCycleRef.current
    };
    
    // Use the tracked previous year stock index for YoY calculation
    const newEconomicState = simulateEconomicStep(currentEconomicState, previousYearValue);
    setEconomicState(newEconomicState);
    
    // Update all refs (for immediate access)
    currentStockIndexRef.current = newEconomicState.stockMarketIndex;
    yearsInCurrentCycleRef.current = newEconomicState.yearsInCurrentCycle;
    currentEconomicCycleRef.current = newEconomicState.economicCycle;
    
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

    // Update financials with inflation effects
    let newInvestmentValue = 0;
    setPersonalData(prev => {
      let newData = { ...prev };
      
      // Adjust salary for inflation (salary typically keeps up partially with inflation)
      const salaryInflationAdjustment = 1 + (newEconomicState.currentInflationRate * 0.8); // 80% inflation adjustment
      newData.currentSalary = prev.currentSalary * salaryInflationAdjustment;

      return newData;
    });

    // Calculate investment growth
    setFinancials(prevFinancials => {
      // Calculate 401k contributions
      const annual401kTraditional = personalData.contributions401kTraditional > 0 ? 
        (personalData.currentSalary * personalData.contributions401kTraditional / 100) : 0;
      const annual401kRoth = personalData.contributions401kRoth > 0 ? 
        (personalData.currentSalary * personalData.contributions401kRoth / 100) : 0;
      const annual401kContribution = annual401kTraditional + annual401kRoth;
      const employerMatch = Math.min(
        annual401kContribution,
        personalData.currentSalary * personalData.match401k / 100
      );
      const total401kContribution = annual401kContribution + employerMatch;

      // Calculate monthly investment contributions (non-401k)
      const annualMonthlyInvestments = personalData.monthlyInvestment * 12;

      // Apply investment growth to existing portfolio
      // Use stock market growth rate from economic simulation
      const investmentGrowthRate = newEconomicState.stockMarketGrowth;
      const previousInvestmentValue = prevFinancials.investmentAccountValue;
      
      // Calculate new investment value: previous value grows + new contributions
      newInvestmentValue = (previousInvestmentValue * (1 + investmentGrowthRate)) + 
                          total401kContribution + annualMonthlyInvestments;

      return {
        ...prevFinancials,
        investmentAccountValue: newInvestmentValue,
        investments: newInvestmentValue, // Keep both for compatibility
      };
    });

    // Apply inflation to housing and grocery costs
    setUserRentData(prev => {
      if (!personalData.state) return prev;
      
      const newRentData = { ...prev };
      const currentInflationRate = newEconomicState.currentInflationRate;
      
      // If user has custom rent data for their state, apply inflation to it
      if (prev[personalData.state]) {
        newRentData[personalData.state] = prev[personalData.state] * (1 + currentInflationRate);
      }
      
      return newRentData;
    });

    setUserGroceryData(prev => {
      if (!personalData.state) return prev;
      
      const newGroceryData = { ...prev };
      const currentInflationRate = newEconomicState.currentInflationRate;
      
      // If user has custom grocery data for their state, apply inflation to it
      if (prev[personalData.state]) {
        newGroceryData[personalData.state] = prev[personalData.state] * (1 + currentInflationRate);
      }
      
      return newGroceryData;
    });

    // Apply inflation to base state costs (affects all states, representing regional inflation)
    setInflationAdjustedRentData(prev => {
      const newRentData = { ...prev };
      const currentInflationRate = newEconomicState.currentInflationRate;
      
      // If this is the first simulation step, initialize with current state data
      if (Object.keys(prev).length === 0) {
        Object.keys(stateRentData).forEach(state => {
          newRentData[state] = stateRentData[state];
        });
      } else {
        // Apply inflation to all state costs
        Object.keys(prev).forEach(state => {
          newRentData[state] = prev[state] * (1 + currentInflationRate);
        });
      }
      
      return newRentData;
    });

    setInflationAdjustedGroceryData(prev => {
      const newGroceryData = { ...prev };
      const currentInflationRate = newEconomicState.currentInflationRate;
      
      // If this is the first simulation step, initialize with current state data
      if (Object.keys(prev).length === 0) {
        Object.keys(stateGroceryData).forEach(state => {
          newGroceryData[state] = stateGroceryData[state];
        });
      } else {
        // Apply inflation to all state costs
        Object.keys(prev).forEach(state => {
          newGroceryData[state] = prev[state] * (1 + currentInflationRate);
        });
      }
      
      return newGroceryData;
    });

    // Calculate proper net worth: Assets - Liabilities
    // Net worth = Cash savings + Investment accounts + 401k balance - Debt
    const updatedAnnualExpenses = financials.annualExpenses * (1 + newEconomicState.currentInflationRate);
    
    // Update personalData savings based on cash flow this year
    let updatedSavings = personalData.savings;
    setPersonalData(prev => {
      const contribution401kTraditional = prev.currentSalary * prev.contributions401kTraditional / 100;
      const contribution401kRoth = prev.currentSalary * prev.contributions401kRoth / 100;
      const simulationYear = simulationProgress.currentDate.getFullYear();
      const taxInfo = calculateTaxes(prev.currentSalary, prev.state, contribution401kTraditional, contribution401kRoth, simulationYear);
      const annualCashFlow = taxInfo.afterTaxIncome - updatedAnnualExpenses;
      
      updatedSavings = prev.savings + annualCashFlow;
      return {
        ...prev,
        savings: updatedSavings
      };
    });
    
    const calculatedNetWorth = updatedSavings + newInvestmentValue;

    // Update net worth with proper calculation
    setFinancials(prev => ({
      ...prev,
      netWorth: calculatedNetWorth,
      currentSalary: personalData.currentSalary,
      annualExpenses: updatedAnnualExpenses // Update expenses for inflation
    }));

    // Record historical data with the updated values
    setHistoricalData(prev => {
      const newPoint: HistoricalDataPoint = {
        age: newAge,
        netWorth: calculatedNetWorth,
        salary: personalData.currentSalary,
        investments: newInvestmentValue,
        debt: 0,
        timestamp: new Date(),
        inflation: newEconomicState.currentInflationRate,
        stockMarketValue: newEconomicState.stockMarketIndex
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
      
      // Store the original salary value before any inflation adjustments
      originalSalaryRef.current = personalData.currentSalary;
      
      setSimulationProgress(prev => ({
        ...prev,
        startDate: new Date(),
        currentDate: new Date(),
        currentAge: personalData.age,
        yearsElapsed: 0,
        monthsElapsed: 0,
        daysElapsed: 0
      }));
      
      // Initialize historical data with the starting point using proper net worth calculation
      const initialNetWorth = personalData.savings + financials.investmentAccountValue;
      
      setHistoricalData([{
        age: personalData.age,
        netWorth: initialNetWorth,
        salary: personalData.currentSalary,
        investments: financials.investmentAccountValue,
        debt: 0,
        timestamp: new Date(),
        inflation: economicState.currentInflationRate,
        stockMarketValue: economicState.stockMarketIndex
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
    const newSalary = personalData.currentSalary * (1 + salaryIncrease);
    
    setPersonalData(prev => ({
      ...prev,
      currentSalary: newSalary
    }));
    setFinancials(prev => ({
      ...prev,
      currentSalary: newSalary
    }));
    
    // Update original salary reference if this is a permanent change
    if (hasStarted) {
      originalSalaryRef.current = newSalary;
    }
    
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
    const newSalary = personalData.currentSalary * (1 - salaryDecrease);
    
    setPersonalData(prev => ({
      ...prev,
      currentSalary: newSalary
    }));
    setFinancials(prev => ({
      ...prev,
      currentSalary: newSalary
    }));
    
    // Update original salary reference if this is a permanent change
    if (hasStarted) {
      originalSalaryRef.current = newSalary;
    }
    
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
    
    // Update original salary reference if this is a permanent change
    if (hasStarted) {
      originalSalaryRef.current = 0;
    }
    
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
      
      // Update original salary reference if this is a permanent change
      if (hasStarted) {
        originalSalaryRef.current = salary;
      }
      
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
    setSetupCompleted(false);
    setSetupStep(1);
    setSalaryActionTaken(false);
    setRecentEvents([]);
    
    // Reset economic state
    setEconomicState({
      currentInflationRate: 0.025,
      cumulativeInflation: 1.0,
      stockMarketIndex: 5000,
      stockMarketGrowth: 0.10,
      economicCycle: 'expansion',
      yearsInCurrentCycle: 0
    });
    
    // Reset all refs
    currentStockIndexRef.current = 5000;
    yearsInCurrentCycleRef.current = 0;
    currentEconomicCycleRef.current = 'expansion';
    
    // Reset inflation-adjusted cost data
    setInflationAdjustedRentData({});
    setInflationAdjustedGroceryData({});
    
    // Reset salary back to original value (before inflation adjustments)
    if (originalSalaryRef.current > 0) {
      setPersonalData(prev => ({
        ...prev,
        savings: 0,
        currentSalary: originalSalaryRef.current
      }));
      
      // Recalculate annual expenses without inflation adjustments
      const originalAnnualExpenses = calculateAnnualExpenses();
      
      setFinancials(prev => ({
        ...prev,
        netWorth: 0,
        currentSalary: originalSalaryRef.current,
        annualExpenses: originalAnnualExpenses,
        investments: 0,
        investmentAccountValue: 0
      }));
    } else {
      // Reset savings to 0
      setPersonalData(prev => ({
        ...prev,
        savings: 0
      }));
      
      setFinancials(prev => ({
        ...prev,
        netWorth: 0,
        investments: 0,
        investmentAccountValue: 0
      }));
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Persistent Simulation Controls Component
  const renderSimulationControls = () => {
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Simulation Controls */}
            <div className="flex items-center space-x-4">
              {/* Start/Resume/Pause Button */}
              {!hasStarted ? (
                <button
                  onClick={startSimulation}
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Simulation
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
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={resetSimulation}
                className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>

              {/* Edit Profile Button */}
              <button
                onClick={() => {
                  setPersonalData(prev => ({ ...prev, age: 0, currentSalary: 0, state: '' }));
                  setFinancials(prev => ({ ...prev, currentSalary: 0 }));
                  setCurrentMode('selection');
                }}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>

            {/* Right side - Simulation Progress */}
            {hasStarted && (
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{simulationProgress.currentAge}</div>
                    <div className="text-xs text-gray-600">Age</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{simulationProgress.yearsElapsed}</div>
                    <div className="text-xs text-gray-600">Years</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{Math.max(0, personalData.retirementAge - simulationProgress.currentAge)}</div>
                    <div className="text-xs text-gray-600">To Retire</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-semibold capitalize ${
                      simulationState === 'running' ? 'text-green-600' : 
                      simulationState === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {simulationState}
                    </div>
                    <div className="text-xs text-gray-600">Status</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
    // If user has custom rent data, use that (already inflation-adjusted during simulation)
    if (userRentData[state]) {
      return userRentData[state];
    }
    
    // If simulation is running and we have inflation-adjusted data, use that
    if (hasStarted && inflationAdjustedRentData[state]) {
      return inflationAdjustedRentData[state];
    }
    
    // Otherwise use the original state data
    return stateRentData[state] ?? 0;
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
    // If user has custom grocery data, use that (already inflation-adjusted during simulation)
    if (userGroceryData[state]) {
      return userGroceryData[state];
    }
    
    // If simulation is running and we have inflation-adjusted data, use that
    if (hasStarted && inflationAdjustedGroceryData[state]) {
      return inflationAdjustedGroceryData[state];
    }
    
    // Otherwise use the original state data
    return stateGroceryData[state] ?? 0;
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

  // Calculate current year's 401k contribution limit
  const get401kLimit = (year?: number): number => {
    const currentYear = year || new Date().getFullYear();
    const baseYear = 2025;
    const baseLimit = 23500;
    const annualIncrease = 500;
    
    if (currentYear < baseYear) {
      // For years before 2025, use historical limits or approximate
      return baseLimit - (annualIncrease * (baseYear - currentYear));
    }
    
    return baseLimit + (annualIncrease * (currentYear - baseYear));
  };

  // Tax calculation function using 2025 tax brackets (single filer)
  const calculateTaxes = (annualSalary: number, state: string = personalData.state, contribution401kTraditional: number = 0, contribution401kRoth: number = 0, year?: number): { 
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
  } => {
    if (annualSalary <= 0) return { 
      totalTax: 0, 
      afterTaxIncome: 0, 
      effectiveRate: 0,
      federalTax: 0,
      stateTax: 0,
      socialSecurity: 0,
      medicare: 0,
      miscDeductions: 0,
      contribution401kTraditional: 0,
      contribution401kRoth: 0,
      totalContribution401k: 0,
      taxableIncome: 0
    };

    // Enforce 401k contribution limits
    const current401kLimit = get401kLimit(year);
    const totalContribution401k = contribution401kTraditional + contribution401kRoth;
    const cappedTotalContribution = Math.min(totalContribution401k, current401kLimit);
    
    // Proportionally reduce contributions if they exceed the limit
    const reductionFactor = totalContribution401k > 0 ? cappedTotalContribution / totalContribution401k : 1;
    const cappedTraditional = contribution401kTraditional * reductionFactor;
    const cappedRoth = contribution401kRoth * reductionFactor;

    // Calculate taxable income - Traditional 401k reduces taxable income, Roth does not
    const taxableIncome = annualSalary - cappedTraditional;

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
    let remainingIncome = taxableIncome;

    for (const bracket of federalBrackets) {
      if (remainingIncome <= 0) break;
      
      const taxableAtThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      federalTax += taxableAtThisBracket * bracket.rate;
      remainingIncome -= taxableAtThisBracket;
    }

    // Calculate state tax (also on taxable income)
    const stateRate = stateTaxRates[state] || 0;
    const stateTax = taxableIncome * stateRate;

    // Calculate Social Security and Medicare (on gross salary, not reduced by 401k)
    const socialSecurityWageBase = 160200;
    const socialSecurity = Math.min(annualSalary, socialSecurityWageBase) * 0.062;
    const medicare = annualSalary * 0.0145 + Math.max(0, annualSalary - 200000) * 0.009;
    const miscDeductions = annualSalary * 0.005;

    const totalTax = federalTax + stateTax + socialSecurity + medicare + miscDeductions;
    
    // After-tax income calculation: subtract taxes and all 401k contributions
    const afterTaxIncome = annualSalary - totalTax - cappedTotalContribution;
    
    const effectiveRate = annualSalary > 0 ? ((totalTax + cappedTotalContribution) / annualSalary) * 100 : 0;

    return { 
      totalTax, 
      afterTaxIncome, 
      effectiveRate, 
      federalTax, 
      stateTax, 
      socialSecurity, 
      medicare, 
      miscDeductions,
      contribution401kTraditional: cappedTraditional,
      contribution401kRoth: cappedRoth,
      totalContribution401k: cappedTotalContribution,
      taxableIncome
    };
  };

  // Update financials effect
  useEffect(() => {
    const annualExpenses = calculateAnnualExpenses();
    
    // Calculate proper net worth: Assets - Liabilities
    // Net worth = Cash savings + Investment accounts + 401k balance - Debt
    const netWorth = personalData.savings + financials.investmentAccountValue; // No debt currently tracked
    
    setFinancials(prev => ({
      ...prev,
      currentSalary: personalData.currentSalary,
      annualExpenses: annualExpenses,
      netWorth: netWorth
    }));
  }, [personalData.currentSalary, personalData.state, userRentData, userGroceryData, inflationAdjustedRentData, inflationAdjustedGroceryData, hasStarted]);

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
        {/* Persistent Simulation Controls */}
        {renderSimulationControls()}
        
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

  const renderInvestmentsPage = () => {
    return (
      <div className="space-y-8">
        {/* Persistent Simulation Controls */}
        {renderSimulationControls()}
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentMode('personal')}
            className="flex items-center text-purple-600 hover:text-purple-800 mr-4"
          >
            ← Back to Dashboard
          </button>
          <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Investment Planning</h1>
        </div>

        {/* 401(k) Planning */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">401(k) Retirement Planning</h2>
          
          {/* Retirement Charts */}
          {personalData.currentSalary > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Retirement Contributions Breakdown Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Annual Retirement Contributions</h3>
                <div className="space-y-4">
                  {(() => {
                    const yourTraditionalContribution = personalData.currentSalary * personalData.contributions401kTraditional / 100;
                    const yourRothContribution = personalData.currentSalary * personalData.contributions401kRoth / 100;
                    const yourTotalContribution = yourTraditionalContribution + yourRothContribution;
                    const employerMatch = Math.min(
                      yourTotalContribution,
                      personalData.currentSalary * personalData.match401k / 100
                    );
                    const maxPossibleMatch = personalData.currentSalary * personalData.match401k / 100;
                    const missedMatch = maxPossibleMatch - employerMatch;
                    const totalContribution = yourTotalContribution + employerMatch;
                    const maxTotal = yourTotalContribution + maxPossibleMatch;

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
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-800">
                                  ${totalContribution.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">Total Annual</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Legend and Details */}
                        <div className="space-y-3">
                          {yourTraditionalContribution > 0 && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                                <span className="text-sm font-medium text-gray-700">Traditional 401(k)</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-900">
                                  ${yourTraditionalContribution.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {personalData.contributions401kTraditional.toFixed(2)}% of salary
                                </div>
                              </div>
                            </div>
                          )}

                          {yourRothContribution > 0 && (
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                                <span className="text-sm font-medium text-gray-700">Roth 401(k)</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-900">
                                  ${yourRothContribution.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {personalData.contributions401kRoth.toFixed(2)}% of salary
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                              <span className="text-sm font-medium text-gray-700">Employer Match</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-900">
                                ${employerMatch.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600">
                                {((employerMatch / personalData.currentSalary) * 100).toFixed(1)}% of salary
                              </div>
                            </div>
                          </div>

                          {missedMatch > 0 && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                                <span className="text-sm font-medium text-red-700">Missed Match</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-red-900">
                                  -${missedMatch.toLocaleString()}
                                </div>
                                <div className="text-xs text-red-600">
                                  Free money left behind
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Potential Maximum</span>
                              <span className="text-sm font-bold text-gray-900">
                                ${maxTotal.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              With full employer match at {personalData.match401k}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Future Retirement Projections Line Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Future Retirement Projections</h3>
                <div className="space-y-4">
                  {(() => {
                    const projectionData: { age: number; value: number; years: number }[] = [];
                    const currentAge = personalData.age || 25;
                    const retirementAge = personalData.retirementAge || 65;
                    const annualYourContribution = 
                      (personalData.currentSalary * personalData.contributions401kTraditional / 100) + 
                      (personalData.currentSalary * personalData.contributions401kRoth / 100);
                    const annualContribution = annualYourContribution > 0 ? 
                      annualYourContribution + Math.min(
                        annualYourContribution,
                        personalData.currentSalary * personalData.match401k / 100
                      ) : 0;

                    // Generate data for every year from current age to retirement age
                    for (let age = currentAge; age <= retirementAge; age++) {
                      const yearsToRetire = age - currentAge;
                      const futureValue = yearsToRetire > 0 && annualContribution > 0 ? 
                        annualContribution * (((1 + 0.07) ** yearsToRetire - 1) / 0.07) : 
                        (age === currentAge ? personalData.savings || 0 : 0);
                      projectionData.push({ age, value: futureValue, years: yearsToRetire });
                    }

                    const maxValue = Math.max(...projectionData.map(d => d.value), 100000);
                    const chartHeight = 300;
                    const chartWidth = 500;
                    const padding = 50;

                    return (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4">
                          Based on current contribution rate of {(personalData.contributions401kTraditional + personalData.contributions401kRoth).toFixed(2)}% with 7% annual return
                        </div>
                        
                        {/* SVG Line Chart */}
                        <div className="flex justify-center">
                          <svg width={chartWidth} height={chartHeight + padding * 2} className="border border-gray-200 rounded">
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                              <g key={ratio}>
                                <line
                                  x1={padding}
                                  y1={padding + chartHeight * ratio}
                                  x2={chartWidth - padding}
                                  y2={padding + chartHeight * ratio}
                                  stroke="#e5e7eb"
                                  strokeWidth="1"
                                />
                                <text
                                  x={padding - 10}
                                  y={padding + chartHeight * ratio + 4}
                                  fontSize="10"
                                  textAnchor="end"
                                  fill="#6b7280"
                                >
                                  ${(maxValue * (1 - ratio) / 1000000).toFixed(1)}M
                                </text>
                              </g>
                            ))}
                            
                            {/* X-axis labels - show every 5 years for readability */}
                            {projectionData.filter((_, index) => index % 5 === 0 || index === projectionData.length - 1).map((point) => {
                              const originalIndex = projectionData.findIndex(p => p.age === point.age);
                              return (
                                <text
                                  key={point.age}
                                  x={padding + (originalIndex * (chartWidth - 2 * padding)) / (projectionData.length - 1)}
                                  y={chartHeight + padding + 20}
                                  fontSize="10"
                                  textAnchor="middle"
                                  fill="#6b7280"
                                >
                                  {point.age}
                                </text>
                              );
                            })}
                            
                            {/* Line path */}
                            <path
                              d={projectionData.map((point, index) => {
                                const x = padding + (index * (chartWidth - 2 * padding)) / (projectionData.length - 1);
                                const y = padding + chartHeight - (point.value / maxValue) * chartHeight;
                                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                              }).join(' ')}
                              stroke="#3b82f6"
                              strokeWidth="3"
                              fill="none"
                            />
                            
                            {/* Data points - show fewer points for readability */}
                            {projectionData.filter((_, index) => index % 5 === 0 || index === projectionData.length - 1).map((point) => {
                              const originalIndex = projectionData.findIndex(p => p.age === point.age);
                              const x = padding + (originalIndex * (chartWidth - 2 * padding)) / (projectionData.length - 1);
                              const y = padding + chartHeight - (point.value / maxValue) * chartHeight;
                              return (
                                <g key={point.age}>
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#3b82f6"
                                    stroke="white"
                                    strokeWidth="2"
                                  />
                                  {/* Tooltip on hover */}
                                  <title>
                                    Age {point.age}: ${point.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                  </title>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                        
                        {annualContribution === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>Start contributing to see projections</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Enter your salary information to see retirement planning charts</p>
            </div>
          )}
        </div>

        {/* Current Investment Portfolio */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Investment Portfolio</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Total Portfolio Value</h3>
              <div className="text-3xl font-bold text-green-900 mb-1">
                ${financials.investmentAccountValue.toLocaleString()}
              </div>
              <p className="text-sm text-green-700">401(k) + Investment Accounts</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">401(k) Contributions</h3>
              <div className="text-2xl font-bold text-blue-900 mb-1">
                {(personalData.contributions401kTraditional + personalData.contributions401kRoth).toFixed(2)}%
              </div>
              <p className="text-sm text-blue-700">
                ${personalData.currentSalary > 0 ? 
                  Math.min(
                    personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100,
                    get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined)
                  ).toLocaleString() : '0'} annually
                {personalData.contributions401kTraditional > 0 && personalData.contributions401kRoth > 0 && (
                  <span className="block text-xs">
                    {personalData.contributions401kTraditional.toFixed(1)}% Traditional, {personalData.contributions401kRoth.toFixed(1)}% Roth
                  </span>
                )}
                {personalData.contributions401kTraditional > 0 && personalData.contributions401kRoth === 0 && (
                  <span className="block text-xs">Traditional</span>
                )}
                {personalData.contributions401kRoth > 0 && personalData.contributions401kTraditional === 0 && (
                  <span className="block text-xs">Roth</span>
                )}
              </p>
              {personalData.currentSalary > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  IRS limit: ${get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined).toLocaleString()} 
                  ({hasStarted ? simulationProgress.currentDate.getFullYear() : new Date().getFullYear()})
                </p>
              )}
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Monthly Investments</h3>
              <div className="text-2xl font-bold text-purple-900 mb-1">
                ${personalData.monthlyInvestment.toLocaleString()}
              </div>
              <p className="text-sm text-purple-700">
                ${(personalData.monthlyInvestment * 12).toLocaleString()} annually
              </p>
            </div>
          </div>

          {/* Portfolio Performance (if simulation has started) */}
          {hasStarted && historicalData.length > 1 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Portfolio Performance</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Investment Growth</h4>
                  {(() => {
                    const firstDataPoint = historicalData[0];
                    const lastDataPoint = historicalData[historicalData.length - 1];
                    const initialValue = firstDataPoint.investments;
                    const currentValue = lastDataPoint.investments;
                    const totalGrowth = currentValue - initialValue;
                    const growthPercentage = initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0;
                    
                    return (
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          ${totalGrowth.toLocaleString()} 
                          <span className={`text-sm ml-2 ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%)
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Since age {firstDataPoint.age} ({historicalData.length} years)
                        </p>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Stock Market Impact</h4>
                  <div className="text-lg font-bold text-gray-900">
                    Market: {economicState.stockMarketIndex.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">
                    Current market cycle: {economicState.economicCycle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasStarted && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center py-4 text-gray-500">
                <p>Start the simulation to see your portfolio grow over time!</p>
              </div>
            </div>
          )}
        </div>

        {/* Investment Strategy */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Investment Strategy</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Risk Tolerance</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-blue-600 capitalize">{personalData.riskTolerance}</span>
                <div className={`w-4 h-4 rounded-full ${
                  personalData.riskTolerance === 'conservative' ? 'bg-yellow-500' :
                  personalData.riskTolerance === 'moderate' ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>
              </div>
              <p className="text-sm text-gray-600">
                {personalData.riskTolerance === 'conservative' && 'Lower risk, steady returns'}
                {personalData.riskTolerance === 'moderate' && 'Balanced risk and growth'}
                {personalData.riskTolerance === 'aggressive' && 'Higher risk, higher potential returns'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Monthly Investment</h3>
              <div className="text-2xl font-bold text-green-600 mb-1">
                ${personalData.monthlyInvestment.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Additional investing beyond 401(k)</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Retirement Goal</h3>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                ${personalData.retirementGoal.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Target retirement savings at age {personalData.retirementAge}</p>
            </div>
          </div>

          {/* Investment Recommendations */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Recommendations</h3>
            <div className="space-y-2">
              {(personalData.contributions401kTraditional + personalData.contributions401kRoth) < personalData.match401k && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm text-blue-700">
                    <strong>Increase 401(k) contribution to {personalData.match401k}%</strong> to get full employer match. 
                    You're leaving ${((personalData.currentSalary * personalData.match401k / 100) - Math.min(
                      personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100,
                      personalData.currentSalary * personalData.match401k / 100
                    )).toLocaleString()} on the table!
                  </p>
                </div>
              )}
              
              {(personalData.contributions401kTraditional + personalData.contributions401kRoth) >= personalData.match401k && (personalData.contributions401kTraditional + personalData.contributions401kRoth) < 15 && (() => {
                const current401kLimit = get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined);
                const maxPercentage = personalData.currentSalary > 0 ? (current401kLimit / personalData.currentSalary) * 100 : 0;
                
                if (maxPercentage > 15) {
                  return (
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-blue-700">
                        Consider increasing 401(k) to 15% for better retirement security.
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-blue-700">
                        Consider maximizing 401(k) contribution to IRS limit of ${current401kLimit.toLocaleString()} ({maxPercentage.toFixed(2)}% of salary).
                      </p>
                    </div>
                  );
                }
              })()}

              {(personalData.contributions401kTraditional + personalData.contributions401kRoth) >= 15 && (() => {
                const currentContribution = personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100;
                const current401kLimit = get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined);
                const isMaxedOut = currentContribution >= current401kLimit;
                
                if (!isMaxedOut) {
                  const remainingRoom = current401kLimit - currentContribution;
                  return (
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-blue-700">
                        You can contribute ${remainingRoom.toLocaleString()} more to reach the IRS 401(k) limit of ${current401kLimit.toLocaleString()}.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-sm text-blue-700">
                  Build an emergency fund of ${((personalData.currentSalary / 12) * personalData.emergencyFundMonths).toLocaleString()} 
                  ({personalData.emergencyFundMonths} months expenses) before increasing investments.
                </p>
              </div>

              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-sm text-blue-700">
                  Consider diversified index funds for your {personalData.riskTolerance} risk profile.
                </p>
              </div>
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
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Access Tools</h2>
        <div className="grid md:grid-cols-3 gap-6">
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

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-800">Investment Planner</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Plan your investment strategy and retirement savings goals.
            </p>
            <button
              onClick={() => setCurrentMode('investments')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Plan Investments
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPersonalMode = () => {
    const contribution401kTraditional = financials.currentSalary * personalData.contributions401kTraditional / 100;
    const contribution401kRoth = financials.currentSalary * personalData.contributions401kRoth / 100;
    const taxInfo = calculateTaxes(financials.currentSalary, personalData.state, contribution401kTraditional, contribution401kRoth);

    // If basic info not complete OR user hasn't clicked continue, show setup screen
    if (!personalData.age || !personalData.currentSalary || !personalData.state || !personalData.careerField || !setupCompleted) {
      return (
        <div className="space-y-8">
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
            <h1 className="text-3xl font-bold text-gray-800">Personal Financial Setup</h1>
          </div>

          {/* Basic Information Setup */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  setupStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`w-16 h-1 ${setupStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  setupStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
              </div>
            </div>

            {setupStep === 1 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Personal Information</h2>
                <p className="text-center text-gray-600 mb-8">Let's start with some basic information about you.</p>
                
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

                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setPersonalData(prev => ({ ...prev, age: 0, state: '' }));
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors text-lg font-semibold"
                    >
                      Clear
                    </button>
                    
                    <button
                      onClick={() => {
                        if (personalData.age && personalData.state) {
                          setSetupStep(2);
                        }
                      }}
                      disabled={!personalData.age || !personalData.state}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
                    >
                      Next: Job Info
                    </button>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 2 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Job & Financial Information</h2>
                <p className="text-center text-gray-600 mb-8">Now let's set up your employment and 401(k) details. You can skip fields you're unsure about.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Annual Salary</label>
                    <input
                      type="number"
                      value={personalData.currentSalary || ''}
                      onChange={(e) => {
                        const salary = parseFloat(e.target.value) || 0;
                        const roundedSalary = Math.round(salary * 100) / 100;
                        setPersonalData(prev => ({ ...prev, currentSalary: roundedSalary }));
                        setFinancials(prev => ({ ...prev, currentSalary: roundedSalary }));
                        originalSalaryRef.current = roundedSalary;
                      }}
                      placeholder="Enter your annual salary"
                      className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Career Field</label>
                    <select
                      value={personalData.careerField}
                      onChange={(e) => {
                        const newField = e.target.value as PersonalFinancialData['careerField'];
                        setPersonalData(prev => ({
                          ...prev,
                          careerField: newField,
                          stockBonus: (newField === 'Government' || newField === 'Service') ? 0 : prev.stockBonus
                        }));
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                    >
                      <option value="">Select career field...</option>
                      <option value="Tech">Tech</option>
                      <option value="Government">Government</option>
                      <option value="Service">Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">401(k) Company Match (%)</label>
                    <input
                      type="number"
                      value={personalData.match401k}
                      onChange={(e) => setPersonalData(prev => ({
                        ...prev,
                        match401k: Math.max(0, Math.min(100, Math.round(Number(e.target.value) * 100) / 100))
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      max="100"
                    />
                    <p className="text-sm text-gray-500 mt-1">Percentage of salary matched by employer</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Traditional 401(k) (%)</label>
                      <input
                        type="number"
                        value={personalData.contributions401kTraditional}
                        onChange={(e) => {
                          const percentage = Number(e.target.value);
                          const roundedPercentage = Math.round(percentage * 100) / 100;
                          const current401kLimit = get401kLimit();
                          const totalCurrent = personalData.contributions401kRoth;
                          const maxPercentage = personalData.currentSalary > 0 ? Math.floor(((current401kLimit / personalData.currentSalary) * 100) * 100) / 100 : 100;
                          const maxTraditional = Math.max(0, maxPercentage - totalCurrent);
                          
                          setPersonalData(prev => ({
                            ...prev,
                            contributions401kTraditional: Math.max(0, Math.min(maxTraditional, roundedPercentage))
                          }));
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">Pre-tax contribution</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Roth 401(k) (%)</label>
                      <input
                        type="number"
                        value={personalData.contributions401kRoth}
                        onChange={(e) => {
                          const percentage = Number(e.target.value);
                          const roundedPercentage = Math.round(percentage * 100) / 100;
                          const current401kLimit = get401kLimit();
                          const totalCurrent = personalData.contributions401kTraditional;
                          const maxPercentage = personalData.currentSalary > 0 ? Math.floor(((current401kLimit / personalData.currentSalary) * 100) * 100) / 100 : 100;
                          const maxRoth = Math.max(0, maxPercentage - totalCurrent);
                          
                          setPersonalData(prev => ({
                            ...prev,
                            contributions401kRoth: Math.max(0, Math.min(maxRoth, roundedPercentage))
                          }));
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">After-tax contribution</p>
                    </div>
                  </div>

                  {personalData.currentSalary > 0 && (personalData.contributions401kTraditional > 0 || personalData.contributions401kRoth > 0) && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Total 401(k): ${Math.min(
                          personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100,
                          get401kLimit()
                        ).toLocaleString()} annually
                        <span className="block text-xs">
                          IRS limit: ${get401kLimit().toLocaleString()}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setSetupStep(1)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors text-lg font-semibold"
                    >
                      ← Previous
                    </button>
                    
                    <button
                      onClick={() => {
                        if (personalData.currentSalary && personalData.careerField) {
                          setSetupCompleted(true);
                        }
                      }}
                      disabled={!personalData.currentSalary || !personalData.careerField}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
                    >
                      Start Simulation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Dashboard view when setup is complete
    return (
      <div className="space-y-8">
        {/* Persistent Simulation Controls */}
        {renderSimulationControls()}
        
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
        <div className="grid md:grid-cols-4 gap-6">
          {/* Net Worth Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
               onClick={() => alert('Net Worth details coming soon!')}>
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
              ${financials.netWorth.toLocaleString()}
            </div>
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
                <p className="text-sm text-gray-600">401(k) Rate</p>
                <p className="text-lg font-bold text-purple-600">
                  {(personalData.contributions401kTraditional + personalData.contributions401kRoth).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                <p className="text-lg font-bold text-purple-600 capitalize">
                  {personalData.riskTolerance}
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
              <p className="text-sm text-gray-600 mb-1">Monthly Surplus</p>
              <p className={`text-2xl font-bold ${((taxInfo.afterTaxIncome - financials.annualExpenses) / 12) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                ${(((taxInfo.afterTaxIncome - financials.annualExpenses) / 12)).toLocaleString()}
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

  const renderSalaryPage = () => {
    const contribution401kTraditional = personalData.currentSalary * personalData.contributions401kTraditional / 100;
    const contribution401kRoth = personalData.currentSalary * personalData.contributions401kRoth / 100;
    const taxInfo = calculateTaxes(personalData.currentSalary, personalData.state, contribution401kTraditional, contribution401kRoth);

    return (
      <div className="space-y-8">
        {/* Persistent Simulation Controls */}
        {renderSimulationControls()}
        
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

        {/* Career Details */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Career Details</h2>
          <p className="text-sm text-gray-600 mb-6">Manage your career information and compensation details</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="careerField" className="block text-sm font-medium text-gray-700 mb-2">
                  Career Field
                </label>
                <select
                  id="careerField"
                  value={personalData.careerField}
                  onChange={(e) => {
                    const newField = e.target.value as PersonalFinancialData['careerField'];
                    setPersonalData(prev => ({
                      ...prev,
                      careerField: newField,
                      // Reset stock bonus if switching to Government or Service
                      stockBonus: (newField === 'Government' || newField === 'Service') ? 0 : prev.stockBonus
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select career field...</option>
                  <option value="Tech">Tech</option>
                  <option value="Government">Government</option>
                  <option value="Service">Service</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="match401k" className="block text-sm font-medium text-gray-700 mb-2">
                  401(k) Company Match (%)
                </label>
                <input
                  type="number"
                  id="match401k"
                  value={personalData.match401k}
                  onChange={(e) => setPersonalData(prev => ({
                    ...prev,
                    match401k: Math.max(0, Math.min(100, Math.round(Number(e.target.value) * 100) / 100))
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">Percentage of salary matched by employer</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  401(k) Traditional Contributions (%)
                </label>
                <input
                  type="number"
                  id="contributions401kTraditional"
                  value={personalData.contributions401kTraditional}
                  onChange={(e) => {
                    const percentage = Number(e.target.value);
                    const roundedPercentage = Math.round(percentage * 100) / 100; // Limit to 2 decimal places
                    const current401kLimit = get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined);
                    const totalCurrent = personalData.contributions401kRoth;
                    const maxPercentage = personalData.currentSalary > 0 ? Math.floor(((current401kLimit / personalData.currentSalary) * 100) * 100) / 100 : 100;
                    const maxTraditional = Math.max(0, maxPercentage - totalCurrent);
                    
                    setPersonalData(prev => ({
                      ...prev,
                      contributions401kTraditional: Math.max(0, Math.min(maxTraditional, roundedPercentage))
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  max={personalData.currentSalary > 0 ? (Math.floor(((get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined) / personalData.currentSalary) * 100) * 100) / 100 - personalData.contributions401kRoth).toFixed(2) : "100"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pre-tax percentage of salary (reduces current taxable income)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  401(k) Roth Contributions (%)
                </label>
                <input
                  type="number"
                  id="contributions401kRoth"
                  value={personalData.contributions401kRoth}
                  onChange={(e) => {
                    const percentage = Number(e.target.value);
                    const roundedPercentage = Math.round(percentage * 100) / 100; // Limit to 2 decimal places
                    const current401kLimit = get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined);
                    const totalCurrent = personalData.contributions401kTraditional;
                    const maxPercentage = personalData.currentSalary > 0 ? Math.floor(((current401kLimit / personalData.currentSalary) * 100) * 100) / 100 : 100;
                    const maxRoth = Math.max(0, maxPercentage - totalCurrent);
                    
                    setPersonalData(prev => ({
                      ...prev,
                      contributions401kRoth: Math.max(0, Math.min(maxRoth, roundedPercentage))
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  max={personalData.currentSalary > 0 ? (Math.floor(((get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined) / personalData.currentSalary) * 100) * 100) / 100 - personalData.contributions401kTraditional).toFixed(2) : "100"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  After-tax percentage of salary (tax-free at withdrawal)
                  {personalData.currentSalary > 0 && (
                    <span className="block">
                      Combined total: ${Math.min(
                        personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100, 
                        get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined)
                      ).toLocaleString()} 
                      (IRS limit: ${get401kLimit(hasStarted ? simulationProgress.currentDate.getFullYear() : undefined).toLocaleString()})
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="cashBonus" className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Cash Bonus ($)
                </label>
                <input
                  type="number"
                  id="cashBonus"
                  value={personalData.cashBonus}
                  onChange={(e) => setPersonalData(prev => ({
                    ...prev,
                    cashBonus: Math.max(0, Math.round(Number(e.target.value) * 100) / 100)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Expected annual cash bonus</p>
              </div>
              
              <div>
                <label htmlFor="stockBonus" className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Stock Bonus ($)
                </label>
                <input
                  type="number"
                  id="stockBonus"
                  value={personalData.stockBonus}
                  onChange={(e) => setPersonalData(prev => ({
                    ...prev,
                    stockBonus: Math.max(0, Math.round(Number(e.target.value) * 100) / 100)
                  }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    personalData.careerField === 'Government' || personalData.careerField === 'Service' 
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : ''
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  disabled={personalData.careerField === 'Government' || personalData.careerField === 'Service'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {personalData.careerField === 'Government' || personalData.careerField === 'Service' 
                    ? 'Stock bonuses not typically available in this field' 
                    : 'Expected annual stock/equity compensation'
                  }
                </p>
              </div>

              {/* 401(k) Match Calculation Display */}
              {personalData.match401k > 0 && personalData.currentSalary > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">401(k) Match Info</h4>
                  <p className="text-xs text-blue-700">
                    Max employer match: ${(personalData.currentSalary * personalData.match401k / 100).toLocaleString()}
                  </p>
                  {(personalData.contributions401kTraditional + personalData.contributions401kRoth) > 0 && (
                    <p className="text-xs text-blue-700">
                      Your contribution triggers: ${Math.min(
                        personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100,
                        personalData.currentSalary * personalData.match401k / 100
                      ).toLocaleString()} match
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 401(k) Contribution Limit Warning */}
          {personalData.currentSalary > 0 && (personalData.contributions401kTraditional + personalData.contributions401kRoth) > 0 && (
            (() => {
              const currentContribution = personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100;
              const displayYear = hasStarted ? simulationProgress.currentDate.getFullYear() : new Date().getFullYear();
              const current401kLimit = get401kLimit(displayYear);
              const isAtLimit = currentContribution >= current401kLimit;
              const maxPercentage = (current401kLimit / personalData.currentSalary) * 100;
              
              return (
                <div className={`mt-6 p-4 rounded-lg border ${isAtLimit ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-2 ${isAtLimit ? 'text-orange-800' : 'text-gray-800'}`}>
                    401(k) Contribution Limits ({displayYear})
                  </h4>
                  <div className="text-xs space-y-1">
                    <p className="text-gray-700">
                      Current contribution: ${currentContribution.toLocaleString()} ({(personalData.contributions401kTraditional + personalData.contributions401kRoth).toFixed(2)}% of salary)
                    </p>
                    <p className="text-gray-700">
                      IRS annual limit: ${current401kLimit.toLocaleString()} ({maxPercentage.toFixed(2)}% of your salary)
                    </p>
                    {isAtLimit && (
                      <p className="text-orange-700 font-medium">
                        ⚠️ You've reached the maximum 401(k) contribution limit for {displayYear}
                      </p>
                    )}
                    {!isAtLimit && (
                      <p className="text-gray-600">
                        You can contribute up to ${(current401kLimit - currentContribution).toLocaleString()} more this year in {displayYear}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()
          )}
          
          {/* Total Compensation Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Total Compensation Package</h3>
            <div className="grid md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Base Salary</p>
                <p className="text-lg font-bold text-gray-900">${personalData.currentSalary.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cash Bonus</p>
                <p className="text-lg font-bold text-green-700">${personalData.cashBonus.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock Bonus</p>
                <p className={`text-lg font-bold ${personalData.careerField === 'Government' || personalData.careerField === 'Service' ? 'text-gray-400' : 'text-blue-700'}`}>
                  ${personalData.stockBonus.toLocaleString()}
                </p>
                {(personalData.careerField === 'Government' || personalData.careerField === 'Service') && (
                  <p className="text-xs text-gray-500">Not available</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">401(k) Contributions</p>
                <p className="text-lg font-bold text-orange-700">${(personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{(personalData.contributions401kTraditional + personalData.contributions401kRoth).toFixed(2)}% of salary</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Package</p>
                <p className="text-xl font-bold text-purple-800">
                  ${(personalData.currentSalary + personalData.cashBonus + personalData.stockBonus).toLocaleString()}
                </p>
              </div>
            </div>
            {(personalData.match401k > 0 && personalData.currentSalary > 0) || (personalData.contributions401kTraditional + personalData.contributions401kRoth) > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">401(k) Benefits Summary</h4>
                {personalData.match401k > 0 && personalData.currentSalary > 0 && (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Max employer match: ${(personalData.currentSalary * personalData.match401k / 100).toLocaleString()}</p>
                    </div>
                    {(personalData.contributions401kTraditional + personalData.contributions401kRoth) > 0 && (
                      <div>
                        <p className="text-blue-700">
                          Actual employer match: ${Math.min(
                            personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100,
                            personalData.currentSalary * personalData.match401k / 100
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-blue-600 mt-2">
                  Total retirement savings: ${(personalData.contributions401kTraditional + personalData.contributions401kRoth) > 0 ? ((personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100) + Math.min(
                    personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100,
                    personalData.currentSalary * personalData.match401k / 100
                  )).toLocaleString() : '0'} annually
                </p>
              </div>
            )}
          </div>
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
                  <p className="text-sm text-red-700">
                    {taxInfo.effectiveRate.toFixed(1)}% effective rate
                    {(contribution401kTraditional > 0 || contribution401kRoth > 0) && (
                      <span className="block">
                        {contribution401kTraditional > 0 && 'Traditional 401(k) reduces taxable income'}
                        {(contribution401kTraditional > 0 && contribution401kRoth > 0) && ' • '}
                        {contribution401kRoth > 0 && 'Roth 401(k) paid with after-tax dollars'}
                      </span>
                    )}
                  </p>
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
                          ...(contribution401kTraditional > 0 ? [{ value: contribution401kTraditional, color: '#f97316', label: '401(k) Traditional' }] : []),
                          ...(contribution401kRoth > 0 ? [{ value: contribution401kRoth, color: '#f59e0b', label: '401(k) Roth' }] : []),
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
                    {(contribution401kTraditional > 0 || contribution401kRoth > 0) && (
                      <>
                        {contribution401kTraditional > 0 && (
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                            <span>401(k) Traditional ({((contribution401kTraditional / personalData.currentSalary) * 100).toFixed(1)}%)</span>
                          </div>
                        )}
                        {contribution401kRoth > 0 && (
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-amber-500 rounded mr-2"></div>
                            <span>401(k) Roth ({((contribution401kRoth / personalData.currentSalary) * 100).toFixed(1)}%)</span>
                          </div>
                        )}
                      </>
                    )}
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

                  {/* Pre-Tax Deductions */}
                  {contribution401kTraditional > 0 && (
                    <div className="mb-4">
                      <h5 className="font-bold text-gray-800 mb-2 text-sm">PRE-TAX DEDUCTIONS</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>401(k) Traditional Contribution:</span>
                          <span className="font-semibold">-${contribution401kTraditional.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-semibold">TAXABLE INCOME:</span>
                          <span className="font-bold">${taxInfo.taxableIncome.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tax Deductions */}
                  <div className="mb-4">
                    <h5 className="font-bold text-gray-800 mb-2 text-sm">TAX DEDUCTIONS</h5>
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
                        <span className="font-semibold">TOTAL TAX DEDUCTIONS:</span>
                        <span className="font-bold text-red-600">-${taxInfo.totalTax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Post-Tax Deductions */}
                  {contribution401kRoth > 0 && (
                    <div className="mb-4">
                      <h5 className="font-bold text-gray-800 mb-2 text-sm">POST-TAX DEDUCTIONS</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>401(k) Roth Contribution:</span>
                          <span className="font-semibold">-${contribution401kRoth.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

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

  const renderEconomyPage = () => {
    return (
      <div className="space-y-8">
        {/* Persistent Simulation Controls */}
        {renderSimulationControls()}
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentMode('personal')}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Dashboard
          </button>
          <Globe className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Economy & Markets</h1>
        </div>

        {/* Current Economic Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Current Economic Conditions</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {/* Economic Cycle */}
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-blue-800 mb-2">Economic Cycle</h3>
              <p className="text-2xl font-bold text-blue-900 capitalize mb-1">{economicState.economicCycle}</p>
              <p className="text-sm text-blue-700">
                Year {economicState.yearsInCurrentCycle} of cycle
              </p>
            </div>

            {/* Inflation Rate */}
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-red-800 mb-2">Inflation Rate</h3>
              <p className="text-2xl font-bold text-red-900">
                {(economicState.currentInflationRate * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-red-700">Annual rate</p>
            </div>

            {/* S&P 500 Index */}
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-green-800 mb-2">S&P 500</h3>
              <p className="text-2xl font-bold text-green-900">
                {economicState.stockMarketIndex.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {historicalData.length > 1 && (
                <p className={`text-sm font-medium ${
                  economicState.stockMarketGrowth >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {economicState.stockMarketGrowth >= 0 ? '+' : ''}{(economicState.stockMarketGrowth * 100).toFixed(1)}% YoY
                </p>
              )}
            </div>

            {/* Cumulative Inflation */}
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-purple-800 mb-2">Total Inflation</h3>
              <p className="text-2xl font-bold text-purple-900">
                {((economicState.cumulativeInflation - 1) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-purple-700">Since simulation start</p>
            </div>
          </div>
        </div>

        {/* Economic Cycle Explanation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Economic Cycle: {economicState.economicCycle}</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            {economicState.economicCycle === 'expansion' && (
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">🔥 Expansion Phase</h3>
                <p className="text-gray-700 mb-2">
                  The economy is growing! GDP is increasing, unemployment is falling, and business confidence is high.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Stock market typically performs well (12-20% annual returns)</li>
                  <li>Inflation may start to rise as demand increases</li>
                  <li>Companies are hiring and expanding</li>
                  <li>Consumer spending is strong</li>
                </ul>
              </div>
            )}
            
            {economicState.economicCycle === 'peak' && (
              <div>
                <h3 className="font-semibold text-orange-800 mb-2">⚠️ Peak Phase</h3>
                <p className="text-gray-700 mb-2">
                  The economy has reached its maximum capacity. Growth is slowing and inflation is rising.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Stock market becomes volatile (5-15% returns)</li>
                  <li>Inflation peaks, potentially above 5%</li>
                  <li>Interest rates may rise to control inflation</li>
                  <li>Economic indicators show warning signs</li>
                </ul>
              </div>
            )}
            
            {economicState.economicCycle === 'recession' && (
              <div>
                <h3 className="font-semibold text-red-800 mb-2">📉 Recession Phase</h3>
                <p className="text-gray-700 mb-2">
                  Economic activity is declining. GDP is shrinking and unemployment is rising.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Stock market performs poorly (-30% to -10% returns)</li>
                  <li>Inflation drops as demand decreases</li>
                  <li>Companies reduce hiring and may lay off workers</li>
                  <li>Consumer spending declines</li>
                </ul>
              </div>
            )}
            
            {economicState.economicCycle === 'trough' && (
              <div>
                <h3 className="font-semibold text-green-800 mb-2">🌱 Trough/Recovery Phase</h3>
                <p className="text-gray-700 mb-2">
                  The economy has hit bottom and is beginning to recover. This is often a good time for investments.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Stock market begins recovery (-15% to +5% returns)</li>
                  <li>Inflation remains low</li>
                  <li>Interest rates are typically low</li>
                  <li>Early signs of economic improvement appear</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Historical Charts */}
        {historicalData.length > 1 && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* S&P 500 Chart */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">S&P 500 Performance</h3>
              <div className="h-64 bg-green-50 rounded p-4">
                <svg width="100%" height="100%" viewBox="0 0 400 200" className="overflow-visible">
                  <defs>
                    <linearGradient id="stockGradientLarge" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>
                  {(() => {
                    const maxValue = Math.max(...historicalData.map(d => d.stockMarketValue));
                    const minValue = Math.min(...historicalData.map(d => d.stockMarketValue));
                    const range = Math.max(maxValue - minValue, 100);
                    
                    const points = historicalData.map((d, i) => {
                      const x = (i / Math.max(historicalData.length - 1, 1)) * 360 + 20;
                      const y = 160 - ((d.stockMarketValue - minValue) / range) * 120;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    const pathPoints = historicalData.map((d, i) => {
                      const x = (i / Math.max(historicalData.length - 1, 1)) * 360 + 20;
                      const y = 160 - ((d.stockMarketValue - minValue) / range) * 120;
                      return `${x},${y}`;
                    });
                    
                    const pathData = pathPoints.length > 1 
                      ? `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')} L ${pathPoints[pathPoints.length - 1].split(',')[0]},160 L ${pathPoints[0].split(',')[0]},160 Z`
                      : '';
                    
                    return (
                      <g>
                        {pathData && <path d={pathData} fill="url(#stockGradientLarge)" />}
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          points={points}
                        />
                        {historicalData.map((d, i) => {
                          const x = (i / Math.max(historicalData.length - 1, 1)) * 360 + 20;
                          const y = 160 - ((d.stockMarketValue - minValue) / range) * 120;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="3"
                              fill="#10b981"
                            />
                          );
                        })}
                        {/* Y-axis labels */}
                        <text x="10" y="45" fill="#6b7280" fontSize="12">{maxValue.toFixed(0)}</text>
                        <text x="10" y="165" fill="#6b7280" fontSize="12">{minValue.toFixed(0)}</text>
                        {/* X-axis labels */}
                        <text x="20" y="185" fill="#6b7280" fontSize="12">Start</text>
                        <text x="360" y="185" fill="#6b7280" fontSize="12">Now</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Inflation Chart */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Inflation Rate Over Time</h3>
              <div className="h-64 bg-red-50 rounded p-4">
                <svg width="100%" height="100%" viewBox="0 0 400 200" className="overflow-visible">
                  <defs>
                    <linearGradient id="inflationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>
                  {(() => {
                    const maxValue = Math.max(...historicalData.map(d => d.inflation * 100), 6);
                    const minValue = 0;
                    const range = maxValue - minValue;
                    
                    const points = historicalData.map((d, i) => {
                      const x = (i / Math.max(historicalData.length - 1, 1)) * 360 + 20;
                      const y = 160 - ((d.inflation * 100 - minValue) / range) * 120;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                      <g>
                        <polyline
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3"
                          points={points}
                        />
                        {historicalData.map((d, i) => {
                          const x = (i / Math.max(historicalData.length - 1, 1)) * 360 + 20;
                          const y = 160 - ((d.inflation * 100 - minValue) / range) * 120;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="3"
                              fill="#ef4444"
                            />
                          );
                        })}
                        {/* Y-axis labels */}
                        <text x="10" y="45" fill="#6b7280" fontSize="12">{maxValue.toFixed(1)}%</text>
                        <text x="10" y="165" fill="#6b7280" fontSize="12">0%</text>
                        {/* X-axis labels */}
                        <text x="20" y="185" fill="#6b7280" fontSize="12">Start</text>
                        <text x="360" y="185" fill="#6b7280" fontSize="12">Now</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Economic Impact on Your Finances */}
        {personalData.currentSalary > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Economic Impact on Your Finances</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Salary Purchasing Power</h3>
                <p className="text-lg font-bold text-blue-900">
                  ${(personalData.currentSalary / economicState.cumulativeInflation).toLocaleString()}
                </p>
                <p className="text-sm text-blue-700">
                  Inflation-adjusted value of your salary
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Cost of Living Impact</h3>
                <p className="text-lg font-bold text-yellow-900">
                  +{((economicState.cumulativeInflation - 1) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-yellow-700">
                  Increase in expenses since simulation start
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Investment Strategy</h3>
                <p className="text-sm text-green-700">
                  {economicState.economicCycle === 'expansion' && "Consider growth investments"}
                  {economicState.economicCycle === 'peak' && "Focus on defensive positions"}
                  {economicState.economicCycle === 'recession' && "Look for value opportunities"}
                  {economicState.economicCycle === 'trough' && "Time to buy the dip"}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Market Volatility Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Market Simulation Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This is a simulated economic environment for educational purposes. Real markets are influenced by many more factors including geopolitical events, technological changes, monetary policy, and global economic conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
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
      case 'investments':
        return renderInvestmentsPage();
      case 'economy':
        return renderEconomyPage();
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
