import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Calculator, BookOpen, Target, PiggyBank, LifeBuoy } from 'lucide-react';

export const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: TrendingUp },
    { path: '/life-simulator', label: 'Life Simulator', icon: LifeBuoy },
    { path: '/debt-simulator', label: 'Debt Simulator', icon: Target },
    { path: '/investment-simulator', label: 'Investment Simulator', icon: TrendingUp },
    { path: '/calculators', label: 'Calculators', icon: Calculator },
    { path: '/learn', label: 'Learn', icon: BookOpen },
  ];

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 text-primary-600">
            <PiggyBank className="h-8 w-8" />
            <span className="text-xl font-bold">FinanceSim</span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  location.pathname === path
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
