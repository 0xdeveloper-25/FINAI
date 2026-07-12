import { ShoppingCart, Briefcase, Coffee, Tv, Laptop, TrendingUp, Zap, ArrowRight, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, t } from '../utils';

interface RecentActivityProps {
  transactions: Transaction[];
  onViewAllClick: () => void;
  onDeleteTransaction?: (id: string) => void;
}

const ICON_MAP: Record<string, any> = {
  ShoppingCart,
  Briefcase,
  Coffee,
  Tv,
  Laptop,
  TrendingUp,
  Zap,
};

export default function RecentActivity({
  transactions,
  onViewAllClick,
  onDeleteTransaction,
}: RecentActivityProps) {
  const getIcon = (name: string) => {
    const Component = ICON_MAP[name];
    return Component || ShoppingCart;
  };

  const displayFormattedCurrency = (val: number) => {
    return formatCurrency(val, { showSign: true });
  };

  return (
    <div
      id="recent-activity-card"
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-slate-900 tracking-tight">
            {t('Recent Activity')}
          </h3>
          <button
            id="view-all-transactions-btn"
            onClick={onViewAllClick}
            className="font-sans text-xs font-semibold text-primary hover:text-secondary flex items-center gap-1 hover:underline transition-all cursor-pointer"
          >
            <span>{t('View All')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of items */}
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="font-sans text-sm text-slate-500 mb-1">No transactions match your search</p>
            <p className="font-sans text-xs text-slate-400">Try clearing filters or adding a new transaction.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 flex flex-col">
            {transactions.map((t) => {
              const Icon = getIcon(t.iconName);
              const isIncome = t.amount > 0;

              return (
                <div
                  key={t.id}
                  id={`transaction-row-${t.id}`}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Icon container */}
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 shrink-0 border border-slate-100">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col">
                      <span className="font-sans text-sm font-semibold text-slate-900 tracking-tight">
                        {t.title}
                      </span>
                      <span className="font-sans text-xs text-slate-500 font-normal mt-0.5">
                        {t.category} • <span className="text-slate-400">{t.time}</span>
                      </span>
                    </div>
                  </div>

                  {/* Value and controls */}
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-mono text-sm font-bold ${
                        isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {displayFormattedCurrency(t.amount)}
                    </span>

                    {/* Delete action */}
                    {onDeleteTransaction && (
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
