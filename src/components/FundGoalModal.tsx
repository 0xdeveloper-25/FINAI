import { X } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { SavingsGoal, UserProfile } from '../types';
import { getCurrencySettings, formatCurrency } from '../utils';

interface FundGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  userProfile: UserProfile;
  onConfirm: (goalId: string, amount: number, sourceAccount: 'checking' | 'savings' | 'investment') => void;
}

export default function FundGoalModal({
  isOpen,
  onClose,
  goal,
  userProfile,
  onConfirm,
}: FundGoalModalProps) {
  const [amount, setAmount] = useState('');
  const [sourceAccount, setSourceAccount] = useState<'checking' | 'savings' | 'investment'>('checking');

  // Reset form when opened for a goal
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSourceAccount('checking');
    }
  }, [isOpen, goal]);

  if (!isOpen || !goal) return null;

  // Formatting utility for thousands separators ( Indonesian style, e.g. 1.000.000 )
  const formatAmountValue = (value: string) => {
    // Strip everything except digits
    let clean = value.replace(/[^0-9]/g, '');
    
    if (clean) {
      const num = parseInt(clean, 10);
      if (!isNaN(num)) {
        return num.toLocaleString('id-ID'); // uses '.' as thousands separator
      }
    }
    return '';
  };

  const parseAmountValue = (val: string): number => {
    // Strip dots (thousands separator)
    const clean = val.replace(/\./g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const getAvailableBalance = () => {
    if (sourceAccount === 'checking') return userProfile.checkingBalance;
    if (sourceAccount === 'savings') return userProfile.savingsBalance;
    return userProfile.investmentsBalance;
  };

  const formatBalanceDisplay = (val: number) => {
    return formatCurrency(val);
  };
 
   const handleSubmit = (e: FormEvent) => {
     e.preventDefault();
     const { rate } = getCurrencySettings();
     const numericAmount = parseAmountValue(amount) / rate;
     if (numericAmount <= 0) return;
 
     onConfirm(goal.id, numericAmount, sourceAccount);
   };

  return (
    <div
      id="fund-goal-modal-overlay"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="fund-goal-modal-content"
        className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 relative p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="text-center mt-2">
            <h3 className="font-display text-2xl font-bold text-[#113d29] tracking-tight">
              Fund Your Goal
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Transfer funds to your <span className="font-bold text-slate-800">{goal.title}</span>
            </p>
          </div>

          {/* Amount Box */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-[24px] p-6 text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold block mb-2">
              Enter Amount
            </span>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(formatAmountValue(e.target.value))}
              className="w-full bg-transparent text-center text-5xl font-extrabold text-[#113d29] focus:outline-none placeholder-slate-300 font-sans border-none p-0"
            />
          </div>

          {/* Source Account Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs mt-1 px-1">
              <span className="text-slate-400 font-semibold">Available Balance</span>
              <span className="font-extrabold text-slate-800">
                {formatBalanceDisplay(getAvailableBalance())}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-2 w-full bg-[#113d29] hover:bg-[#0c2e1f] active:scale-[0.98] text-white font-bold py-4 rounded-2xl shadow-lg transition-all hover:shadow-xl cursor-pointer text-sm"
          >
            Add Funds
          </button>
        </form>
      </div>
    </div>
  );
}
