import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartDataItem } from '../types';

interface IncomeSpendingChartProps {
  data: ChartDataItem[];
  timeframe: 'daily' | 'weekly' | 'monthly';
  weeklyAvg?: string;
  savingsRate?: string;
}

export default function IncomeSpendingChart({
  data,
  timeframe,
  weeklyAvg = "+$1,240",
  savingsRate = "32%",
}: IncomeSpendingChartProps) {
  // Custom tooltip styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md">
          <p className="font-display text-xs font-bold text-slate-900 mb-1.5">{label}</p>
          <div className="flex flex-col gap-1 font-mono text-xs">
            <span className="text-primary font-semibold">
              Income: ${payload[0]?.value?.toLocaleString()}
            </span>
            <span className="text-slate-500 font-semibold">
              Spending: ${payload[1]?.value?.toLocaleString()}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="income-spending-chart-card"
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full"
    >
      <div>
        {/* Title & Custom Legend */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg font-bold text-slate-900 tracking-tight">
            Income vs Spending
          </h3>
          <div className="flex items-center gap-4 text-xs font-semibold font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-slate-600">INCOME</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span className="text-slate-600">SPENDING</span>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              barGap={4}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Inter' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Inter' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
              <Bar
                dataKey="income"
                fill="#14422d"
                radius={[3, 3, 0, 0]}
                maxBarSize={16}
              />
              <Bar
                dataKey="spending"
                fill="#4c6455"
                radius={[3, 3, 0, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer statistics breakdown */}
      <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
        <div id="weekly-avg-col">
          <span className="font-sans text-xs text-slate-500 block mb-1">
            {timeframe === 'daily' ? 'Weekly Avg' : timeframe === 'weekly' ? 'Monthly Avg' : 'Annual Avg'}
          </span>
          <span className="font-mono text-lg font-bold text-primary">
            {weeklyAvg}
          </span>
        </div>
        <div id="savings-rate-col">
          <span className="font-sans text-xs text-slate-500 block mb-1">Savings Rate</span>
          <span className="font-mono text-lg font-bold text-slate-900">
            {savingsRate}
          </span>
        </div>
      </div>
    </div>
  );
}
