import { PiggyBank, HelpCircle } from 'lucide-react';
import { SavingsGoal } from '../types';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatSimpleCurrency, t } from '../utils';

interface SavingsGoalCardProps {
  goals: SavingsGoal[];
  onAddGoalClick: () => void;
  onCardClick?: () => void;
}

export default function SavingsGoalCard({ goals, onAddGoalClick, onCardClick }: SavingsGoalCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide to next goal every 4 seconds if there are multiple goals
  useEffect(() => {
    if (goals.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % goals.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex, goals.length]);

  const activeGoal = goals[currentIndex] || {
    id: "g-empty",
    title: "Create a Savings Goal",
    target: 1000,
    current: 0,
    deadline: "2026-12-31"
  };

  const percentage = Math.min(100, Math.round((activeGoal.current / activeGoal.target) * 100)) || 0;

  const displayFormattedCurrency = (val: number) => {
    return formatSimpleCurrency(val);
  };

  const displayFormattedCurrencyWithCents = (val: number) => {
    return formatCurrency(val);
  };

  return (
    <div
      id="savings-goal-container-card"
      onClick={onCardClick}
      className="bg-primary text-white rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden group shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] transition-all duration-300"
    >
      {/* Decorative Vector Rings */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 border-4 border-white/5 rounded-full pointer-events-none group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute -top-10 -left-10 w-32 h-32 border border-white/5 rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />

      {/* Goal Content with dynamic animation */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden relative min-h-[160px] z-0 mt-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-between h-full w-full"
          >
            {/* Goal Title */}
            <div className="my-4">
              <h3 className="font-display text-2xl font-bold tracking-tight mb-1 truncate">
                {activeGoal.title}
              </h3>
              <span className="font-sans text-xs text-white/70 font-medium">
                {t('Target')}: {displayFormattedCurrencyWithCents(activeGoal.target)}
              </span>
            </div>

            {/* Bottom Area: Progress Info */}
            <div className="mt-auto">
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-mono text-2xl font-extrabold text-white tracking-tight">
                  {displayFormattedCurrency(activeGoal.current)}
                </span>
                <span className="font-mono text-sm font-semibold text-white/80">
                  {percentage}%
                </span>
              </div>

              {/* Progress bar container */}
              <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
                <div
                  id="goal-progress-bar-fill"
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Deadline text or add new goal trigger */}
              <div className="flex items-center justify-between mt-3 text-[10px] text-white/55 font-medium">
                <span>By {activeGoal.deadline}</span>
                <button
                  id="add-new-goal-inline-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddGoalClick();
                  }}
                  className="hover:text-white underline transition-colors cursor-pointer"
                >
                  + {t('Create New Goal')}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

