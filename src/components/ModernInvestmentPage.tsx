import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, BarChart3, DollarSign, Activity, Info, PieChart, ArrowLeft, Building2, User } from 'lucide-react';
import { PersonalFinancialData, SimulationState, SimulationProgress, EconomicState } from '../types/simulation';
import { Investment, TransactionHistory, PortfolioData, ChartDataPoint, InvestmentAccount, AccountType, InvestmentType } from '../types/investment';
import { SimulationControls } from './SimulationControls';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, PieChart as RechartsPieChart, Cell } from 'recharts';

interface ModernInvestmentPageProps {
  data: PersonalFinancialData;
  setData: React.Dispatch<React.SetStateAction<PersonalFinancialData>>;
  navigate: (page: string) => void;
  formatCurrency: (amount: number) => string;
  hasStarted?: boolean;
  simulationState?: SimulationState;
  simulationProgress?: SimulationProgress;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onEditProfile?: () => void;
  economicState?: EconomicState;
  financials?: {
    currentSalary: number;
    netWorth: number;
    annualExpenses: number;
    investments: number;
    investmentAccountValue: number;
  };
}

const ModernInvestmentPage: React.FC<ModernInvestmentPageProps> = ({
  data,
  setData,
  navigate,
  formatCurrency,
  hasStarted,
  simulationState,
  simulationProgress,
  onStart,
  onPause,
  onReset,
  onEditProfile,
  economicState
}) => {
  const [selectedAccount, setSelectedAccount] = useState<AccountType>('personal');
  const [selectedInvestment, setSelectedInvestment] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [sellShares, setSellShares] = useState<string>('');
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);

  // Create investment accounts from personal data
  const investmentAccounts: InvestmentAccount[] = useMemo(() => [
    {
      id: 'personal',
      name: 'Personal Taxable Account',
      description: 'Individual investment account with no contribution limits',
      totalValue: (data.investments || 0) + (data.techStockHoldings || 0),
      holdings: {
        sp500: { investmentType: 'sp500', shares: (data.investments || 0) / 450, totalValue: data.investments || 0 },
        tech: { investmentType: 'tech', shares: (data.techStockHoldings || 0) / 180, totalValue: data.techStockHoldings || 0 },
        treasuries: { investmentType: 'treasuries', shares: 0, totalValue: 0 },
        bonds: { investmentType: 'bonds', shares: 0, totalValue: 0 }
      },
      taxAdvantaged: false
    },
    {
      id: 'ira-traditional',
      name: 'Traditional IRA',
      description: 'Tax-deferred retirement account',
      totalValue: data.iraTraditionalHoldings || 0,
      holdings: {
        sp500: { investmentType: 'sp500', shares: (data.iraTraditionalHoldings || 0) / 450, totalValue: data.iraTraditionalHoldings || 0 },
        tech: { investmentType: 'tech', shares: 0, totalValue: 0 },
        treasuries: { investmentType: 'treasuries', shares: 0, totalValue: 0 },
        bonds: { investmentType: 'bonds', shares: 0, totalValue: 0 }
      },
      taxAdvantaged: true,
      contributionLimit: 6500,
      penaltyAge: 59.5
    },
    {
      id: 'ira-roth',
      name: 'Roth IRA',
      description: 'Tax-free retirement account',
      totalValue: data.iraRothHoldings || 0,
      holdings: {
        sp500: { investmentType: 'sp500', shares: (data.iraRothHoldings || 0) / 450, totalValue: data.iraRothHoldings || 0 },
        tech: { investmentType: 'tech', shares: 0, totalValue: 0 },
        treasuries: { investmentType: 'treasuries', shares: 0, totalValue: 0 },
        bonds: { investmentType: 'bonds', shares: 0, totalValue: 0 }
      },
      taxAdvantaged: true,
      contributionLimit: 6500,
      penaltyAge: 59.5
    },
    {
      id: '401k-traditional',
      name: '401(k) Traditional',
      description: 'Employer-sponsored pre-tax retirement account',
      totalValue: data.the401kTraditionalHoldings || 0,
      holdings: {
        sp500: { investmentType: 'sp500', shares: (data.the401kTraditionalHoldings || 0) / 450, totalValue: data.the401kTraditionalHoldings || 0 },
        tech: { investmentType: 'tech', shares: 0, totalValue: 0 },
        treasuries: { investmentType: 'treasuries', shares: 0, totalValue: 0 },
        bonds: { investmentType: 'bonds', shares: 0, totalValue: 0 }
      },
      taxAdvantaged: true,
      contributionLimit: 23000,
      penaltyAge: 59.5
    },
    {
      id: '401k-roth',
      name: '401(k) Roth',
      description: 'Employer-sponsored after-tax retirement account',
      totalValue: data.the401kRothHoldings || 0,
      holdings: {
        sp500: { investmentType: 'sp500', shares: (data.the401kRothHoldings || 0) / 450, totalValue: data.the401kRothHoldings || 0 },
        tech: { investmentType: 'tech', shares: 0, totalValue: 0 },
        treasuries: { investmentType: 'treasuries', shares: 0, totalValue: 0 },
        bonds: { investmentType: 'bonds', shares: 0, totalValue: 0 }
      },
      taxAdvantaged: true,
      contributionLimit: 23000,
      penaltyAge: 59.5
    }
  ], [data.investments, data.techStockHoldings, data.iraTraditionalHoldings, data.iraRothHoldings, data.the401kTraditionalHoldings, data.the401kRothHoldings]);

  // Available investments for trading
  const availableInvestments: Investment[] = useMemo(() => [
    {
      id: 'sp500',
      type: 'sp500',
      name: 'S&P 500 Index Fund',
      symbol: 'SPY',
      currentPrice: 450,
      dayChange: 5.4,
      dayChangePercent: 1.2,
      annualReturn: economicState?.investmentReturns?.sp500 || 0.07,
      description: 'Tracks the S&P 500 index, providing broad market exposure',
      riskLevel: 'Medium',
      category: 'Index Funds'
    },
    {
      id: 'tech',
      type: 'tech',
      name: 'Technology Stock Portfolio',
      symbol: 'TECH',
      currentPrice: 180,
      dayChange: 4.5,
      dayChangePercent: 2.5,
      annualReturn: economicState?.investmentReturns?.tech || 0.12,
      description: 'High-growth technology companies with higher volatility',
      riskLevel: 'High',
      category: 'Growth Stocks'
    },
    {
      id: 'treasuries',
      type: 'treasuries',
      name: 'US Treasury Bonds',
      symbol: 'GOVT',
      currentPrice: 100,
      dayChange: 0.1,
      dayChangePercent: 0.1,
      annualReturn: economicState?.investmentReturns?.treasuries || 0.04,
      description: 'Safe government bonds with guaranteed returns',
      riskLevel: 'Low',
      category: 'Fixed Income'
    },
    {
      id: 'bonds',
      type: 'bonds',
      name: 'Corporate Bond Fund',
      symbol: 'BOND',
      currentPrice: 95,
      dayChange: 0.19,
      dayChangePercent: 0.2,
      annualReturn: economicState?.investmentReturns?.bonds || 0.04,
      description: 'Diversified corporate bonds with moderate risk',
      riskLevel: 'Low',
      category: 'Fixed Income'
    }
  ], [economicState]);

  // Get current account
  const currentAccount = investmentAccounts.find(acc => acc.id === selectedAccount);

  // Calculate portfolio data for all accounts combined
  const portfolioData: PortfolioData = useMemo(() => {
    const totalValue = investmentAccounts.reduce((sum, acc) => sum + acc.totalValue, 0);
    const totalCost = totalValue; // For now, assume no gains/losses display
    const dayChange = totalValue * 0.012; // Mock daily change
    
    return {
      totalValue,
      totalCost,
      totalGainLoss: 0, // Will be calculated based on transaction history
      totalGainLossPercent: 0,
      dayChange,
      dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0
    };
  }, [investmentAccounts]);

  // Mock chart data for portfolio performance
  const chartData: ChartDataPoint[] = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const baseValue = portfolioData.totalValue;
      const randomVariation = (Math.random() - 0.5) * 0.1 * baseValue;
      const portfolioValue = Math.max(0, baseValue + randomVariation);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolioValue,
        contributions: portfolioValue * 0.8, // Assume 80% contributions
        gains: portfolioValue * 0.2 // Assume 20% gains
      });
    }
    
    return data;
  }, [portfolioData.totalValue]);

  const handleBuy = (investmentId: string) => {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment || !buyAmount) return;

    const amount = parseFloat(buyAmount);
    if (amount <= 0 || amount > (data.checkingAccount || 0)) return;

    const shares = amount / investment.currentPrice;
    
    // Update the data based on investment type
    if (investmentId === 'sp500') {
      setData(prev => ({
        ...prev,
        investments: (prev.investments || 0) + amount,
        checkingAccount: (prev.checkingAccount || 0) - amount
      }));
    } else if (investmentId === 'tech') {
      setData(prev => ({
        ...prev,
        techStockHoldings: (prev.techStockHoldings || 0) + amount,
        checkingAccount: (prev.checkingAccount || 0) - amount
      }));
    } else if (investmentId === '401k-traditional') {
      setData(prev => ({
        ...prev,
        the401kTraditionalHoldings: (prev.the401kTraditionalHoldings || 0) + amount,
        checkingAccount: (prev.checkingAccount || 0) - amount
      }));
    } else if (investmentId === '401k-roth') {
      setData(prev => ({
        ...prev,
        the401kRothHoldings: (prev.the401kRothHoldings || 0) + amount,
        checkingAccount: (prev.checkingAccount || 0) - amount
      }));
    } else if (investmentId === 'ira-traditional') {
      setData(prev => ({
        ...prev,
        iraTraditionalHoldings: (prev.iraTraditionalHoldings || 0) + amount,
        checkingAccount: (prev.checkingAccount || 0) - amount
      }));
    } else if (investmentId === 'ira-roth') {
      setData(prev => ({
        ...prev,
        iraRothHoldings: (prev.iraRothHoldings || 0) + amount,
        checkingAccount: (prev.checkingAccount || 0) - amount
      }));
    }

    // Add to transaction history
    const transaction: TransactionHistory = {
      id: Date.now().toString(),
      type: 'buy',
      investmentId,
      investmentName: investment.name,
      shares,
      price: investment.currentPrice,
      total: amount,
      date: new Date()
    };
    
    setTransactionHistory(prev => [transaction, ...prev]);
    setBuyAmount('');
  };

  const handleSell = (investmentId: string) => {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment || !sellShares) return;

    const sharesToSell = parseFloat(sellShares);
    if (sharesToSell <= 0 || sharesToSell > investment.shares) return;

    const amount = sharesToSell * investment.currentPrice;
    
    // Update the data based on investment type
    if (investmentId === 'sp500') {
      setData(prev => ({
        ...prev,
        investments: Math.max(0, (prev.investments || 0) - amount),
        checkingAccount: (prev.checkingAccount || 0) + amount
      }));
    } else if (investmentId === 'tech') {
      setData(prev => ({
        ...prev,
        techStockHoldings: Math.max(0, (prev.techStockHoldings || 0) - amount),
        checkingAccount: (prev.checkingAccount || 0) + amount
      }));
    } else if (investmentId === '401k-traditional') {
      setData(prev => ({
        ...prev,
        the401kTraditionalHoldings: Math.max(0, (prev.the401kTraditionalHoldings || 0) - amount),
        checkingAccount: (prev.checkingAccount || 0) + amount
      }));
    } else if (investmentId === '401k-roth') {
      setData(prev => ({
        ...prev,
        the401kRothHoldings: Math.max(0, (prev.the401kRothHoldings || 0) - amount),
        checkingAccount: (prev.checkingAccount || 0) + amount
      }));
    } else if (investmentId === 'ira-traditional') {
      setData(prev => ({
        ...prev,
        iraTraditionalHoldings: Math.max(0, (prev.iraTraditionalHoldings || 0) - amount),
        checkingAccount: (prev.checkingAccount || 0) + amount
      }));
    } else if (investmentId === 'ira-roth') {
      setData(prev => ({
        ...prev,
        iraRothHoldings: Math.max(0, (prev.iraRothHoldings || 0) - amount),
        checkingAccount: (prev.checkingAccount || 0) + amount
      }));
    }

    // Add to transaction history
    const transaction: TransactionHistory = {
      id: Date.now().toString(),
      type: 'sell',
      investmentId,
      investmentName: investment.name,
      shares: sharesToSell,
      price: investment.currentPrice,
      total: amount,
      date: new Date()
    };
    
    setTransactionHistory(prev => [transaction, ...prev]);
    setSellShares('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('personal')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">Investments</h1>
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <SimulationControls
          hasStarted={hasStarted || false}
          simulationState={simulationState || 'setup'}
          simulationProgress={simulationProgress || {
            currentDate: new Date(),
            startDate: new Date(),
            currentAge: 0,
            yearsElapsed: 0,
            monthsElapsed: 0,
            daysElapsed: 0,
            speedMultiplier: 1
          }}
          personalData={data}
          onStart={onStart || (() => {})}
          onPause={onPause || (() => {})}
          onReset={onReset || (() => {})}
          onEditProfile={onEditProfile || (() => {})}
        />
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Portfolio Value Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Portfolio Value</h3>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(portfolioData.totalValue)}
            </div>
            <div className={`flex items-center text-sm ${
              portfolioData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolioData.dayChange >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {formatCurrency(Math.abs(portfolioData.dayChange))} ({Math.abs(portfolioData.dayChangePercent).toFixed(2)}%)
            </div>
            <div className="text-xs text-gray-500 mt-1">Today</div>
          </div>

          {/* Available Cash */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Available Cash</h3>
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(data.checkingAccount || 0)}
            </div>
            <div className="text-sm text-gray-600">Ready to invest</div>
          </div>

          {/* Investment Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Annual Returns</h3>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">S&P 500</span>
                <span className="text-sm font-medium text-green-600">+7.0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tech</span>
                <span className="text-sm font-medium text-green-600">
                  +{((economicState?.investmentReturns?.tech || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bonds</span>
                <span className="text-sm font-medium text-blue-600">+4.0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Portfolio Performance</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg">1M</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">3M</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">1Y</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ALL</button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [formatCurrency(Number(value)), name]}
                />
                <Area
                  type="monotone"
                  dataKey="portfolioValue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorPortfolio)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holdings and Trading */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Holdings */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Holdings</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {investments.map((investment) => (
                <div 
                  key={investment.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedInvestment === investment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedInvestment(investment.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{investment.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          investment.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                          investment.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {investment.riskLevel} Risk
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{investment.symbol} • {investment.category}</div>
                      <div className="text-xs text-gray-500 mb-3">{investment.description}</div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Shares</div>
                          <div className="font-medium">{investment.shares.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Current Price</div>
                          <div className="font-medium">{formatCurrency(investment.currentPrice)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Total Value</div>
                          <div className="font-semibold text-lg">{formatCurrency(investment.totalValue)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Annual Return</div>
                          <div className="font-medium text-green-600">
                            +{(investment.annualReturn * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Portfolio Allocation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                Portfolio Allocation
              </h3>
              
              {portfolioData.totalValue > 0 ? (
                <div className="space-y-3">
                  {investments.filter(inv => inv.totalValue > 0).map((investment) => {
                    const percentage = (investment.totalValue / portfolioData.totalValue) * 100;
                    return (
                      <div key={investment.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            investment.id === 'sp500' ? 'bg-blue-500' :
                            investment.id === 'tech' ? 'bg-green-500' :
                            investment.id === 'treasuries' ? 'bg-yellow-500' :
                            'bg-purple-500'
                          }`} />
                          <span className="text-sm text-gray-700">{investment.symbol}</span>
                        </div>
                        <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                  
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Diversification Score</div>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((investments.filter(inv => inv.totalValue > 0).length / 4) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm font-medium text-green-600">
                        {investments.filter(inv => inv.totalValue > 0).length}/4
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PieChart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No investments yet</p>
                  <p className="text-sm">Start investing to see allocation</p>
                </div>
              )}
            </div>

            {/* Market Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                Market Insights
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-900 text-sm">Economic Outlook</div>
                  <div className="text-blue-800 text-xs mt-1">
                    Current inflation: {((economicState?.currentInflationRate || 0.025) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-900 text-sm">Growth Opportunity</div>
                  <div className="text-green-800 text-xs mt-1">
                    Tech sector showing {((economicState?.investmentReturns?.tech || 0.12) * 100).toFixed(1)}% annual returns
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-medium text-yellow-900 text-sm">Safe Haven</div>
                  <div className="text-yellow-800 text-xs mt-1">
                    Treasuries provide stable 4.0% returns during volatility
                  </div>
                </div>
              </div>
            </div>
            {/* Trading Panel */}
            {selectedInvestment && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Trade {investments.find(inv => inv.id === selectedInvestment)?.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Buy */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-700">Buy</h4>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Amount ($)</label>
                      <input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0.00"
                        min="0"
                        max={data.checkingAccount || 0}
                      />
                    </div>
                    <button
                      onClick={() => handleBuy(selectedInvestment)}
                      disabled={!buyAmount || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) > (data.checkingAccount || 0)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Buy
                    </button>
                  </div>

                  {/* Sell */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-red-700">Sell</h4>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Shares</label>
                      <input
                        type="number"
                        value={sellShares}
                        onChange={(e) => setSellShares(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="0"
                        min="0"
                        max={investments.find(inv => inv.id === selectedInvestment)?.shares || 0}
                        step="0.01"
                      />
                    </div>
                    <button
                      onClick={() => handleSell(selectedInvestment)}
                      disabled={!sellShares || parseFloat(sellShares) <= 0 || parseFloat(sellShares) > (investments.find(inv => inv.id === selectedInvestment)?.shares || 0)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-4 w-4 inline mr-1" />
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setSelectedInvestment('sp500')}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">S&P 500</div>
                      <div className="text-sm text-gray-600">Safe diversified growth</div>
                    </div>
                    <div className="text-green-600 font-medium text-sm">+7.0%</div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedInvestment('tech')}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Tech Stocks</div>
                      <div className="text-sm text-gray-600">High growth potential</div>
                    </div>
                    <div className="text-green-600 font-medium text-sm">
                      +{((economicState?.investmentReturns?.tech || 0.12) * 100).toFixed(1)}%
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedInvestment('treasuries')}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">US Treasuries</div>
                      <div className="text-sm text-gray-600">Ultra-safe bonds</div>
                    </div>
                    <div className="text-blue-600 font-medium text-sm">+4.0%</div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedInvestment('bonds')}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Corporate Bonds</div>
                      <div className="text-sm text-gray-600">Steady income</div>
                    </div>
                    <div className="text-blue-600 font-medium text-sm">+4.0%</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {transactionHistory.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {transactionHistory.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {transaction.type === 'buy' ? 'Bought' : 'Sold'} {transaction.investmentName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {transaction.shares.toFixed(2)} shares @ {formatCurrency(transaction.price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.date.toLocaleDateString()} {transaction.date.toLocaleTimeString()}
                        </div>
                      </div>
                      <div className={`font-medium text-lg ${
                        transaction.type === 'buy' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'buy' ? '-' : '+'}{formatCurrency(transaction.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No transactions yet</p>
                <p className="text-sm">Start trading to see your history here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernInvestmentPage;
