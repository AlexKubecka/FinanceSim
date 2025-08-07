import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface InvestmentChartProps {
  chartData: Array<{
    year: number;
    'Total Balance': number;
    'Total Contributions': number;
    'Investment Earnings': number;
  }>;
  formatCurrency: (amount: number) => string;
}

export const InvestmentChart: React.FC<InvestmentChartProps> = React.memo(({
  chartData,
  formatCurrency
}) => {
  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4">Investment Growth Over Time</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip 
              formatter={(value, name) => [formatCurrency(Number(value)), name]}
              labelFormatter={(year) => `Year ${year}`}
            />
            <Area 
              type="monotone" 
              dataKey="Total Contributions" 
              stackId="1"
              stroke="#3b82f6" 
              fill="url(#colorContributions)"
            />
            <Area 
              type="monotone" 
              dataKey="Investment Earnings" 
              stackId="1"
              stroke="#10b981" 
              fill="url(#colorBalance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
