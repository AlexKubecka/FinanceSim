import React, { useState } from 'react';
import { PiggyBank, DollarSign, TrendingUp, Calendar, Shield, ArrowRightLeft, AlertTriangle, Edit3, Check, X } from 'lucide-react';
import { 
  PersonalFinancialData, 
  SimulationProgress, 
  HistoricalDataPoint
} from '../types/simulation';
import { SimulationControls } from './SimulationControls';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth' | 'bank' | 'debt' | 'reports';

interface TaxInfo {
  totalTax: number;
  afterTaxIncome: number;
  effectiveRate: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  miscDeductions: number;
  contribution401kTraditional: number;
  contribution401kRoth: number;
  totalContribution401k: number;
  taxableIncome: number;
}

interface BankAccountPageProps {
  personalData: PersonalFinancialData;
  setPersonalData: React.Dispatch<React.SetStateAction<PersonalFinancialData>>;
  setCurrentMode: React.Dispatch<React.SetStateAction<SimulationMode>>;
  currentAnnualExpenses: number;
  taxInfo: TaxInfo;
  hasStarted: boolean;
  simulationState: 'setup' | 'running' | 'paused' | 'completed';
  simulationProgress: SimulationProgress;
  historicalData: HistoricalDataPoint[];
  
  // Simulation controls
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onEditProfile: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const BankAccountPage: React.FC<BankAccountPageProps> = ({
  personalData,
  setPersonalData,
  setCurrentMode,
  currentAnnualExpenses,
  taxInfo,
  hasStarted,
  simulationState,
  simulationProgress,
  historicalData,
  onStart,
  onPause,
  onReset,
  onEditProfile
}) => {
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferFrom, setTransferFrom] = useState<'savings' | 'checking' | 'hysa'>('savings');
  const [transferTo, setTransferTo] = useState<'savings' | 'checking' | 'hysa'>('hysa');
  
  // Edit state management
  const [editingAccount, setEditingAccount] = useState<'checking' | 'savings' | 'hysa' | null>(null);
  const [editValues, setEditValues] = useState({
    checking: '',
    savings: '',
    hysa: ''
  });
  
  // Calculate bank account balances (with backwards compatibility)
  const savingsBalance = personalData.savingsAccount ?? 0;
  const checkingBalance = personalData.checkingAccount ?? 0;
  const hysaBalance = personalData.hysaAccount ?? 0;
  const legacySavings = personalData.savings ?? 0;
  
  // If we have legacy savings but no new accounts, migrate the data
  const totalBankBalance = savingsBalance + checkingBalance + hysaBalance + legacySavings;
  
  const monthlyExpenses = currentAnnualExpenses / 12;
  const emergencyFundGoal = monthlyExpenses * (personalData.emergencyFundMonths || 6);
  const coverageMonths = monthlyExpenses > 0 ? totalBankBalance / monthlyExpenses : 0;
  const goalMet = totalBankBalance >= emergencyFundGoal;
  const monthlySurplus = (taxInfo.afterTaxIncome - currentAnnualExpenses) / 12;
  
  // Calculate savings rate
  const savingsRate = taxInfo.afterTaxIncome > 0 ? (monthlySurplus * 12) / taxInfo.afterTaxIncome * 100 : 0;

  // Handle money transfers between accounts
  const handleTransfer = () => {
    if (transferAmount <= 0) return;
    
    const fromBalance = transferFrom === 'savings' ? savingsBalance : 
                       transferFrom === 'checking' ? checkingBalance : hysaBalance;
    
    if (transferAmount > fromBalance) {
      alert('Insufficient funds for this transfer.');
      return;
    }
    
    setPersonalData(prev => {
      const newData = { ...prev };
      
      // Deduct from source account
      if (transferFrom === 'savings') {
        newData.savingsAccount = (prev.savingsAccount ?? 0) - transferAmount;
      } else if (transferFrom === 'checking') {
        newData.checkingAccount = (prev.checkingAccount ?? 0) - transferAmount;
      } else {
        newData.hysaAccount = (prev.hysaAccount ?? 0) - transferAmount;
      }
      
      // Add to destination account
      if (transferTo === 'savings') {
        newData.savingsAccount = (prev.savingsAccount ?? 0) + transferAmount;
      } else if (transferTo === 'checking') {
        newData.checkingAccount = (prev.checkingAccount ?? 0) + transferAmount;
      } else {
        newData.hysaAccount = (prev.hysaAccount ?? 0) + transferAmount;
      }
      
      return newData;
    });
    
    setTransferAmount(0);
  };
  
  // Edit functionality handlers
  const handleStartEdit = (account: 'checking' | 'savings' | 'hysa') => {
    setEditingAccount(account);
    const currentValue = account === 'checking' ? checkingBalance : 
                        account === 'savings' ? savingsBalance : hysaBalance;
    setEditValues(prev => ({
      ...prev,
      [account]: currentValue.toString()
    }));
  };
  
  const handleSaveEdit = () => {
    if (!editingAccount) return;
    
    const newValue = parseFloat(editValues[editingAccount]);
    if (isNaN(newValue) || newValue < 0) {
      alert('Please enter a valid positive number.');
      return;
    }
    
    setPersonalData(prev => ({
      ...prev,
      [`${editingAccount}Account`]: newValue
    }));
    
    setEditingAccount(null);
    setEditValues(prev => ({
      ...prev,
      [editingAccount!]: ''
    }));
  };
  
  const handleCancelEdit = () => {
    setEditingAccount(null);
    setEditValues({
      checking: '',
      savings: '',
      hysa: ''
    });
  };
  
  const handleEditValueChange = (account: 'checking' | 'savings' | 'hysa', value: string) => {
    setEditValues(prev => ({
      ...prev,
      [account]: value
    }));
  };
  
  return (
    <div className="space-y-8">
      {/* Persistent Simulation Controls */}
      <SimulationControls
        hasStarted={hasStarted}
        simulationState={simulationState}
        simulationProgress={simulationProgress}
        personalData={personalData}
        onStart={onStart}
        onPause={onPause}
        onReset={onReset}
        onEditProfile={onEditProfile}
      />
      
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentMode('personal')}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
        >
          ← Back to Dashboard
        </button>
        <PiggyBank className="h-8 w-8 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Bank Account & Cash Management</h1>
      </div>

      {/* Three Account Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Bank Accounts</h2>
        
        {/* Account Balances */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Savings Account */}
          <div className="bg-blue-50 rounded-lg p-6 text-center relative">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Savings Account</h3>
            
            {/* Edit functionality for balance */}
            {editingAccount === 'savings' ? (
              <div className="space-y-3">
                <input
                  type="number"
                  value={editValues.savings}
                  onChange={(e) => handleEditValueChange('savings', e.target.value)}
                  className="w-full text-center text-2xl font-bold text-blue-600 bg-white border-2 border-blue-300 rounded px-2 py-1"
                  placeholder="Enter amount"
                  autoFocus
                />
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(savingsBalance)}</p>
                  <button
                    onClick={() => handleStartEdit('savings')}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit balance"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mt-2">APY: 0.05%</p>
            {savingsBalance > 0 && (
              <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Consider moving to HYSA for better returns!
              </div>
            )}
          </div>

          {/* Checking Account */}
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Checking Account</h3>
            
            {/* Edit functionality for balance */}
            {editingAccount === 'checking' ? (
              <div className="space-y-3">
                <input
                  type="number"
                  value={editValues.checking}
                  onChange={(e) => handleEditValueChange('checking', e.target.value)}
                  className="w-full text-center text-2xl font-bold text-green-600 bg-white border-2 border-green-300 rounded px-2 py-1"
                  placeholder="Enter amount"
                  autoFocus
                />
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(checkingBalance)}</p>
                  <button
                    onClick={() => handleStartEdit('checking')}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Edit balance"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mt-2">APY: 0%</p>
            <p className="text-xs text-gray-500 mt-1">For daily expenses</p>
          </div>

          {/* HYSA Account */}
          <div className="bg-purple-50 rounded-lg p-6 text-center relative">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">High Yield Savings</h3>
            
            {/* Edit functionality for balance */}
            {editingAccount === 'hysa' ? (
              <div className="space-y-3">
                <input
                  type="number"
                  value={editValues.hysa}
                  onChange={(e) => handleEditValueChange('hysa', e.target.value)}
                  className="w-full text-center text-2xl font-bold text-purple-600 bg-white border-2 border-purple-300 rounded px-2 py-1"
                  placeholder="Enter amount"
                  autoFocus
                />
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <p className="text-3xl font-bold text-purple-600">{formatCurrency(hysaBalance)}</p>
                  <button
                    onClick={() => handleStartEdit('hysa')}
                    className="text-purple-600 hover:text-purple-800 p-1"
                    title="Edit balance"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mt-2">APY: 4.0%</p>
            <div className="absolute top-2 right-2">
              <span className="bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">
                🏆 Best Rate
              </span>
            </div>
          </div>
        </div>

        {/* Total Balance Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Balance</h3>
              <p className="text-3xl font-bold text-gray-700">{formatCurrency(totalBankBalance)}</p>
              <p className="text-sm text-gray-600 mt-2">Across all accounts</p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Monthly Cash Flow</h3>
              <p className={`text-3xl font-bold ${monthlySurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthlySurplus)}
              </p>
              <p className="text-sm text-gray-600 mt-2">After expenses</p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Savings Rate</h3>
              <p className="text-3xl font-bold text-purple-600">{savingsRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600 mt-2">Of after-tax income</p>
            </div>
          </div>
        </div>
      </div>

      {/* Money Transfer Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Transfer Between Accounts</h2>
        
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Account</label>
            <select
              value={transferFrom}
              onChange={(e) => setTransferFrom(e.target.value as 'savings' | 'checking' | 'hysa')}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="savings">Savings (${formatCurrency(savingsBalance).replace('$', '')})</option>
              <option value="checking">Checking (${formatCurrency(checkingBalance).replace('$', '')})</option>
              <option value="hysa">HYSA (${formatCurrency(hysaBalance).replace('$', '')})</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Account</label>
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value as 'savings' | 'checking' | 'hysa')}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="savings">Savings</option>
              <option value="checking">Checking</option>
              <option value="hysa">HYSA (Recommended)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input
              type="number"
              value={transferAmount || ''}
              onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full p-3 border border-gray-300 rounded-lg"
              min="0"
              step="100"
            />
          </div>

          <div>
            <button
              onClick={handleTransfer}
              disabled={transferAmount <= 0 || transferFrom === transferTo}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer
            </button>
          </div>
        </div>

        {transferFrom === transferTo && (
          <p className="text-sm text-red-600 mt-2">Please select different source and destination accounts.</p>
        )}
      </div>

      {/* Emergency Fund Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Emergency Fund Status</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Progress Overview */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Coverage Progress</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                goalMet ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {goalMet ? 'Goal Met!' : 'In Progress'}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Current: {coverageMonths.toFixed(1)} months</span>
                <span>Goal: {personalData.emergencyFundMonths || 6} months</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-300 ${goalMet ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((totalBankBalance / emergencyFundGoal) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600">Current Amount</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totalBankBalance)}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600">Target Amount</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(emergencyFundGoal)}</p>
              </div>
            </div>
          </div>

          {/* Emergency Fund Tips */}
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800">Emergency Fund Tips</h3>
            </div>
            
            <ul className="space-y-3 text-sm text-blue-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Keep 3-6 months of expenses in easily accessible savings</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Use high-yield savings accounts for better returns</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Only use for true emergencies, not planned expenses</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Replenish immediately after use</span>
              </li>
            </ul>
            
            {!goalMet && (
              <div className="mt-4 p-3 bg-blue-100 rounded">
                <p className="text-sm text-blue-800 font-medium">
                  💡 You need {formatCurrency(emergencyFundGoal - totalBankBalance)} more to reach your {personalData.emergencyFundMonths || 6}-month goal.
                </p>
                {monthlySurplus > 0 && (
                  <p className="text-xs text-blue-700 mt-1">
                    At your current savings rate, you'll reach your goal in {Math.ceil((emergencyFundGoal - totalBankBalance) / monthlySurplus)} months.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cash Flow Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Cash Flow Analysis</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">After-Tax Income</span>
                <span className="font-semibold text-green-600">{formatCurrency(taxInfo.afterTaxIncome / 12)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-semibold text-red-600">-{formatCurrency(monthlyExpenses)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t-2 border-gray-200">
                <span className="font-semibold text-gray-800">Net Cash Flow</span>
                <span className={`font-bold text-lg ${monthlySurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlySurplus >= 0 ? '+' : ''}{formatCurrency(monthlySurplus)}
                </span>
              </div>
            </div>
          </div>

          {/* Savings Goals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Savings Recommendations</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conservative (10%)</span>
                <span className="font-semibold">{formatCurrency(taxInfo.afterTaxIncome * 0.1 / 12)}/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Moderate (20%)</span>
                <span className="font-semibold">{formatCurrency(taxInfo.afterTaxIncome * 0.2 / 12)}/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Aggressive (30%)</span>
                <span className="font-semibold">{formatCurrency(taxInfo.afterTaxIncome * 0.3 / 12)}/month</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <p className="text-sm text-blue-800">
                <strong>Your Rate:</strong> {savingsRate.toFixed(1)}% 
                ({savingsRate >= 20 ? 'Excellent!' : savingsRate >= 10 ? 'Good progress' : 'Room for improvement'})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Cash Flow */}
      {historicalData.length > 1 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Savings History</h2>
          
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Savings trend chart coming soon!</p>
              <p className="text-sm text-gray-500 mt-2">
                Track your cash flow and savings rate over time
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
