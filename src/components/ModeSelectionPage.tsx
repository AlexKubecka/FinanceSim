import React from 'react';
import { User, Globe, Target, DollarSign, Receipt, TrendingUp } from 'lucide-react';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom' | 'salary' | 'expenses' | 'investments' | 'economy' | 'networth' | 'bank' | 'debt' | 'reports';

interface ModeSelectionPageProps {
  setCurrentMode: React.Dispatch<React.SetStateAction<SimulationMode>>;
}

export const ModeSelectionPage: React.FC<ModeSelectionPageProps> = ({
  setCurrentMode
}) => {
  const modes = [
    {
      id: 'personal',
      title: 'Personal Mode',
      icon: User,
      description: 'Plan your actual financial future with real goals and timeline',
      features: [
        'Your real age and salary',
        'Actual debt amounts', 
        'Personal investment goals',
        'Life event planning'
      ],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'realistic',
      title: 'Realistic Scenarios',
      icon: Globe,
      description: 'Experience common financial challenges and learn from them',
      features: [
        'Market crashes and booms',
        'Unexpected expenses',
        'Job changes and promotions',
        'Economic events'
      ],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      id: 'custom',
      title: 'Custom Simulation',
      icon: Target,
      description: 'Create your own scenarios with specific parameters',
      features: [
        'Custom market conditions',
        'Specific life events',
        'Variable income streams',
        'Complex investment strategies'
      ],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Life Financial Simulator</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Explore different financial scenarios, plan your future, and learn through realistic simulations.
          Choose a mode below to begin your financial journey.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 ${mode.bgColor} border-2 border-transparent hover:border-gray-200`}
          >
            <div className="flex items-center mb-4">
              <mode.icon className="h-8 w-8 text-gray-700 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">{mode.title}</h2>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {mode.description}
            </p>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Features:</h3>
              <ul className="space-y-2">
                {mode.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setCurrentMode(mode.id as SimulationMode)}
              className={`w-full bg-gradient-to-r ${mode.color} text-white py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center font-semibold`}
              disabled={mode.id !== 'personal'}
            >
              <mode.icon className="h-5 w-5 mr-2" />
              {mode.id === 'personal' ? 'Start Planning' : 'Coming Soon'}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Access Tools */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Access Tools</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-800">Salary Calculator</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Calculate your take-home pay with detailed tax breakdowns for any state.
            </p>
            <button
              onClick={() => setCurrentMode('salary')}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Calculate Taxes
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <Receipt className="h-8 w-8 text-orange-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-800">Expense Tracker</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Track and manage your expenses with real-world data by state.
            </p>
            <button
              onClick={() => setCurrentMode('expenses')}
              className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Track Expenses
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-800">Investment Planner</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Plan your investment strategy and retirement savings goals.
            </p>
            <button
              onClick={() => setCurrentMode('investments')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Plan Investments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
