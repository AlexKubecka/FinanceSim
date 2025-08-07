import React from 'react';
import { DollarSign } from 'lucide-react';
import { InvestmentInputs } from '../../hooks/useInvestmentCalculations';

interface InvestmentInputsProps {
  inputs: InvestmentInputs;
  onUpdateInput: (field: keyof InvestmentInputs, value: number) => void;
  onScenarioSelect: (scenario: 'young' | 'midcareer' | 'preretirement') => void;
}

export const InvestmentInputsSection: React.FC<InvestmentInputsProps> = React.memo(({
  inputs,
  onUpdateInput,
  onScenarioSelect
}) => {
  return (
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
            onChange={(e) => onUpdateInput('initialAmount', Number(e.target.value))}
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
            onChange={(e) => onUpdateInput('monthlyContribution', Number(e.target.value))}
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
            onChange={(e) => onUpdateInput('annualReturn', Number(e.target.value))}
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
            onChange={(e) => onUpdateInput('timeHorizon', Number(e.target.value))}
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
            onClick={() => onScenarioSelect('young')}
            className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-blue-50"
          >
            🎯 Young Professional: $200/month for 30 years
          </button>
          <button
            onClick={() => onScenarioSelect('midcareer')}
            className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-blue-50"
          >
            💼 Mid-Career: $5k start + $1k/month for 20 years
          </button>
          <button
            onClick={() => onScenarioSelect('preretirement')}
            className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-blue-50"
          >
            🏠 Pre-Retirement: $50k + $2k/month for 15 years
          </button>
        </div>
      </div>
    </div>
  );
});
