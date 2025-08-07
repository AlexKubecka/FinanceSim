import React from 'react';
import { PersonalFinancialData } from '../types/simulation';

interface InvestmentsPageProps {
  data: PersonalFinancialData;
  setData: React.Dispatch<React.SetStateAction<PersonalFinancialData>>;
  navigate: (page: string) => void;
  formatCurrency: (amount: number) => string;
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ 
  data, 
  setData, 
  navigate, 
  formatCurrency 
}) => {
  return (
    <div className="tab-content">
      <div className="page-title">
        <h2>💰 Investment Strategy</h2>
        <p>Simplified test version - Build wealth through smart investing and retirement planning</p>
      </div>
      
      <div className="form-group">
        <label>401(k) Traditional Contribution (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={data.contributions401kTraditional}
          onChange={(e) => setData({...data, contributions401kTraditional: parseFloat(e.target.value) || 0})}
        />
        <small>Current: {data.contributions401kTraditional}% of salary</small>
      </div>

      <div className="page-navigation">
        <button onClick={() => navigate('expenses')} className="nav-button">
          ← Back to Expenses
        </button>
        <button onClick={() => navigate('dashboard')} className="nav-button primary">
          Continue to Dashboard →
        </button>
      </div>
    </div>
  );
};

export default InvestmentsPage;
