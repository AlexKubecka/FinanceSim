/**
 * Financial calculation utilities
 */

/**
 * Calculate current year's 401k contribution limit
 * @param year - Optional year to calculate limit for, defaults to current year
 * @returns The 401k contribution limit for the specified year
 */
export const get401kLimit = (year?: number): number => {
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
