import React, { useState } from 'react';
import { Calculator, Home, DollarSign, TrendingUp } from 'lucide-react';

export const FinancialCalculators: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = useState<'emergency' | 'retirement' | 'loan'>('emergency');

  // Emergency Fund Calculator
  const [emergencyInputs, setEmergencyInputs] = useState({
    monthlyExpenses: 3000,
    months: 6
  });

  // Retirement Calculator
  const [retirementInputs, setRetirementInputs] = useState({
    currentAge: 25,
    retirementAge: 65,
    currentSavings: 10000,
    monthlyContribution: 500,
    expectedReturn: 7
  });

  // Loan Calculator
  const [loanInputs, setLoanInputs] = useState({
    loanAmount: 200000,
    interestRate: 4.5,
    loanTerm: 30
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateEmergencyFund = () => {
    return emergencyInputs.monthlyExpenses * emergencyInputs.months;
  };

  const calculateRetirement = () => {
    const yearsToRetirement = retirementInputs.retirementAge - retirementInputs.currentAge;
    const monthlyRate = retirementInputs.expectedReturn / 100 / 12;
    const totalMonths = yearsToRetirement * 12;
    
    // Future value of current savings
    const currentSavingsFV = retirementInputs.currentSavings * Math.pow(1 + monthlyRate, totalMonths);
    
    // Future value of monthly contributions
    const contributionsFV = retirementInputs.monthlyContribution * 
      ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    
    return currentSavingsFV + contributionsFV;
  };

  const calculateLoan = () => {
    const monthlyRate = loanInputs.interestRate / 100 / 12;
    const totalMonths = loanInputs.loanTerm * 12;
    
    const monthlyPayment = loanInputs.loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    const totalPaid = monthlyPayment * totalMonths;
    const totalInterest = totalPaid - loanInputs.loanAmount;
    
    return { monthlyPayment, totalPaid, totalInterest };
  };

  const calculators = [
    {
      id: 'emergency',
      title: 'Emergency Fund',
      icon: Home,
      description: 'Calculate how much you need for emergencies'
    },
    {
      id: 'retirement',
      title: 'Retirement Savings',
      icon: TrendingUp,
      description: 'Plan for your retirement goals'
    },
    {
      id: 'loan',
      title: 'Loan Payment',
      icon: DollarSign,
      description: 'Calculate mortgage and loan payments'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Financial Calculators</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Use these tools to plan your financial future. Calculate emergency funds, retirement savings, and loan payments.
        </p>
      </div>

      {/* Calculator Selection */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {calculators.map((calc) => (
            <button
              key={calc.id}
              onClick={() => setActiveCalculator(calc.id as any)}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
                activeCalculator === calc.id
                  ? 'bg-white shadow-sm text-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <calc.icon className="h-4 w-4 mr-2" />
              {calc.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Emergency Fund Calculator */}
        {activeCalculator === 'emergency' && (
          <>
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Home className="mr-2 h-6 w-6 text-primary-600" />
                Emergency Fund Calculator
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Expenses
                  </label>
                  <input
                    type="number"
                    value={emergencyInputs.monthlyExpenses}
                    onChange={(e) => setEmergencyInputs({
                      ...emergencyInputs,
                      monthlyExpenses: Number(e.target.value)
                    })}
                    className="input-field"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include rent, food, utilities, insurance, minimum debt payments
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Months of Coverage
                  </label>
                  <select
                    value={emergencyInputs.months}
                    onChange={(e) => setEmergencyInputs({
                      ...emergencyInputs,
                      months: Number(e.target.value)
                    })}
                    className="input-field"
                  >
                    <option value={3}>3 months (minimum)</option>
                    <option value={6}>6 months (recommended)</option>
                    <option value={9}>9 months (conservative)</option>
                    <option value={12}>12 months (very conservative)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="card bg-green-50">
              <h3 className="text-xl font-semibold mb-4 text-green-700">Your Emergency Fund Goal</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {formatCurrency(calculateEmergencyFund())}
                </div>
                <p className="text-gray-600">
                  This covers {emergencyInputs.months} months of expenses
                </p>
              </div>
              
              <div className="mt-6 p-4 bg-white rounded-lg">
                <h4 className="font-semibold mb-2">💡 Emergency Fund Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keep it in a high-yield savings account</li>
                  <li>• Start with $1,000 if you have debt</li>
                  <li>• Build to 3-6 months after paying off debt</li>
                  <li>• Only use for true emergencies</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Retirement Calculator */}
        {activeCalculator === 'retirement' && (
          <>
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-primary-600" />
                Retirement Calculator
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Age
                    </label>
                    <input
                      type="number"
                      value={retirementInputs.currentAge}
                      onChange={(e) => setRetirementInputs({
                        ...retirementInputs,
                        currentAge: Number(e.target.value)
                      })}
                      className="input-field"
                      min="18"
                      max="80"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retirement Age
                    </label>
                    <input
                      type="number"
                      value={retirementInputs.retirementAge}
                      onChange={(e) => setRetirementInputs({
                        ...retirementInputs,
                        retirementAge: Number(e.target.value)
                      })}
                      className="input-field"
                      min="50"
                      max="80"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Retirement Savings
                  </label>
                  <input
                    type="number"
                    value={retirementInputs.currentSavings}
                    onChange={(e) => setRetirementInputs({
                      ...retirementInputs,
                      currentSavings: Number(e.target.value)
                    })}
                    className="input-field"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Contribution
                  </label>
                  <input
                    type="number"
                    value={retirementInputs.monthlyContribution}
                    onChange={(e) => setRetirementInputs({
                      ...retirementInputs,
                      monthlyContribution: Number(e.target.value)
                    })}
                    className="input-field"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Annual Return (%)
                  </label>
                  <input
                    type="number"
                    value={retirementInputs.expectedReturn}
                    onChange={(e) => setRetirementInputs({
                      ...retirementInputs,
                      expectedReturn: Number(e.target.value)
                    })}
                    className="input-field"
                    min="0"
                    max="15"
                    step="0.5"
                  />
                </div>
              </div>
            </div>
            
            <div className="card bg-blue-50">
              <h3 className="text-xl font-semibold mb-4 text-blue-700">Retirement Projection</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {formatCurrency(calculateRetirement())}
                </div>
                <p className="text-gray-600">
                  Estimated balance at age {retirementInputs.retirementAge}
                </p>
              </div>
              
              <div className="mt-6 p-4 bg-white rounded-lg">
                <h4 className="font-semibold mb-2">💡 Retirement Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Contribute to employer 401(k) match first</li>
                  <li>• Consider Roth IRA for tax-free growth</li>
                  <li>• Increase contributions with salary raises</li>
                  <li>• Rule of thumb: Save 10-15% of income</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Loan Calculator */}
        {activeCalculator === 'loan' && (
          <>
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <DollarSign className="mr-2 h-6 w-6 text-primary-600" />
                Loan Payment Calculator
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount
                  </label>
                  <input
                    type="number"
                    value={loanInputs.loanAmount}
                    onChange={(e) => setLoanInputs({
                      ...loanInputs,
                      loanAmount: Number(e.target.value)
                    })}
                    className="input-field"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    value={loanInputs.interestRate}
                    onChange={(e) => setLoanInputs({
                      ...loanInputs,
                      interestRate: Number(e.target.value)
                    })}
                    className="input-field"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Term (Years)
                  </label>
                  <select
                    value={loanInputs.loanTerm}
                    onChange={(e) => setLoanInputs({
                      ...loanInputs,
                      loanTerm: Number(e.target.value)
                    })}
                    className="input-field"
                  >
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={25}>25 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="card bg-orange-50">
              <h3 className="text-xl font-semibold mb-4 text-orange-700">Loan Details</h3>
              {(() => {
                const result = calculateLoan();
                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {formatCurrency(result.monthlyPayment)}
                      </div>
                      <p className="text-gray-600">Monthly Payment</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-lg font-semibold text-gray-800">
                          {formatCurrency(result.totalPaid)}
                        </div>
                        <div className="text-xs text-gray-600">Total Paid</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-lg font-semibold text-red-600">
                          {formatCurrency(result.totalInterest)}
                        </div>
                        <div className="text-xs text-gray-600">Total Interest</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div className="mt-6 p-4 bg-white rounded-lg">
                <h4 className="font-semibold mb-2">💡 Loan Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Shorter terms = higher payments but less interest</li>
                  <li>• Extra principal payments save significant interest</li>
                  <li>• Shop around for the best interest rates</li>
                  <li>• Consider 20% down payment to avoid PMI</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
