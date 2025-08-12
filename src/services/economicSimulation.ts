import { EconomicState } from '../types/simulation';

/**
 * Simplified Economic Simulation Service
 * Uses fixed annual returns for different investment types
 */

/**
 * Simulates one economic step (typically one year)
 * Uses simplified fixed returns instead of complex economic cycles
 */
export const simulateEconomicStep = (currentEconomic: EconomicState): EconomicState => {
  let newEconomic = { ...currentEconomic };
  
  // Simplified inflation: fixed 2.5% base with small random variation
  newEconomic.currentInflationRate = 0.025 + (Math.random() - 0.5) * 0.01; // 2.0% to 3.0%
  
  // Update cumulative inflation
  newEconomic.cumulativeInflation *= (1 + newEconomic.currentInflationRate);
  
  // Set fixed investment returns
  newEconomic.investmentReturns = {
    sp500: 0.07,      // S&P 500: 7% annually
    tech: Math.random() * 0.20, // Tech: 0-20% randomly each year
    treasuries: 0.04, // Treasuries: 4% annually
    bonds: 0.04       // Bonds: 4% annually
  };
  
  // Update legacy fields for backward compatibility (use S&P 500 as default)
  const sp500Growth = newEconomic.investmentReturns.sp500;
  newEconomic.stockMarketGrowth = sp500Growth;
  newEconomic.stockMarketIndex = currentEconomic.stockMarketIndex * (1 + sp500Growth);
  
  // Legacy cycle fields (no longer actively used but kept for compatibility)
  newEconomic.economicCycle = 'expansion';
  newEconomic.yearsInCurrentCycle += 1;
  
  console.log('Simplified Economic Step:', {
    year: newEconomic.yearsInCurrentCycle,
    inflation: (newEconomic.currentInflationRate * 100).toFixed(2) + '%',
    returns: {
      sp500: (newEconomic.investmentReturns.sp500 * 100).toFixed(1) + '%',
      tech: (newEconomic.investmentReturns.tech * 100).toFixed(1) + '%',
      treasuries: (newEconomic.investmentReturns.treasuries * 100).toFixed(1) + '%',
      bonds: (newEconomic.investmentReturns.bonds * 100).toFixed(1) + '%'
    }
  });
  
  return newEconomic;
};

/**
 * Creates an initial economic state with default values
 */
export const createInitialEconomicState = (): EconomicState => ({
  currentInflationRate: 0.025, // Start with 2.5% inflation
  cumulativeInflation: 1.0, // No inflation yet
  stockMarketIndex: 5000, // Start at S&P 500-like level
  stockMarketGrowth: 0.07, // 7% S&P 500 growth (default)
  economicCycle: 'expansion',
  yearsInCurrentCycle: 0,
  investmentReturns: {
    sp500: 0.07,      // S&P 500: 7% annually
    tech: 0.10,       // Tech: Start at 10% (will be random each year)
    treasuries: 0.04, // Treasuries: 4% annually
    bonds: 0.04       // Bonds: 4% annually
  }
});

/**
 * Resets economic state to initial values
 */
export const resetEconomicState = (): EconomicState => createInitialEconomicState();
