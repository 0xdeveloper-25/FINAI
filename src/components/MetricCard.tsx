import { TrendingUp, TrendingDown } from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { formatCurrency, formatSimpleCurrency, t } from '../utils';

interface MetricCardProps {
  user: UserProfile;
  transactions: Transaction[];
}

export default function MetricCard({ user, transactions }: MetricCardProps) {
  const combinedBalance = user.checkingBalance + user.savingsBalance + user.investmentsBalance;

  // Calculate comparison with last month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const currentMonthTxs = transactions.filter(t => {
    try {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === currentMonth && y === currentYear;
    } catch (e) {
      return false;
    }
  });

  const currentMonthNetChange = currentMonthTxs.reduce((sum, t) => sum + t.amount, 0);
  const lastMonthCombinedBalance = combinedBalance - currentMonthNetChange;

  let pctText = '0%';
  let isPositive = true;

  if (lastMonthCombinedBalance === 0) {
    if (combinedBalance > 0) {
      pctText = '+100%';
      isPositive = true;
    } else if (combinedBalance < 0) {
      pctText = '-100%';
      isPositive = false;
    } else {
      pctText = '0%';
      isPositive = true;
    }
  } else {
    const pct = ((combinedBalance - lastMonthCombinedBalance) / lastMonthCombinedBalance) * 100;
    isPositive = pct >= 0;
    const formattedPct = Math.abs(pct) % 1 === 0 ? Math.abs(pct).toFixed(0) : Math.abs(pct).toFixed(1);
    pctText = `${pct >= 0 ? '+' : '-'}${formattedPct}%`;
  }

  return (
    <div
      id="metric-combined-balance-card"
      className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-full shadow-xs relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

      <div>
        <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
          {t('Total Combined Balance')}
        </span>
        <div className="flex items-baseline flex-wrap gap-2">
          <span className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(combinedBalance)}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 mt-2.5 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-600" />
          )}
          <span>{pctText} {t('from last month')}</span>
        </div>
      </div>

      {/* Account breakdown divider */}
      <div className="my-6 border-t border-slate-100" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div id="account-checking-col">
          <span className="font-sans text-xs text-slate-500 block mb-1">{t('Checking')}</span>
          <span className="font-mono text-base font-bold text-slate-900">
            {formatSimpleCurrency(user.checkingBalance)}
          </span>
        </div>
        <div id="account-savings-col">
          <span className="font-sans text-xs text-slate-500 block mb-1">{t('Savings')}</span>
          <span className="font-mono text-base font-bold text-slate-900">
            {formatSimpleCurrency(user.savingsBalance)}
          </span>
        </div>
        <div id="account-investments-col">
          <span className="font-sans text-xs text-slate-500 block mb-1">{t('Investments')}</span>
          <span className="font-mono text-base font-bold text-slate-900">
            {formatSimpleCurrency(user.investmentsBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}
