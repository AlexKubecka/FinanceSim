import { EconomicState } from '../types/simulation';
import {
  INFLATION_BY_CYCLE,
  STOCK_GROWTH_BY_CYCLE,
  MARKET_VOLATILITY,
  ECONOMIC_TRANSITIONS
} from '../utils/constants';

export const useEconomicSimulation = () => {
  
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
          if (transitionRoll < ECONOMIC_TRANSITIONS.expansion.peak) {
            // 70% chance: Normal progression to peak
            newEconomic.economicCycle = 'peak';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: expansion → peak');
          } else if (transitionRoll < (ECONOMIC_TRANSITIONS.expansion.peak + ECONOMIC_TRANSITIONS.expansion.extendedExpansion)) {
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
          if (transitionRoll < ECONOMIC_TRANSITIONS.peak.recession) {
            // 55% chance: Normal progression to recession
            newEconomic.economicCycle = 'recession';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: peak → recession');
          } else if (transitionRoll < (ECONOMIC_TRANSITIONS.peak.recession + ECONOMIC_TRANSITIONS.peak.softLanding)) {
            // 30% chance: Back to expansion (soft landing)
            newEconomic.economicCycle = 'expansion';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: peak → soft landing to expansion');
          } else if (transitionRoll < (ECONOMIC_TRANSITIONS.peak.recession + ECONOMIC_TRANSITIONS.peak.softLanding + ECONOMIC_TRANSITIONS.peak.extendedPeak)) {
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
          if (transitionRoll < ECONOMIC_TRANSITIONS.recession.trough) {
            // 50% chance: Normal progression to trough
            newEconomic.economicCycle = 'trough';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: recession → trough');
          } else if (transitionRoll < (ECONOMIC_TRANSITIONS.recession.trough + ECONOMIC_TRANSITIONS.recession.vShapedRecovery)) {
            // 30% chance: Direct recovery to expansion (V-shaped recovery)
            newEconomic.economicCycle = 'expansion';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: recession → V-shaped recovery to expansion');
          } else if (transitionRoll < (ECONOMIC_TRANSITIONS.recession.trough + ECONOMIC_TRANSITIONS.recession.vShapedRecovery + ECONOMIC_TRANSITIONS.recession.extendedRecession)) {
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
          if (transitionRoll < ECONOMIC_TRANSITIONS.trough.expansion) {
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
          if (transitionRoll < ECONOMIC_TRANSITIONS.depression.trough) {
            // 60% chance: Slow recovery to trough
            newEconomic.economicCycle = 'trough';
            newEconomic.yearsInCurrentCycle = 0;
            console.log('🔄 Economic cycle transition: depression → trough (slow recovery)');
          } else if (transitionRoll < (ECONOMIC_TRANSITIONS.depression.trough + ECONOMIC_TRANSITIONS.depression.extendedDepression)) {
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
    const inflationConfig = INFLATION_BY_CYCLE[newEconomic.economicCycle];
    newEconomic.currentInflationRate = inflationConfig.base + (Math.random() * inflationConfig.variance);
    
    // Ensure inflation doesn't go below -2% (severe deflation cap)
    newEconomic.currentInflationRate = Math.max(-0.02, newEconomic.currentInflationRate);
    
    // Update cumulative inflation
    newEconomic.cumulativeInflation *= (1 + newEconomic.currentInflationRate);
    
    // Calculate stock market growth based on economic cycle (S&P 500 equivalent)
    const stockConfig = STOCK_GROWTH_BY_CYCLE[newEconomic.economicCycle];
    let stockGrowth = stockConfig.base + (Math.random() * stockConfig.variance);
    
    // Add some random volatility (monthly variations averaged over the year)
    const randomFactor = (Math.random() - 0.5) * MARKET_VOLATILITY;
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

  return {
    simulateEconomicStep
  };
};
