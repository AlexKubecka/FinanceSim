import React, { useState, useCallback } from 'react';
import { useInvestmentCalculations, InvestmentInputs } from '../hooks/useInvestmentCalculations';
import { InvestmentInputsSection } from '../components/investment/InvestmentInputsSection';
import { InvestmentSummaryCards } from '../components/investment/InvestmentSummaryCards';
import { InvestmentChart } from '../components/investment/InvestmentChart';

export const InvestmentSimulator: React.FC = React.memo(() => {
  const [inputs, setInputs] = useState<InvestmentInputs>({
    initialAmount: 1000,
    monthlyContribution: 500,
    annualReturn: 7,
    timeHorizon: 30
  });

  const { finalResult, chartData } = useInvestmentCalculations(inputs);

  const updateInput = useCallback((field: keyof InvestmentInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const handleScenarioSelect = useCallback((scenario: 'young' | 'midcareer' | 'preretirement') => {
    switch (scenario) {
      case 'young':
        setInputs({ initialAmount: 0, monthlyContribution: 200, annualReturn: 7, timeHorizon: 30 });
        break;
      case 'midcareer':
        setInputs({ initialAmount: 5000, monthlyContribution: 1000, annualReturn: 7, timeHorizon: 20 });
        break;
      case 'preretirement':
        setInputs({ initialAmount: 50000, monthlyContribution: 2000, annualReturn: 6, timeHorizon: 15 });
        break;
    }
  }, []);

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
        <InvestmentInputsSection
          inputs={inputs}
          onUpdateInput={updateInput}
          onScenarioSelect={handleScenarioSelect}
        />

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <InvestmentSummaryCards
            finalResult={finalResult}
            formatCurrency={formatCurrency}
          />

          {/* Investment Growth Chart */}
          <InvestmentChart
            chartData={chartData}
            formatCurrency={formatCurrency}
          />
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
});
