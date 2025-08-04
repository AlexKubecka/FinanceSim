import React, { useState, useEffect, useRef } from 'react';
import { User, Shuffle, Settings, ArrowRight, LifeBuoy, Sparkles, DollarSign, Calendar, TrendingUp, PiggyBank, Calculator, Download, Save, Play, Pause, FastForward, SkipForward, Clock, Target, Plus, Flag, X, Check } from 'lucide-react';

type SimulationMode = 'selection' | 'personal' | 'realistic' | 'custom';

interface PersonalFinancialData {
  // Basic Info
  age: number;
  currentSalary: number;
  
  // Assets
  savings: number;
  investments: number;
  
  // Debts
  debtAmount: number;
  debtInterestRate: number;
}

type SimulationSpeed = 'day' | 'week' | 'month' | 'year';
type SimulationState = 'setup' | 'running' | 'paused' | 'completed';

interface SimulationProgress {
  currentDate: Date;
  startDate: Date;
  currentAge: number;
  yearsElapsed: number;
  monthsElapsed: number;
  daysElapsed: number;
}

interface LifeEvent {
  id: string;
  name: string;
  description: string;
  type: 'income' | 'expense' | 'debt' | 'investment' | 'career' | 'emergency';
  amount: number;
  targetAge?: number;
  isActive: boolean;
  triggered: boolean;
}

interface FinancialGoal {
  id: string;
  name: string;
  description: string;
  type: 'savings' | 'networth' | 'debt_free' | 'investment' | 'retirement';
  targetAmount: number;
  targetAge?: number;
  isCompleted: boolean;
  progress: number;
}

export const LifeSimulator: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<SimulationMode>('selection');
  const [personalData, setPersonalData] = useState<PersonalFinancialData>({
    // Basic Info
    age: 25,
    currentSalary: 50000,
    
    // Assets
    savings: 10000,
    investments: 15000,
    
    // Debts
    debtAmount: 25000,
    debtInterestRate: 18.5,
  });

  // Simulation state
  const [simulationState, setSimulationState] = useState<SimulationState>('setup');
  const [simulationSpeed, setSimulationSpeed] = useState<SimulationSpeed>('day');
  const [simulationProgress, setSimulationProgress] = useState<SimulationProgress>({
    currentDate: new Date(),
    startDate: new Date(),
    currentAge: 25,
    yearsElapsed: 0,
    monthsElapsed: 0,
    daysElapsed: 0,
  });
  const [targetAge, setTargetAge] = useState<number>(65);
  const intervalRef = useRef<number | null>(null);

  // Events and Goals state
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [wasRunningBeforeModal, setWasRunningBeforeModal] = useState<boolean>(false);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle event triggering when simulation progresses
  useEffect(() => {
    if (simulationState === 'running' || simulationState === 'paused' || simulationState === 'completed') {
      // Check for events that should trigger
      lifeEvents.forEach(event => {
        if (event.isActive && event.targetAge && simulationProgress.currentAge >= event.targetAge && !event.triggered) {
          console.log('Triggering event:', event.name, 'at age', simulationProgress.currentAge);
          setLifeEvents(prev => prev.map(e => 
            e.id === event.id ? { ...e, triggered: true } : e
          ));
        }
      });

      // Update financial goals progress
      const financials = calculateCurrentFinancials();
      setFinancialGoals(prev => prev.map(goal => {
        let progress = 0;
        let isCompleted = false;
        
        switch (goal.type) {
          case 'savings':
            progress = Math.min(100, (financials.currentSavings / goal.targetAmount) * 100);
            isCompleted = financials.currentSavings >= goal.targetAmount;
            break;
          case 'networth':
            progress = Math.min(100, (financials.netWorth / goal.targetAmount) * 100);
            isCompleted = financials.netWorth >= goal.targetAmount;
            break;
          case 'debt_free':
            progress = financials.remainingDebt === 0 ? 100 : Math.max(0, ((personalData.debtAmount - financials.remainingDebt) / personalData.debtAmount) * 100);
            isCompleted = financials.remainingDebt === 0;
            break;
          case 'investment':
            progress = Math.min(100, (financials.currentInvestments / goal.targetAmount) * 100);
            isCompleted = financials.currentInvestments >= goal.targetAmount;
            break;
          case 'retirement':
            const totalRetirement = financials.currentSavings + financials.currentInvestments;
            progress = Math.min(100, (totalRetirement / goal.targetAmount) * 100);
            isCompleted = totalRetirement >= goal.targetAmount;
            break;
        }
        
        return { ...goal, progress, isCompleted };
      }));
    }
  }, [simulationProgress.currentAge, lifeEvents, personalData.debtAmount]);

  // Separate calculation function to avoid circular dependencies
  const calculateCurrentFinancials = () => {
    const years = simulationProgress.yearsElapsed;
    const months = simulationProgress.monthsElapsed;
    
    // Base salary growth (3% per year)
    let currentSalary = personalData.currentSalary * Math.pow(1.03, years);
    
    // Base investment growth (7% per year)
    let currentInvestments = personalData.investments * Math.pow(1.07, years);
    
    // Base savings growth (assuming 10% savings rate + 2% interest)
    const monthlySavings = currentSalary * 0.10 / 12;
    const savingsGrowth = monthlySavings * months * 1.02;
    let currentSavings = personalData.savings + savingsGrowth;
    
    // Base debt reduction (fixed monthly payment)
    const monthlyRate = personalData.debtInterestRate / 100 / 12;
    const monthlyPayment = personalData.debtAmount * (monthlyRate * Math.pow(1 + monthlyRate, 60)) / (Math.pow(1 + monthlyRate, 60) - 1);
    let remainingDebt = Math.max(0, personalData.debtAmount - (monthlyPayment * months * 0.7)); // 70% goes to principal roughly
    
    // Apply triggered life events (read-only calculation)
    lifeEvents.forEach(event => {
      if (event.isActive && event.targetAge && simulationProgress.currentAge >= event.targetAge && event.triggered) {
        // Apply event effects to calculations only
        switch (event.type) {
          case 'income':
            currentSalary += event.amount;
            break;
          case 'expense':
            currentSavings = Math.max(0, currentSavings - event.amount);
            break;
          case 'debt':
            remainingDebt += event.amount;
            break;
          case 'investment':
            currentInvestments += event.amount;
            break;
          case 'career':
            currentSalary = event.amount; // Career change sets new salary
            break;
          case 'emergency':
            // Emergency takes from savings first, then investments, then creates debt
            if (currentSavings >= event.amount) {
              currentSavings -= event.amount;
            } else {
              const remaining = event.amount - currentSavings;
              currentSavings = 0;
              if (currentInvestments >= remaining) {
                currentInvestments -= remaining;
              } else {
                const stillRemaining = remaining - currentInvestments;
                currentInvestments = 0;
                remainingDebt += stillRemaining;
              }
            }
            break;
        }
      }
    });
    
    const netWorth = currentSavings + currentInvestments - remainingDebt;
    
    return {
      currentSalary,
      currentInvestments,
      currentSavings,
      remainingDebt,
      netWorth,
      monthlyPayment
    };
  };

  const simulationOptions = [
    {
      id: 'personal',
      title: 'Personal Journey',
      icon: User,
      description: 'Input your real financial information and see how your actual situation plays out over time',
      features: [
        'Use your real age, salary, and savings',
        'Plan for your actual goals and timeline',
        'Get personalized recommendations',
        'Export your financial plan'
      ],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'realistic',
      title: 'Life Simulation Game',
      icon: Shuffle,
      description: 'Create a character and experience realistic financial scenarios with random life events',
      features: [
        'Create a custom character profile',
        'Random life events and opportunities',
        'Economic cycles and market changes',
        'Multiple difficulty levels'
      ],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      id: 'custom',
      title: 'Custom Scenarios',
      icon: Settings,
      description: 'Design your own financial scenarios and test different strategies',
      features: [
        'Coming Soon!',
        'Build custom economic scenarios',
        'Test extreme market conditions',
        'Compare multiple strategies'
      ],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      disabled: true
    }
  ];

  const renderSelectionPage = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <LifeBuoy className="h-12 w-12 text-blue-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-800">Life Financial Simulator</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose your path to financial wisdom. Whether you want to plan your real future, 
          experience life's financial challenges through simulation, or create custom scenarios.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {simulationOptions.map((option) => (
          <div
            key={option.id}
            className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${
              option.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
            onClick={() => !option.disabled && setCurrentMode(option.id as SimulationMode)}
          >
            <div className={`h-32 bg-gradient-to-r ${option.color} flex items-center justify-center`}>
              <option.icon className="h-16 w-16 text-white" />
            </div>
            
            <div className="p-6 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-800">{option.title}</h3>
                {option.disabled && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {option.description}
              </p>
              
              <div className="space-y-2 mb-6">
                {option.features.map((feature, index) => (
                  <div key={index} className="flex items-start text-sm">
                    <Sparkles className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className={option.disabled ? 'text-gray-400' : 'text-gray-700'}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              
              <button
                disabled={option.disabled}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                  option.disabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : `${option.bgColor} ${option.textColor} hover:opacity-80`
                }`}
              >
                {option.disabled ? 'Coming Soon' : 'Start Journey'}
                {!option.disabled && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Educational Preview */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Why Use the Life Simulator?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-indigo-700 mb-3">Learn Through Experience</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  See how financial decisions compound over decades
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  Experience the impact of unexpected life events
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  Understand the power of starting early vs. starting late
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  Test different strategies risk-free
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-purple-700 mb-3">Real-World Scenarios</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Job loss, market crashes, and economic downturns
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Promotions, windfalls, and investment gains
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Major purchases: house, car, education
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Family changes: marriage, children, inheritance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPersonalMode = () => {
    console.log('renderPersonalMode called, currentMode:', currentMode);
    console.log('simulationState:', simulationState);
    console.log('personalData:', personalData);
    
    const updatePersonalData = (field: keyof PersonalFinancialData, value: number) => {
      setPersonalData(prev => ({ ...prev, [field]: value }));
    };

    // Simulation control functions
    const startSimulation = () => {
      const startDate = new Date();
      setSimulationProgress({
        currentDate: new Date(startDate),
        startDate: startDate,
        currentAge: personalData.age,
        yearsElapsed: 0,
        monthsElapsed: 0,
        daysElapsed: 0,
      });
      setSimulationState('running');
      runSimulation();
    };

    const pauseSimulation = () => {
      setSimulationState('paused');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const runSimulation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const speeds = {
        day: 2000,   // 2000ms (2 seconds) per day
        week: 2000,  // 2000ms (2 seconds) per week (7 days)
        month: 2000, // 2000ms (2 seconds) per month
        year: 2000   // 2000ms (2 seconds) per year
      };

      intervalRef.current = setInterval(() => {
        setSimulationProgress(prev => {
          const newDate = new Date(prev.currentDate);

          switch (simulationSpeed) {
            case 'day':
              newDate.setDate(newDate.getDate() + 1);
              break;
            case 'week':
              newDate.setDate(newDate.getDate() + 7);
              break;
            case 'month':
              newDate.setMonth(newDate.getMonth() + 1);
              break;
            case 'year':
              newDate.setFullYear(newDate.getFullYear() + 1);
              break;
          }

          const daysDiff = Math.floor((newDate.getTime() - prev.startDate.getTime()) / (1000 * 60 * 60 * 24));
          const monthsDiff = Math.floor(daysDiff / 30);
          const yearsDiff = Math.floor(daysDiff / 365);
          const currentAge = Math.min(100, personalData.age + yearsDiff);

          // Stop simulation if target age reached or max age (100) reached
          if (currentAge >= targetAge || currentAge >= 100) {
            pauseSimulation();
            setSimulationState('completed');
          }

          return {
            currentDate: newDate,
            startDate: prev.startDate,
            currentAge: currentAge,
            yearsElapsed: yearsDiff,
            monthsElapsed: monthsDiff,
            daysElapsed: daysDiff,
          };
        });
      }, speeds[simulationSpeed]);
    };

    const resumeSimulation = () => {
      setSimulationState('running');
      runSimulation();
    };

    const simulateToAge = (age: number) => {
      // Cap the target age at 100
      const targetAge = Math.min(100, age);
      const yearsToAdd = targetAge - simulationProgress.currentAge;
      if (yearsToAdd <= 0) return;

      const newDate = new Date(simulationProgress.currentDate);
      newDate.setFullYear(newDate.getFullYear() + yearsToAdd);
      
      const totalYearsElapsed = simulationProgress.yearsElapsed + yearsToAdd;
      
      setSimulationProgress({
        currentDate: newDate,
        startDate: simulationProgress.startDate,
        currentAge: targetAge,
        yearsElapsed: totalYearsElapsed,
        monthsElapsed: totalYearsElapsed * 12,
        daysElapsed: totalYearsElapsed * 365,
      });
      setSimulationState('paused');
    };

    const financials = calculateCurrentFinancials();

    // Format date for display
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    // Helper function to close modals and resume simulation if needed
  const closeModalAndResume = (modalSetter: (value: boolean) => void) => {
    modalSetter(false);
    if (wasRunningBeforeModal) {
      // Small delay to ensure modal closes first
      setTimeout(() => {
        resumeSimulation();
        setWasRunningBeforeModal(false);
      }, 100);
    }
  };

  // Event Modal Component
    const EventModal = () => {
      const [eventData, setEventData] = useState({
        name: '',
        description: '',
        type: 'income' as LifeEvent['type'],
        amount: 0,
        targetAge: simulationProgress.currentAge + 1
      });

      const handleAddEvent = () => {
        const newEvent: LifeEvent = {
          id: Date.now().toString(),
          name: eventData.name,
          description: eventData.description,
          type: eventData.type,
          amount: eventData.amount,
          targetAge: eventData.targetAge,
          isActive: true,
          triggered: false
        };
        setLifeEvents(prev => [...prev, newEvent]);
        closeModalAndResume(setShowEventModal);
        setEventData({
          name: '',
          description: '',
          type: 'income',
          amount: 0,
          targetAge: simulationProgress.currentAge + 1
        });
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add Life Event</h3>
              <button
                onClick={() => closeModalAndResume(setShowEventModal)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input
                  type="text"
                  value={eventData.name}
                  onChange={(e) => setEventData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Job Promotion"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={2}
                  placeholder="Brief description of the event"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={eventData.type}
                  onChange={(e) => setEventData(prev => ({ ...prev, type: e.target.value as LifeEvent['type'] }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="income">Income Boost</option>
                  <option value="expense">Major Expense</option>
                  <option value="debt">New Debt</option>
                  <option value="investment">Investment Opportunity</option>
                  <option value="career">Career Change</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={eventData.amount}
                  onChange={(e) => setEventData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger at Age</label>
                <input
                  type="number"
                  value={eventData.targetAge}
                  onChange={(e) => setEventData(prev => ({ ...prev, targetAge: parseInt(e.target.value) || simulationProgress.currentAge + 1 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min={simulationProgress.currentAge + 1}
                  max="100"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => closeModalAndResume(setShowEventModal)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!eventData.name}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4 inline mr-1" />
                Add Event
              </button>
            </div>
          </div>
        </div>
      );
    };

    // Goal Modal Component
    const GoalModal = () => {
      const [goalData, setGoalData] = useState({
        name: '',
        description: '',
        type: 'savings' as FinancialGoal['type'],
        targetAmount: 0,
        targetAge: simulationProgress.currentAge + 5
      });

      const handleAddGoal = () => {
        const newGoal: FinancialGoal = {
          id: Date.now().toString(),
          name: goalData.name,
          description: goalData.description,
          type: goalData.type,
          targetAmount: goalData.targetAmount,
          targetAge: goalData.targetAge,
          isCompleted: false,
          progress: 0
        };
        setFinancialGoals(prev => [...prev, newGoal]);
        closeModalAndResume(setShowGoalModal);
        setGoalData({
          name: '',
          description: '',
          type: 'savings',
          targetAmount: 0,
          targetAge: simulationProgress.currentAge + 5
        });
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add Financial Goal</h3>
              <button
                onClick={() => closeModalAndResume(setShowGoalModal)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={goalData.name}
                  onChange={(e) => setGoalData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={goalData.description}
                  onChange={(e) => setGoalData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={2}
                  placeholder="Brief description of your goal"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                <select
                  value={goalData.type}
                  onChange={(e) => setGoalData(prev => ({ ...prev, type: e.target.value as FinancialGoal['type'] }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="savings">Savings Target</option>
                  <option value="networth">Net Worth Goal</option>
                  <option value="debt_free">Debt Free</option>
                  <option value="investment">Investment Goal</option>
                  <option value="retirement">Retirement Fund</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount ($)</label>
                <input
                  type="number"
                  value={goalData.targetAmount}
                  onChange={(e) => setGoalData(prev => ({ ...prev, targetAmount: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Age (Optional)</label>
                <input
                  type="number"
                  value={goalData.targetAge}
                  onChange={(e) => setGoalData(prev => ({ ...prev, targetAge: parseInt(e.target.value) || simulationProgress.currentAge + 5 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min={simulationProgress.currentAge + 1}
                  max="100"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => closeModalAndResume(setShowGoalModal)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                disabled={!goalData.name || !goalData.targetAmount}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4 inline mr-1" />
                Add Goal
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentMode('selection')}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Options
          </button>
          <User className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Personal Life Simulator</h1>
        </div>

        {/* Setup Phase */}
        {simulationState === 'setup' && (
          <div className="bg-white rounded-lg shadow-lg p-6 bg-blue-50 border-blue-200 border">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-blue-800 mb-2">Setup Your Life Simulation</h2>
              <p className="text-blue-700">
                Enter your starting financial situation and watch your life unfold over time
              </p>
            </div>

            <div className="bg-white rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Starting Position</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Starting Age
                    </label>
                    <input
                      type="number"
                      value={personalData.age}
                      onChange={(e) => updatePersonalData('age', parseInt(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="18"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Annual Salary
                    </label>
                    <input
                      type="number"
                      value={personalData.currentSalary}
                      onChange={(e) => updatePersonalData('currentSalary', parseInt(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      placeholder="e.g., 50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PiggyBank className="inline h-4 w-4 mr-1" />
                      Current Savings
                    </label>
                    <input
                      type="number"
                      value={personalData.savings}
                      onChange={(e) => updatePersonalData('savings', parseInt(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      placeholder="e.g., 10000"
                    />
                  </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Assets & Debts</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TrendingUp className="inline h-4 w-4 mr-1" />
                      Current Investments
                    </label>
                    <input
                      type="number"
                      value={personalData.investments}
                      onChange={(e) => updatePersonalData('investments', parseInt(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      placeholder="e.g., 15000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calculator className="inline h-4 w-4 mr-1" />
                      Total Debt
                    </label>
                    <input
                      type="number"
                      value={personalData.debtAmount}
                      onChange={(e) => updatePersonalData('debtAmount', parseInt(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      placeholder="e.g., 25000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Debt Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      value={personalData.debtInterestRate}
                      onChange={(e) => updatePersonalData('debtInterestRate', parseFloat(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="30"
                      step="0.1"
                      placeholder="e.g., 18.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Target className="inline h-4 w-4 mr-1" />
                      Simulate Until Age
                    </label>
                    <input
                      type="number"
                      value={targetAge}
                      onChange={(e) => setTargetAge(parseInt(e.target.value) || 65)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={personalData.age + 1}
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Start Simulation Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={startSimulation}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-lg font-semibold mx-auto"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Life Simulation
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Watch your financial journey unfold year by year
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Running/Paused Simulation */}
        {(simulationState === 'running' || simulationState === 'paused' || simulationState === 'completed') && (
          <div className="space-y-6">
            {/* Simulation Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">
                      {formatDate(simulationProgress.currentDate)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">
                      Age {simulationProgress.currentAge}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {simulationState === 'running' ? (
                    <button
                      onClick={pauseSimulation}
                      className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </button>
                  ) : simulationState === 'paused' ? (
                    <button
                      onClick={resumeSimulation}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-gray-600 text-white rounded-lg">
                      {simulationProgress.currentAge >= 100 ? 'Max Age Reached (100)' : 'Simulation Complete'}
                    </span>
                  )}

                  {/* Speed Controls */}
                  <div className="flex items-center space-x-1 bg-white rounded-lg p-1">
                    {(['day', 'week', 'month', 'year'] as SimulationSpeed[]).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          setSimulationSpeed(speed);
                          if (simulationState === 'running') {
                            // Restart simulation with new speed
                            runSimulation();
                          }
                        }}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          simulationSpeed === speed
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>

                  {/* Quick Jump Controls */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => simulateToAge(simulationProgress.currentAge + 5)}
                      className="flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                      <FastForward className="h-3 w-3 mr-1" />
                      +5yr
                    </button>
                    <button
                      onClick={() => simulateToAge(simulationProgress.currentAge + 10)}
                      className="flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                      <SkipForward className="h-3 w-3 mr-1" />
                      +10yr
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Dashboard */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Current Financial Status</h3>
              
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className={`p-4 rounded-lg border ${financials.netWorth >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <h4 className={`font-semibold ${financials.netWorth >= 0 ? 'text-green-800' : 'text-red-800'} mb-1`}>Net Worth</h4>
                  <p className={`text-xl font-bold ${financials.netWorth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    ${financials.netWorth.toLocaleString()}
                  </p>
                  <p className={`text-xs ${financials.netWorth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Assets - Debts
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-1">Annual Salary</h4>
                  <p className="text-xl font-bold text-blue-900">
                    ${financials.currentSalary.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-700">3% annual growth</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-1">Investments</h4>
                  <p className="text-xl font-bold text-green-900">
                    ${financials.currentInvestments.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-700">7% annual return</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-1">Remaining Debt</h4>
                  <p className="text-xl font-bold text-purple-900">
                    ${financials.remainingDebt.toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-700">
                    {financials.remainingDebt === 0 ? 'Debt Free!' : `$${financials.monthlyPayment.toLocaleString()}/month`}
                  </p>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Time Elapsed</h4>
                  <p className="text-lg font-bold text-gray-900">
                    {simulationProgress.yearsElapsed} years, {simulationProgress.monthsElapsed % 12} months
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-800 mb-2">Progress to Target</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, ((simulationProgress.currentAge - personalData.age) / (Math.min(targetAge, 100) - personalData.age)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-indigo-800">
                      {Math.min(100, Math.round(((simulationProgress.currentAge - personalData.age) / (Math.min(targetAge, 100) - personalData.age)) * 100))}%
                    </span>
                  </div>
                  {simulationProgress.currentAge >= 100 && (
                    <p className="text-xs text-indigo-700 mt-1">Maximum age limit reached</p>
                  )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Savings Rate</h4>
                  <p className="text-lg font-bold text-yellow-900">10%</p>
                  <p className="text-xs text-yellow-700">of annual income</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center mt-6">
                <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </button>
                <button className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </button>
                <button 
                  onClick={() => {
                    const wasRunning = simulationState === 'running';
                    if (wasRunning) {
                      pauseSimulation();
                    }
                    setWasRunningBeforeModal(wasRunning);
                    setShowEventModal(true);
                  }}
                  className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </button>
                <button 
                  onClick={() => {
                    const wasRunning = simulationState === 'running';
                    if (wasRunning) {
                      pauseSimulation();
                    }
                    setWasRunningBeforeModal(wasRunning);
                    setShowGoalModal(true);
                  }}
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Add Goal
                </button>
                <button 
                  onClick={() => {
                    setSimulationState('setup');
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current);
                      intervalRef.current = null;
                    }
                  }}
                  className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Reset Simulation
                </button>
              </div>
            </div>

            {/* Life Events & Goals Section */}
            {(lifeEvents.length > 0 || financialGoals.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Life Events */}
                {lifeEvents.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center mb-4">
                      <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Life Events</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {lifeEvents.map((event) => (
                        <div 
                          key={event.id} 
                          className={`p-3 rounded-lg border-l-4 ${
                            event.triggered 
                              ? 'bg-gray-50 border-gray-400' 
                              : event.targetAge && simulationProgress.currentAge >= event.targetAge
                                ? 'bg-yellow-50 border-yellow-400'
                                : 'bg-blue-50 border-blue-400'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium ${
                                  event.triggered ? 'text-gray-600' : 'text-gray-800'
                                }`}>
                                  {event.name}
                                </h4>
                                {event.triggered && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <p className={`text-sm ${
                                event.triggered ? 'text-gray-500' : 'text-gray-600'
                              } mt-1`}>
                                {event.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs">
                                <span className={`px-2 py-1 rounded ${
                                  event.type === 'income' ? 'bg-green-100 text-green-700' :
                                  event.type === 'expense' ? 'bg-red-100 text-red-700' :
                                  event.type === 'debt' ? 'bg-red-100 text-red-700' :
                                  event.type === 'investment' ? 'bg-blue-100 text-blue-700' :
                                  event.type === 'career' ? 'bg-purple-100 text-purple-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {event.type}
                                </span>
                                <span className="text-gray-600">
                                  ${event.amount.toLocaleString()}
                                </span>
                                {event.targetAge && (
                                  <span className="text-gray-600">
                                    Age {event.targetAge}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setLifeEvents(prev => prev.filter(e => e.id !== event.id));
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Goals */}
                {financialGoals.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center mb-4">
                      <Target className="h-5 w-5 text-indigo-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Financial Goals</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {financialGoals.map((goal) => (
                        <div 
                          key={goal.id} 
                          className={`p-3 rounded-lg border ${
                            goal.isCompleted 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium ${
                                  goal.isCompleted ? 'text-green-800' : 'text-gray-800'
                                }`}>
                                  {goal.name}
                                </h4>
                                {goal.isCompleted && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {goal.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs">
                                <span className={`px-2 py-1 rounded ${
                                  goal.type === 'savings' ? 'bg-blue-100 text-blue-700' :
                                  goal.type === 'networth' ? 'bg-green-100 text-green-700' :
                                  goal.type === 'debt_free' ? 'bg-red-100 text-red-700' :
                                  goal.type === 'investment' ? 'bg-purple-100 text-purple-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {goal.type.replace('_', ' ')}
                                </span>
                                <span className="text-gray-600">
                                  ${goal.targetAmount.toLocaleString()}
                                </span>
                                {goal.targetAge && (
                                  <span className="text-gray-600">
                                    By Age {goal.targetAge}
                                  </span>
                                )}
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600">Progress</span>
                                  <span className={`font-medium ${
                                    goal.isCompleted ? 'text-green-600' : 'text-gray-800'
                                  }`}>
                                    {Math.round(goal.progress)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      goal.isCompleted ? 'bg-green-500' : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${Math.min(100, goal.progress)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setFinancialGoals(prev => prev.filter(g => g.id !== goal.id));
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Modals */}
        {showEventModal && <EventModal />}
        {showGoalModal && <GoalModal />}
      </div>
    );
  };

  const renderRealisticMode = () => (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentMode('selection')}
          className="flex items-center text-green-600 hover:text-green-800 mr-4"
        >
          ← Back to Options
        </button>
        <Shuffle className="h-8 w-8 text-green-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Life Simulation Game</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 bg-green-50 border-green-200 border">
        <h2 className="text-xl font-semibold mb-4 text-green-800">
          Experience Life's Financial Journey
        </h2>
        <p className="text-green-700 mb-4">
          Create a character and navigate through decades of realistic financial scenarios. 
          Random events, economic cycles, and life changes will test your financial decision-making skills.
        </p>
        
        {/* Realistic mode content will go here */}
        <div className="bg-white rounded-lg p-6">
          <p className="text-gray-600 text-center py-8">
            🎮 Game Mode interface coming up next! 
            This will include character creation and random life events.
          </p>
        </div>
      </div>
    </div>
  );

  const renderCustomMode = () => (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentMode('selection')}
          className="flex items-center text-purple-600 hover:text-purple-800 mr-4"
        >
          ← Back to Options
        </button>
        <Settings className="h-8 w-8 text-purple-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Custom Scenarios</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 bg-purple-50 border-purple-200 border">
        <h2 className="text-xl font-semibold mb-4 text-purple-800">
          Design Your Own Financial Scenarios
        </h2>
        <p className="text-purple-700 mb-4">
          Create custom economic conditions, test extreme scenarios, and compare multiple strategies side-by-side.
        </p>
        
        <div className="bg-white rounded-lg p-6">
          <p className="text-gray-600 text-center py-8">
            ⚙️ Custom Mode coming soon! 
            This will allow you to create and test custom financial scenarios.
          </p>
        </div>
      </div>
    </div>
  );

  switch (currentMode) {
    case 'personal':
      return renderPersonalMode();
    case 'realistic':
      return renderRealisticMode();
    case 'custom':
      return renderCustomMode();
    default:
      return renderSelectionPage();
  }
};
