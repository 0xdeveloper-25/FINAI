import { X, Target, DollarSign, Calendar, Tag } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { SavingsGoal } from '../types';
import { getCurrencySettings } from '../utils';

interface AddSavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: Omit<SavingsGoal, 'id'>) => void;
  categories: string[];
}

export default function AddSavingsGoalModal({ isOpen, onClose, onAdd, categories }: AddSavingsGoalModalProps) {
  const { symbol } = getCurrencySettings();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState(categories && categories.length > 0 ? categories[0] : 'Travel');
  const [description, setDescription] = useState('');
  const [isTargetFocused, setIsTargetFocused] = useState(false);
  const [priority, setPriority] = useState('MEDIUM');

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

  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 6); // Default 6 months from now
    setDeadline(defaultDate.toISOString().split('T')[0]);
  }, [isOpen]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !target) return;

    const { rate } = getCurrencySettings();
    const parsedTarget = parseAmountValue(target) / rate;
    const parsedCurrent = current ? (parseAmountValue(current) / rate) : 0;

    onAdd({
      title,
      target: parsedTarget,
      current: parsedCurrent,
      deadline,
      category,
      description: description || 'No description provided',
      priority: priority,
    });

    setTitle('');
    setTarget('');
    setCurrent('');
    setCategory('Travel');
    setDescription('');
    setPriority('MEDIUM');
    onClose();
  };

  return (
    <div
      id="add-goal-modal-overlay"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="add-goal-modal-content"
        className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-slate-100 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transform transition-all animate-in fade-in zoom-in-95 duration-200 relative p-8 max-h-[90vh]"
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="text-center mt-2">
            <h3 className="font-display text-2xl font-bold text-[#113d29] tracking-tight">
              Create Savings Goal
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Set up your next big milestone or savings target
            </p>
          </div>

          {/* Amount Box (Target) */}
          <div className="bg-[#f5f5f5] p-5 rounded-[24px] flex flex-col items-center justify-center border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enter Target Amount</span>
            <div className="flex items-center justify-center w-full">
              <input
                id="goal-target"
                type="text"
                inputMode="numeric"
                required
                placeholder={`${symbol}0`}
                value={isTargetFocused ? target : (target ? `${symbol}${target}` : '')}
                onChange={(e) => setTarget(formatAmountValue(e.target.value))}
                onFocus={() => setIsTargetFocused(true)}
                onBlur={() => setIsTargetFocused(false)}
                className="w-full bg-transparent text-center text-4xl md:text-5xl font-extrabold text-[#113d29] focus:outline-none focus:ring-0 placeholder-slate-300 font-sans border-none p-0"
              />
            </div>
          </div>

          {/* Already Saved Amount (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-current" className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              Already Saved (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{symbol}</span>
              <input
                id="goal-current"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={current}
                onChange={(e) => setCurrent(formatAmountValue(e.target.value))}
                className="w-full bg-white text-sm text-slate-700 border border-slate-200 focus:border-slate-400 pl-8 pr-4 py-3 rounded-xl outline-none transition-all font-bold"
              />
            </div>
          </div>

          {/* Goal Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-title" className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              Goal Title
            </label>
            <input
              id="goal-title"
              type="text"
              required
              placeholder="e.g., Japan Trip, Emergency Fund"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white text-sm text-slate-700 border border-slate-200 focus:border-slate-400 px-4 py-3 rounded-xl outline-none transition-all font-bold"
            />
          </div>



          {/* Grid for Select elements */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal-category" className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                Category
              </label>
              <div className="relative">
                <select
                  id="goal-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white text-xs text-slate-700 border border-slate-200 focus:border-slate-400 pl-3 pr-8 py-3 rounded-xl outline-none transition-all appearance-none font-bold cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </span>
              </div>
            </div>

            {/* Goal Priority */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal-priority" className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                Priority Badge
              </label>
              <div className="relative">
                <select
                  id="goal-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-white text-xs text-slate-700 border border-slate-200 focus:border-slate-400 pl-3 pr-8 py-3 rounded-xl outline-none transition-all appearance-none font-bold cursor-pointer"
                >
                  <option value="HIGH PRIORITY">HIGH PRIORITY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LONG TERM">LONG TERM</option>
                  <option value="UPCOMING">UPCOMING</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-deadline" className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              Target Date (Deadline)
            </label>
            <input
              id="goal-deadline"
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-white text-sm text-slate-700 border border-slate-200 focus:border-slate-400 px-4 py-3 rounded-xl outline-none transition-all font-bold font-sans"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-2 w-full bg-[#113d29] hover:bg-[#0c2e1f] active:scale-[0.98] text-white font-bold py-4 rounded-2xl shadow-lg transition-all hover:shadow-xl cursor-pointer text-sm"
          >
            Create Savings Goal
          </button>
        </form>
      </div>
    </div>
  );
}
