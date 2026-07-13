import { X, Calendar, CreditCard, Banknote, PenLine, Shapes, ChevronDown, Plus, QrCode, ArrowRightLeft } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { Transaction, Category } from '../types';
import { getCurrencySettings } from '../utils';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, 'id' | 'time'>) => void;
  categories?: Category[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Groceries', type: 'expense' },
  { name: 'Income', type: 'income' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Dining Out', type: 'expense' },
  { name: 'Investment', type: 'income' },
  { name: 'Other', type: 'expense' }
];

const CATEGORY_ICONS: Record<string, string> = {
  Groceries: 'ShoppingCart',
  Income: 'Briefcase',
  'Dining Out': 'Coffee',
  Entertainment: 'Tv',
  Utilities: 'Zap',
  Transport: 'Car',
  Investment: 'TrendingUp',
  Other: 'Laptop',
};

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  categories = DEFAULT_CATEGORIES
}: AddTransactionModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Other');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Qris' | 'Transfer'>('Cash');

  useEffect(() => {
    // Set today's date as default (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, [isOpen]);

  useEffect(() => {
    if (categories.length > 0 && !categories.map(c => c.name).includes(category)) {
      setCategory(categories[0]?.name || 'Other');
    }
  }, [categories, category]);

  if (!isOpen) return null;

  const formatAmountValue = (value: string) => {
    // Strip everything except digits and comma
    let clean = value.replace(/[^0-9,]/g, '');
    
    // Ensure only one comma exists for decimal
    const parts = clean.split(',');
    let integerPart = parts[0];
    let decimalPart = parts.slice(1).join('');
    
    // Format integerPart with thousands separator '.'
    if (integerPart) {
      const num = parseInt(integerPart, 10);
      if (!isNaN(num)) {
        integerPart = num.toLocaleString('id-ID'); // uses '.' as thousands separator
      } else {
        integerPart = '';
      }
    }
    
    // Combine back
    if (parts.length > 1) {
      return `${integerPart},${decimalPart.slice(0, 2)}`; // limit to 2 decimal places
    }
    return integerPart;
  };

  const parseAmountValue = (val: string): number => {
    // Strip dots (thousands separator)
    let clean = val.replace(/\./g, '');
    // Replace comma with dot (decimal separator)
    clean = clean.replace(/,/g, '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const { rate } = getCurrencySettings();
    const numericAmount = parseAmountValue(amount) / rate;
    if (numericAmount <= 0) return;

    // Find if category is of type 'income'
    const selectedCatObj = categories.find(c => c.name === category);
    const isIncome = selectedCatObj ? selectedCatObj.type === 'income' : category === 'Income';
    const finalAmount = isIncome ? Math.abs(numericAmount) : -Math.abs(numericAmount);

    // Format payment method text for display
    let formattedMethod = paymentMethod as string;
    if (paymentMethod === 'Qris') {
      formattedMethod = 'Qris';
    } else if (paymentMethod === 'Transfer') {
      formattedMethod = 'Transfer';
    } else if (paymentMethod === 'Cash') {
      formattedMethod = 'Cash';
    }

    onAdd({
      title,
      amount: finalAmount,
      category,
      date,
      iconName: CATEGORY_ICONS[category] || 'ShoppingCart',
      method: formattedMethod,
    });

    // Reset form
    setTitle('');
    setAmount('');
    setCategory(categories[0]?.name || 'Other');
    setPaymentMethod('Cash');
    onClose();
  };

  return (
    <div
      id="add-transaction-modal-overlay"
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div
        id="add-transaction-modal-content"
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300 p-6 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <h3 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">Add Transaction</h3>
          <button
            id="close-transaction-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Amount Box */}
          <div className="bg-[#f5f5f5] p-5 rounded-2xl flex flex-col items-center justify-center border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Enter Amount</span>
            <div className="flex items-center justify-center w-full">
              <input
                id="transaction-amount"
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(formatAmountValue(e.target.value))}
                className="w-full bg-transparent text-center text-4xl md:text-5xl font-extrabold text-slate-900 focus:outline-none focus:ring-0 placeholder-slate-400 font-sans border-none p-0"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="transaction-title" className="font-sans text-sm font-bold text-slate-800">
              Description
            </label>
            <div className="relative">
              <PenLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="transaction-title"
                type="text"
                required
                placeholder="What was this for?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#fcfcfc] text-sm text-slate-900 border border-slate-200 focus:border-slate-400 focus:bg-white pl-11 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Category & Date Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="flex flex-col gap-2">
              <label htmlFor="transaction-category" className="font-sans text-sm font-bold text-slate-800">
                Category
              </label>
              <div className="relative">
                <Shapes className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <select
                  id="transaction-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#fcfcfc] text-sm text-slate-900 border border-slate-200 focus:border-slate-400 focus:bg-white pl-11 pr-10 py-3 rounded-xl outline-none transition-all appearance-none font-medium cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-2">
              <label htmlFor="transaction-date" className="font-sans text-sm font-bold text-slate-800">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  id="transaction-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#fcfcfc] text-sm text-slate-900 border border-slate-200 focus:border-slate-400 focus:bg-white pl-11 pr-4 py-3 rounded-xl outline-none transition-all font-medium cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-2.5">
            <span className="font-sans text-sm font-bold text-slate-800">Payment Method</span>
            <div className="grid grid-cols-3 gap-3">
              {/* Cash Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-3.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'Cash'
                    ? 'bg-[#d1f2dd] border-2 border-[#107c41] text-[#113d29] font-bold shadow-xs'
                    : 'bg-[#f5f5f5] border border-transparent hover:bg-slate-100 text-slate-600 font-medium'
                }`}
              >
                <Banknote className="w-4.5 h-4.5" />
                <span className="text-xs">Cash</span>
              </button>

              {/* Qris Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('Qris')}
                className={`py-3.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'Qris'
                    ? 'bg-[#d1f2dd] border-2 border-[#107c41] text-[#113d29] font-bold shadow-xs'
                    : 'bg-[#f5f5f5] border border-transparent hover:bg-slate-100 text-slate-600 font-medium'
                }`}
              >
                <QrCode className="w-4.5 h-4.5" />
                <span className="text-xs">QRIS</span>
              </button>

              {/* Transfer Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('Transfer')}
                className={`py-3.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'Transfer'
                    ? 'bg-[#d1f2dd] border-2 border-[#107c41] text-[#113d29] font-bold shadow-xs'
                    : 'bg-[#f5f5f5] border border-transparent hover:bg-slate-100 text-slate-600 font-medium'
                }`}
              >
                <ArrowRightLeft className="w-4.5 h-4.5" />
                <span className="text-xs">Transfer</span>
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <button
              type="button"
              id="cancel-transaction-modal-btn"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all text-sm cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-transaction-modal-btn"
              className="py-3 px-4 rounded-xl bg-[#113d29] hover:bg-[#0c2e1f] text-white font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
