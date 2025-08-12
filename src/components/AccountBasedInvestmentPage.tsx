import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, BarChart3, DollarSign, Activity, ArrowLeft, Building2, User, PieChart } from 'lucide-react';
import { PersonalFinancialData, SimulationState, SimulationProgress, EconomicState } from '../types/simulation';
import { Investment, TransactionHistory, PortfolioData, InvestmentAccount, AccountType, InvestmentType } from '../types/investment';
import { SimulationControls } from './SimulationControls';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';

interface AccountBasedInvestmentPageProps {
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
}

const AccountBasedInvestmentPage: React.FC<AccountBasedInvestmentPageProps> = ({
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
  const [buyAmounts, setBuyAmounts] = useState<Record<string, string>>({});
  const [sellShares, setSellShares] = useState<Record<string, string>>({});
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [selectedBankAccount, setSelectedBankAccount] = useState<'checking' | 'savings' | 'hysa'>('checking');
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);

  // Custom reset handler that clears transaction history
  const handleReset = () => {
    setTransactionHistory([]);
    setBuyAmounts({});
    setSellShares({});
    setTransferAmount('');
    if (onReset) {
      onReset();
    }
  };

  // Create investment accounts from personal data
  const investmentAccounts: InvestmentAccount[] = useMemo(() => {
    // Get current prices for calculations
    const sp500Price = 450;
    const techPrice = 180;
    
    return [
      {
        id: 'personal',
        name: 'Personal Taxable Account',
        description: 'Individual investment account with no contribution limits',
        cashBalance: data.personalInvestmentCash || 0,
        totalValue: (data.investments || 0) + (data.techStockHoldings || 0) + (data.personalInvestmentCash || 0),
        holdings: {
          cash: { investmentType: 'cash', shares: 1, totalValue: data.personalInvestmentCash || 0 },
          sp500: { investmentType: 'sp500', shares: (data.investments || 0) / sp500Price, totalValue: data.investments || 0 },
          tech: { investmentType: 'tech', shares: (data.techStockHoldings || 0) / techPrice, totalValue: data.techStockHoldings || 0 },
          treasuries: { investmentType: 'treasuries', shares: 0, totalValue: 0 },
          bonds: { investmentType: 'bonds', shares: 0, totalValue: 0 }
        },
        taxAdvantaged: false
      },
      {
        id: 'ira-traditional',
        name: 'Traditional IRA',
        description: 'Tax-deferred retirement account',
        cashBalance: data.iraTraditionalCash || 0,
        totalValue: (data.iraTraditionalHoldings || 0) + (data.iraTraditionalTechHoldings || 0) + (data.iraTraditionalCash || 0),
        holdings: {
          cash: { investmentType: 'cash', shares: 1, totalValue: data.iraTraditionalCash || 0 },
          sp500: { investmentType: 'sp500', shares: (data.iraTraditionalHoldings || 0) / sp500Price, totalValue: data.iraTraditionalHoldings || 0 },
          tech: { investmentType: 'tech', shares: (data.iraTraditionalTechHoldings || 0) / techPrice, totalValue: data.iraTraditionalTechHoldings || 0 },
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
        cashBalance: data.iraRothCash || 0,
        totalValue: (data.iraRothHoldings || 0) + (data.iraRothTechHoldings || 0) + (data.iraRothCash || 0),
        holdings: {
          cash: { investmentType: 'cash', shares: 1, totalValue: data.iraRothCash || 0 },
          sp500: { investmentType: 'sp500', shares: (data.iraRothHoldings || 0) / sp500Price, totalValue: data.iraRothHoldings || 0 },
          tech: { investmentType: 'tech', shares: (data.iraRothTechHoldings || 0) / techPrice, totalValue: data.iraRothTechHoldings || 0 },
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
        cashBalance: data.the401kTraditionalCash || 0,
        totalValue: (data.the401kTraditionalHoldings || 0) + (data.the401kTraditionalTechHoldings || 0) + (data.the401kTraditionalCash || 0),
        holdings: {
          cash: { investmentType: 'cash', shares: 1, totalValue: data.the401kTraditionalCash || 0 },
          sp500: { investmentType: 'sp500', shares: (data.the401kTraditionalHoldings || 0) / sp500Price, totalValue: data.the401kTraditionalHoldings || 0 },
          tech: { investmentType: 'tech', shares: (data.the401kTraditionalTechHoldings || 0) / techPrice, totalValue: data.the401kTraditionalTechHoldings || 0 },
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
        cashBalance: data.the401kRothCash || 0,
        totalValue: (data.the401kRothHoldings || 0) + (data.the401kRothTechHoldings || 0) + (data.the401kRothCash || 0),
        holdings: {
          cash: { investmentType: 'cash', shares: 1, totalValue: data.the401kRothCash || 0 },
          sp500: { investmentType: 'sp500', shares: (data.the401kRothHoldings || 0) / sp500Price, totalValue: data.the401kRothHoldings || 0 },
          tech: { investmentType: 'tech', shares: (data.the401kRothTechHoldings || 0) / techPrice, totalValue: data.the401kRothTechHoldings || 0 },
          treasuries: { investmentType: 'treasuries', shares: 0, totalValue: 0 },
          bonds: { investmentType: 'bonds', shares: 0, totalValue: 0 }
        },
        taxAdvantaged: true,
        contributionLimit: 23000,
        penaltyAge: 59.5
      }
    ];
  }, [
    data.investments, 
    data.techStockHoldings, 
    data.iraTraditionalHoldings, 
    data.iraTraditionalTechHoldings,
    data.iraRothHoldings, 
    data.iraRothTechHoldings,
    data.the401kTraditionalHoldings, 
    data.the401kTraditionalTechHoldings,
    data.the401kRothHoldings, 
    data.the401kRothTechHoldings,
    data.personalInvestmentCash, 
    data.iraTraditionalCash, 
    data.iraRothCash, 
    data.the401kTraditionalCash, 
    data.the401kRothCash
  ]);

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

  // Calculate available cash from all bank accounts
  const availableCash = (data.checkingAccount || 0) + (data.savingsAccount || 0) + (data.hysaAccount || 0);

  // Handle transferring money from bank accounts directly to investment account cash
  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (amount <= 0) return;

    let sourceBalance = 0;
    if (selectedBankAccount === 'checking') sourceBalance = data.checkingAccount || 0;
    else if (selectedBankAccount === 'savings') sourceBalance = data.savingsAccount || 0;
    else if (selectedBankAccount === 'hysa') sourceBalance = data.hysaAccount || 0;

    if (amount > sourceBalance) return;

    // Transfer money from selected bank account to the selected investment account's cash balance
    setData(prev => {
      const newData = { ...prev };
      
      // Deduct from bank account
      if (selectedBankAccount === 'checking') {
        newData.checkingAccount = (prev.checkingAccount || 0) - amount;
      } else if (selectedBankAccount === 'savings') {
        newData.savingsAccount = (prev.savingsAccount || 0) - amount;
      } else if (selectedBankAccount === 'hysa') {
        newData.hysaAccount = (prev.hysaAccount || 0) - amount;
      }
      
      // Add to selected investment account's cash balance
      if (selectedAccount === 'personal') {
        newData.personalInvestmentCash = (prev.personalInvestmentCash || 0) + amount;
      } else if (selectedAccount === 'ira-traditional') {
        newData.iraTraditionalCash = (prev.iraTraditionalCash || 0) + amount;
      } else if (selectedAccount === 'ira-roth') {
        newData.iraRothCash = (prev.iraRothCash || 0) + amount;
      } else if (selectedAccount === '401k-traditional') {
        newData.the401kTraditionalCash = (prev.the401kTraditionalCash || 0) + amount;
      } else if (selectedAccount === '401k-roth') {
        newData.the401kRothCash = (prev.the401kRothCash || 0) + amount;
      }
      
      return newData;
    });

    setTransferAmount('');
  };

  // Calculate portfolio data for all accounts combined
  const portfolioData: PortfolioData = useMemo(() => {
    const totalValue = investmentAccounts.reduce((sum, acc) => sum + acc.totalValue, 0);
    const totalCost = totalValue; // For now, assume no gains/losses display
    const dayChange = totalValue * 0.012; // Mock daily change
    
    return {
      totalValue,
      totalCost,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      dayChange,
      dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0
    };
  }, [investmentAccounts]);

  const handleBuy = (investmentType: InvestmentType) => {
    const investment = availableInvestments.find(inv => inv.type === investmentType);
    const buyAmount = buyAmounts[investmentType] || '';
    if (!investment || !buyAmount || !currentAccount) return;

    const amount = parseFloat(buyAmount);
    if (amount <= 0 || amount > currentAccount.cashBalance) return;

    const shares = amount / investment.currentPrice;
    
    // Update the specific account holdings and reduce cash balance
    if (selectedAccount === 'personal' && investmentType === 'sp500') {
      setData(prev => ({
        ...prev,
        investments: (prev.investments || 0) + amount,
        personalInvestmentCash: (prev.personalInvestmentCash || 0) - amount
      }));
    } else if (selectedAccount === 'personal' && investmentType === 'tech') {
      setData(prev => ({
        ...prev,
        techStockHoldings: (prev.techStockHoldings || 0) + amount,
        personalInvestmentCash: (prev.personalInvestmentCash || 0) - amount
      }));
    } else if (selectedAccount === 'ira-traditional') {
      if (investmentType === 'sp500') {
        setData(prev => ({
          ...prev,
          iraTraditionalHoldings: (prev.iraTraditionalHoldings || 0) + amount,
          iraTraditionalCash: (prev.iraTraditionalCash || 0) - amount
        }));
      } else if (investmentType === 'tech') {
        setData(prev => ({
          ...prev,
          iraTraditionalTechHoldings: (prev.iraTraditionalTechHoldings || 0) + amount,
          iraTraditionalCash: (prev.iraTraditionalCash || 0) - amount
        }));
      }
    } else if (selectedAccount === 'ira-roth') {
      if (investmentType === 'sp500') {
        setData(prev => ({
          ...prev,
          iraRothHoldings: (prev.iraRothHoldings || 0) + amount,
          iraRothCash: (prev.iraRothCash || 0) - amount
        }));
      } else if (investmentType === 'tech') {
        setData(prev => ({
          ...prev,
          iraRothTechHoldings: (prev.iraRothTechHoldings || 0) + amount,
          iraRothCash: (prev.iraRothCash || 0) - amount
        }));
      }
    } else if (selectedAccount === '401k-traditional') {
      if (investmentType === 'sp500') {
        setData(prev => ({
          ...prev,
          the401kTraditionalHoldings: (prev.the401kTraditionalHoldings || 0) + amount,
          the401kTraditionalCash: (prev.the401kTraditionalCash || 0) - amount
        }));
      } else if (investmentType === 'tech') {
        setData(prev => ({
          ...prev,
          the401kTraditionalTechHoldings: (prev.the401kTraditionalTechHoldings || 0) + amount,
          the401kTraditionalCash: (prev.the401kTraditionalCash || 0) - amount
        }));
      }
    } else if (selectedAccount === '401k-roth') {
      if (investmentType === 'sp500') {
        setData(prev => ({
          ...prev,
          the401kRothHoldings: (prev.the401kRothHoldings || 0) + amount,
          the401kRothCash: (prev.the401kRothCash || 0) - amount
        }));
      } else if (investmentType === 'tech') {
        setData(prev => ({
          ...prev,
          the401kRothTechHoldings: (prev.the401kRothTechHoldings || 0) + amount,
          the401kRothCash: (prev.the401kRothCash || 0) - amount
        }));
      }
    }

    // Add to transaction history
    const transaction: TransactionHistory = {
      id: Date.now().toString(),
      type: 'buy',
      accountId: selectedAccount,
      investmentId: investment.id,
      investmentName: investment.name,
      shares,
      price: investment.currentPrice,
      total: amount,
      date: new Date()
    };
    
    setTransactionHistory(prev => [transaction, ...prev]);
    setBuyAmounts(prev => ({ ...prev, [investmentType]: '' }));
  };

  const handleSell = (investmentType: InvestmentType) => {
    const investment = availableInvestments.find(inv => inv.type === investmentType);
    const holding = currentAccount?.holdings[investmentType];
    const sellSharesAmount = sellShares[investmentType] || '';
    if (!investment || !sellSharesAmount || !holding || !currentAccount) return;

    const sharesToSell = parseFloat(sellSharesAmount);
    if (sharesToSell <= 0 || sharesToSell > holding.shares) return;

    const amount = sharesToSell * investment.currentPrice;
    
    // Update the specific account holdings and add to cash balance
    if (selectedAccount === 'personal' && investmentType === 'sp500') {
      setData(prev => ({
        ...prev,
        investments: Math.max(0, (prev.investments || 0) - amount),
        personalInvestmentCash: (prev.personalInvestmentCash || 0) + amount
      }));
    } else if (selectedAccount === 'personal' && investmentType === 'tech') {
      setData(prev => ({
        ...prev,
        techStockHoldings: Math.max(0, (prev.techStockHoldings || 0) - amount),
        personalInvestmentCash: (prev.personalInvestmentCash || 0) + amount
      }));
    } else if (selectedAccount === 'ira-traditional') {
      if (investmentType === 'sp500') {
        setData(prev => ({
          ...prev,
          iraTraditionalHoldings: Math.max(0, (prev.iraTraditionalHoldings || 0) - amount),
          iraTraditionalCash: (prev.iraTraditionalCash || 0) + amount
        }));
      } else if (investmentType === 'tech') {
        setData(prev => ({
          ...prev,
          iraTraditionalTechHoldings: Math.max(0, (prev.iraTraditionalTechHoldings || 0) - amount),
          iraTraditionalCash: (prev.iraTraditionalCash || 0) + amount
        }));
      }
    } else if (selectedAccount === 'ira-roth') {
      if (investmentType === 'sp500') {
        setData(prev => ({
          ...prev,
          iraRothHoldings: Math.max(0, (prev.iraRothHoldings || 0) - amount),
          iraRothCash: (prev.iraRothCash || 0) + amount
        }));
      } else if (investmentType === 'tech') {
        setData(prev => ({
          ...prev,
          iraRothTechHoldings: Math.max(0, (prev.iraRothTechHoldings || 0) - amount),
          iraRothCash: (prev.iraRothCash || 0) + amount
        }));
      }
    } else if (selectedAccount === '401k-traditional') {
      if (investmentType === 'sp500') {
        setData(prev => ({
          ...prev,
          the401kTraditionalHoldings: Math.max(0, (prev.the401kTraditionalHoldings || 0) - amount),
          the401kTraditionalCash: (prev.the401kTraditionalCash || 0) + amount
        }));
      } else if (investmentType === 'tech') {
        setData(prev => ({
          ...prev,
          the401kTraditionalTechHoldings: Math.max(0, (prev.the401kTraditionalTechHoldings || 0) - amount),
          the401kTraditionalCash: (prev.the401kTraditionalCash || 0) + amount
        }));
      }
    } else if (selectedAccount === '401k-roth') {
      if (investmentType === 'sp500') {
        setData(prev => ({
          ...prev,
          the401kRothHoldings: Math.max(0, (prev.the401kRothHoldings || 0) - amount),
          the401kRothCash: (prev.the401kRothCash || 0) + amount
        }));
      } else if (investmentType === 'tech') {
        setData(prev => ({
          ...prev,
          the401kRothTechHoldings: Math.max(0, (prev.the401kRothTechHoldings || 0) - amount),
          the401kRothCash: (prev.the401kRothCash || 0) + amount
        }));
      }
    }

    // Add to transaction history
    const transaction: TransactionHistory = {
      id: Date.now().toString(),
      type: 'sell',
      accountId: selectedAccount,
      investmentId: investment.id,
      investmentName: investment.name,
      shares: sharesToSell,
      price: investment.currentPrice,
      total: amount,
      date: new Date()
    };
    
    setTransactionHistory(prev => [transaction, ...prev]);
    setSellShares(prev => ({ ...prev, [investmentType]: '' }));
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
            <h1 className="text-xl font-semibold text-gray-900">Investment Accounts</h1>
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
          onReset={handleReset}
          onEditProfile={onEditProfile || (() => {})}
        />
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Account Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Investment Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {investmentAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account.id)}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedAccount === account.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {account.taxAdvantaged ? (
                    <Building2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                  <h3 className="font-medium text-gray-900">{account.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{account.description}</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(account.totalValue)}</p>
                {account.contributionLimit && (
                  <p className="text-xs text-gray-500 mt-1">
                    Limit: {formatCurrency(account.contributionLimit)}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Account Cash Balance - Prominent Display */}
        {currentAccount && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-green-800 mb-1">Cash Available to Invest</h3>
                  <p className="text-sm text-green-600">{currentAccount.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-800">
                    {formatCurrency(currentAccount.cashBalance)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">Ready to invest</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Funding Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fund Your Investments</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Cash */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Available Cash</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Checking Account</span>
                    <span className="font-medium text-gray-900">{formatCurrency(data.checkingAccount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Savings Account</span>
                    <span className="font-medium text-gray-900">{formatCurrency(data.savingsAccount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">High Yield Savings</span>
                    <span className="font-medium text-gray-900">{formatCurrency(data.hysaAccount || 0)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Available</span>
                      <span className="font-bold text-lg text-gray-900">{formatCurrency(availableCash)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Transfer Money */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Move Money for Investing</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Account</label>
                    <select
                      value={selectedBankAccount}
                      onChange={(e) => setSelectedBankAccount(e.target.value as 'checking' | 'savings' | 'hysa')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="checking">Checking Account</option>
                      <option value="savings">Savings Account</option>
                      <option value="hysa">High Yield Savings</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Amount</label>
                    <input
                      type="number"
                      placeholder="Amount to make available for investing"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleTransfer}
                    disabled={
                      !transferAmount || 
                      parseFloat(transferAmount) <= 0 || 
                      parseFloat(transferAmount) > (
                        selectedBankAccount === 'checking' ? (data.checkingAccount || 0) :
                        selectedBankAccount === 'savings' ? (data.savingsAccount || 0) :
                        (data.hysaAccount || 0)
                      )
                    }
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    {selectedBankAccount === 'checking' ? 'Confirm Available Amount' : `Transfer from ${
                      selectedBankAccount === 'savings' ? 'Savings' : 'HYSA'
                    }`}
                  </button>
                  
                  <p className="text-xs text-gray-500">
                    Transfer funds from any bank account to make them available for investment purchases.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Account Details */}
        {currentAccount && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{currentAccount.name}</h3>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentAccount.totalValue)}
                </div>
              </div>
              
              {/* Holdings in Current Account */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Holdings</h4>
                
                {/* Cash holding - always show first */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h5 className="font-medium text-green-800">Cash</h5>
                      <p className="text-sm text-green-600">Available for investing</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-800">{formatCurrency(currentAccount.cashBalance)}</div>
                    <div className="text-sm text-green-600">0.00% yield</div>
                  </div>
                </div>
                
                {Object.entries(currentAccount.holdings).map(([type, holding]) => {
                  const investment = availableInvestments.find(inv => inv.type === type);
                  if (!investment || holding.totalValue === 0) return null;
                  
                  return (
                    <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h5 className="font-medium text-gray-900">{investment.name}</h5>
                          <p className="text-sm text-gray-600">
                            {holding.shares.toFixed(3)} shares @ {formatCurrency(investment.currentPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{formatCurrency(holding.totalValue)}</div>
                        <div className={`text-sm ${investment.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {investment.dayChangePercent >= 0 ? '+' : ''}{investment.dayChangePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {Object.values(currentAccount.holdings).every(h => h.totalValue === 0) && currentAccount.cashBalance === 0 && (
                  <p className="text-gray-500 text-center py-4">No holdings in this account</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Investment Options */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Investments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableInvestments.map((investment) => (
              <div key={investment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{investment.name}</h4>
                    <p className="text-sm text-gray-600">{investment.symbol}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(investment.currentPrice)}</div>
                    <div className={`text-sm ${investment.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {investment.dayChangePercent >= 0 ? '+' : ''}{formatCurrency(investment.dayChange)} ({investment.dayChangePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{investment.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Risk Level:</span>
                  <span className={`text-sm font-medium ${
                    investment.riskLevel === 'Low' ? 'text-green-600' :
                    investment.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {investment.riskLevel}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Amount $"
                      value={buyAmounts[investment.type] || ''}
                      onChange={(e) => setBuyAmounts(prev => ({ ...prev, [investment.type]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleBuy(investment.type)}
                    disabled={
                      !buyAmounts[investment.type] ||
                      parseFloat(buyAmounts[investment.type] || '0') <= 0 ||
                      !currentAccount ||
                      parseFloat(buyAmounts[investment.type] || '0') > currentAccount.cashBalance
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Buy
                  </button>
                </div>
                
                {/* Buy validation message */}
                {buyAmounts[investment.type] && parseFloat(buyAmounts[investment.type] || '0') > (currentAccount?.cashBalance || 0) && (
                  <p className="text-xs text-red-600 mt-1">
                    Insufficient cash balance. Available: {formatCurrency(currentAccount?.cashBalance || 0)}
                  </p>
                )}
                
                {/* Sell section - only show if user has holdings in current account */}
                {currentAccount?.holdings[investment.type] && currentAccount.holdings[investment.type].shares > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-gray-600 mb-2">
                      You own {currentAccount.holdings[investment.type].shares.toFixed(4)} shares
                    </p>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Shares to sell"
                          value={sellShares[investment.type] || ''}
                          onChange={(e) => setSellShares(prev => ({ ...prev, [investment.type]: e.target.value }))}
                          max={currentAccount?.holdings[investment.type]?.shares || 0}
                          step="0.0001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        onClick={() => handleSell(investment.type)}
                        disabled={
                          !sellShares[investment.type] || 
                          parseFloat(sellShares[investment.type] || '0') <= 0 || 
                          parseFloat(sellShares[investment.type] || '0') > (currentAccount?.holdings[investment.type]?.shares || 0)
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Sell
                      </button>
                    </div>
                    
                    {/* Sell validation message */}
                    {sellShares[investment.type] && parseFloat(sellShares[investment.type] || '0') > (currentAccount?.holdings[investment.type]?.shares || 0) && (
                      <p className="text-xs text-red-600 mt-1">
                        Cannot sell more than {currentAccount?.holdings[investment.type]?.shares.toFixed(4)} shares owned
                      </p>
                    )}
                    
                    {sellShares[investment.type] && parseFloat(sellShares[investment.type] || '0') > 0 && parseFloat(sellShares[investment.type] || '0') <= (currentAccount?.holdings[investment.type]?.shares || 0) && (
                      <p className="text-xs text-green-600 mt-1">
                        Proceeds: {formatCurrency(parseFloat(sellShares[investment.type] || '0') * investment.currentPrice)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Overview (All Accounts)</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(portfolioData.totalValue)}</div>
                <div className="text-sm text-gray-600">Total Portfolio Value</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${portfolioData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioData.dayChange >= 0 ? '+' : ''}{formatCurrency(portfolioData.dayChange)}
                </div>
                <div className="text-sm text-gray-600">Today's Change</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.checkingAccount || 0)}</div>
                <div className="text-sm text-gray-600">Available for Investing</div>
                <div className="text-xs text-gray-500 mt-1">
                  (Total Cash: {formatCurrency(availableCash)})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        {transactionHistory.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactionHistory.slice(0, 10).map((transaction) => {
                      const account = investmentAccounts.find(acc => acc.id === transaction.accountId);
                      return (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.date.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {account?.name}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.investmentName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.shares.toFixed(3)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatCurrency(transaction.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountBasedInvestmentPage;
