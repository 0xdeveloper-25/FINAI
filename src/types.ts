export interface Category {
  name: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: string;
  title: string;
  amount: number; // Positive for Income, Negative for Spending
  category: string;
  time: string; // Friendly text (e.g., "2 hours ago")
  date: string; // ISO date string (e.g., "2026-07-07")
  iconName: string; // Key of Lucide icons
  method?: string; // Payment method (e.g., "Visa •••• 4242")
}

export interface SavingsGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  category?: string;
  description?: string;
  priority?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  tier: string; // e.g., "Premium Member", "Free Tier"
  avatarUrl?: string;
  checkingBalance: number;
  savingsBalance: number;
  investmentsBalance: number;
  phone?: string;
  location?: string;
  currency?: string;
  joinedDate?: string;
  role?: string;
}

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'savings-goals'
  | 'reports'
  | 'profile'
  | 'settings'
  | 'subscription'
  | 'support';

export interface ChartDataItem {
  name: string; // e.g., "Mon", "Tue"
  income: number;
  spending: number;
}
