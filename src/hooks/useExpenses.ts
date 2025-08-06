import { useState } from 'react';
import { STATE_RENT_DATA, STATE_GROCERY_DATA } from '../utils/constants';

export const useExpenses = () => {
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

  // Rent management functions
  const getCurrentRent = (state: string, hasStarted: boolean): number => {
    // If user has custom rent data, use that (already inflation-adjusted during simulation)
    if (userRentData[state]) {
      return userRentData[state];
    }
    
    // If simulation is running and we have inflation-adjusted data, use that
    if (hasStarted && inflationAdjustedRentData[state]) {
      return inflationAdjustedRentData[state];
    }
    
    // Otherwise use the original state data
    return STATE_RENT_DATA[state] ?? 0;
  };

  const handleEditRent = (state: string) => {
    if (!state) return;
    const currentRent = getCurrentRent(state, false);
    setTempRentValue(currentRent.toString());
    setEditingRent(true);
  };

  const handleSaveRent = (state: string) => {
    if (!state) return;
    const newRentValue = parseInt(tempRentValue) || 0;
    setUserRentData(prev => ({
      ...prev,
      [state]: newRentValue
    }));
    setEditingRent(false);
    setTempRentValue('');
  };

  const handleCancelEditRent = () => {
    setEditingRent(false);
    setTempRentValue('');
  };

  const handleResetRent = (state: string) => {
    if (!state) return;
    setUserRentData(prev => {
      const newData = { ...prev };
      delete newData[state];
      return newData;
    });
  };

  const isCustomRent = (state: string): boolean => {
    return userRentData.hasOwnProperty(state);
  };

  // Grocery management functions
  const getCurrentGrocery = (state: string, hasStarted: boolean): number => {
    // If user has custom grocery data, use that (already inflation-adjusted during simulation)
    if (userGroceryData[state]) {
      return userGroceryData[state];
    }
    
    // If simulation is running and we have inflation-adjusted data, use that
    if (hasStarted && inflationAdjustedGroceryData[state]) {
      return inflationAdjustedGroceryData[state];
    }
    
    // Otherwise use the original state data
    return STATE_GROCERY_DATA[state] ?? 0;
  };

  const handleEditGrocery = (state: string) => {
    if (!state) return;
    const currentGrocery = getCurrentGrocery(state, false);
    setTempGroceryValue(currentGrocery.toString());
    setEditingGrocery(true);
  };

  const handleSaveGrocery = (state: string) => {
    if (!state) return;
    const newGroceryValue = parseFloat(tempGroceryValue) || 0;
    setUserGroceryData(prev => ({
      ...prev,
      [state]: newGroceryValue
    }));
    setEditingGrocery(false);
    setTempGroceryValue('');
  };

  const handleCancelEditGrocery = () => {
    setEditingGrocery(false);
    setTempGroceryValue('');
  };

  const handleResetGrocery = (state: string) => {
    if (!state) return;
    setUserGroceryData(prev => {
      const newData = { ...prev };
      delete newData[state];
      return newData;
    });
  };

  const isCustomGrocery = (state: string): boolean => {
    return userGroceryData.hasOwnProperty(state);
  };

  // Calculate total annual expenses
  const calculateAnnualExpenses = (state: string, hasStarted: boolean): number => {
    const currentStateRent = state ? getCurrentRent(state, hasStarted) : 0;
    const annualRent = currentStateRent * 12;
    
    const currentStateGrocery = state ? getCurrentGrocery(state, hasStarted) : 0;
    const annualGrocery = currentStateGrocery * 52; // Weekly to annual
    
    return annualRent + annualGrocery;
  };

  // Apply inflation to expenses
  const applyInflationToExpenses = (
    state: string,
    currentInflationRate: number,
    setUserRentData: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>,
    setUserGroceryData: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>,
    setInflationAdjustedRentData: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>,
    setInflationAdjustedGroceryData: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>
  ) => {
    // Apply inflation to user custom data
    if (state && userRentData[state]) {
      setUserRentData(prev => ({
        ...prev,
        [state]: prev[state] * (1 + currentInflationRate)
      }));
    }

    if (state && userGroceryData[state]) {
      setUserGroceryData(prev => ({
        ...prev,
        [state]: prev[state] * (1 + currentInflationRate)
      }));
    }

    // Apply inflation to base state costs (affects all states, representing regional inflation)
    setInflationAdjustedRentData(prev => {
      const newRentData = { ...prev };
      
      // If this is the first simulation step, initialize with current state data
      if (Object.keys(prev).length === 0) {
        Object.keys(STATE_RENT_DATA).forEach(state => {
          newRentData[state] = STATE_RENT_DATA[state];
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
      
      // If this is the first simulation step, initialize with current state data
      if (Object.keys(prev).length === 0) {
        Object.keys(STATE_GROCERY_DATA).forEach(state => {
          newGroceryData[state] = STATE_GROCERY_DATA[state];
        });
      } else {
        // Apply inflation to all state costs
        Object.keys(prev).forEach(state => {
          newGroceryData[state] = prev[state] * (1 + currentInflationRate);
        });
      }
      
      return newGroceryData;
    });
  };

  // Reset inflation-adjusted data
  const resetInflationAdjustedData = () => {
    setInflationAdjustedRentData({});
    setInflationAdjustedGroceryData({});
  };

  return {
    // State
    userRentData,
    userGroceryData,
    inflationAdjustedRentData,
    inflationAdjustedGroceryData,
    editingRent,
    tempRentValue,
    editingGrocery,
    tempGroceryValue,
    
    // State setters
    setUserRentData,
    setUserGroceryData,
    setInflationAdjustedRentData,
    setInflationAdjustedGroceryData,
    setTempRentValue,
    setTempGroceryValue,
    
    // Rent functions
    getCurrentRent,
    handleEditRent,
    handleSaveRent,
    handleCancelEditRent,
    handleResetRent,
    isCustomRent,
    
    // Grocery functions
    getCurrentGrocery,
    handleEditGrocery,
    handleSaveGrocery,
    handleCancelEditGrocery,
    handleResetGrocery,
    isCustomGrocery,
    
    // Utility functions
    calculateAnnualExpenses,
    applyInflationToExpenses,
    resetInflationAdjustedData
  };
};
