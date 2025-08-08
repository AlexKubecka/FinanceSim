import React from 'react';
import { Clock, Target, Calendar } from 'lucide-react';
import { PersonalFinancialData } from '../types/simulation';

interface LifeProgressBarProps {
  personalData: PersonalFinancialData;
  currentAge: number;
  netWorth: number;
}

export const LifeProgressBar: React.FC<LifeProgressBarProps> = ({
  personalData,
  currentAge,
  netWorth
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate progress percentages
  const lifeProgress = Math.min(((currentAge - 18) / (personalData.retirementAge - 18)) * 100, 100);
  const retirementProgress = Math.min((netWorth / personalData.retirementGoal) * 100, 100);
  
  // Years remaining
  const yearsToRetirement = Math.max(personalData.retirementAge - currentAge, 0);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-6 border border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Life & Financial Progress
        </h2>
        <div className="text-sm text-gray-600 flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          Age {currentAge}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Life Progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <Clock className="h-4 w-4 mr-1 text-blue-500" />
              Career Progress
            </span>
            <span className="text-sm text-gray-600">{lifeProgress.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
            <div 
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${lifeProgress}%` }}
            >
              <div className="absolute right-2 top-0 h-full flex items-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Started Career (18)</span>
            <span>Retirement ({personalData.retirementAge})</span>
          </div>
          <div className="mt-2 text-center">
            <span className="text-lg font-bold text-blue-600">{yearsToRetirement}</span>
            <span className="text-sm text-gray-600 ml-1">years remaining</span>
          </div>
        </div>

        {/* Financial Progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <Target className="h-4 w-4 mr-1 text-purple-500" />
              Retirement Goal
            </span>
            <span className="text-sm text-gray-600">{retirementProgress.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
            <div 
              className={`h-4 rounded-full transition-all duration-700 ease-out relative ${
                retirementProgress >= 100
                  ? 'bg-gradient-to-r from-green-400 to-green-600' 
                  : retirementProgress > 50 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  : 'bg-gradient-to-r from-purple-400 to-purple-600'
              }`}
              style={{ width: `${Math.min(retirementProgress, 100)}%` }}
            >
              <div className="absolute right-2 top-0 h-full flex items-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Current: {formatCurrency(netWorth)}</span>
            <span>Goal: {formatCurrency(personalData.retirementGoal)}</span>
          </div>

        </div>
      </div>
    </div>
  );
};
