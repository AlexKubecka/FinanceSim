import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { LifeSimulator } from './pages/LifeSimulator';
import { DebtSimulator } from './pages/DebtSimulator';
import { InvestmentSimulator } from './pages/InvestmentSimulator';
import { FinancialCalculators } from './pages/FinancialCalculators';
import { LearningModules } from './pages/LearningModules';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/life-simulator" element={<LifeSimulator />} />
            <Route path="/debt-simulator" element={<DebtSimulator />} />
            <Route path="/investment-simulator" element={<InvestmentSimulator />} />
            <Route path="/calculators" element={<FinancialCalculators />} />
            <Route path="/learn" element={<LearningModules />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
