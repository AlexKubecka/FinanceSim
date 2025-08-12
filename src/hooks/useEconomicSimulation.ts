import { useState } from 'react';
import { EconomicState } from '../types/simulation';
import { simulateEconomicStep as simulateEconomicStepService, createInitialEconomicState } from '../services/economicSimulation';

export const useEconomicSimulation = () => {
  const [economicState, setEconomicState] = useState<EconomicState>(createInitialEconomicState());
  
  // Use the service function directly
  const simulateEconomicStep = (currentEconomic: EconomicState): EconomicState => {
    return simulateEconomicStepService(currentEconomic);
  };

  const resetEconomicState = () => {
    setEconomicState(createInitialEconomicState());
  };

  return {
    economicState,
    setEconomicState,
    simulateEconomicStep,
    resetEconomicState
  };
};
