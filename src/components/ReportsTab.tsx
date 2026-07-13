import { useState, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  Download, 
  FileText, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp,
  ChevronDown,
  Printer,
  X,
  Check,
  Award,
  DollarSign
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Transaction, SavingsGoal, Category, UserProfile } from '../types';
import { formatCurrency, isZenModeEnabled, t } from '../utils';

interface ReportsTabProps {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  categories: Category[];
  userProfile: UserProfile;
}

export default function ReportsTab({ transactions, savingsGoals, categories, userProfile }: ReportsTabProps) {
  const [timeframe, setTimeframe] = useState('Last 6 Months');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // States for historical mutation downloads
  const [selectedHistMonthKey, setSelectedHistMonthKey] = useState('');
  const [exportModalType, setExportModalType] = useState<'general' | 'historical'>('general');
  const [historicalModalMonthKey, setHistoricalModalMonthKey] = useState('');
  const [autoTriggerPrint, setAutoTriggerPrint] = useState(false);

  useEffect(() => {
    if (isExportModalOpen && autoTriggerPrint) {
      const timer = setTimeout(() => {
        window.print();
        setAutoTriggerPrint(false);
      }, 400); // Allow modal to fully render before print trigger
      return () => clearTimeout(timer);
    }
  }, [isExportModalOpen, autoTriggerPrint]);

  const currentLang = typeof window !== 'undefined' ? localStorage.getItem('finai_display_language') || 'en' : 'en';
  const localeStr = currentLang === 'id' ? 'id-ID' : currentLang === 'es' ? 'es-ES' : currentLang === 'fr' ? 'fr-FR' : 'en-US';

  // Extract unique months from transactions
  const availableMonths = Array.from(new Set(
    transactions
      .map(t => {
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return null;
        return JSON.stringify({
          year: d.getFullYear(),
          month: d.getMonth(),
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleString(localeStr, { month: 'long', year: 'numeric' })
        });
      })
      .filter((item): item is string => item !== null)
  )).map(str => JSON.parse(str) as { year: number; month: number; key: string; label: string })
    .sort((a, b) => b.key.localeCompare(a.key)); // Newest first

  const activeHistKey = selectedHistMonthKey || availableMonths[0]?.key || '';
  const selectedMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return false;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return key === activeHistKey;
  });

  const handleDownloadCSV = (monthKey: string, label: string) => {
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === monthKey;
    });

    if (monthTx.length === 0) {
      alert("No transactions found for this month.");
      return;
    }

    // CSV headers
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
    const rows = monthTx.map(t => [
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.category || 'Other').replace(/"/g, '""')}"`,
      t.amount,
      t.amount < 0 ? 'Expense' : 'Income'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Transaction_Statement_${label.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Determine reference date (last transaction date or today)
  const txDates = transactions
    .map(t => new Date(t.date).getTime())
    .filter(t => !isNaN(t));
  const referenceDate = txDates.length > 0 ? new Date(Math.max(...txDates)) : new Date();

  // Protect against invalid reference date
  if (isNaN(referenceDate.getTime())) {
    referenceDate.setTime(new Date().getTime());
  }

  // 2. Map timeframe to months count
  let monthsCount = 6;
  if (timeframe === 'Last 3 Months') monthsCount = 3;
  else if (timeframe === 'Last 6 Months') monthsCount = 6;
  else if (timeframe === 'Last Year') monthsCount = 12;
  else if (timeframe === 'All Time') monthsCount = 12; // Visual span limit

  // 3. Generate monthly range buckets
  const getMonthsRange = (refDate: Date, count: number) => {
    const list = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      list.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        name: d.toLocaleString('en-US', { month: 'short' }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      });
    }
    return list;
  };

  const currentBuckets = getMonthsRange(referenceDate, monthsCount);
  const currentKeys = currentBuckets.map(b => b.key);

  const getTxKey = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Previous buckets of equal length for financial MoM/PoP comparisons
  const prevReferenceDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - monthsCount, 1);
  const previousBuckets = getMonthsRange(prevReferenceDate, monthsCount);
  const previousKeys = previousBuckets.map(b => b.key);

  // Filter transactions
  const currentTx = transactions.filter(t => currentKeys.includes(getTxKey(t.date)));
  const previousTx = transactions.filter(t => previousKeys.includes(getTxKey(t.date)));

  // Calculate stats
  const totalSpending = currentTx.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
  const prevSpending = previousTx.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
  const spendingChange = prevSpending > 0 ? ((totalSpending - prevSpending) / prevSpending) * 100 : 0;

  const totalIncome = currentTx.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
  const netSavings = totalIncome - totalSpending;
  const prevIncome = previousTx.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
  const prevNetSavings = prevIncome - prevSpending;
  const savingsChange = Math.abs(prevNetSavings) > 0 ? ((netSavings - prevNetSavings) / Math.abs(prevNetSavings)) * 100 : 0;

  // Budget consumed calculation (relative to the latest active month)
  const activeMonthBucket = currentBuckets[currentBuckets.length - 1];
  const activeMonthTx = currentTx.filter(t => getTxKey(t.date) === activeMonthBucket?.key);
  const activeMonthExpenses = activeMonthTx.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
  const budgetLimit = 5000;
  const budgetConsumedPct = Math.min(100, Math.round((activeMonthExpenses / budgetLimit) * 100)) || 72;

  // Status for Budget Card
  let projectionStatus = 'On Track';
  if (budgetConsumedPct < 50) projectionStatus = 'Excellent';
  else if (budgetConsumedPct <= 80) projectionStatus = 'On Track';
  else if (budgetConsumedPct <= 100) projectionStatus = 'Nearing Limit';
  else projectionStatus = 'Over Budget';

  // 4. Line Chart Cash Flow Data
  const cashFlowData = currentBuckets.map(b => {
    const monthTx = currentTx.filter(t => getTxKey(t.date) === b.key);
    const income = monthTx.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
    const expenses = monthTx.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
    return {
      name: b.name,
      income,
      expenses,
      key: b.key
    };
  });

  const hasAnyChartData = cashFlowData.some(d => d.income > 0 || d.expenses > 0);
  const finalCashFlowData = hasAnyChartData
    ? cashFlowData
    : [
        { name: 'Jan', income: 3800, expenses: 2800, key: 'Jan' },
        { name: 'Feb', income: 4500, expenses: 2600, key: 'Feb' },
        { name: 'Mar', income: 4800, expenses: 2400, key: 'Mar' },
        { name: 'Apr', income: 4200, expenses: 3100, key: 'Apr' },
        { name: 'May', income: 3900, expenses: 3700, key: 'May' },
        { name: 'Jun', income: 5200, expenses: 2900, key: 'Jun' },
      ].slice(-monthsCount);

  // 5. Category breakdown
  const categoryTotals: { [key: string]: number } = {};
  currentTx.forEach(t => {
    if (t.amount < 0) {
      const cat = t.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
    }
  });

  const sortedCategories = Object.keys(categoryTotals).map(cat => ({
    label: cat,
    val: categoryTotals[cat],
  })).sort((a, b) => b.val - a.val);

  const maxCategoryVal = sortedCategories.length > 0 ? Math.max(...sortedCategories.map(c => c.val)) : 1;

  const getBarColor = (index: number) => {
    const colors = ['bg-[#113d29]', 'bg-[#4c6455]', 'bg-[#769080]', 'bg-[#a1bfa9]'];
    return colors[index % colors.length];
  };

  const categoriesData = sortedCategories.map((c, idx) => ({
    label: c.label,
    val: c.val,
    pct: Math.round((c.val / maxCategoryVal) * 100),
    color: getBarColor(idx)
  }));

  const finalCategoriesData = categoriesData.length > 0
    ? categoriesData.slice(0, 4)
    : [
        { label: 'Housing & Utilities', val: 2100.00, pct: 65, color: 'bg-[#113d29]' },
        { label: 'Food & Dining', val: 845.20, pct: 35, color: 'bg-[#4c6455]' },
        { label: 'Transportation', val: 420.00, pct: 20, color: 'bg-[#769080]' },
        { label: 'Entertainment', val: 312.15, pct: 10, color: 'bg-[#a1bfa9]' },
      ];

  // 6. Removed FinAI Insight and Trend Anomalies logic as requested

  // 8. Custom Tooltip for Line Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg font-sans">
          <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">
            {payload[0]?.payload.name} Flow
          </p>
          <div className="flex flex-col gap-1 font-mono text-xs">
            <span className="text-[#113d29] font-bold flex items-center gap-1">
              ● Income: {formatCurrency(payload[0]?.value || 0)}
            </span>
            <span className="text-slate-500 font-bold flex items-center gap-1">
              ● Expenses: {formatCurrency(payload[1]?.value || 0)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Trigger simulated PDF report generation
  const handleExportPDF = () => {
    setExportModalType('general');
    setIsExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setIsExportModalOpen(true);
          return 100;
        }
        return p + 20;
      });
    }, 150);
  };

  return (
    <div id="tab-reports" className="flex flex-col gap-6 animate-in fade-in duration-300 font-sans pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('Spending Overview')}
          </h1>
          <p className="font-sans text-sm text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
            {t('A minimalist breakdown of your financial flows. Your spending')} {spendingChange < 0 ? t('decreased') : t('increased')} {t('by')} {Math.abs(Math.round(spendingChange))}% {t('compared to the previous period.')}
          </p>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          {/* Timeframe Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
              className="px-4 py-3 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{t(timeframe)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            
            {isTimeframeOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-35 animate-in fade-in slide-in-from-top-1 duration-150">
                {['Last 3 Months', 'Last 6 Months', 'Last Year', 'All Time'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setTimeframe(option);
                      setIsTimeframeOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                      timeframe === option ? 'text-[#113d29] bg-emerald-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t(option)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Total Spending */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">
              {t('Total Spending')}
            </span>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(totalSpending)}
            </p>
          </div>
          {transactions.length > 0 && (
            <div className={`flex items-center gap-1 font-bold text-xs mt-3 ${
              prevSpending > 0 
                ? (spendingChange <= 0 ? 'text-emerald-600' : 'text-rose-500') 
                : 'text-slate-500'
            }`}>
              {prevSpending > 0 ? (
                spendingChange <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />
              ) : null}
              <span>
                {prevSpending > 0 
                  ? `${Math.abs(Math.round(spendingChange))}% ${t('vs. prev. period')}` 
                  : t('No previous data to compare')}
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Net Savings */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">
              {t('Net Savings')}
            </span>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(netSavings)}
            </p>
          </div>
          {transactions.length > 0 && (
            <div className={`flex items-center gap-1 font-bold text-xs mt-3 ${
              Math.abs(prevNetSavings) > 0 
                ? (savingsChange >= 0 ? 'text-emerald-600' : 'text-rose-500') 
                : 'text-slate-500'
            }`}>
              {Math.abs(prevNetSavings) > 0 ? (
                savingsChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />
              ) : null}
              <span>
                {Math.abs(prevNetSavings) > 0 
                  ? `${Math.abs(Math.round(savingsChange))}% ${t('vs. prev. period')}` 
                  : t('No previous data to compare')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Middle Row: Chart Section */}
      {isZenModeEnabled() ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{t('Zen Mode is Active')}</h4>
            <p className="text-xs text-slate-500 font-semibold">{t('Aggressive charts and complex visualization models have been suspended for a cleaner view.')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-extrabold text-slate-900 tracking-tight">
              {t('Cash Flow Analytics')}
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              {t('Income vs. Expenses across the current semester')}
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600 self-start sm:self-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#113d29]" />
              <span>{t('Income')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
              <span>{t('Expenses')}</span>
            </div>
          </div>
        </div>

        {/* Line Chart Component */}
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">{t('No cash flow analytics data available')}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1 max-w-[280px]">
              {t('Your income vs. expenses chart will be displayed here once you start adding transactions.')}
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={finalCashFlowData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold', fontFamily: 'Inter' }}
                  dy={10}
                />
                <YAxis hide={true} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f1f5f9', strokeWidth: 1.5 }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#113d29"
                  strokeWidth={2.5}
                  dot={{ fill: '#113d29', r: 4, strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={2.5}
                  dot={{ fill: '#94a3b8', r: 4, strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      )}

      {/* Bottom Layout Row: Category Breakdown + FinAI Insight & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Spending by Category (2/3 Width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-display text-lg font-extrabold text-slate-900 tracking-tight mb-5">
              {t('Spending by Category')}
            </h3>
            
            {transactions.filter(t => t.amount < 0).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">{t('No spending data available')}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-1 max-w-[280px]">
                  {t('Your category spending breakdown will appear here once you record expenses.')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {finalCategoriesData.map((item) => (
                  <div key={item.label} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{t(item.label)}</span>
                      <span className="font-mono text-slate-900">{formatCurrency(item.val)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Historical Mutation Downloader (1/3 Width) */}
        <div className="flex flex-col gap-5">
          {/* Card 2: Historical Mutation Downloader */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col">
            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-[#113d29] pb-3 border-b border-slate-100 flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>{t('Historical Mutations')}</span>
            </h4>
            
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {t('Select Billing Month')}
                </label>
                <select
                  value={activeHistKey}
                  onChange={(e) => setSelectedHistMonthKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113d29]/20 focus:border-[#113d29] transition-all"
                >
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                  {availableMonths.length === 0 && (
                    <option value="">{t('No history available')}</option>
                  )}
                </select>
              </div>

              {/* Mini Quick-stats for the selected month */}
              {activeHistKey && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                    <span>{t('Total Transactions:')}</span>
                    <span className="font-mono text-slate-800 font-bold">{selectedMonthTransactions.length} {t('items')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                    <span>{t('Net Cashflow:')}</span>
                    <span className={`font-mono font-bold ${
                      selectedMonthTransactions.reduce((acc, t) => acc + t.amount, 0) >= 0 
                        ? 'text-emerald-700' 
                        : 'text-rose-600'
                    }`}>
                      {formatCurrency(selectedMonthTransactions.reduce((acc, t) => acc + t.amount, 0))}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    if (!activeHistKey) return;
                    setExportModalType('historical');
                    setHistoricalModalMonthKey(activeHistKey);
                    setIsExportModalOpen(true);
                  }}
                  disabled={!activeHistKey}
                  className="w-full px-3 py-2.5 bg-[#113d29] hover:bg-[#0c2e1f] disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('View PDF')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* PDF Export Modal / Statement Viewer */}
      {isExportModalOpen && (() => {
        const isHistoricalModal = exportModalType === 'historical' && historicalModalMonthKey;
        
        const modalTx = isHistoricalModal
          ? transactions.filter(t => {
              const d = new Date(t.date);
              if (isNaN(d.getTime())) return false;
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              return key === historicalModalMonthKey;
            })
          : currentTx;

        const modalIncome = modalTx.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
        const modalSpending = modalTx.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
        const modalNetSavings = modalIncome - modalSpending;

        // Modal Category Breakdown
        const modalCategoryTotals: { [key: string]: number } = {};
        modalTx.forEach(t => {
          if (t.amount < 0) {
            const cat = t.category || 'Other';
            modalCategoryTotals[cat] = (modalCategoryTotals[cat] || 0) + Math.abs(t.amount);
          }
        });

        const modalSortedCategories = Object.keys(modalCategoryTotals).map(cat => ({
          label: cat,
          val: modalCategoryTotals[cat],
        })).sort((a, b) => b.val - a.val);

        const modalMaxCategoryVal = modalSortedCategories.length > 0 ? Math.max(...modalSortedCategories.map(c => c.val)) : 1;

        const modalCategoriesData = modalSortedCategories.map((c) => ({
          label: c.label,
          val: c.val,
          pct: Math.round((c.val / modalMaxCategoryVal) * 100),
        }));

        const finalModalCategoriesData = modalCategoriesData.length > 0
          ? modalCategoriesData
          : [
              { label: 'Housing & Utilities', val: 2100.00, pct: 65 },
              { label: 'Food & Dining', val: 845.20, pct: 35 },
              { label: 'Transportation', val: 420.00, pct: 20 },
              { label: 'Entertainment', val: 312.15, pct: 10 },
            ];

        const modalLabel = isHistoricalModal
          ? availableMonths.find(m => m.key === historicalModalMonthKey)?.label || 'Selected Month'
          : timeframe;

        return createPortal(
          <div
            id="export-pdf-overlay"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fade-in"
            onClick={() => setIsExportModalOpen(false)}
          >
            <div
              id="export-pdf-content"
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-800" />
                  <h3 className="font-display text-lg font-extrabold text-slate-800">
                    {isHistoricalModal ? t('Historical Transaction Statement') : t('Financial Statement Report')}
                  </h3>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Document Content to print */}
              <div id="printable-statement-area" className="p-8 flex-1 overflow-y-auto flex flex-col gap-6 font-sans">
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div>
                    <h4 className="font-display text-2xl font-extrabold text-emerald-950 tracking-tight">FINAI</h4>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{t('Personal Finance Advisor')}</p>
                  </div>
                  <div className="text-right">
                    <h5 className="text-xs font-bold text-slate-800">{t('STATEMENT OF ACCOUNT')}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">{t('Period')}: {modalLabel}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t('Generated')}: {new Date().toLocaleDateString(localeStr)} {t('at')} {new Date().toLocaleTimeString(localeStr)}</p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">{t('Prepared For')}</span>
                    <p className="font-bold text-slate-800">{userProfile?.name || 'User Name'}</p>
                    <p className="text-slate-500 font-medium mt-0.5">{userProfile?.email || 'email@example.com'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">{t('Account Tier')}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#eaf5ef] text-emerald-800 border border-emerald-100">
                      {t(userProfile?.tier || 'Premium Member')}
                    </span>
                  </div>
                </div>

                {/* Statement summary */}
                <div>
                  <h6 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-2.5">{t('Financial Metrics Summary')}</h6>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                      <span className="text-[10px] text-slate-400 font-bold block">{t('Total Cash Inflow')}</span>
                      <span className="text-sm font-extrabold text-emerald-700 block mt-1">+{formatCurrency(modalIncome)}</span>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                      <span className="text-[10px] text-slate-400 font-bold block">{t('Total Cash Outflow')}</span>
                      <span className="text-sm font-extrabold text-rose-600 block mt-1">-{formatCurrency(modalSpending)}</span>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                      <span className="text-[10px] text-slate-400 font-bold block">{t('Net Cashflow')}</span>
                      <span className={`text-sm font-extrabold block mt-1 ${modalNetSavings >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                        {modalNetSavings >= 0 ? `+${formatCurrency(modalNetSavings)}` : `-${formatCurrency(Math.abs(modalNetSavings))}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Categorized spending breakdown */}
                {modalSpending > 0 && (
                  <div>
                    <h6 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">{t('Spending by Category Breakdown')}</h6>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 font-extrabold text-slate-700">{t('Category')}</th>
                            <th className="p-3 font-extrabold text-slate-700 text-right">{t('Total Amount')}</th>
                            <th className="p-3 font-extrabold text-slate-700 text-right">{t('Proportion')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finalModalCategoriesData.map((cat, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0">
                              <td className="p-3 font-bold text-slate-800">{t(cat.label)}</td>
                              <td className="p-3 font-mono font-bold text-slate-700 text-right">{formatCurrency(cat.val)}</td>
                              <td className="p-3 text-slate-500 font-semibold text-right">{cat.pct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Individual Transaction Mutations Table (only for historical single-month view) */}
                {isHistoricalModal && (
                  <div>
                    <h6 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">{t('Transaction Details (Account Activity)')}</h6>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
                            <th className="p-2.5 font-extrabold text-slate-700">{t('Date')}</th>
                            <th className="p-2.5 font-extrabold text-slate-700">{t('Description')}</th>
                            <th className="p-2.5 font-extrabold text-slate-700">{t('Category')}</th>
                            <th className="p-2.5 font-extrabold text-slate-700 text-right">{t('Amount')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalTx.map((tx, idx) => (
                            <tr key={tx.id || idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                               <td className="p-2.5 text-slate-500 font-medium">
                                 {new Date(tx.date).toLocaleDateString(localeStr, { month: 'short', day: 'numeric', year: 'numeric' })}
                               </td>
                               <td className="p-2.5 font-bold text-slate-800">{tx.title}</td>
                               <td className="p-2.5 text-slate-600 font-semibold">{tx.category ? t(tx.category) : 'Other'}</td>
                               <td className={`p-2.5 font-mono font-bold text-right ${tx.amount < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                 {tx.amount < 0 ? `-${formatCurrency(Math.abs(tx.amount))}` : `+${formatCurrency(tx.amount)}`}
                               </td>
                             </tr>
                           ))}
                          {modalTx.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-slate-400 font-semibold">
                                {t('No transaction history recorded for this period.')}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer Notice */}
                <div className="border-t border-slate-200 pt-5 text-center text-[10px] text-slate-400 font-medium leading-relaxed">
                  {t('This document is a certified summary of personal financial statements processed by FINAI. Information is prepared for reference purposes and is not formal legal tax auditing advice.')}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {t('Close')}
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#113d29] hover:bg-[#0c2e1f] rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('Download PDF')}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
