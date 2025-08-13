import { useState, useRef, useEffect } from 'react';
import { 
  SimulationProgress, 
  EconomicState, 
  HistoricalDataPoint, 
  PersonalFinancialData 
} from '../types/simulation';
import { INITIAL_ECONOMIC_STATE } from '../utils/constants';

type SimulationState = 'setup' | 'running' | 'paused' | 'completed';

interface UseSimulationProps {
  personalData: PersonalFinancialData;
  financials: {
    investmentAccountValue: number;
    annualExpenses: number;
  };
  calculateTaxes: (
    annualSalary: number, 
    state: string, 
    contribution401kTraditional: number, 
    contribution401kRoth: number, 
    year?: number
  ) => any;
  updatePersonalData: (data: Partial<PersonalFinancialData>) => void;
  updateFinancials: (data: any) => void;
  simulateEconomicStep: (currentEconomic: EconomicState) => EconomicState;
}

export const useSimulation = ({
  personalData,
  financials,
  calculateTaxes,
  updatePersonalData,
  updateFinancials,
  simulateEconomicStep
}: UseSimulationProps) => {
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

  // Economic state
  const [economicState, setEconomicState] = useState<EconomicState>(INITIAL_ECONOMIC_STATE);
  
  // Chart state
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Track state variables
  const [hasStarted, setHasStarted] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [setupStep, setSetupStep] = useState(1);

  // Event notifications
  const [recentEvents, setRecentEvents] = useState<Array<{
    type: string;
    description: string;
    timestamp: Date;
    id: string;
  }>>([]);

  // Refs for immediate updates
  const intervalRef = useRef<number | null>(null);
  const currentStockIndexRef = useRef<number>(INITIAL_ECONOMIC_STATE.stockMarketIndex);
  const yearsInCurrentCycleRef = useRef<number>(0);
  const currentEconomicCycleRef = useRef<'expansion' | 'peak' | 'recession' | 'trough' | 'depression'>('expansion');
  const originalSalaryRef = useRef<number>(0);

  // Main simulation step function
  const runSimulationStep = () => {
    let newAge = simulationProgress.currentAge;
    
    // Create updated economic state with current values
    const currentEconomicState = {
      ...economicState,
      stockMarketIndex: currentStockIndexRef.current,
      yearsInCurrentCycle: yearsInCurrentCycleRef.current,
      economicCycle: currentEconomicCycleRef.current
    };
    
    // Simulate economic changes
    const newEconomicState = simulateEconomicStep(currentEconomicState);
    setEconomicState(newEconomicState);
    
    // Update all refs (for immediate access)
    currentStockIndexRef.current = newEconomicState.stockMarketIndex;
    yearsInCurrentCycleRef.current = newEconomicState.yearsInCurrentCycle;
    currentEconomicCycleRef.current = newEconomicState.economicCycle;
    
    // Update simulation progress
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

    // Check for retirement account milestone alerts
    const previousAge = simulationProgress.currentAge;
    
    // IRA penalty-free withdrawal at age 59.5 (but we check at 60 for simplicity)
    if (previousAge < 60 && newAge >= 60) {
      setRecentEvents(prev => {
        const newEvent = {
          type: 'retirement_milestone',
          description: '🎉 You turned 60! You can now make penalty-free withdrawals from your IRA accounts (available since age 59½).',
          timestamp: new Date(),
          id: Math.random().toString(36).substr(2, 9)
        };
        return [newEvent, ...prev].slice(0, 5);
      });
    }
    
    // Early Social Security at age 62
    if (previousAge < 62 && newAge >= 62) {
      setRecentEvents(prev => {
        const newEvent = {
          type: 'retirement_milestone',
          description: '💰 You turned 62! You can now claim early Social Security benefits (at reduced rates).',
          timestamp: new Date(),
          id: Math.random().toString(36).substr(2, 9)
        };
        return [newEvent, ...prev].slice(0, 5);
      });
    }
    
    // Medicare and traditional retirement at age 65
    if (previousAge < 65 && newAge >= 65) {
      setRecentEvents(prev => {
        const newEvent = {
          type: 'retirement_milestone',
          description: '🎉 You turned 65! You can now access Medicare and make full retirement withdrawals from your 401k.',
          timestamp: new Date(),
          id: Math.random().toString(36).substr(2, 9)
        };
        return [newEvent, ...prev].slice(0, 5);
      });
    }
    
    // Full Social Security retirement age (67 for most people)
    if (previousAge < 67 && newAge >= 67) {
      setRecentEvents(prev => {
        const newEvent = {
          type: 'retirement_milestone',
          description: '🏆 You turned 67! You can now claim full Social Security benefits without reduction.',
          timestamp: new Date(),
          id: Math.random().toString(36).substr(2, 9)
        };
        return [newEvent, ...prev].slice(0, 5);
      });
    }

    // Update financials with inflation effects
    let newInvestmentValue = 0;
    
    // Adjust salary for inflation (salary typically keeps up partially with inflation)
    const salaryInflationAdjustment = 1 + (newEconomicState.currentInflationRate * 0.8); // 80% inflation adjustment
    updatePersonalData({
      currentSalary: personalData.currentSalary * salaryInflationAdjustment
    });

    // Calculate investment growth
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

    // Calculate monthly investment contributions (non-401k, non-IRA)
    const annualMonthlyInvestments = personalData.monthlyInvestment * 12;
    const annualIraContributions = (personalData.iraTraditionalContribution || 0) + (personalData.iraRothContribution || 0);

    // Apply investment growth to existing portfolio
    // Use S&P 500 growth rate for general investments
    const investmentGrowthRate = newEconomicState.investmentReturns.sp500;
    const previousInvestmentValue = financials.investmentAccountValue;
    
    // Calculate new investment value: previous value grows + new contributions
    // Note: We include 401k and IRA in the total value for historical tracking, but allocate them separately
    newInvestmentValue = (previousInvestmentValue * (1 + investmentGrowthRate)) + 
                        total401kContribution + annualMonthlyInvestments + annualIraContributions;

    // Also update the specific account holdings for retirement contributions
    updatePersonalData({
      // Allocate traditional 401(k) contributions (employee + all employer match)
      the401kTraditionalHoldings: (personalData.the401kTraditionalHoldings || 0) + annual401kTraditional + employerMatch,
      // Allocate Roth 401(k) contributions (employee only, no employer match)
      the401kRothHoldings: (personalData.the401kRothHoldings || 0) + annual401kRoth,
      // Also update IRA holdings with their contributions
      iraTraditionalHoldings: (personalData.iraTraditionalHoldings || 0) + (personalData.iraTraditionalContribution || 0),
      iraRothHoldings: (personalData.iraRothHoldings || 0) + (personalData.iraRothContribution || 0)
    });

    updateFinancials({
      investmentAccountValue: newInvestmentValue,
      investments: newInvestmentValue, // Keep both for compatibility
    });

    // Calculate proper net worth and update personal data savings
    const updatedAnnualExpenses = financials.annualExpenses * (1 + newEconomicState.currentInflationRate);
    
    let updatedSavings = personalData.savings;
    const contribution401kTraditional = personalData.currentSalary * personalData.contributions401kTraditional / 100;
    const contribution401kRoth = personalData.currentSalary * personalData.contributions401kRoth / 100;
    const simulationYear = simulationProgress.currentDate.getFullYear();
    const taxInfo = calculateTaxes(personalData.currentSalary, personalData.state, contribution401kTraditional, contribution401kRoth, simulationYear);
    const annualCashFlow = taxInfo.afterTaxIncome - updatedAnnualExpenses;
    
    updatedSavings = personalData.savings + annualCashFlow;
    updatePersonalData({ savings: updatedSavings });
    
    const calculatedNetWorth = updatedSavings + newInvestmentValue;

    // Update net worth with proper calculation
    updateFinancials({
      netWorth: calculatedNetWorth,
      currentSalary: personalData.currentSalary,
      annualExpenses: updatedAnnualExpenses // Update expenses for inflation
    });

    // Record historical data with the updated values
    setHistoricalData(prev => {
      const newPoint: HistoricalDataPoint = {
        age: newAge,
        netWorth: calculatedNetWorth,
        salary: personalData.currentSalary,
        investments: newInvestmentValue,
        debt: 0,
        debtPayment: 0,
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
        debtPayment: 0,
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
    setRecentEvents([]);
    
    // Reset economic state
    setEconomicState(INITIAL_ECONOMIC_STATE);
    
    // Reset all refs
    currentStockIndexRef.current = INITIAL_ECONOMIC_STATE.stockMarketIndex;
    yearsInCurrentCycleRef.current = 0;
    currentEconomicCycleRef.current = 'expansion';
    
    // Reset salary back to original value (before inflation adjustments)
    if (originalSalaryRef.current > 0) {
      updatePersonalData({
        savings: 0,
        currentSalary: originalSalaryRef.current
      });
      
      updateFinancials({
        netWorth: 0,
        currentSalary: originalSalaryRef.current,
        investments: 0,
        investmentAccountValue: 0
      });
    } else {
      // Reset savings to 0
      updatePersonalData({ savings: 0 });
      
      updateFinancials({
        netWorth: 0,
        investments: 0,
        investmentAccountValue: 0
      });
    }
  };

  // Career action functions
  const handlePromotion = () => {
    const salaryIncrease = 0.15; // 15% increase
    const newSalary = personalData.currentSalary * (1 + salaryIncrease);
    
    updatePersonalData({ currentSalary: newSalary });
    updateFinancials({ currentSalary: newSalary });
    
    // Update original salary reference if this is a permanent change
    if (hasStarted) {
      originalSalaryRef.current = newSalary;
    }
    
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
    
    updatePersonalData({ currentSalary: newSalary });
    updateFinancials({ currentSalary: newSalary });
    
    // Update original salary reference if this is a permanent change
    if (hasStarted) {
      originalSalaryRef.current = newSalary;
    }
    
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
    updatePersonalData({ currentSalary: 0 });
    updateFinancials({ currentSalary: 0 });
    
    // Update original salary reference if this is a permanent change
    if (hasStarted) {
      originalSalaryRef.current = 0;
    }
    
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
      updatePersonalData({ currentSalary: salary });
      updateFinancials({ currentSalary: salary });
      
      // Update original salary reference if this is a permanent change
      if (hasStarted) {
        originalSalaryRef.current = salary;
      }
      
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

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    simulationState,
    simulationProgress,
    economicState,
    historicalData,
    hasStarted,
    setupCompleted,
    setupStep,
    recentEvents,
    
    // State setters
    setSetupCompleted,
    setSetupStep,
    
    // Actions
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation,
    handlePromotion,
    handleDemotion,
    handleQuitJob,
    handleNewJob
  };
};
