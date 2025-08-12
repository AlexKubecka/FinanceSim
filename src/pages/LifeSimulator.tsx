import React, { useState, useEffect, useRef } from 'react';
import { Square, TrendingUp, DollarSign, User, Target, Receipt, Globe } from 'lucide-react';
import { SimulationControls } from '../components/SimulationControls';
import { Dashboard } from '../components/Dashboard';
import { SetupWizard } from '../components/SetupWizard';
import { ModeSelectionPage } from '../components/ModeSelectionPage';
import { NetWorthPage } from '../components/NetWorthPage';
import AccountBasedInvestmentPage from '../components/AccountBasedInvestmentPage';
import { BankAccountPage } from '../components/BankAccountPage';
import { YearEndSummaryModal } from '../components/YearEndSummaryModal';
import { YearEndReportsPage } from '../components/YearEndReportsPage';
import { get401kLimit, calculatePersonalNetWorth, calculateTotalPortfolioValue, calculateNonTechPortfolioValue, calculateTechStockValue } from '../utils/financialCalculations';
import { calculateInvestmentBreakdown } from '../utils/investmentCalculations';
import { stateRentData, stateGroceryData } from '../utils/expenseData';
import { simulateEconomicStep, createInitialEconomicState } from '../services/economicSimulation';
import { generateYearlySummary } from '../utils/yearlySummaryGenerator';
import { 
  SimulationMode, 
  SimulationState, 
  PersonalFinancialData, 
  SimulationProgress, 
  HistoricalDataPoint, 
  EconomicState
} from '../types/simulation';
import { YearlySummary } from '../types/yearlySummary';
// import InvestmentPage from '../components/InvestmentPage';

// Add Edit3 icon for the edit button

export const LifeSimulator: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<SimulationMode>('selection');
  const [personalData, setPersonalData] = useState<PersonalFinancialData>({
    age: 0,
    currentSalary: 0,
    state: '',
    careerField: '',
    maritalStatus: 'single',
    match401k: 0,
    contributions401k: 0, // DEPRECATED
    contributions401kTraditional: 0,
    contributions401kRoth: 0,
    contribution401kType: 'traditional', // DEPRECATED
    iraTraditionalContribution: 0,
    iraRothContribution: 0,
    monthlyRent: undefined, // Optional - uses state average if not set
    weeklyGroceries: undefined, // Optional - uses state average if not set
    iraTraditionalHoldings: 0,
    iraTraditionalTechHoldings: 0,
    iraRothHoldings: 0,
    iraRothTechHoldings: 0,
    the401kTraditionalHoldings: 0,
    the401kTraditionalTechHoldings: 0,
    the401kRothHoldings: 0,
    the401kRothTechHoldings: 0,
    personalInvestmentCash: 0,
    iraTraditionalCash: 0,
    iraRothCash: 0,
    the401kTraditionalCash: 0,
    the401kRothCash: 0,
    cashBonus: 0,
    stockBonus: 0,
    savings: 0, // DEPRECATED - keeping for backwards compatibility
    // Enhanced bank account system
    savingsAccount: 0, // Traditional savings account (0.05% APY)
    checkingAccount: 0, // Checking account (0% APY)
    hysaAccount: 0, // High Yield Savings Account (4% APY)
    investments: 0,
    techStockHoldings: 0,
    debtAmount: 0,
    debtInterestRate: 0,
    retirementAge: 65,
    retirementGoal: 1000000,
    emergencyFundMonths: 6,
    riskTolerance: 'moderate',
    monthlyInvestment: 0,
    plannedPurchases: [],
    yearlySummaries: [],
    wasRunningBeforeModal: false
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
  
  // Yearly summary modal state
  const [showYearEndModal, setShowYearEndModal] = useState(false);
  const [currentYearlySummary, setCurrentYearlySummary] = useState<YearlySummary | null>(null);
  const [showYearlyReports, setShowYearlyReports] = useState(true); // New setting to control yearly reports

  // Economic state
  const [economicState, setEconomicState] = useState<EconomicState>(createInitialEconomicState());

  // Track previous year's stock market value for year-over-year growth calculation
  // Use a ref to track the current stock market value for immediate updates
  const currentStockIndexRef = useRef<number>(5000);
  
  // Track years in current economic cycle with a ref for immediate updates
  const yearsInCurrentCycleRef = useRef<number>(0);
  
  // Track current economic cycle with a ref for immediate updates
  const currentEconomicCycleRef = useRef<'expansion' | 'peak' | 'recession' | 'trough' | 'depression'>('expansion');

  // Store original salary to reset to after inflation adjustments
  const originalSalaryRef = useRef<number>(0);
  
  // Track simulation state with a ref for immediate access in intervals
  const simulationStateRef = useRef<SimulationState>('setup');
  
  // Track current simulation year (starts at 0, increments to 1, 2, 3, etc.)
  const currentYearRef = useRef<number>(0);

  // Financial tracking
  const [financials, setFinancials] = useState({
    currentSalary: 0,
    netWorth: 0,
    annualExpenses: 0,
    investments: 0,
    investmentAccountValue: 0
  });

  // Use ref to persist investment value between simulation steps
  const currentInvestmentValueRef = useRef(0);
  
  // Use ref to persist savings value between simulation steps
  const currentSavingsRef = useRef(0);
  
  // Use ref to persist tech stock value between simulation steps
  const currentTechStockValueRef = useRef(0);

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

  // Main simulation step function
  const runSimulationStep = () => {
    console.log('🔄 Running simulation step...', { state: simulationStateRef.current, intervalExists: !!intervalRef.current });
    
    // Guard: Don't run if simulation is not in running state
    if (simulationStateRef.current !== 'running') {
      console.log('⏸️ Simulation step aborted - not in running state:', simulationStateRef.current);
      return;
    }
    
    let newAge = simulationProgress.currentAge;
    
    // Use the current ref value as the previous year for YoY calculation
    // Create updated economic state with current stock market index AND years in cycle AND economic cycle
    const currentEconomicState = {
      ...economicState,
      stockMarketIndex: currentStockIndexRef.current,
      yearsInCurrentCycle: yearsInCurrentCycleRef.current,
      economicCycle: currentEconomicCycleRef.current
    };
    
    // Use the tracked previous year stock index for YoY calculation
    const newEconomicState = simulateEconomicStep(currentEconomicState);
    setEconomicState(newEconomicState);
    
    // Update all refs (for immediate access)
    currentStockIndexRef.current = newEconomicState.stockMarketIndex;
    yearsInCurrentCycleRef.current = newEconomicState.yearsInCurrentCycle;
    currentEconomicCycleRef.current = newEconomicState.economicCycle;
    
    // Increment the year counter
    currentYearRef.current += 1;
    let currentSimulationYear = currentYearRef.current;
    
    setSimulationProgress(prev => {
      const newDate = new Date(prev.currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // Add exactly 1 year
      const yearsElapsed = Math.floor((newDate.getTime() - prev.startDate.getTime()) / (365 * 24 * 60 * 60 * 1000));
      const monthsElapsed = currentYearRef.current * 12; // Use simple year counter
      const currentAge = personalData.age + currentYearRef.current; // Use simple year counter for age
      newAge = currentAge;
      
      // Store the current simulation year (which starts at 1)
      currentSimulationYear = currentYearRef.current;
      
      console.log('📊 Debug Year Calculation:', {
        yearsElapsed,
        currentSimulationYear,
        currentYearRef: currentYearRef.current,
        startDate: prev.startDate,
        newDate,
        personalDataAge: personalData.age,
        newAge: currentAge
      });

      return {
        ...prev,
        currentDate: newDate,
        currentAge,
        yearsElapsed,
        monthsElapsed,
        daysElapsed: Math.floor((newDate.getTime() - prev.startDate.getTime()) / (24 * 60 * 60 * 1000))
      };
    });

    // Calculate the current simulation year for debug logging (starts at 1)
    const debugYear = currentSimulationYear;
    
    console.log('📊 Generating yearly summary:', {
      debugYear,
      currentSimulationYear,
      newAge: personalData.age + currentYearRef.current, // Show correct age in debug
      personalDataAge: personalData.age,
      currentYearRef: currentYearRef.current
    });

    // Update financials with inflation effects
    setPersonalData(prev => {
      let newData = { ...prev };
      
      // Adjust salary for inflation (salary typically keeps up partially with inflation)
      const salaryInflationAdjustment = 1 + (newEconomicState.currentInflationRate * 0.8); // 80% inflation adjustment
      newData.currentSalary = prev.currentSalary * salaryInflationAdjustment;

      return newData;
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
      
      // If this is the first simulation step, initialize with current state data and apply first year inflation
      if (Object.keys(prev).length === 0) {
        Object.keys(stateRentData).forEach(state => {
          newRentData[state] = stateRentData[state] * (1 + currentInflationRate);
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
      
      // If this is the first simulation step, initialize with current state data and apply first year inflation
      if (Object.keys(prev).length === 0) {
        Object.keys(stateGroceryData).forEach(state => {
          newGroceryData[state] = stateGroceryData[state] * (1 + currentInflationRate);
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
    const contribution401kTraditional = personalData.currentSalary * personalData.contributions401kTraditional / 100;
    const contribution401kRoth = personalData.currentSalary * personalData.contributions401kRoth / 100;
    const simulationYear = simulationProgress.currentDate.getFullYear();
    const taxInfo = calculateTaxes(personalData.currentSalary, personalData.state, contribution401kTraditional, contribution401kRoth, simulationYear);
    
    // Calculate after-tax investment contributions that reduce cash savings
    const annualMonthlyInvestments = personalData.monthlyInvestment * 12;
    const annualIraContributions = personalData.iraTraditionalContribution + personalData.iraRothContribution;
    const afterTaxInvestmentContributions = annualMonthlyInvestments + annualIraContributions;
    
    // Annual cash flow = after-tax income - expenses - after-tax investment contributions
    const annualCashFlow = taxInfo.afterTaxIncome - updatedAnnualExpenses - afterTaxInvestmentContributions;
    
    // Handle bank account system: salary goes to savings account by default
    // Apply interest to accounts: HYSA gets 4%, Savings gets 0.05%, Checking gets 0%
    const currentSavingsAccount = personalData.savingsAccount ?? 0;
    const currentCheckingAccount = personalData.checkingAccount ?? 0;
    const currentHysaAccount = personalData.hysaAccount ?? 0;
    
    // Apply annual interest
    const savingsInterest = currentSavingsAccount * 0.0005; // 0.05% APY
    const hysaInterest = currentHysaAccount * 0.04; // 4% APY
    
    // Add salary (cash flow) to savings account by default
    const newSavingsAccount = currentSavingsAccount + annualCashFlow + savingsInterest;
    const newCheckingAccount = currentCheckingAccount; // No interest
    const newHysaAccount = currentHysaAccount + hysaInterest;
    
    // Calculate total bank balance for ref tracking and net worth
    const newTotalBankBalance = Math.max(0, newSavingsAccount) + Math.max(0, newCheckingAccount) + Math.max(0, newHysaAccount);
    
    // Update the ref with the new total bank balance for next iteration
    currentSavingsRef.current = newTotalBankBalance;
    
    // Update personalData with the new account values and clear legacy savings to prevent double counting
    setPersonalData(prev => ({
      ...prev,
      savings: 0, // Clear legacy field to prevent double counting
      savingsAccount: Math.max(0, newSavingsAccount),
      checkingAccount: Math.max(0, newCheckingAccount),
      hysaAccount: Math.max(0, newHysaAccount)
    }));

    // Calculate investment growth AFTER savings calculation
    // Use centralized calculation for consistent contribution amounts
    const investmentBreakdown = calculateInvestmentBreakdown(personalData, 0); // Pass 0 since we only need contribution amounts, not balances
    const total401kContribution = investmentBreakdown.annual401kTraditional + investmentBreakdown.annual401kRoth + investmentBreakdown.employerMatch;

    // Apply investment growth to existing portfolio
    // Use S&P 500 growth rate for general investments (401k, IRA, taxable accounts)
    const generalInvestmentGrowthRate = newEconomicState.investmentReturns.sp500;
    const previousInvestmentValue = currentInvestmentValueRef.current; // Get current value before calculation
    
    // Calculate new investment value: previous value grows + new contributions
    let newInvestmentValue = (previousInvestmentValue * (1 + generalInvestmentGrowthRate)) + 
                        total401kContribution + annualMonthlyInvestments + annualIraContributions;

    // Update the ref with the new value for next iteration
    currentInvestmentValueRef.current = newInvestmentValue;

    // Apply tech-specific growth to tech stock holdings
    const techGrowthRate = newEconomicState.investmentReturns.tech;
    const previousTechStockValue = currentTechStockValueRef.current;
    let newTechStockValue = previousTechStockValue * (1 + techGrowthRate);
    
    // Update the ref with the new tech stock value for next iteration
    currentTechStockValueRef.current = newTechStockValue;

    // Calculate net worth: Total Assets - Total Liabilities (same as NetWorthPage)
    // Use the NEW calculated values (not the stale personalData values) for accurate calculation
    const assets = {
      savings: Math.max(0, newSavingsAccount),
      checking: Math.max(0, newCheckingAccount),
      hysa: Math.max(0, newHysaAccount),
      legacy: 0, // Clear legacy to prevent double counting
      investments: newInvestmentValue, // Use the comprehensive calculation for all accounts
      techStock: newTechStockValue, // Include tech stock as separate asset
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
    const calculatedNetWorth = totalAssets - totalLiabilities;

    // Calculate total investment value including tech stocks for consistent display
    const totalInvestmentValueIncludingTechStock = newInvestmentValue + newTechStockValue;

    // Single setFinancials call to update both investment value and net worth
    setFinancials(prev => ({
      ...prev,
      investmentAccountValue: totalInvestmentValueIncludingTechStock,
      investments: totalInvestmentValueIncludingTechStock, // Keep both for compatibility
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
        investments: totalInvestmentValueIncludingTechStock,
        debt: personalData.debtAmount,
        timestamp: new Date(),
        inflation: newEconomicState.currentInflationRate,
        stockMarketValue: newEconomicState.stockMarketIndex
      };
      
      // Debug logging to verify cash flow calculation
      console.log('Annual Cash Flow Debug:', {
        year: debugYear,
        age: newAge,
        afterTaxIncome: taxInfo.afterTaxIncome,
        annualExpenses: updatedAnnualExpenses,
        afterTaxInvestments: afterTaxInvestmentContributions,
        monthlyInvestments: annualMonthlyInvestments,
        iraContributions: annualIraContributions,
        netCashFlow: annualCashFlow,
        previousBankBalance: currentSavingsRef.current - newTotalBankBalance + annualCashFlow, // Calculate previous from current
        newBankBalance: newTotalBankBalance,
        bankBalanceChange: annualCashFlow + savingsInterest + hysaInterest
      });

      // Debug logging for key financial values
      console.log('Key Financial Values Debug:', {
        year: debugYear,
        age: newAge,
        totalBankBalance: newTotalBankBalance,
        annualCashFlow: annualCashFlow,
        newInvestmentValue: newInvestmentValue,
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        calculatedNetWorth: calculatedNetWorth
      });

      // Debug logging to verify investment calculation
      console.log('Investment Growth Debug:', {
        year: debugYear,
        age: newAge,
        previousInvestmentValue: previousInvestmentValue,
        generalInvestmentGrowthRate: generalInvestmentGrowthRate,
        techGrowthRate: techGrowthRate,
        generalGrowthAmount: previousInvestmentValue * generalInvestmentGrowthRate,
        techGrowthAmount: previousTechStockValue * techGrowthRate,
        breakdown: {
          annual401kTraditional: investmentBreakdown.annual401kTraditional,
          annual401kRoth: investmentBreakdown.annual401kRoth,
          employerMatch: investmentBreakdown.employerMatch,
          total401k: total401kContribution
        },
        monthlyInvestments: annualMonthlyInvestments,
        iraContributions: annualIraContributions,
        totalNewContributions: total401kContribution + annualMonthlyInvestments + annualIraContributions,
        newInvestmentValue: newInvestmentValue,
        newTechStockValue: newTechStockValue,
        investmentChange: newInvestmentValue - previousInvestmentValue
      });
      
      // Debug logging to verify net worth calculation
      console.log('Historical Data Point:', {
        age: newAge,
        netWorth: calculatedNetWorth,
        breakdown: {
          totalBankBalance: newTotalBankBalance,
          investments: newInvestmentValue,
          debt: personalData.debtAmount,
          calculation: `${newTotalBankBalance} + ${newInvestmentValue} - ${personalData.debtAmount} = ${calculatedNetWorth}`
        }
      });
      
      return [...prev, newPoint];
    });

    // Generate yearly summary at the end of each year
    const previousYearData = historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;
    const startingYearData = previousYearData || {
      age: personalData.age,
      netWorth: 0,
      salary: personalData.currentSalary,
      investments: 0,
      debt: personalData.debtAmount,
      timestamp: new Date(simulationProgress.startDate),
      inflation: 0,
      stockMarketValue: 5000
    };

    const currentYearData = {
      age: personalData.age + currentYearRef.current, // Use simple counter for age
      netWorth: calculatedNetWorth,
      salary: personalData.currentSalary,
      investments: newInvestmentValue,
      debt: personalData.debtAmount,
      timestamp: new Date(),
      inflation: newEconomicState.currentInflationRate,
      stockMarketValue: newEconomicState.stockMarketIndex
    };

    const yearlySummary = generateYearlySummary(
      debugYear,
      startingYearData,
      currentYearData,
      personalData,
      financials,
      newEconomicState,
      {
        ...taxInfo,
        iraTraditionalContribution: personalData.iraTraditionalContribution,
        iraRothContribution: personalData.iraRothContribution,
        totalIraContribution: personalData.iraTraditionalContribution + personalData.iraRothContribution
      },
      personalData.yearlySummaries.length > 0 ? personalData.yearlySummaries[personalData.yearlySummaries.length - 1] : undefined
    );

    // Only pause simulation if we're going to show the modal
    const wasRunning = simulationStateRef.current === 'running';
    if (showYearlyReports && wasRunning) {
      console.log('📊 Year End: Pausing simulation for yearly summary modal');
      // Stop the interval immediately
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Set state to paused
      setSimulationState('paused');
      simulationStateRef.current = 'paused'; // Update ref immediately
    } else if (showYearlyReports) {
      console.log('📊 Year End: Simulation was not running, showing modal without pause');
    } else {
      console.log('📊 Year End: Yearly reports disabled, continuing simulation without pause');
    }

    // Show the yearly summary modal only if the setting is enabled
    setCurrentYearlySummary(yearlySummary);
    if (showYearlyReports) {
      setShowYearEndModal(true);
    }

    // Save the yearly summary to personal data
    setPersonalData(prev => ({
      ...prev,
      yearlySummaries: [...prev.yearlySummaries, yearlySummary],
      // Only store wasRunningBeforeModal if we're showing the modal
      wasRunningBeforeModal: showYearlyReports ? wasRunning : false
    }));

    // Check if simulation should end
    if (newAge >= personalData.retirementAge) {
      stopSimulation();
    }
  };

  // Simulation controls
  const startSimulation = () => {
    setSimulationState('running');
    simulationStateRef.current = 'running'; // Update ref immediately
    
    // Only reset simulation progress if this is the very first start
    if (!hasStarted) {
      setHasStarted(true);
      
      // Store the original salary value before any inflation adjustments
      originalSalaryRef.current = personalData.currentSalary;
      
      // Initialize investment ref with non-tech portfolio value (S&P 500 + cash only)
      const totalStartingNonTechInvestments = calculateNonTechPortfolioValue(personalData);
      currentInvestmentValueRef.current = totalStartingNonTechInvestments;
      
      // Initialize tech stock ref with tech stock value from all accounts
      const totalStartingTechInvestments = calculateTechStockValue(personalData);
      currentTechStockValueRef.current = totalStartingTechInvestments;
      
      // Initialize savings ref with current total bank balance
      const currentTotalBank = (personalData.savingsAccount ?? 0) + 
                               (personalData.checkingAccount ?? 0) + 
                               (personalData.hysaAccount ?? 0);
      currentSavingsRef.current = currentTotalBank;
      
      // Migrate legacy savings to new account system if needed
      if ((personalData.savings || 0) > 0 && 
          (personalData.savingsAccount ?? 0) === 0 && 
          (personalData.checkingAccount ?? 0) === 0 && 
          (personalData.hysaAccount ?? 0) === 0) {
        setPersonalData(prev => ({
          ...prev,
          savingsAccount: prev.savings || 0,
          checkingAccount: 0,
          hysaAccount: 0
        }));
      }
      
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
      // Same calculation as NetWorthPage: Total Assets - Total Liabilities
      // Use the same comprehensive net worth calculation used throughout the app
      const initialNetWorth = calculatePersonalNetWorth(personalData);
      
      // Calculate total investments for historical tracking using comprehensive function
      const initialTotalInvestments = calculateTotalPortfolioValue(personalData);
      
      setHistoricalData([{
        age: personalData.age,
        netWorth: initialNetWorth,
        salary: personalData.currentSalary,
        investments: initialTotalInvestments,
        debt: personalData.debtAmount,
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
    simulationStateRef.current = 'paused'; // Update ref immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopSimulation = () => {
    setSimulationState('setup');
    simulationStateRef.current = 'setup'; // Update ref immediately
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
          description: `You got a new job with salary $${salary.toLocaleString('en-US', { maximumFractionDigits: 0 })}!`,
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
    // NOTE: Do NOT reset setupCompleted - user should stay on dashboard after reset
    setSetupStep(1);
    setSalaryActionTaken(false);
    setRecentEvents([]);
    
    // Clear yearly summary modal state
    setShowYearEndModal(false);
    setCurrentYearlySummary(null);
    
    // Reset economic state
    setEconomicState(createInitialEconomicState());
    
    // Reset all refs
    currentStockIndexRef.current = 5000;
    yearsInCurrentCycleRef.current = 0;
    currentEconomicCycleRef.current = 'expansion';
    currentInvestmentValueRef.current = 0;
    currentSavingsRef.current = 0;
    currentTechStockValueRef.current = 0;
    
    // Reset inflation-adjusted cost data
    setInflationAdjustedRentData({});
    setInflationAdjustedGroceryData({});
    
    // Reset salary back to original value (before inflation adjustments)
    if (originalSalaryRef.current > 0) {
      setPersonalData(prev => ({
        ...prev,
        savings: 0,
        investments: 0, // Reset investments to 0
        techStockHoldings: 0, // Reset tech stock to 0
        yearlySummaries: [], // Clear yearly reports
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
      // Reset savings and investments to 0
      setPersonalData(prev => ({
        ...prev,
        savings: 0,
        investments: 0, // Reset investments to 0
        techStockHoldings: 0, // Reset tech stock to 0
        yearlySummaries: [] // Clear yearly reports
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

  // Update financials whenever personalData changes to ensure net worth is accurate
  useEffect(() => {
    setFinancials(prev => ({
      ...prev,
      netWorth: calculatePersonalNetWorth(personalData),
      currentSalary: personalData.currentSalary
    }));
  }, [
    personalData.currentSalary,
    personalData.savingsAccount,
    personalData.checkingAccount,
    personalData.hysaAccount,
    personalData.investments,
    personalData.techStockHoldings,
    personalData.iraTraditionalHoldings,
    personalData.iraRothHoldings,
    personalData.iraTraditionalTechHoldings,
    personalData.iraRothTechHoldings,
    personalData.the401kTraditionalHoldings,
    personalData.the401kTraditionalTechHoldings,
    personalData.the401kRothHoldings,
    personalData.the401kRothTechHoldings,
    personalData.personalInvestmentCash,
    personalData.iraTraditionalCash,
    personalData.iraRothCash,
    personalData.the401kTraditionalCash,
    personalData.the401kRothCash,
    personalData.debtAmount
  ]);

  // Handle edit profile action
  const handleEditProfile = () => {
    // Don't reset data, just go back to setup to allow editing
    setSetupCompleted(false);
    setCurrentMode('personal');
  };

  // Developer autofill for testing (only in development)
  const handleDeveloperAutofill = () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const testScenarios = [
      {
        age: 25,
        currentSalary: 65000,
        state: 'California',
        careerField: 'Tech' as const,
        maritalStatus: 'single' as const,
        match401k: 4,
        contributions401kTraditional: 10,
        contributions401kRoth: 5,
        iraTraditionalContribution: 0,
        iraRothContribution: 3000,
        monthlyRent: 2200, // Custom rent vs CA average of 2800
        weeklyGroceries: 110, // Custom groceries vs CA average of 125
        iraTraditionalHoldings: 5000,
        iraTraditionalTechHoldings: 0,
        iraRothHoldings: 8000,
        iraRothTechHoldings: 0,
        the401kTraditionalHoldings: 0,
        the401kTraditionalTechHoldings: 0,
        the401kRothHoldings: 0,
        the401kRothTechHoldings: 0,
        savings: 15000,
        investments: 5000,
        techStockHoldings: 15000, // Tech worker with stock options
        debtAmount: 25000,
        debtInterestRate: 4.5,
        retirementAge: 65,
        retirementGoal: 1500000,
        monthlyInvestment: 800
      },
      {
        age: 35,
        currentSalary: 85000,
        state: 'Texas',
        careerField: 'Government' as const,
        maritalStatus: 'married-jointly' as const,
        match401k: 5,
        contributions401kTraditional: 15,
        contributions401kRoth: 0,
        iraTraditionalContribution: 7000,
        iraRothContribution: 0,
        monthlyRent: undefined, // Will use TX state average
        weeklyGroceries: undefined, // Will use TX state average
        iraTraditionalHoldings: 45000,
        iraTraditionalTechHoldings: 0,
        iraRothHoldings: 15000,
        iraRothTechHoldings: 0,
        the401kTraditionalHoldings: 0,
        the401kTraditionalTechHoldings: 0,
        the401kRothHoldings: 0,
        the401kRothTechHoldings: 0,
        savings: 45000,
        investments: 35000,
        techStockHoldings: 8000, // Government worker with some tech stock investments
        debtAmount: 15000,
        debtInterestRate: 3.2,
        retirementAge: 62,
        retirementGoal: 1200000,
        monthlyInvestment: 1200
      },
      {
        age: 22,
        currentSalary: 45000,
        state: 'Florida',
        careerField: 'Service' as const,
        maritalStatus: 'single' as const,
        match401k: 3,
        contributions401kTraditional: 8,
        contributions401kRoth: 2,
        iraTraditionalContribution: 0,
        iraRothContribution: 2000,
        monthlyRent: 1400, // Custom rent vs FL average of 1750
        weeklyGroceries: 95, // Custom groceries vs FL average of 108
        iraTraditionalHoldings: 0,
        iraTraditionalTechHoldings: 0,
        iraRothHoldings: 3000,
        iraRothTechHoldings: 0,
        the401kTraditionalHoldings: 0,
        the401kTraditionalTechHoldings: 0,
        the401kRothHoldings: 0,
        the401kRothTechHoldings: 0,
        personalInvestmentCash: 0,
        iraTraditionalCash: 0,
        iraRothCash: 0,
        the401kTraditionalCash: 0,
        the401kRothCash: 0,
        savings: 8000,
        investments: 2000,
        techStockHoldings: 1500, // Service worker with small tech stock investment
        debtAmount: 35000,
        debtInterestRate: 6.8,
        retirementAge: 67,
        retirementGoal: 800000,
        monthlyInvestment: 300
      }
    ];
    
    const randomScenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
    setPersonalData(prev => ({
      ...prev,
      ...randomScenario,
      // Keep existing fields that aren't in the test scenario
      contributions401k: 0,
      contribution401kType: 'traditional' as const,
      cashBonus: Math.floor(Math.random() * 10000),
      stockBonus: Math.floor(Math.random() * 15000),
      emergencyFundMonths: 6,
      riskTolerance: 'moderate' as const,
      plannedPurchases: [],
      yearlySummaries: [],
      wasRunningBeforeModal: false
    }));
    
    // Set financials to match
    setFinancials(prev => ({
      ...prev,
      currentSalary: randomScenario.currentSalary
    }));
    
    // Mark setup as completed and stay in personal mode
    setSetupCompleted(true);
    setCurrentMode('personal');
    
    console.log('🔧 Developer autofill applied:', randomScenario);
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
    // Use the same logic as expenses page - getCurrentRent and getCurrentGrocery already handle custom values
    const monthlyRent = personalData.state ? getCurrentRent(personalData.state) : 0;
    const annualRent = monthlyRent * 12;
    
    const weeklyGroceries = personalData.state ? getCurrentGrocery(personalData.state) : 0;
    const annualGrocery = weeklyGroceries * 52; // Weekly to annual
    
    return annualRent + annualGrocery;
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
    // Skip this effect entirely during simulation to avoid interfering with simulation calculations
    if (hasStarted) {
      return;
    }

    const annualExpenses = calculateAnnualExpenses();
    
    // Calculate proper net worth: Assets - Liabilities (same as NetWorthPage)
    // Use comprehensive portfolio calculation that includes all cash balances
    const totalInvestmentValue = calculateTotalPortfolioValue(personalData);
    const netWorth = calculatePersonalNetWorth(personalData);
    
    // Initialize the investment ref with non-tech portfolio value if not started
    // Track non-tech investments and tech stocks separately for proper growth application
    const nonTechInvestmentValue = calculateNonTechPortfolioValue(personalData);
    const techStockValue = calculateTechStockValue(personalData);
    currentInvestmentValueRef.current = nonTechInvestmentValue;
    currentTechStockValueRef.current = techStockValue;
    
    // Initialize the savings ref with the current total bank balance
    const currentBankTotal = (personalData.savingsAccount ?? 0) + 
                             (personalData.checkingAccount ?? 0) + 
                             (personalData.hysaAccount ?? 0);
    currentSavingsRef.current = currentBankTotal;
    
    setFinancials(prev => ({
      ...prev,
      currentSalary: personalData.currentSalary,
      annualExpenses: annualExpenses,
      netWorth: netWorth,
      investmentAccountValue: totalInvestmentValue // Use same calculation as net worth
    }));
  }, [personalData.currentSalary, personalData.state, userRentData, userGroceryData, inflationAdjustedRentData, inflationAdjustedGroceryData, hasStarted, personalData.savings, personalData.investments, personalData.debtAmount, personalData.techStockHoldings, personalData.iraTraditionalHoldings, personalData.iraRothHoldings, personalData.personalInvestmentCash, personalData.iraTraditionalCash, personalData.iraRothCash, personalData.the401kTraditionalCash, personalData.the401kRothCash, personalData.iraTraditionalTechHoldings, personalData.iraRothTechHoldings, personalData.the401kTraditionalHoldings, personalData.the401kTraditionalTechHoldings, personalData.the401kRothHoldings, personalData.the401kRothTechHoldings]);

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
                <p className="text-2xl font-bold text-blue-900">${currentStateRent.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                <p className="text-sm text-blue-700">
                  {isUsingCustomRent ? 'Your custom amount' : 'State average'}
                </p>
                {isUsingCustomRent && defaultStateRent > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    State avg: ${defaultStateRent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                )}
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Annual Housing Cost</h3>
                <p className="text-2xl font-bold text-green-900">${annualRent.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
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
                <p className="text-2xl font-bold text-yellow-900">${annualGrocery.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
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
                <p className="text-3xl font-bold text-orange-900">${totalAnnualExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
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

  const renderNetWorthPage = () => {
    return (
      <NetWorthPage
        personalData={personalData}
        financials={financials}
        hasStarted={hasStarted}
        simulationState={simulationState}
        simulationProgress={simulationProgress}
        historicalData={historicalData}
        setCurrentMode={setCurrentMode}
        onStart={startSimulation}
        onPause={pauseSimulation}
        onReset={resetSimulation}
        onEditProfile={handleEditProfile}
      />
    );
  };

  const renderInvestmentsPage = () => {
    return (
      <AccountBasedInvestmentPage
        data={personalData}
        setData={setPersonalData}
        navigate={(page: string) => setCurrentMode(page as SimulationMode)}
        formatCurrency={(amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
        hasStarted={hasStarted}
        simulationState={simulationState}
        simulationProgress={simulationProgress}
        historicalData={historicalData}
        onStart={startSimulation}
        onPause={pauseSimulation}
        onReset={resetSimulation}
        onEditProfile={handleEditProfile}
        economicState={economicState}
      />
    );
  };
  const renderSelectionPage = () => (
    <ModeSelectionPage 
      setCurrentMode={setCurrentMode} 
    />
  );

  // Setup wizard for personal mode
  const renderPersonalSetupWizard = () => {
    return (
      <SetupWizard
        personalData={personalData}
        setPersonalData={setPersonalData}
        setupStep={setupStep}
        setSetupStep={setSetupStep}
        setSetupCompleted={setSetupCompleted}
        setCurrentMode={setCurrentMode}
        setFinancials={setFinancials}
        originalSalaryRef={originalSalaryRef}
        onDeveloperAutofill={handleDeveloperAutofill}
      />
    );
  };

  const renderSalaryPage = () => {
    const contribution401kTraditional = personalData.currentSalary * personalData.contributions401kTraditional / 100;
    const contribution401kRoth = personalData.currentSalary * personalData.contributions401kRoth / 100;
    const taxInfo = calculateTaxes(personalData.currentSalary, personalData.state, contribution401kTraditional, contribution401kRoth);

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
              
              {/* Tech Stock Holdings - Available for all users */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <label htmlFor="techStockHoldings" className="block text-sm font-medium text-gray-700 mb-2">
                  Tech Stock Investments
                </label>
                <input
                  type="number"
                  id="techStockHoldings"
                  value={personalData.techStockHoldings || ''}
                  onChange={(e) => {
                    const holdings = parseFloat(e.target.value) || 0;
                    setPersonalData(prev => ({ 
                      ...prev, 
                      techStockHoldings: Math.max(0, holdings)
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Current value of tech stocks"
                  min="0"
                  step="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {personalData.careerField === 'Tech' 
                    ? 'Company stock options, RSUs, ESPP shares, or personal tech stock investments'
                    : 'Tech stock investments (AAPL, GOOGL, MSFT, TSLA, etc.)'
                  }. This will grow with market performance.
                </p>
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
        // If basic info not complete, show setup screen
        if (!personalData.age || !personalData.currentSalary || !personalData.state || !personalData.careerField) {
          return renderPersonalSetupWizard();
        }
        
        // Only show setup screen if explicitly not completed
        if (!setupCompleted) {
          return renderPersonalSetupWizard();
        }
        
        // Otherwise show the main dashboard
        return (
          <Dashboard
            personalData={personalData}
            financials={financials}
            currentAnnualExpenses={calculateAnnualExpenses()}
            hasStarted={hasStarted}
            simulationState={simulationState}
            simulationProgress={simulationProgress}
            historicalData={historicalData}
            economicState={economicState}
            recentEvents={recentEvents}
            taxInfo={calculateTaxes(financials.currentSalary, personalData.state, 
              personalData.currentSalary * personalData.contributions401kTraditional / 100,
              personalData.currentSalary * personalData.contributions401kRoth / 100)}
            setCurrentMode={setCurrentMode}
            showYearlyReports={showYearlyReports}
            onToggleYearlyReports={setShowYearlyReports}
            startSimulation={startSimulation}
            pauseSimulation={pauseSimulation}
            resetSimulation={resetSimulation}
            handleEditProfile={handleEditProfile}
          />
        );
      case 'salary':
        return renderSalaryPage();
      case 'expenses':
        return renderExpensesPage();
      case 'investments':
        return renderInvestmentsPage();
      case 'networth':
        return renderNetWorthPage();
      case 'bank':
        return (
          <BankAccountPage
            personalData={personalData}
            setPersonalData={setPersonalData}
            setCurrentMode={setCurrentMode}
            currentAnnualExpenses={calculateAnnualExpenses()}
            taxInfo={calculateTaxes(financials.currentSalary, personalData.state, 
              personalData.currentSalary * personalData.contributions401kTraditional / 100,
              personalData.currentSalary * personalData.contributions401kRoth / 100)}
            hasStarted={hasStarted}
            simulationState={simulationState}
            simulationProgress={simulationProgress}
            historicalData={historicalData}
            onStart={startSimulation}
            onPause={pauseSimulation}
            onReset={resetSimulation}
            onEditProfile={handleEditProfile}
          />
        );
      case 'economy':
        return renderEconomyPage();
      case 'reports':
        return (
          <YearEndReportsPage
            personalData={personalData}
            hasStarted={hasStarted}
            simulationState={simulationState}
            simulationProgress={simulationProgress}
            yearlySummaries={personalData.yearlySummaries}
            setCurrentMode={setCurrentMode}
            startSimulation={startSimulation}
            pauseSimulation={pauseSimulation}
            resetSimulation={resetSimulation}
            handleEditProfile={handleEditProfile}
          />
        );
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
      
      {/* Year End Summary Modal */}
      {showYearEndModal && currentYearlySummary && (
        <YearEndSummaryModal
          isOpen={showYearEndModal}
          summary={currentYearlySummary}
          allYearlySummaries={personalData.yearlySummaries}
          onClose={() => {
            console.log('📊 Year End: Modal closed via X button - not resuming simulation');
            setShowYearEndModal(false);
            // Don't resume simulation when closing via X button
          }}
          onContinueSimulation={() => {
            setShowYearEndModal(false);
            // Resume simulation if it was running before modal appeared
            if (personalData.wasRunningBeforeModal) {
              console.log('📊 Year End: Resuming simulation after continue button');
              // Use setTimeout to ensure modal closes first
              setTimeout(() => {
                startSimulation();
                // Clear the flag
                setPersonalData(prev => ({
                  ...prev,
                  wasRunningBeforeModal: false
                }));
              }, 100);
            } else {
              console.log('📊 Year End: Not resuming simulation (was not running before modal)');
            }
          }}
        />
      )}
    </div>
  );
};
