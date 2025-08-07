import { useState, useCallback, useRef } from 'react';
import { SimulationProgress, EconomicState } from '../types/simulation';
import { createInitialEconomicState } from '../services/economicSimulation';

export const useSimulationState = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [speed, setSpeed] = useState(1);
  
  const [simulationProgress, setSimulationProgress] = useState<SimulationProgress>({
    currentAge: 0,
    currentDate: new Date(),
    startDate: new Date(),
    yearsElapsed: 0,
    monthsElapsed: 0,
    daysElapsed: 0,
    speedMultiplier: 1
  });

  const [economicState, setEconomicState] = useState<EconomicState>(createInitialEconomicState());
  
  // Refs for immediate access during simulation
  const intervalRef = useRef<number | null>(null);
  const currentStockIndexRef = useRef<number>(economicState.stockMarketIndex);
  const yearsInCurrentCycleRef = useRef<number>(economicState.yearsInCurrentCycle);
  const currentEconomicCycleRef = useRef<string>(economicState.economicCycle);
  const originalSalaryRef = useRef<number>(0);

  const startSimulation = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setHasStarted(true);
  }, []);

  const pauseSimulation = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setHasStarted(false);
    setSimulationProgress({
      currentAge: 0,
      currentDate: new Date(),
      startDate: new Date(),
      yearsElapsed: 0,
      monthsElapsed: 0,
      daysElapsed: 0,
      speedMultiplier: 1
    });
    setEconomicState(createInitialEconomicState());
    
    // Reset refs
    currentStockIndexRef.current = economicState.stockMarketIndex;
    yearsInCurrentCycleRef.current = economicState.yearsInCurrentCycle;
    currentEconomicCycleRef.current = economicState.economicCycle;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [economicState.stockMarketIndex, economicState.yearsInCurrentCycle, economicState.economicCycle]);

  const updateSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  return {
    // State
    isRunning,
    isPaused,
    hasStarted,
    speed,
    simulationProgress,
    economicState,
    
    // Refs
    intervalRef,
    currentStockIndexRef,
    yearsInCurrentCycleRef,
    currentEconomicCycleRef,
    originalSalaryRef,
    
    // Actions
    startSimulation,
    pauseSimulation,
    resetSimulation,
    updateSpeed,
    setSimulationProgress,
    setEconomicState
  };
};
