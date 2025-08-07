import React from 'react';
import { PersonalFinancialData } from '../types/simulation';
import { get401kLimit } from '../utils/constants';

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
  const currentYear = new Date().getFullYear();
  const current401kLimit = get401kLimit(currentYear);

  return (
    <div className="tab-content">
      <div className="page-title">
        <h2>💰 Investment Strategy</h2>
        <p>Build wealth through smart investing and retirement planning</p>
      </div>
      
      <div className="investment-grid">
        <div className="investment-section">
          <h3>401(k) Retirement Account</h3>
          <div className="form-grid">
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
            
            <div className="form-group">
              <label>401(k) Roth Contribution (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={data.contributions401kRoth}
                onChange={(e) => setData({...data, contributions401kRoth: parseFloat(e.target.value) || 0})}
              />
              <small>Current: {data.contributions401kRoth}% of salary</small>
            </div>
            
            <div className="form-group">
              <label>Company Match (%)</label>
              <input
                type="number"
                min="0"
                max="15"
                step="0.25"
                value={data.match401k}
                onChange={(e) => setData({...data, match401k: parseFloat(e.target.value) || 0})}
              />
              <small>Employer matches up to {data.match401k}%</small>
            </div>
          </div>

          {/* 401k Contribution Chart */}
          <div className="chart-container">
            <h4>Annual 401(k) Contribution Breakdown</h4>
            <div className="chart-visual">
              {(() => {
                const annualTraditionalContribution = (data.currentSalary * data.contributions401kTraditional / 100);
                const annualRothContribution = (data.currentSalary * data.contributions401kRoth / 100);
                const totalAnnualContribution = annualTraditionalContribution + annualRothContribution;
                const companyMatchAmount = Math.min(data.currentSalary * data.match401k / 100, totalAnnualContribution);
                const totalContribution = totalAnnualContribution + companyMatchAmount;
                const limit = current401kLimit;
                
                return (
                  <div className="bar-chart">
                    <div className="bar-container">
                      <div 
                        className="bar employee-contribution" 
                        style={{height: `${Math.min(totalAnnualContribution / limit * 100, 100)}%`}}
                        title={`Your contribution: ${formatCurrency(totalAnnualContribution)}`}
                      />
                      <div 
                        className="bar company-match" 
                        style={{height: `${Math.min(companyMatchAmount / limit * 100, 100)}%`}}
                        title={`Company match: ${formatCurrency(companyMatchAmount)}`}
                      />
                    </div>
                    <div className="chart-labels">
                      <div className="chart-stats">
                        <div className="stat-item">
                          <span className="stat-color employee-contribution"></span>
                          Your traditional: {formatCurrency(annualTraditionalContribution)}
                        </div>
                        <div className="stat-item">
                          <span className="stat-color employee-roth"></span>
                          Your Roth: {formatCurrency(annualRothContribution)}
                        </div>
                        <div className="stat-item">
                          <span className="stat-color company-match"></span>
                          Company match: {formatCurrency(companyMatchAmount)}
                        </div>
                        <div className="stat-item total">
                          Total annual: {formatCurrency(totalContribution)}
                        </div>
                        <div className="stat-item limit">
                          {currentYear} limit: {formatCurrency(limit)}
                        </div>
                        {totalContribution > limit && (
                          <div className="warning">
                            ⚠️ Contribution exceeds annual limit!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="investment-section">
          <h3>Investment Portfolio</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Risk Tolerance</label>
              <select
                value={data.riskTolerance}
                onChange={(e) => setData({...data, riskTolerance: e.target.value as 'conservative' | 'moderate' | 'aggressive'})}
              >
                <option value="conservative">Conservative (Lower risk, stable returns)</option>
                <option value="moderate">Moderate (Balanced risk/reward)</option>
                <option value="aggressive">Aggressive (Higher risk, higher potential)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Monthly Investment Amount</label>
              <input
                type="number"
                min="0"
                step="10"
                value={data.monthlyInvestment}
                onChange={(e) => setData({...data, monthlyInvestment: parseFloat(e.target.value) || 0})}
              />
              <small>Additional investment beyond 401(k)</small>
            </div>
          </div>

          {/* Investment Allocation Chart */}
          <div className="allocation-chart">
            <h4>Recommended Asset Allocation</h4>
            {(() => {
              const allocations = {
                conservative: { stocks: 30, bonds: 60, cash: 10 },
                moderate: { stocks: 60, bonds: 30, cash: 10 },
                aggressive: { stocks: 80, bonds: 15, cash: 5 }
              };
              const allocation = allocations[data.riskTolerance];
              
              return (
                <div className="pie-chart-container">
                  <div className="pie-chart">
                    <div 
                      className="pie-slice stocks"
                      style={{
                        background: `conic-gradient(from 0deg, #4CAF50 0deg ${allocation.stocks * 3.6}deg, transparent ${allocation.stocks * 3.6}deg)`
                      }}
                    />
                    <div 
                      className="pie-slice bonds"
                      style={{
                        background: `conic-gradient(from ${allocation.stocks * 3.6}deg, #2196F3 0deg ${allocation.bonds * 3.6}deg, transparent ${allocation.bonds * 3.6}deg)`
                      }}
                    />
                    <div 
                      className="pie-slice cash"
                      style={{
                        background: `conic-gradient(from ${(allocation.stocks + allocation.bonds) * 3.6}deg, #FF9800 0deg ${allocation.cash * 3.6}deg, transparent ${allocation.cash * 3.6}deg)`
                      }}
                    />
                  </div>
                  <div className="allocation-legend">
                    <div className="legend-item">
                      <span className="legend-color stocks"></span>
                      Stocks: {allocation.stocks}%
                    </div>
                    <div className="legend-item">
                      <span className="legend-color bonds"></span>
                      Bonds: {allocation.bonds}%
                    </div>
                    <div className="legend-item">
                      <span className="legend-color cash"></span>
                      Cash: {allocation.cash}%
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="investment-section">
          <h3>Current Investment Performance</h3>
          <div className="portfolio-summary">
            <div className="portfolio-stat">
              <div className="stat-label">Total Portfolio Value</div>
              <div className="stat-value">{formatCurrency(data.investments)}</div>
            </div>
            <div className="portfolio-stat">
              <div className="stat-label">Cash Savings</div>
              <div className="stat-value">{formatCurrency(data.savings)}</div>
            </div>
            <div className="portfolio-stat">
              <div className="stat-label">Monthly Investment Goal</div>
              <div className="stat-value">
                {formatCurrency(data.monthlyInvestment)}
              </div>
            </div>
          </div>

          {/* Investment Recommendations */}
          <div className="investment-recommendations">
            <h4>💡 Personalized Recommendations</h4>
            <div className="recommendations-list">
              {(() => {
                const recommendations = [];
                const totalContributions = data.contributions401kTraditional + data.contributions401kRoth;
                
                if (totalContributions < data.match401k) {
                  recommendations.push({
                    type: 'warning',
                    title: 'Maximize Company Match',
                    description: `You're leaving free money on the table! Increase your 401(k) contribution to ${data.match401k}% to get the full company match.`
                  });
                }
                
                if (data.emergencyFundMonths < 3) {
                  recommendations.push({
                    type: 'info',
                    title: 'Build Emergency Fund First',
                    description: 'Focus on building 3-6 months of expenses in your emergency fund before increasing investments.'
                  });
                }
                
                if (data.debtAmount > 0 && data.debtInterestRate > 6) {
                  recommendations.push({
                    type: 'warning',
                    title: 'Consider Debt Payoff',
                    description: `With ${data.debtInterestRate}% debt interest rate, consider paying off debt before investing in taxable accounts.`
                  });
                }
                
                if (data.currentSalary > 50000 && totalContributions < 10) {
                  recommendations.push({
                    type: 'success',
                    title: 'Increase Retirement Savings',
                    description: `Consider increasing your 401(k) contribution to at least 10% for better retirement security.`
                  });
                }
                
                return recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation ${rec.type}`}>
                    <h5>{rec.title}</h5>
                    <p>{rec.description}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        <div className="investment-section">
          <h3>Investment Goals & Timeline</h3>
          <div className="goals-container">
            <div className="form-group">
              <label>Retirement Age Goal</label>
              <input
                type="number"
                min="50"
                max="80"
                value={data.retirementAge}
                onChange={(e) => setData({...data, retirementAge: parseInt(e.target.value) || 65})}
              />
            </div>
            
            <div className="form-group">
              <label>Retirement Savings Goal</label>
              <input
                type="number"
                min="100000"
                step="10000"
                value={data.retirementGoal}
                onChange={(e) => setData({...data, retirementGoal: parseInt(e.target.value) || 1000000})}
              />
            </div>
          </div>

          {/* Retirement Timeline */}
          <div className="retirement-timeline">
            <h4>Path to Retirement</h4>
            {(() => {
              const currentAge = data.age;
              const yearsToRetirement = data.retirementAge - currentAge;
              const monthlyRetirementSaving = ((data.currentSalary * (data.contributions401kTraditional + data.contributions401kRoth) / 100) + data.monthlyInvestment * 12) / 12;
              const estimatedRetirementValue = data.investments + (monthlyRetirementSaving * 12 * yearsToRetirement * 1.07); // 7% annual growth assumption
              
              return (
                <div className="timeline-stats">
                  <div className="timeline-stat">
                    <div className="stat-number">{yearsToRetirement}</div>
                    <div className="stat-label">Years to Retirement</div>
                  </div>
                  <div className="timeline-stat">
                    <div className="stat-number">{formatCurrency(monthlyRetirementSaving)}</div>
                    <div className="stat-label">Monthly Saving</div>
                  </div>
                  <div className="timeline-stat">
                    <div className="stat-number">{formatCurrency(estimatedRetirementValue)}</div>
                    <div className="stat-label">Projected Value</div>
                  </div>
                  <div className="timeline-stat">
                    <div className="stat-number">
                      {estimatedRetirementValue > data.retirementGoal ? '✅' : '⚠️'}
                    </div>
                    <div className="stat-label">Goal Status</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
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