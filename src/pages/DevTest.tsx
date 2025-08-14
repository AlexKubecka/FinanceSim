import React, { useState } from 'react';
import { PersonalFinancialData, SimulationProgress, HistoricalDataPoint } from '../types/simulation';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Calculate debt payment for historical display using fixed payment amounts
// Since debt amounts change each year, we calculate based on the original parameters
const calculateHistoricalDebtPayment = (data: PersonalFinancialData): number => {
  const originalDebtAmount = data.debtAmount || 0;
  const debtInterestRate = data.debtInterestRate || 0;
  
  if (originalDebtAmount <= 0 || data.debtPaymentPlan === 'none') {
    return 0;
  }
  
  const monthlyRate = debtInterestRate / 100 / 12;
  
  // Calculate fixed payment based on original debt amount and plan
  if (data.debtPaymentPlan === '30-year') {
    const monthsIn30Years = 30 * 12;
    return monthlyRate > 0 
      ? (originalDebtAmount * monthlyRate * Math.pow(1 + monthlyRate, monthsIn30Years)) / (Math.pow(1 + monthlyRate, monthsIn30Years) - 1)
      : originalDebtAmount / monthsIn30Years;
  } else if (data.debtPaymentPlan === '15-year') {
    const monthsIn15Years = 15 * 12;
    return monthlyRate > 0 
      ? (originalDebtAmount * monthlyRate * Math.pow(1 + monthlyRate, monthsIn15Years)) / (Math.pow(1 + monthlyRate, monthsIn15Years) - 1)
      : originalDebtAmount / monthsIn15Years;
  } else if (data.debtPaymentPlan === '5-year') {
    const monthsIn5Years = 5 * 12;
    return monthlyRate > 0 
      ? (originalDebtAmount * monthlyRate * Math.pow(1 + monthlyRate, monthsIn5Years)) / (Math.pow(1 + monthlyRate, monthsIn5Years) - 1)
      : originalDebtAmount / monthsIn5Years;
  } else if (data.debtPaymentPlan === 'custom') {
    return data.customDebtPayment || 0;
  }
  
  return 0;
};

// Get historical debt amount for a specific year
const getHistoricalDebtAmount = (year: number, historicalData: HistoricalDataPoint[], currentDebtAmount: number): number => {
  // Find the historical data point that corresponds to this year
  const historicalPoint = historicalData.find(point => {
    // Calculate year from age if simulationProgress is available, 
    // or use a simple match based on the order of yearly summaries
    return point.age && year > 0; // Simple placeholder logic
  });
  
  // If we have historical data for this specific year, use the debt amount from that point
  if (historicalPoint && typeof historicalPoint.debt === 'number') {
    return historicalPoint.debt;
  }
  
  // Fallback to current debt amount if no historical data available
  return currentDebtAmount;
};

interface DevTestProps {
  data: PersonalFinancialData;
  setData: React.Dispatch<React.SetStateAction<PersonalFinancialData>>;
  navigate: (page: string) => void;
  formatCurrency: (amount: number) => string;
  historicalData?: HistoricalDataPoint[];
  // Simulation controls
  hasStarted?: boolean;
  simulationState?: 'setup' | 'running' | 'paused' | 'completed';
  simulationProgress?: SimulationProgress;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

const DevTest: React.FC<DevTestProps> = ({ 
  data, 
  setData, 
  navigate, 
  formatCurrency,
  historicalData = [],
  hasStarted = false,
  simulationState = 'setup',
  simulationProgress,
  onStart,
  onPause,
  onReset
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Autofill preset values - customize these values as needed
  const presetValues = {
    // Basic Info
    age: 25,
    currentSalary: 100000,
    state: "Maryland",
    careerField: "Tech" as const,
    maritalStatus: "single" as const,

    // Expenses
    monthlyRent: 2000,
    weeklyGroceries: 100,

    // Bonuses
    cashBonus: 0,
    stockBonus: 0,

    // 401k Setup
    contributions401kTraditional: 5,
    contributions401kRoth: 5,
    match401k: 5,

    // IRA Setup
    iraTraditionalContribution: 1000,
    iraRothContribution: 1000,

    // Personal Taxable Setup
    monthlyInvestment: 0,

    // Account Holdings - 401k Traditional
    the401kTraditionalHoldings: 0,
    the401kTraditionalTechHoldings: 0,
    the401kTraditionalCash: 0,

    // Account Holdings - 401k Roth
    the401kRothHoldings: 0,
    the401kRothTechHoldings: 0,
    the401kRothCash: 0,

    // Account Holdings - IRA Traditional
    iraTraditionalHoldings: 0,
    iraTraditionalTechHoldings: 0,
    iraTraditionalCash: 0,

    // Account Holdings - IRA Roth
    iraRothHoldings: 0,
    iraRothTechHoldings: 0,
    iraRothCash: 0,

    // Account Holdings - Personal Taxable
    investments: 0,
    techStockHoldings: 0,
    personalInvestmentCash: 0,

    // Bank Accounts
    checkingAccount: 0,
    savingsAccount: 0,
    hysaAccount: 0,

    // Debt
    debtAmount: 300000,
    debtInterestRate: 6.5,
    debtPaymentPlan: '30-year' as const,
    customDebtPayment: 0,
  };

  const handleAutofill = () => {
    setData(prev => ({
      ...prev,
      ...presetValues
    }));
  };

  // Calculate derived values
  const annual401kTraditional = (data.currentSalary * data.contributions401kTraditional) / 100;
  const annual401kRoth = (data.currentSalary * data.contributions401kRoth) / 100;
  const employerMatch = (data.currentSalary * data.match401k) / 100;
  const total401k = annual401kTraditional + annual401kRoth + employerMatch;
  const totalIRA = data.iraTraditionalContribution + data.iraRothContribution;
  const annualPersonalInvestment = data.monthlyInvestment * 12;
  const totalAnnualInvestments = total401k + totalIRA + annualPersonalInvestment;

  // Personal taxable breakdown with fixed allocations
  const personalS500Allocation = 0.7; // 70% to S&P 500
  const personalTechAllocation = 0.3; // 30% to Tech
  const annualPersonalS500 = annualPersonalInvestment * personalS500Allocation;
  const annualPersonalTech = annualPersonalInvestment * personalTechAllocation;

  // Account totals
  const total401kTraditional = (data.the401kTraditionalHoldings || 0) + (data.the401kTraditionalTechHoldings || 0) + (data.the401kTraditionalCash || 0);
  const total401kRoth = (data.the401kRothHoldings || 0) + (data.the401kRothTechHoldings || 0) + (data.the401kRothCash || 0);
  const totalIRATraditional = (data.iraTraditionalHoldings || 0) + (data.iraTraditionalTechHoldings || 0) + (data.iraTraditionalCash || 0);
  const totalIRARoth = (data.iraRothHoldings || 0) + (data.iraRothTechHoldings || 0) + (data.iraRothCash || 0);
  const totalPersonalTaxable = (data.investments || 0) + (data.techStockHoldings || 0) + (data.personalInvestmentCash || 0);

  const handleEdit = (field: string, currentValue: number | string) => {
    setEditingField(field);
    setEditValue(currentValue.toString());
  };

  const handleSave = (field: string) => {
    const numValue = parseFloat(editValue) || 0;
    setData(prev => ({
      ...prev,
      [field]: numValue
    }));
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveString = (field: string) => {
    setData(prev => ({
      ...prev,
      [field]: editValue
    }));
    setEditingField(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const renderEditableField = (field: string, value: number | string, isPercentage: boolean = false, isString: boolean = false) => {
    if (editingField === field) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type={isString ? "text" : "number"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
            step={isPercentage ? "0.5" : "1"}
          />
          <button
            onClick={() => isString ? handleSaveString(field) : handleSave(field)}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="font-mono">
          {isString ? value : (isPercentage ? `${value}%` : formatCurrency(value as number))}
        </span>
        <button
          onClick={() => handleEdit(field, value)}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Edit
        </button>
      </div>
    );
  };

  const tableData = [
    // Basic Info
    { category: 'Basic Info', name: 'Current Age', field: 'age', value: data.age, calculation: 'User Input', editable: true },
    { category: 'Basic Info', name: 'Current Salary', field: 'currentSalary', value: data.currentSalary, calculation: 'User Input', editable: true },
    { category: 'Basic Info', name: 'State', field: 'state', value: data.state, calculation: 'User Input', editable: true, isString: true },
    { category: 'Basic Info', name: 'Career Field', field: 'careerField', value: data.careerField, calculation: 'User Input', editable: true, isString: true },
    { category: 'Basic Info', name: 'Marital Status', field: 'maritalStatus', value: data.maritalStatus, calculation: 'User Input', editable: true, isString: true },

    // Expenses
    { category: 'Expenses', name: 'Monthly Rent', field: 'monthlyRent', value: data.monthlyRent || 0, calculation: 'User Input (or state average)', editable: true },
    { category: 'Expenses', name: 'Weekly Groceries', field: 'weeklyGroceries', value: data.weeklyGroceries || 0, calculation: 'User Input (or state average)', editable: true },

    // Bonuses
    { category: 'Bonuses', name: 'Cash Bonus', field: 'cashBonus', value: data.cashBonus, calculation: 'User Input', editable: true },
    { category: 'Bonuses', name: 'Stock Bonus', field: 'stockBonus', value: data.stockBonus, calculation: 'User Input', editable: true },

    // 401k Setup & Calculated (Combined)
    { category: '401k Setup & Calculated', name: 'Traditional %', field: 'contributions401kTraditional', value: data.contributions401kTraditional, calculation: '% of salary', editable: true, isPercentage: true },
    { category: '401k Setup & Calculated', name: 'Traditional Amount', field: null, value: annual401kTraditional, calculation: `${data.currentSalary} × ${data.contributions401kTraditional}%`, editable: false },
    { category: '401k Setup & Calculated', name: 'Roth %', field: 'contributions401kRoth', value: data.contributions401kRoth, calculation: '% of salary', editable: true, isPercentage: true },
    { category: '401k Setup & Calculated', name: 'Roth Amount', field: null, value: annual401kRoth, calculation: `${data.currentSalary} × ${data.contributions401kRoth}%`, editable: false },
    { category: '401k Setup & Calculated', name: 'Employer Match %', field: 'match401k', value: data.match401k, calculation: '% of salary', editable: true, isPercentage: true },
    { category: '401k Setup & Calculated', name: 'Employer Match Amount', field: null, value: employerMatch, calculation: `${data.currentSalary} × ${data.match401k}%`, editable: false },
    { category: '401k Setup & Calculated', name: 'Total Annual 401k', field: null, value: total401k, calculation: 'Traditional + Roth + Match', editable: false },

    // IRA Contributions
    { category: 'IRA Setup', name: 'Traditional IRA Annual', field: 'iraTraditionalContribution', value: data.iraTraditionalContribution, calculation: 'User Input', editable: true },
    { category: 'IRA Setup', name: 'Roth IRA Annual', field: 'iraRothContribution', value: data.iraRothContribution, calculation: 'User Input', editable: true },
    { category: 'IRA Setup', name: 'Total Annual IRA', field: null, value: totalIRA, calculation: 'Traditional + Roth', editable: false },

    // Personal Taxable Investing
    { category: 'Personal Taxable Setup', name: 'Monthly Investment', field: 'monthlyInvestment', value: data.monthlyInvestment, calculation: 'User Input', editable: true },
    { category: 'Personal Taxable Setup', name: 'Annual Investment', field: null, value: annualPersonalInvestment, calculation: 'Monthly × 12', editable: false },
    { category: 'Personal Taxable Setup', name: 'S&P 500 Allocation %', field: null, value: personalS500Allocation * 100, calculation: 'Fixed allocation percentage', editable: false, isPercentage: true },
    { category: 'Personal Taxable Setup', name: 'Tech Allocation %', field: null, value: personalTechAllocation * 100, calculation: 'Fixed allocation percentage', editable: false, isPercentage: true },
    { category: 'Personal Taxable Setup', name: 'Annual to S&P 500', field: null, value: annualPersonalS500, calculation: `${annualPersonalInvestment} × ${personalS500Allocation}`, editable: false },
    { category: 'Personal Taxable Setup', name: 'Annual to Tech', field: null, value: annualPersonalTech, calculation: `${annualPersonalInvestment} × ${personalTechAllocation}`, editable: false },

    // Total Investment Summary
    { category: 'Investment Summary', name: 'Total Annual Investments', field: null, value: totalAnnualInvestments, calculation: '401k + IRA + Personal', editable: false },

    // Account Balances - 401k Traditional
    { category: '401k Traditional Holdings', name: 'S&P 500 Holdings', field: 'the401kTraditionalHoldings', value: data.the401kTraditionalHoldings || 0, calculation: 'Simulation Calculated', editable: true },
    { category: '401k Traditional Holdings', name: 'Tech Holdings', field: 'the401kTraditionalTechHoldings', value: data.the401kTraditionalTechHoldings || 0, calculation: 'Simulation Calculated', editable: true },
    { category: '401k Traditional Holdings', name: 'Cash', field: 'the401kTraditionalCash', value: data.the401kTraditionalCash || 0, calculation: 'Simulation Calculated', editable: true },
    { category: '401k Traditional Holdings', name: 'Total', field: null, value: total401kTraditional, calculation: 'S&P 500 + Tech + Cash', editable: false },

    // Account Balances - 401k Roth
    { category: '401k Roth Holdings', name: 'S&P 500 Holdings', field: 'the401kRothHoldings', value: data.the401kRothHoldings || 0, calculation: 'Simulation Calculated', editable: true },
    { category: '401k Roth Holdings', name: 'Tech Holdings', field: 'the401kRothTechHoldings', value: data.the401kRothTechHoldings || 0, calculation: 'Simulation Calculated', editable: true },
    { category: '401k Roth Holdings', name: 'Cash', field: 'the401kRothCash', value: data.the401kRothCash || 0, calculation: 'Simulation Calculated', editable: true },
    { category: '401k Roth Holdings', name: 'Total', field: null, value: total401kRoth, calculation: 'S&P 500 + Tech + Cash', editable: false },

    // Account Balances - IRA Traditional
    { category: 'IRA Traditional Holdings', name: 'S&P 500 Holdings', field: 'iraTraditionalHoldings', value: data.iraTraditionalHoldings || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'IRA Traditional Holdings', name: 'Tech Holdings', field: 'iraTraditionalTechHoldings', value: data.iraTraditionalTechHoldings || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'IRA Traditional Holdings', name: 'Cash', field: 'iraTraditionalCash', value: data.iraTraditionalCash || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'IRA Traditional Holdings', name: 'Total', field: null, value: totalIRATraditional, calculation: 'S&P 500 + Tech + Cash', editable: false },

    // Account Balances - IRA Roth
    { category: 'IRA Roth Holdings', name: 'S&P 500 Holdings', field: 'iraRothHoldings', value: data.iraRothHoldings || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'IRA Roth Holdings', name: 'Tech Holdings', field: 'iraRothTechHoldings', value: data.iraRothTechHoldings || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'IRA Roth Holdings', name: 'Cash', field: 'iraRothCash', value: data.iraRothCash || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'IRA Roth Holdings', name: 'Total', field: null, value: totalIRARoth, calculation: 'S&P 500 + Tech + Cash', editable: false },

    // Account Balances - Personal Taxable
    { category: 'Personal Taxable Holdings', name: 'S&P 500 Holdings (investments)', field: 'investments', value: data.investments || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'Personal Taxable Holdings', name: 'Tech Holdings', field: 'techStockHoldings', value: data.techStockHoldings || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'Personal Taxable Holdings', name: 'Cash', field: 'personalInvestmentCash', value: data.personalInvestmentCash || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'Personal Taxable Holdings', name: 'Total', field: null, value: totalPersonalTaxable, calculation: 'S&P 500 + Tech + Cash', editable: false },

    // Bank Accounts
    { category: 'Bank Accounts', name: 'Checking Account', field: 'checkingAccount', value: data.checkingAccount || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'Bank Accounts', name: 'Savings Account', field: 'savingsAccount', value: data.savingsAccount || 0, calculation: 'Simulation Calculated', editable: true },
    { category: 'Bank Accounts', name: 'HYSA Account', field: 'hysaAccount', value: data.hysaAccount || 0, calculation: 'Simulation Calculated', editable: true },

    // Debt
    { category: 'Debt', name: 'Debt Amount', field: 'debtAmount', value: data.debtAmount || 0, calculation: 'User Input/Simulation', editable: true },
    { category: 'Debt', name: 'Debt Interest Rate', field: 'debtInterestRate', value: data.debtInterestRate || 0, calculation: 'User Input', editable: true, isPercentage: true },
    { category: 'Debt', name: 'Debt Payment Plan', field: 'debtPaymentPlan', value: data.debtPaymentPlan || 'none', calculation: 'User Input', editable: true, isString: true },
    { category: 'Debt', name: 'Custom Monthly Payment', field: 'customDebtPayment', value: data.customDebtPayment || 0, calculation: 'User Input (if plan = custom)', editable: true },
  ];

  // Group data by category
  const groupedData = tableData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof tableData>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('personal')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="text-sm font-medium">← Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">Dev Test - Financial Data Debug</h1>
          </div>
          <div className="text-sm text-gray-500">
            Debug all financial calculations and data
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Instructions */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">How to Use This Debug Page</h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Editable fields</strong> have blue "Edit" buttons - click to modify values</li>
            <li>• <strong>Calculated fields</strong> show formulas and update automatically</li>
            <li>• Use this page to verify all calculations are working correctly</li>
            <li>• Make changes here and they'll be reflected throughout the app</li>
          </ul>
        </div>

        {/* Data Tables by Category */}
        {Object.entries(groupedData).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              {category}
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                      Parameter
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                      Calculation/Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.editable && item.field ? (
                          renderEditableField(item.field, item.value as number, item.isPercentage, item.isString)
                        ) : typeof item.value === 'string' ? (
                          <span className="font-mono">{item.value}</span>
                        ) : (
                          <span className="font-mono">
                            {item.isPercentage ? `${item.value}%` : formatCurrency(item.value as number)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {item.calculation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Simulation Controls */}
        {(onStart || onPause || onReset) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Simulation Controls</h2>
            <div className="flex items-center space-x-4">
              {!hasStarted ? (
                <button
                  onClick={onStart}
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Simulation
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  {simulationState === 'running' ? (
                    <button
                      onClick={onPause}
                      className="flex items-center bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={onStart}
                      className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </button>
                  )}
                  <button
                    onClick={onReset}
                    className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </button>
                </div>
              )}
              
              {/* Simulation Status */}
              {hasStarted && simulationProgress && (
                <div className="bg-white rounded-lg px-4 py-2 border">
                  <div className="text-sm text-gray-600">
                    Age: <span className="font-bold text-blue-600">{simulationProgress.currentAge}</span> | 
                    Years Elapsed: <span className="font-bold text-blue-600">{simulationProgress.yearsElapsed}</span> | 
                    Status: <span className="font-bold text-blue-600 capitalize">{simulationState}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historical Data - Previous 2 Years */}
        {data.yearlySummaries && data.yearlySummaries.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-purple-800 mb-4">
              Historical Data - Last {Math.min(2, data.yearlySummaries.length)} Year{data.yearlySummaries.length > 1 ? 's' : ''}
            </h2>
            <div className="space-y-4">
              {data.yearlySummaries.slice(-2).map((summary) => (
                <div key={summary.year} className="bg-white rounded-lg p-4 border">
                  <h3 className="text-md font-semibold text-purple-700 mb-3">
                    Year {summary.year} (Age {summary.age})
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Net Worth</h4>
                      <div className="text-sm space-y-1">
                        <div>Start: <span className="font-mono">{formatCurrency(summary.financial.startingNetWorth)}</span></div>
                        <div>End: <span className="font-mono">{formatCurrency(summary.financial.endingNetWorth)}</span></div>
                        <div className={`${summary.financial.netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Change: <span className="font-mono">{formatCurrency(summary.financial.netWorthChange)}</span>
                          <span className="ml-1">({summary.financial.netWorthChangePercentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Cash Flow</h4>
                      <div className="text-sm space-y-1">
                        <div>Income: <span className="font-mono">{formatCurrency(summary.financial.takeHomePay)}</span></div>
                        <div>Expenses: <span className="font-mono">{formatCurrency(summary.financial.totalExpenses)}</span></div>
                        <div>Investments: <span className="font-mono">{formatCurrency(summary.financial.totalInvestmentContributions)}</span></div>
                        <div className="text-red-600">Debt Payments: <span className="font-mono">{formatCurrency(calculateHistoricalDebtPayment(data) * 12)}</span></div>
                        <div className={`${summary.financial.cashFlowToSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          To Savings: <span className="font-mono">{formatCurrency(summary.financial.cashFlowToSavings)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Bank Accounts</h4>
                      <div className="text-sm space-y-1">
                        <div>Checking: <span className="font-mono">{formatCurrency(summary.financial.bankAccounts.checking)}</span></div>
                        <div>Savings: <span className="font-mono">{formatCurrency(summary.financial.bankAccounts.savings)}</span></div>
                        <div>HYSA: <span className="font-mono">{formatCurrency(summary.financial.bankAccounts.hysa)}</span></div>
                        <div className="font-medium">Total: <span className="font-mono">{formatCurrency(summary.financial.bankAccounts.totalCash)}</span></div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Investments</h4>
                      <div className="text-sm space-y-1">
                        <div>401k Trad: <span className="font-mono">{formatCurrency(summary.financial.investments.traditional401k)}</span></div>
                        <div>401k Roth: <span className="font-mono">{formatCurrency(summary.financial.investments.roth401k)}</span></div>
                        <div>IRA Trad: <span className="font-mono">{formatCurrency(summary.financial.investments.traditionalIra)}</span></div>
                        <div>IRA Roth: <span className="font-mono">{formatCurrency(summary.financial.investments.rothIra)}</span></div>
                        <div>Taxable: <span className="font-mono">{formatCurrency(summary.financial.investments.taxable)}</span></div>
                        <div className="font-medium">Total: <span className="font-mono">{formatCurrency(summary.financial.investments.total)}</span></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Debt & Cash Flow</h4>
                      <div className="text-sm space-y-1">
                        {(() => {
                          // Try to find the actual debt amount for this specific year from historical data
                          const yearAge = summary.age;
                          const historicalPoint = historicalData.find(point => point.age === yearAge);
                          const actualDebtAmount = historicalPoint?.debt ?? data.debtAmount;
                          
                          return (
                            <>
                              <div>Debt Amount: <span className="font-mono">{formatCurrency(actualDebtAmount || 0)}</span></div>
                              <div>Interest Rate: <span className="font-mono">{(data.debtInterestRate || 0).toFixed(1)}%</span></div>
                              <div>Payment Plan: <span className="font-mono text-xs">{data.debtPaymentPlan || 'none'}</span></div>
                              <div className="font-medium text-red-600">
                                Monthly Payment: <span className="font-mono">{formatCurrency(calculateHistoricalDebtPayment(data))}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {actualDebtAmount && actualDebtAmount > 0 ? '⚠️ Impact on Cash Flow' : '✅ No Debt Payments'}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Quick Actions</h2>
          <div className="flex space-x-4">
            <button
              onClick={handleAutofill}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🎯 Autofill Test Values
            </button>
            <button
              onClick={() => navigate('personal')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('investments')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Investment Accounts
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevTest;
