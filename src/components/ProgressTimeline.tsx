import React from 'react';
import { TrendingUp, DollarSign, Target, Calendar } from 'lucide-react';
import { HistoricalDataPoint, PersonalFinancialData } from '../types/simulation';

interface ProgressTimelineProps {
  historicalData: HistoricalDataPoint[];
  personalData: PersonalFinancialData;
  currentAge: number;
}

interface Milestone {
  age: number;
  title: string;
  description: string;
  achieved: boolean;
  value?: number;
  type: 'networth' | 'investment' | 'salary' | 'retirement';
  icon: React.ReactNode;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  historicalData,
  personalData,
  currentAge
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate current values
  const currentData = historicalData[historicalData.length - 1];
  const currentNetWorth = currentData?.netWorth || 0;
  const currentInvestments = currentData?.investments || 0;

  // Define financial milestones
  const milestones: Milestone[] = [
    {
      age: 25,
      title: "First $10K Net Worth",
      description: "Building your initial financial foundation",
      achieved: currentAge >= 25 && currentNetWorth >= 10000,
      value: 10000,
      type: 'networth',
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      age: 30,
      title: "First $50K Invested",
      description: "Serious investment portfolio growth",
      achieved: currentAge >= 30 && currentInvestments >= 50000,
      value: 50000,
      type: 'investment',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      age: 35,
      title: "$100K Net Worth",
      description: "Significant wealth accumulation milestone",
      achieved: currentAge >= 35 && currentNetWorth >= 100000,
      value: 100000,
      type: 'networth',
      icon: <Target className="h-4 w-4" />
    },
    {
      age: 40,
      title: "$250K Invested",
      description: "Investment portfolio becoming substantial",
      achieved: currentAge >= 40 && currentInvestments >= 250000,
      value: 250000,
      type: 'investment',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      age: 50,
      title: "$500K Net Worth",
      description: "Well on track for comfortable retirement",
      achieved: currentAge >= 50 && currentNetWorth >= 500000,
      value: 500000,
      type: 'networth',
      icon: <Target className="h-4 w-4" />
    },
    {
      age: personalData.retirementAge,
      title: "Retirement Goal",
      description: `Target: ${formatCurrency(personalData.retirementGoal)}`,
      achieved: currentAge >= personalData.retirementAge && currentNetWorth >= personalData.retirementGoal,
      value: personalData.retirementGoal,
      type: 'retirement',
      icon: <Calendar className="h-4 w-4" />
    }
  ];

  // Sort milestones by age
  const sortedMilestones = milestones.sort((a, b) => a.age - b.age);

  // Calculate progress percentage for retirement goal
  const retirementProgress = Math.min((currentNetWorth / personalData.retirementGoal) * 100, 100);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Financial Journey</h2>
        <div className="text-sm text-gray-600">
          Age {currentAge} • {personalData.retirementAge - currentAge} years to retirement
        </div>
      </div>

      {/* Milestone Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Financial Milestones</h3>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {sortedMilestones.map((milestone, index) => (
            <div key={index} className="relative flex items-start mb-6 last:mb-0">
              {/* Timeline dot */}
              <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${
                milestone.achieved 
                  ? 'bg-green-500 border-green-200' 
                  : currentAge >= milestone.age
                  ? 'bg-yellow-500 border-yellow-200'
                  : 'bg-gray-300 border-gray-200'
              }`}>
                <div className="text-white">
                  {milestone.achieved ? '✓' : milestone.icon}
                </div>
              </div>
              
              {/* Milestone content */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-semibold ${
                      milestone.achieved ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {milestone.title}
                    </h4>
                    <p className="text-xs text-gray-600">{milestone.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Age {milestone.age}</div>
                    {milestone.value && (
                      <div className="text-xs font-medium text-gray-700">
                        {formatCurrency(milestone.value)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress bar for current milestone */}
                {!milestone.achieved && currentAge < milestone.age && milestone.value && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          milestone.type === 'networth' ? 'bg-purple-500' :
                          milestone.type === 'investment' ? 'bg-green-500' :
                          milestone.type === 'salary' ? 'bg-blue-500' :
                          'bg-orange-500'
                        }`}
                        style={{ 
                          width: `${Math.min(
                            milestone.type === 'networth' ? (currentNetWorth / milestone.value) * 100 :
                            milestone.type === 'investment' ? (currentInvestments / milestone.value) * 100 :
                            0, 100
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {milestone.type === 'networth' ? formatCurrency(currentNetWorth) :
                       milestone.type === 'investment' ? formatCurrency(currentInvestments) :
                       'In progress...'}
                      {' of '}{formatCurrency(milestone.value)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
