import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Target, PiggyBank } from 'lucide-react';

interface InvestmentInputs {
  initialAmount: number;
  monthlyContribution: number;
  annualReturn: number;
  timeHorizon: number;
}

interface InvestmentResult {
  year: number;
  balance: number;
  contributions: number;
  earnings: number;
  totalContributions: number;
}

export const InvestmentSimulator: React.FC = () => {
  const [inputs, setInputs] = useState<InvestmentInputs>({
    initialAmount: 1000,
    monthlyContribution: 500,
    annualReturn: 7,
    timeHorizon: 30
  });

  const [results, setResults] = useState<InvestmentResult[]>([]);
  const [finalResult, setFinalResult] = useState<{
    totalBalance: number;
    totalContributions: number;
    totalEarnings: number;
  }>({ totalBalance: 0, totalContributions: 0, totalEarnings: 0 });

  const calculateInvestment = () => {
    const { initialAmount, monthlyContribution, annualReturn, timeHorizon } = inputs;
    const monthlyRate = annualReturn / 100 / 12;
    const results: InvestmentResult[] = [];
    
    let balance = initialAmount;
    let totalContributions = initialAmount;
    
    // Add year 0
    results.push({
      year: 0,
      balance: initialAmount,
      contributions: initialAmount,
      earnings: 0,
      totalContributions: initialAmount
    });

    for (let year = 1; year <= timeHorizon; year++) {
      let yearStartBalance = balance;
      let yearContributions = 0;
      
      // Calculate monthly growth and contributions
      for (let month = 1; month <= 12; month++) {
        // Add monthly contribution
        balance += monthlyContribution;
        yearContributions += monthlyContribution;
        totalContributions += monthlyContribution;
        
        // Apply monthly growth
        balance *= (1 + monthlyRate);
      }
      
      const earnings = balance - totalContributions;
      
      results.push({
        year,
        balance: Math.round(balance),
        contributions: Math.round(yearContributions),
        earnings: Math.round(earnings),
        totalContributions: Math.round(totalContributions)
      });
    }
    
    setResults(results);
    
    const final = results[results.length - 1];
    setFinalResult({
      totalBalance: final.balance,
      totalContributions: final.totalContributions,
      totalEarnings: final.earnings
    });
  };

  useEffect(() => {
    calculateInvestment();
  }, [inputs]);

  const updateInput = (field: keyof InvestmentInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  // Prepare chart data
  const chartData = results.map(result => ({
    year: result.year,
    'Total Balance': result.balance,
    'Total Contributions': result.totalContributions,
    'Investment Earnings': result.earnings
  }));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Investment Growth Simulator</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover the power of compound interest and see how consistent investing can build substantial wealth over time.
          Small amounts invested regularly can grow into life-changing sums.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <DollarSign className="mr-2 h-6 w-6 text-primary-600" />
            Investment Parameters
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Investment
              </label>
              <input
                type="number"
                value={inputs.initialAmount}
                onChange={(e) => updateInput('initialAmount', Number(e.target.value))}
                className="input-field"
                min="0"
                step="100"
              />
              <p className="text-xs text-gray-500 mt-1">Starting amount to invest</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Contribution
              </label>
              <input
                type="number"
                value={inputs.monthlyContribution}
                onChange={(e) => updateInput('monthlyContribution', Number(e.target.value))}
                className="input-field"
                min="0"
                step="50"
              />
              <p className="text-xs text-gray-500 mt-1">Amount invested each month</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Annual Return (%)
              </label>
              <input
                type="number"
                value={inputs.annualReturn}
                onChange={(e) => updateInput('annualReturn', Number(e.target.value))}
                className="input-field"
                min="0"
                max="20"
                step="0.5"
              />
              <p className="text-xs text-gray-500 mt-1">Historical stock market average: ~7-10%</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Horizon (Years)
              </label>
              <input
                type="number"
                value={inputs.timeHorizon}
                onChange={(e) => updateInput('timeHorizon', Number(e.target.value))}
                className="input-field"
                min="1"
                max="50"
                step="1"
              />
              <p className="text-xs text-gray-500 mt-1">How long you plan to invest</p>
            </div>
          </div>

          {/* Quick Scenarios */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Quick Scenarios</h3>
            <div className="space-y-2">
              <button
                onClick={() => setInputs({ initialAmount: 0, monthlyContribution: 200, annualReturn: 7, timeHorizon: 30 })}
                className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-blue-50"
              >
                🎯 Young Professional: $200/month for 30 years
              </button>
              <button
                onClick={() => setInputs({ initialAmount: 5000, monthlyContribution: 1000, annualReturn: 7, timeHorizon: 20 })}
                className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-blue-50"
              >
                💼 Mid-Career: $5k start + $1k/month for 20 years
              </button>
              <button
                onClick={() => setInputs({ initialAmount: 50000, monthlyContribution: 2000, annualReturn: 6, timeHorizon: 15 })}
                className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-blue-50"
              >
                🏠 Pre-Retirement: $50k + $2k/month for 15 years
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center mb-2">
                <Target className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-700">Final Balance</span>
              </div>
              <div className="text-2xl font-bold text-green-800">
                {formatCurrency(finalResult.totalBalance)}
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center mb-2">
                <PiggyBank className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-700">Total Contributed</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {formatCurrency(finalResult.totalContributions)}
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-700">Investment Earnings</span>
              </div>
              <div className="text-2xl font-bold text-purple-800">
                {formatCurrency(finalResult.totalEarnings)}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {finalResult.totalContributions > 0 
                  ? `${Math.round((finalResult.totalEarnings / finalResult.totalContributions) * 100)}% growth`
                  : ''
                }
              </div>
            </div>
          </div>

          {/* Investment Growth Chart */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Investment Growth Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(Number(value)), name]}
                    labelFormatter={(year) => `Year ${year}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Total Contributions" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="url(#colorContributions)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Investment Earnings" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="url(#colorBalance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50">
        <h2 className="text-2xl font-semibold mb-4">💡 The Magic of Compound Interest</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-green-600 mb-3">Why Start Early?</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <div>
                  <strong>Time is your biggest advantage:</strong> Starting 10 years earlier can result in hundreds of thousands more dollars
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <div>
                  <strong>Compound interest:</strong> You earn returns on your returns, creating exponential growth
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <div>
                  <strong>Dollar-cost averaging:</strong> Regular investing reduces the impact of market volatility
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-blue-600 mb-3">Investment Tips</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <div>
                  <strong>Diversify:</strong> Don't put all eggs in one basket - spread investments across different assets
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <div>
                  <strong>Stay consistent:</strong> Regular monthly contributions are more powerful than trying to time the market
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <div>
                  <strong>Think long-term:</strong> Short-term market fluctuations matter less over 10+ year periods
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
