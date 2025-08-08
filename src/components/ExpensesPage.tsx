import React from 'react';
import { Receipt } from 'lucide-react';
import { PersonalFinancialData, SimulationProgress, FinancialState } from '../types/simulation';
import { SimulationControls } from './SimulationControls';
import { stateRentData, stateGroceryData } from '../utils/expenseData';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth';

interface ExpensesPageProps {
  // Core data
  personalData: PersonalFinancialData;
  financials: FinancialState;
  
  // Simulation state
  hasStarted: boolean;
  simulationState: 'setup' | 'running' | 'paused' | 'completed';
  simulationProgress: SimulationProgress;
  
  // Rent management
  getCurrentRent: (state: string) => number;
  handleEditRent: () => void;
  handleSaveRent: () => void;
  handleCancelEditRent: () => void;
  handleResetRent: () => void;
  isCustomRent: (state: string) => boolean;
  editingRent: boolean;
  tempRentValue: string;
  setTempRentValue: (value: string) => void;
  
  // Grocery management
  getCurrentGrocery: (state: string) => number;
  handleEditGrocery: () => void;
  handleSaveGrocery: () => void;
  handleCancelEditGrocery: () => void;
  handleResetGrocery: () => void;
  isCustomGrocery: (state: string) => boolean;
  editingGrocery: boolean;
  tempGroceryValue: string;
  setTempGroceryValue: (value: string) => void;
  
  // Navigation and actions
  setPersonalData: (updater: (prev: PersonalFinancialData) => PersonalFinancialData) => void;
  setCurrentMode: React.Dispatch<React.SetStateAction<SimulationMode>>;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  handleEditProfile: () => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  personalData,
  financials,
  hasStarted,
  simulationState,
  simulationProgress,
  getCurrentRent,
  handleEditRent,
  handleSaveRent,
  handleCancelEditRent,
  handleResetRent,
  isCustomRent,
  editingRent,
  tempRentValue,
  setTempRentValue,
  getCurrentGrocery,
  handleEditGrocery,
  handleSaveGrocery,
  handleCancelEditGrocery,
  handleResetGrocery,
  isCustomGrocery,
  editingGrocery,
  tempGroceryValue,
  setTempGroceryValue,
  setPersonalData,
  setCurrentMode,
  startSimulation,
  pauseSimulation,
  resetSimulation,
  handleEditProfile
}) => {
  const currentStateRent = personalData.state ? getCurrentRent(personalData.state) : 0;
  const annualRent = currentStateRent * 12;
  const isUsingCustomRent = personalData.state ? isCustomRent(personalData.state) : false;
  const defaultStateRent = personalData.state ? stateRentData[personalData.state] ?? 0 : 0;

  const currentStateGrocery = personalData.state ? getCurrentGrocery(personalData.state) : 0;
  const annualGrocery = currentStateGrocery * 52;
  const isUsingCustomGrocery = personalData.state ? isCustomGrocery(personalData.state) : false;
  const defaultStateGrocery = personalData.state ? stateGroceryData[personalData.state] ?? 0 : 0;

  const totalAnnualExpenses = annualRent + annualGrocery;

  return (
    <div className="space-y-8">
      {/* Persistent Simulation Controls */}
      <SimulationControls
        hasStarted={hasStarted}
        simulationState={simulationState}
        simulationProgress={simulationProgress}
        personalData={personalData}
        onStart={startSimulation}
        onPause={pauseSimulation}
        onReset={resetSimulation}
        onEditProfile={handleEditProfile}
      />
      
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentMode('personal')}
          className="flex items-center text-orange-600 hover:text-orange-800 mr-4"
        >
          ← Back to Dashboard
        </button>
        <Receipt className="h-8 w-8 text-orange-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
      </div>

      {/* State Selection */}
      {!personalData.state && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Your State</h2>
          <select
            value={personalData.state}
            onChange={(e) => setPersonalData(prev => ({ ...prev, state: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            <option value="">Choose your state...</option>
            {Object.keys(stateRentData).sort().map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      )}

      {/* State Rent Information */}
      {personalData.state && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Housing Costs - {personalData.state}
            </h2>
            <div className="flex items-center space-x-2">
              {isUsingCustomRent && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Custom
                </span>
              )}
              {!editingRent ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleEditRent}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Edit Rent
                  </button>
                  {isUsingCustomRent && (
                    <button
                      onClick={handleResetRent}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={tempRentValue}
                    onChange={(e) => setTempRentValue(e.target.value)}
                    placeholder="Monthly rent"
                    className="w-32 p-2 border border-gray-300 rounded text-sm"
                    min="0"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveRent}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditRent}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Monthly Rent</h3>
              <p className="text-2xl font-bold text-blue-900">${currentStateRent.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-blue-700">
                {isUsingCustomRent ? 'Your custom amount' : 'State average'}
              </p>
              {isUsingCustomRent && defaultStateRent > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  State avg: ${defaultStateRent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Annual Housing Cost</h3>
              <p className="text-2xl font-bold text-green-900">${annualRent.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-green-700">Per year</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Housing % of Salary</h3>
              <p className="text-2xl font-bold text-purple-900">
                {financials.currentSalary > 0 ? ((annualRent / financials.currentSalary) * 100).toFixed(1) : '0'}%
              </p>
              <p className="text-sm text-purple-700">Housing cost ratio</p>
            </div>
          </div>
        </div>
      )}

      {/* State Grocery Information */}
      {personalData.state && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Food Costs - {personalData.state}
            </h2>
            <div className="flex items-center space-x-2">
              {isUsingCustomGrocery && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Custom
                </span>
              )}
              {!editingGrocery ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleEditGrocery}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Edit Groceries
                  </button>
                  {isUsingCustomGrocery && (
                    <button
                      onClick={handleResetGrocery}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={tempGroceryValue}
                    onChange={(e) => setTempGroceryValue(e.target.value)}
                    placeholder="Weekly groceries"
                    className="w-32 p-2 border border-gray-300 rounded text-sm"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveGrocery}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditGrocery}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Weekly Groceries</h3>
              <p className="text-2xl font-bold text-green-900">${currentStateGrocery.toFixed(2)}</p>
              <p className="text-sm text-green-700">
                {isUsingCustomGrocery ? 'Your custom amount' : 'State average'}
              </p>
              {isUsingCustomGrocery && defaultStateGrocery > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  State avg: ${defaultStateGrocery.toFixed(2)}
                </p>
              )}
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Annual Food Cost</h3>
              <p className="text-2xl font-bold text-yellow-900">${annualGrocery.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-yellow-700">Per year</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Food % of Salary</h3>
              <p className="text-2xl font-bold text-red-900">
                {financials.currentSalary > 0 ? ((annualGrocery / financials.currentSalary) * 100).toFixed(1) : '0'}%
              </p>
              <p className="text-sm text-red-700">Food cost ratio</p>
            </div>
          </div>
        </div>
      )}

      {/* Total Expenses Summary */}
      {personalData.state && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Annual Expense Summary
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">Total Annual Expenses</h3>
              <p className="text-3xl font-bold text-orange-900">${totalAnnualExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-orange-700">Housing + Food costs</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-800 mb-2">Expense % of Salary</h3>
              <p className="text-3xl font-bold text-indigo-900">
                {financials.currentSalary > 0 ? ((totalAnnualExpenses / financials.currentSalary) * 100).toFixed(1) : '0'}%
              </p>
              <p className="text-sm text-indigo-700">Total expense ratio</p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Expense Categories */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Additional Expense Categories</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Transportation</h3>
            <p className="text-lg font-bold text-gray-900">Coming Soon</p>
            <p className="text-sm text-gray-600">Car payments, insurance, gas</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Healthcare</h3>
            <p className="text-lg font-bold text-gray-900">Coming Soon</p>
            <p className="text-sm text-gray-600">Insurance, medical expenses</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Entertainment</h3>
            <p className="text-lg font-bold text-gray-900">Coming Soon</p>
            <p className="text-sm text-gray-600">Dining out, subscriptions, hobbies</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Utilities</h3>
            <p className="text-lg font-bold text-gray-900">Coming Soon</p>
            <p className="text-sm text-gray-600">Electricity, water, internet</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Savings Goals</h3>
            <p className="text-lg font-bold text-gray-900">Coming Soon</p>
            <p className="text-sm text-gray-600">Emergency fund, retirement</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Miscellaneous</h3>
            <p className="text-lg font-bold text-gray-900">Coming Soon</p>
            <p className="text-sm text-gray-600">Clothing, personal care</p>
          </div>
        </div>
      </div>
    </div>
  );
};
