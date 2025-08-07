import { EconomicState } from '../types/simulation';

/**
 * Economic Simulation Service
 * Handles complex economic cycle transitions and calculations
 */

/**
 * Simulates one economic step (typically one year)
 * Handles economic cycle transitions, inflation rates, and stock market movements
 */
export const simulateEconomicStep = (currentEconomic: EconomicState, previousYearIndex: number): EconomicState => {
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

/**
 * Creates an initial economic state with default values
 */
export const createInitialEconomicState = (): EconomicState => ({
  currentInflationRate: 0.025, // Start with 2.5% inflation
  cumulativeInflation: 1.0, // No inflation yet
  stockMarketIndex: 5000, // Start at S&P 500-like level
  stockMarketGrowth: 0.10, // 10% average annual growth (including dividends)
  economicCycle: 'expansion',
  yearsInCurrentCycle: 0
});

/**
 * Resets economic state to initial values
 */
export const resetEconomicState = (): EconomicState => createInitialEconomicState();
