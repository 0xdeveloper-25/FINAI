import { Transaction, SavingsGoal, UserProfile, ChartDataItem } from './types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: "Alex Chen",
  email: "alex.chen@finai.com",
  tier: "Premium Member",
  avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200", // professional portrait matching the mockup style
  checkingBalance: 0,
  savingsBalance: 0,
  investmentsBalance: 0,
  phone: "+1 (555) 0123 456",
  location: "San Francisco, CA",
  currency: "USD ($)",
  joinedDate: "January 12, 2023",
  role: "Senior Product Designer",
};

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

// Helper to get a relative date in string form (YYYY-MM-DD)
const getRelativeDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const DAILY_CHART_DATA: ChartDataItem[] = [
  { name: 'Mon', income: 0, spending: 0 },
  { name: 'Tue', income: 0, spending: 0 },
  { name: 'Wed', income: 0, spending: 0 },
  { name: 'Thu', income: 0, spending: 0 },
  { name: 'Fri', income: 0, spending: 0 },
  { name: 'Sat', income: 0, spending: 0 },
  { name: 'Sun', income: 0, spending: 0 },
];

export const WEEKLY_CHART_DATA: ChartDataItem[] = [
  { name: 'W1', income: 0, spending: 0 },
  { name: 'W2', income: 0, spending: 0 },
  { name: 'W3', income: 0, spending: 0 },
  { name: 'W4', income: 0, spending: 0 },
];

export const MONTHLY_CHART_DATA: ChartDataItem[] = [
  { name: 'Jan', income: 0, spending: 0 },
  { name: 'Feb', income: 0, spending: 0 },
  { name: 'Mar', income: 0, spending: 0 },
  { name: 'Apr', income: 0, spending: 0 },
  { name: 'May', income: 0, spending: 0 },
  { name: 'Jun', income: 0, spending: 0 },
];
