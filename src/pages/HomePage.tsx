import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, Calculator, BookOpen, DollarSign, Shield, LifeBuoy } from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: LifeBuoy,
      title: 'Life Simulator',
      description: 'Plan your entire financial journey and see how major life events impact your wealth',
      link: '/life-simulator',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: Target,
      title: 'Debt Payoff Simulator',
      description: 'Visualize different debt payoff strategies and see how much you can save',
      link: '/debt-simulator',
      color: 'bg-red-50 text-red-600'
    },
    {
      icon: TrendingUp,
      title: 'Investment Growth Simulator',
      description: 'See how compound interest can grow your investments over time',
      link: '/investment-simulator',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Calculator,
      title: 'Financial Calculators',
      description: 'Emergency fund, retirement, and loan calculators',
      link: '/calculators',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: BookOpen,
      title: 'Learning Modules',
      description: 'Interactive lessons on budgeting, investing, and financial planning',
      link: '/learn',
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl text-white">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-6">Master Your Financial Future</h1>
          <p className="text-xl mb-8 opacity-90">
            Learn smart money habits through interactive simulations and calculators. 
            Discover the power of staying debt-free and investing wisely.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/debt-simulator" className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Debt Simulation
            </Link>
            <Link to="/investment-simulator" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors">
              Try Investment Simulator
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Everything You Need to Learn Finance
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="card hover:shadow-xl transition-shadow duration-300 group"
            >
              <div className={`p-3 rounded-lg ${feature.color} w-fit mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-white rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Why Financial Education Matters
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-green-50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Build Wealth</h3>
            <p className="text-gray-600">
              Learn how compound interest and smart investing can multiply your money over time
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Avoid Debt Traps</h3>
            <p className="text-gray-600">
              Understand the true cost of debt and learn strategies to pay it off efficiently
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Achieve Goals</h3>
            <p className="text-gray-600">
              Set and track financial goals with our interactive planning tools
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
