import React from 'react';
import { User, Code } from 'lucide-react';
import { PersonalFinancialData } from '../types/simulation';
import { stateRentData, stateGroceryData } from '../utils/expenseData';
import { get401kLimit } from '../utils/financialCalculations';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth' | 'bank' | 'reports';

interface SetupWizardProps {
  // Personal data state
  personalData: PersonalFinancialData;
  setPersonalData: (updater: (prev: PersonalFinancialData) => PersonalFinancialData) => void;
  
  // Setup flow state
  setupStep: number;
  setSetupStep: (step: number) => void;
  setSetupCompleted: (completed: boolean) => void;
  
  // Navigation
  setCurrentMode: React.Dispatch<React.SetStateAction<SimulationMode>>;
  
  // Financial state setters (for salary updates)
  setFinancials: (updater: (prev: any) => any) => void;
  originalSalaryRef: React.MutableRefObject<number>;
  
  // Developer tools
  onDeveloperAutofill?: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  personalData,
  setPersonalData,
  setupStep,
  setSetupStep,
  setSetupCompleted,
  setCurrentMode,
  setFinancials,
  originalSalaryRef,
  onDeveloperAutofill
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => {
            setSetupCompleted(false);
            setSetupStep(1);
            setCurrentMode('selection');
          }}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
        >
          ← Back to Selection
        </button>
        <User className="h-8 w-8 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Personal Financial Setup</h1>
      </div>

      {/* Basic Information Setup */}
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              setupStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${setupStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              setupStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${setupStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              setupStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {setupStep === 1 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Personal Information</h2>
            <p className="text-center text-gray-600 mb-8">Let's start with some basic information about you.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Age</label>
                <input
                  type="number"
                  value={personalData.age || ''}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter your age"
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                  min="18"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={personalData.state}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                >
                  <option value="">Choose your state...</option>
                  {Object.keys(stateRentData).sort().map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                <select
                  value={personalData.maritalStatus}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, maritalStatus: e.target.value as 'single' | 'married-jointly' | 'married-separately' }))}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                >
                  <option value="single">Single</option>
                  <option value="married-jointly">Married Filing Jointly</option>
                  <option value="married-separately">Married Filing Separately</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">This affects IRA contribution limits</p>
              </div>

              {/* Developer Autofill Section */}
              {onDeveloperAutofill && process.env.NODE_ENV === 'development' && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Developer Tools
                  </h3>
                  <p className="text-purple-700 mb-3 text-sm">
                    Quickly populate realistic test data for development and testing.
                  </p>
                  <button
                    onClick={onDeveloperAutofill}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    🔧 Generate Test Data & Start Simulation
                  </button>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setPersonalData(prev => ({ ...prev, age: 0, state: '' }));
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors text-lg font-semibold"
                >
                  Clear
                </button>
                
                <button
                  onClick={() => {
                    if (personalData.age && personalData.state) {
                      setSetupStep(2);
                    }
                  }}
                  disabled={!personalData.age || !personalData.state}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
                >
                  Next: Job Info
                </button>
              </div>
            </div>
          </div>
        )}

        {setupStep === 2 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Job & Financial Information</h2>
            <p className="text-center text-gray-600 mb-8">Now let's set up your employment and 401(k) details. You can skip fields you're unsure about.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Salary</label>
                <input
                  type="number"
                  value={personalData.currentSalary || ''}
                  onChange={(e) => {
                    const salary = parseFloat(e.target.value) || 0;
                    const roundedSalary = Math.round(salary * 100) / 100;
                    setPersonalData(prev => ({ ...prev, currentSalary: roundedSalary }));
                    setFinancials(prev => ({ ...prev, currentSalary: roundedSalary }));
                    originalSalaryRef.current = roundedSalary;
                  }}
                  placeholder="Enter your annual salary"
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Career Field</label>
                <select
                  value={personalData.careerField}
                  onChange={(e) => {
                    const newField = e.target.value as PersonalFinancialData['careerField'];
                    setPersonalData(prev => ({
                      ...prev,
                      careerField: newField,
                      stockBonus: (newField === 'Government' || newField === 'Service') ? 0 : prev.stockBonus
                    }));
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                >
                  <option value="">Select career field...</option>
                  <option value="Tech">Tech</option>
                  <option value="Government">Government</option>
                  <option value="Service">Service</option>
                </select>
              </div>

              {/* Tech Stock Holdings - Available for all users */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tech Stock Investments (Optional)
                </label>
                <input
                  type="number"
                  value={personalData.techStockHoldings || ''}
                  onChange={(e) => {
                    const holdings = parseFloat(e.target.value) || 0;
                    setPersonalData(prev => ({ 
                      ...prev, 
                      techStockHoldings: Math.max(0, holdings)
                    }));
                  }}
                  placeholder="Enter current value of tech stocks"
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                  min="0"
                  step="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {personalData.careerField === 'Tech' 
                    ? 'Include company stock options, RSUs, ESPP shares, or personal tech stock investments'
                    : 'Include any tech stock investments (AAPL, GOOGL, MSFT, TSLA, etc.)'
                  }
                </p>
                <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-700">
                  💡 <strong>Tip:</strong> This will grow with market performance during the simulation and be included in your net worth calculations.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">401(k) Company Match (%)</label>
                <input
                  type="number"
                  value={personalData.match401k}
                  onChange={(e) => setPersonalData(prev => ({
                    ...prev,
                    match401k: Math.max(0, Math.min(100, Math.round(Number(e.target.value) * 100) / 100))
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  max="100"
                />
                <p className="text-sm text-gray-500 mt-1">Percentage of salary matched by employer</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Traditional 401(k) (%)</label>
                  <input
                    type="number"
                    value={personalData.contributions401kTraditional}
                    onChange={(e) => {
                      const percentage = Number(e.target.value);
                      const roundedPercentage = Math.round(percentage * 100) / 100;
                      const current401kLimit = get401kLimit();
                      const totalCurrent = personalData.contributions401kRoth;
                      const maxPercentage = personalData.currentSalary > 0 ? Math.floor(((current401kLimit / personalData.currentSalary) * 100) * 100) / 100 : 100;
                      const maxTraditional = Math.max(0, maxPercentage - totalCurrent);
                      
                      setPersonalData(prev => ({
                        ...prev,
                        contributions401kTraditional: Math.max(0, Math.min(maxTraditional, roundedPercentage))
                      }));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pre-tax contribution</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roth 401(k) (%)</label>
                  <input
                    type="number"
                    value={personalData.contributions401kRoth}
                    onChange={(e) => {
                      const percentage = Number(e.target.value);
                      const roundedPercentage = Math.round(percentage * 100) / 100;
                      const current401kLimit = get401kLimit();
                      const totalCurrent = personalData.contributions401kTraditional;
                      const maxPercentage = personalData.currentSalary > 0 ? Math.floor(((current401kLimit / personalData.currentSalary) * 100) * 100) / 100 : 100;
                      const maxRoth = Math.max(0, maxPercentage - totalCurrent);
                      
                      setPersonalData(prev => ({
                        ...prev,
                        contributions401kRoth: Math.max(0, Math.min(maxRoth, roundedPercentage))
                      }));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">After-tax contribution</p>
                </div>
              </div>

              {personalData.currentSalary > 0 && (personalData.contributions401kTraditional > 0 || personalData.contributions401kRoth > 0) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Total 401(k): ${Math.min(
                      personalData.currentSalary * (personalData.contributions401kTraditional + personalData.contributions401kRoth) / 100,
                      get401kLimit()
                    ).toLocaleString()} annually
                    <span className="block text-xs">
                      IRS limit: ${get401kLimit().toLocaleString()}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setSetupStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors text-lg font-semibold"
                >
                  ← Previous
                </button>
                
                <button
                  onClick={() => {
                    if (personalData.currentSalary && personalData.careerField) {
                      setSetupStep(3);
                    }
                  }}
                  disabled={!personalData.currentSalary || !personalData.careerField}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
                >
                  Next: Financial Details
                </button>
              </div>
            </div>
          </div>
        )}

        {setupStep === 3 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Financial Details & IRA Information</h2>
            <p className="text-center text-gray-600 mb-8">
              Let's add some optional details to make your simulation more accurate. 
              <br />
              <span className="text-sm text-gray-500">All fields are optional - we'll use state averages if you leave them blank.</span>
            </p>
            
            <div className="space-y-6">
              {/* Expense Information */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">🏠</span>
                  Living Expenses
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rent (Optional)
                    </label>
                    <input
                      type="number"
                      value={personalData.monthlyRent || ''}
                      onChange={(e) => {
                        const rent = parseFloat(e.target.value) || undefined;
                        setPersonalData(prev => ({ ...prev, monthlyRent: rent }));
                      }}
                      placeholder={`State average: $${personalData.state ? stateRentData[personalData.state]?.toLocaleString() || 'N/A' : 'Select state first'}`}
                      className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                      min="0"
                      step="50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If left blank, we'll use your state's average rent
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weekly Groceries (Optional)
                    </label>
                    <input
                      type="number"
                      value={personalData.weeklyGroceries || ''}
                      onChange={(e) => {
                        const groceries = parseFloat(e.target.value) || undefined;
                        setPersonalData(prev => ({ ...prev, weeklyGroceries: groceries }));
                      }}
                      placeholder={`State average: $${personalData.state ? stateGroceryData[personalData.state]?.toLocaleString() || 'N/A' : 'Select state first'}`}
                      className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                      min="0"
                      step="5"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If left blank, we'll use your state's average grocery costs
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Savings */}
              <div className="p-6 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">💵</span>
                  Current Savings
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Cash Savings Balance
                  </label>
                  <input
                    type="number"
                    value={personalData.savingsAccount || ''}
                    onChange={(e) => {
                      const savings = parseFloat(e.target.value) || 0;
                      setPersonalData(prev => ({ 
                        ...prev, 
                        savings: 0, // Clear legacy field to prevent double counting
                        // Initialize bank account system with savings going to savings account
                        savingsAccount: Math.max(0, savings),
                        checkingAccount: 0,
                        hysaAccount: 0
                      }));
                    }}
                    placeholder="Current savings balance"
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                    min="0"
                    step="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your current cash savings (will be placed in Savings Account initially - you can move to HYSA for better returns!)
                  </p>
                </div>
              </div>

              {/* IRA Information */}
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">💰</span>
                  IRA Accounts
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Traditional IRA Balance
                      </label>
                      <input
                        type="number"
                        value={personalData.iraTraditionalHoldings || ''}
                        onChange={(e) => {
                          const holdings = parseFloat(e.target.value) || 0;
                          setPersonalData(prev => ({ ...prev, iraTraditionalHoldings: Math.max(0, holdings) }));
                        }}
                        placeholder="Current balance"
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                        min="0"
                        step="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your current traditional IRA account balance
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Roth IRA Balance
                      </label>
                      <input
                        type="number"
                        value={personalData.iraRothHoldings || ''}
                        onChange={(e) => {
                          const holdings = parseFloat(e.target.value) || 0;
                          setPersonalData(prev => ({ ...prev, iraRothHoldings: Math.max(0, holdings) }));
                        }}
                        placeholder="Current balance"
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                        min="0"
                        step="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your current Roth IRA account balance
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Annual Traditional IRA Contribution
                      </label>
                      <input
                        type="number"
                        value={personalData.iraTraditionalContribution || ''}
                        onChange={(e) => {
                          const contribution = parseFloat(e.target.value) || 0;
                          const iraLimit = 7000; // 2024 IRA contribution limit
                          const maxTraditional = Math.max(0, iraLimit - (personalData.iraRothContribution || 0));
                          setPersonalData(prev => ({ 
                            ...prev, 
                            iraTraditionalContribution: Math.max(0, Math.min(maxTraditional, contribution))
                          }));
                        }}
                        placeholder="Annual contribution"
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                        min="0"
                        step="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Pre-tax contribution (2024 limit: $7,000)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Annual Roth IRA Contribution
                      </label>
                      <input
                        type="number"
                        value={personalData.iraRothContribution || ''}
                        onChange={(e) => {
                          const contribution = parseFloat(e.target.value) || 0;
                          const iraLimit = 7000; // 2024 IRA contribution limit
                          const maxRoth = Math.max(0, iraLimit - (personalData.iraTraditionalContribution || 0));
                          setPersonalData(prev => ({ 
                            ...prev, 
                            iraRothContribution: Math.max(0, Math.min(maxRoth, contribution))
                          }));
                        }}
                        placeholder="Annual contribution"
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                        min="0"
                        step="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        After-tax contribution (2024 limit: $7,000 combined)
                      </p>
                    </div>
                  </div>

                  {((personalData.iraTraditionalContribution || 0) + (personalData.iraRothContribution || 0)) > 0 && (
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Total IRA Contributions: ${((personalData.iraTraditionalContribution || 0) + (personalData.iraRothContribution || 0)).toLocaleString()} annually
                        <span className="block text-xs">
                          IRS limit: $7,000 combined ({((personalData.iraTraditionalContribution || 0) + (personalData.iraRothContribution || 0)) > 7000 ? 'OVER LIMIT' : 'within limit'})
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setSetupStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors text-lg font-semibold"
                >
                  ← Previous
                </button>
                
                <button
                  onClick={() => setSetupCompleted(true)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
                >
                  Next: Review & Start
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
