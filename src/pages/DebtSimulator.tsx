import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CreditCard, Calculator, DollarSign, Calendar } from 'lucide-react';

interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

interface PayoffStrategy {
  strategy: 'minimum' | 'snowball' | 'avalanche';
  extraPayment: number;
}

export const DebtSimulator: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([
    { id: '1', name: 'Credit Card 1', balance: 5000, interestRate: 18.99, minimumPayment: 150 },
    { id: '2', name: 'Credit Card 2', balance: 3000, interestRate: 22.99, minimumPayment: 100 },
    { id: '3', name: 'Personal Loan', balance: 8000, interestRate: 12.99, minimumPayment: 250 }
  ]);
  
  const [strategy, setStrategy] = useState<PayoffStrategy>({
    strategy: 'minimum',
    extraPayment: 0
  });

  const [results, setResults] = useState<any>(null);

  // Calculate debt payoff scenarios
  const calculatePayoff = () => {
    const scenarios = ['minimum', 'snowball', 'avalanche'].map(strategyType => {
      const debtsCopy = [...debts];
      let totalPaid = 0;
      let totalInterest = 0;
      let months = 0;
      let monthlyData = [];
      
      // Sort debts based on strategy
      if (strategyType === 'snowball') {
        debtsCopy.sort((a, b) => a.balance - b.balance);
      } else if (strategyType === 'avalanche') {
        debtsCopy.sort((a, b) => b.interestRate - a.interestRate);
      }

      let extraPayment = strategy.extraPayment;
      
      while (debtsCopy.some(debt => debt.balance > 0) && months < 600) { // Max 50 years
        months++;
        let monthlyPayment = 0;
        let monthlyInterest = 0;
        
        // Apply minimum payments and interest
        debtsCopy.forEach(debt => {
          if (debt.balance > 0) {
            const interest = debt.balance * (debt.interestRate / 100 / 12);
            monthlyInterest += interest;
            debt.balance += interest;
            
            const payment = Math.min(debt.minimumPayment, debt.balance);
            debt.balance -= payment;
            monthlyPayment += payment;
          }
        });
        
        // Apply extra payment to strategy-specific debt
        if (extraPayment > 0 && strategyType !== 'minimum') {
          const targetDebt = debtsCopy.find(debt => debt.balance > 0);
          if (targetDebt) {
            const extraAmount = Math.min(extraPayment, targetDebt.balance);
            targetDebt.balance -= extraAmount;
            monthlyPayment += extraAmount;
          }
        }
        
        totalPaid += monthlyPayment;
        totalInterest += monthlyInterest;
        
        const remainingBalance = debtsCopy.reduce((sum, debt) => sum + debt.balance, 0);
        monthlyData.push({
          month: months,
          balance: remainingBalance,
          payment: monthlyPayment,
          interest: monthlyInterest
        });
        
        if (remainingBalance <= 0) break;
      }
      
      return {
        strategy: strategyType,
        months,
        years: Math.ceil(months / 12),
        totalPaid: Math.round(totalPaid),
        totalInterest: Math.round(totalInterest),
        monthlySavings: strategyType !== 'minimum' ? 
          Math.round((results?.minimum?.totalInterest || 0) - totalInterest) : 0,
        monthlyData: monthlyData.slice(0, Math.min(120, monthlyData.length)) // Show max 10 years
      };
    });

    const scenarioResults = scenarios.reduce((acc, scenario) => {
      acc[scenario.strategy] = scenario;
      return acc;
    }, {} as any);

    setResults(scenarioResults);
  };

  useEffect(() => {
    calculatePayoff();
  }, [debts, strategy]);

  const addDebt = () => {
    const newDebt: Debt = {
      id: Date.now().toString(),
      name: `Debt ${debts.length + 1}`,
      balance: 1000,
      interestRate: 15,
      minimumPayment: 50
    };
    setDebts([...debts, newDebt]);
  };

  const updateDebt = (id: string, field: keyof Debt, value: string | number) => {
    setDebts(debts.map(debt => 
      debt.id === id ? { ...debt, [field]: value } : debt
    ));
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter(debt => debt.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Debt Payoff Simulator</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          See how different debt payoff strategies can save you thousands of dollars and years of payments.
          The debt avalanche method focuses on highest interest rates first, while snowball focuses on smallest balances.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Debt Input Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center">
              <CreditCard className="mr-2 h-6 w-6 text-primary-600" />
              Your Debts
            </h2>
            <button
              onClick={addDebt}
              className="btn-primary text-sm"
            >
              Add Debt
            </button>
          </div>

          <div className="space-y-4">
            {debts.map((debt) => (
              <div key={debt.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <input
                    type="text"
                    value={debt.name}
                    onChange={(e) => updateDebt(debt.id, 'name', e.target.value)}
                    className="input-field text-sm"
                    placeholder="Debt name"
                  />
                  <button
                    onClick={() => removeDebt(debt.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Balance</label>
                    <input
                      type="number"
                      value={debt.balance}
                      onChange={(e) => updateDebt(debt.id, 'balance', Number(e.target.value))}
                      className="input-field text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={debt.interestRate}
                      onChange={(e) => updateDebt(debt.id, 'interestRate', Number(e.target.value))}
                      className="input-field text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min Payment</label>
                    <input
                      type="number"
                      value={debt.minimumPayment}
                      onChange={(e) => updateDebt(debt.id, 'minimumPayment', Number(e.target.value))}
                      className="input-field text-sm"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-blue-600" />
              Extra Payment Strategy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Strategy</label>
                <select
                  value={strategy.strategy}
                  onChange={(e) => setStrategy({...strategy, strategy: e.target.value as any})}
                  className="input-field text-sm"
                >
                  <option value="minimum">Minimum Payments Only</option>
                  <option value="snowball">Debt Snowball (Smallest First)</option>
                  <option value="avalanche">Debt Avalanche (Highest Rate First)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Extra Monthly Payment</label>
                <input
                  type="number"
                  value={strategy.extraPayment}
                  onChange={(e) => setStrategy({...strategy, extraPayment: Number(e.target.value)})}
                  className="input-field text-sm"
                  min="0"
                  placeholder="$0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Calculator className="mr-2 h-6 w-6 text-primary-600" />
            Payoff Comparison
          </h2>

          {results && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {['minimum', 'snowball', 'avalanche'].map((strategyType) => {
                  const result = results[strategyType];
                  const isSelected = strategy.strategy === strategyType;
                  
                  return (
                    <div
                      key={strategyType}
                      className={`p-4 rounded-lg border-2 ${
                        isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <h3 className="font-semibold capitalize text-center mb-2">
                        {strategyType === 'minimum' ? 'Minimum Only' : 
                         strategyType === 'snowball' ? 'Snowball' : 'Avalanche'}
                      </h3>
                      <div className="text-center space-y-1">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{result.years} years</span>
                        </div>
                        <div className="text-lg font-bold text-primary-600">
                          {formatCurrency(result.totalInterest)}
                        </div>
                        <div className="text-xs text-gray-600">Total Interest</div>
                        {strategyType !== 'minimum' && (
                          <div className="text-xs text-green-600 font-medium">
                            Save {formatCurrency(results.minimum.totalInterest - result.totalInterest)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart */}
              <div className="h-64">
                <h3 className="text-lg font-semibold mb-4">Debt Balance Over Time</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results[strategy.strategy]?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'balance' ? 'Remaining Balance' : 'Monthly Payment'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      name="balance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-2xl font-semibold mb-4">💡 Debt Payoff Strategies Explained</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-blue-600 mb-2">Debt Snowball</h3>
            <p className="text-sm text-gray-700">
              Pay minimums on all debts, then put extra money toward the smallest balance first. 
              This method provides psychological wins and builds momentum.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-green-600 mb-2">Debt Avalanche</h3>
            <p className="text-sm text-gray-700">
              Pay minimums on all debts, then put extra money toward the highest interest rate first. 
              This method saves the most money mathematically.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-purple-600 mb-2">Key Tips</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Stop adding new debt</li>
              <li>• Pay more than minimums</li>
              <li>• Consider debt consolidation</li>
              <li>• Build an emergency fund</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
