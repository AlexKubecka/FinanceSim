import React, { useState } from 'react';
import { BookOpen, ChevronRight, CheckCircle, Star } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  completed: boolean;
  topics: string[];
}

export const LearningModules: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set(['1', '2']));

  const modules: Module[] = [
    {
      id: '1',
      title: 'Budgeting Basics',
      description: 'Learn how to create and stick to a budget that works for your lifestyle',
      difficulty: 'Beginner',
      estimatedTime: '15 min',
      completed: true,
      topics: [
        'The 50/30/20 rule',
        'Tracking expenses',
        'Setting financial goals',
        'Emergency fund basics'
      ]
    },
    {
      id: '2',
      title: 'Understanding Debt',
      description: 'Master the fundamentals of debt management and payoff strategies',
      difficulty: 'Beginner',
      estimatedTime: '20 min',
      completed: true,
      topics: [
        'Good debt vs bad debt',
        'Interest rates and compounding',
        'Debt avalanche vs snowball',
        'Credit score impact'
      ]
    },
    {
      id: '3',
      title: 'Investment Fundamentals',
      description: 'Start your investment journey with solid foundations',
      difficulty: 'Intermediate',
      estimatedTime: '25 min',
      completed: false,
      topics: [
        'Stocks, bonds, and ETFs',
        'Risk vs return',
        'Diversification principles',
        'Dollar-cost averaging'
      ]
    },
    {
      id: '4',
      title: 'Retirement Planning',
      description: 'Plan for a secure financial future with retirement strategies',
      difficulty: 'Intermediate',
      estimatedTime: '30 min',
      completed: false,
      topics: [
        '401(k) and IRA accounts',
        'Employer matching',
        'Roth vs Traditional',
        'Withdrawal strategies'
      ]
    },
    {
      id: '5',
      title: 'Tax Optimization',
      description: 'Learn strategies to minimize your tax burden legally',
      difficulty: 'Advanced',
      estimatedTime: '35 min',
      completed: false,
      topics: [
        'Tax-advantaged accounts',
        'Tax loss harvesting',
        'Deduction strategies',
        'Tax-efficient investing'
      ]
    },
    {
      id: '6',
      title: 'Real Estate Investing',
      description: 'Explore real estate as an investment and wealth-building tool',
      difficulty: 'Advanced',
      estimatedTime: '40 min',
      completed: false,
      topics: [
        'Primary residence vs investment',
        'REITs and real estate funds',
        'Rental property analysis',
        'Real estate market cycles'
      ]
    }
  ];

  const toggleModuleCompletion = (moduleId: string) => {
    const newCompleted = new Set(completedModules);
    if (newCompleted.has(moduleId)) {
      newCompleted.delete(moduleId);
    } else {
      newCompleted.add(moduleId);
    }
    setCompletedModules(newCompleted);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const progressPercentage = (completedModules.size / modules.length) * 100;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Financial Education Modules</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Master personal finance through structured learning modules. Start with the basics and progress to advanced strategies.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Your Progress</h2>
          <div className="flex items-center text-primary-600">
            <Star className="h-5 w-5 mr-1" />
            <span className="font-semibold">{completedModules.size} of {modules.length} completed</span>
          </div>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="absolute right-0 top-4 text-sm text-gray-600">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Module List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {modules.map((module) => {
              const isCompleted = completedModules.has(module.id);
              const isSelected = selectedModule === module.id;
              
              return (
                <div
                  key={module.id}
                  className={`card cursor-pointer transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-lg'
                  } ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
                  onClick={() => setSelectedModule(isSelected ? null : module.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-semibold text-gray-800 mr-3">
                          {module.title}
                        </h3>
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{module.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                          {module.difficulty}
                        </span>
                        <span className="text-gray-500">⏱️ {module.estimatedTime}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModuleCompletion(module.id);
                        }}
                        className={`btn-primary text-sm ${
                          isCompleted ? 'bg-green-600 hover:bg-green-700' : ''
                        }`}
                      >
                        {isCompleted ? 'Completed' : 'Mark Complete'}
                      </button>
                      <ChevronRight 
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                          isSelected ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold mb-3">What you'll learn:</h4>
                      <ul className="space-y-2">
                        {module.topics.map((topic, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary-600 mr-2">•</span>
                            <span className="text-gray-700">{topic}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-6 flex space-x-3">
                        <button className="btn-primary">
                          Start Learning
                        </button>
                        <button className="btn-secondary">
                          Download PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning Tips Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-primary-600" />
              Learning Tips
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="text-primary-600 mr-2">💡</span>
                <div>
                  <strong>Take your time:</strong> Financial concepts build on each other. Make sure you understand each module before moving on.
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✅</span>
                <div>
                  <strong>Apply what you learn:</strong> Use the calculators and simulators to practice the concepts.
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">🎯</span>
                <div>
                  <strong>Set goals:</strong> After each module, set specific financial goals based on what you learned.
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <h3 className="text-lg font-semibold mb-3 text-yellow-800">Financial Health Checklist</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <input type="checkbox" checked readOnly className="mr-2" />
                <span className="line-through text-gray-600">Create a monthly budget</span>
              </div>
              <div className="flex items-center">
                <input type="checkbox" checked readOnly className="mr-2" />
                <span className="line-through text-gray-600">Build $1,000 emergency fund</span>
              </div>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Pay off high-interest debt</span>
              </div>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Save 3-6 months expenses</span>
              </div>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Start investing for retirement</span>
              </div>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Diversify investment portfolio</span>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">Recommended Reading</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-semibold">"The Total Money Makeover"</div>
                <div className="text-gray-600">by Dave Ramsey</div>
              </div>
              <div>
                <div className="font-semibold">"The Bogleheads' Guide to Investing"</div>
                <div className="text-gray-600">by Taylor Larimore</div>
              </div>
              <div>
                <div className="font-semibold">"Your Money or Your Life"</div>
                <div className="text-gray-600">by Vicki Robin</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
