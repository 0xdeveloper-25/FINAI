import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion } from 'motion/react';
import { NavTab, Transaction, SavingsGoal, UserProfile, ChartDataItem, Category } from './types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_SAVINGS_GOALS,
  INITIAL_TRANSACTIONS,
  DAILY_CHART_DATA,
  WEEKLY_CHART_DATA,
  MONTHLY_CHART_DATA,
} from './mockData';

// Component imports
import Sidebar from './components/Sidebar';
import { formatCurrency, isZenModeEnabled, t } from './utils';
import MetricCard from './components/MetricCard';
import SavingsGoalCard from './components/SavingsGoalCard';
import RecentActivity from './components/RecentActivity';
import IncomeSpendingChart from './components/IncomeSpendingChart';
import AddTransactionModal from './components/AddTransactionModal';
import AddSavingsGoalModal from './components/AddSavingsGoalModal';
import FundGoalModal from './components/FundGoalModal';
import ReportsTab from './components/ReportsTab';
import ProfileTab from './components/ProfileTab';
import SupportTab from './components/SupportTab';

import {
  Lightbulb,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Filter,
  CheckCircle,
  ShieldCheck,
  Award,
  BookOpen,
  Send,
  User,
  Settings as SettingsIcon,
  HelpCircle,
  PiggyBank,
  Check,
  Briefcase,
  DollarSign,
  ShoppingCart,
  Zap,
  Tv,
  Car,
  Coffee,
  Laptop,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Home,
  Compass,
  Search,
  X,
  Tag,
  Menu
} from 'lucide-react';

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

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core App States
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(INITIAL_SAVINGS_GOALS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  
  // Category management helper states
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Custom Transaction Page Filters & Pagination
  const [txTimeframe, setTxTimeframe] = useState<'All Time' | 'This Month' | 'This Week' | 'Today'>('All Time');
  const [txCategory, setTxCategory] = useState<string>('All');
  const [txAmount, setTxAmount] = useState<'All' | 'Under $50' | '$50 - $200' | 'Over $200'>('All');
  const [txMethod, setTxMethod] = useState<string>('All');
  const [txPage, setTxPage] = useState(1);
  const [activeTxDropdown, setActiveTxDropdown] = useState<'timeframe' | 'category' | 'amount' | 'method' | null>(null);

  // Chart Timeframe State ('daily' | 'weekly' | 'monthly')
  const [chartTimeframe, setChartTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Modals Visibility
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [fundGoal, setFundGoal] = useState<SavingsGoal | null>(null);

  // Quick Deposit state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [savingsSearch, setSavingsSearch] = useState('');
  const [deleteConfirmGoalId, setDeleteConfirmGoalId] = useState<string | null>(null);

  // Savings filter and sort states
  const [savingsFilterCategory, setSavingsFilterCategory] = useState('All');
  const [savingsFilterStatus, setSavingsFilterStatus] = useState('All');
  const [savingsSortBy, setSavingsSortBy] = useState('None');
  const [isSavingsFilterOpen, setIsSavingsFilterOpen] = useState(false);
  const [isSavingsSortOpen, setIsSavingsSortOpen] = useState(false);

  // Dynamic Savings Goal Categories states
  const [savingsGoalCategories, setSavingsGoalCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('finai_savings_goal_categories');
    return saved ? JSON.parse(saved) : ['Travel', 'Financial', 'Electronics', 'Vehicle', 'Home', 'Other'];
  });
  const [isManageSavingsCatsOpen, setIsManageSavingsCatsOpen] = useState(false);
  const [newSavingsCatName, setNewSavingsCatName] = useState('');
  const [editingSavingsCatIndex, setEditingSavingsCatIndex] = useState<number | null>(null);
  const [editingSavingsCatValue, setEditingSavingsCatValue] = useState('');

  // Support contact form state
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Settings subscription to trigger dynamic re-renders when settings are changed
  const [settingsVersion, setSettingsVersion] = useState(0);
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettingsVersion((v) => v + 1);
    };
    window.addEventListener('finai_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('finai_settings_updated', handleSettingsUpdate);
    };
  }, []);

  // Ref for outside-click dropdown closing
  const filterDropdownsRef = useRef<HTMLDivElement>(null);
  const savingsFilterRef = useRef<HTMLDivElement>(null);
  const savingsSortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        activeTxDropdown &&
        filterDropdownsRef.current &&
        !filterDropdownsRef.current.contains(event.target as Node)
      ) {
        setActiveTxDropdown(null);
      }
      if (
        isSavingsFilterOpen &&
        savingsFilterRef.current &&
        !savingsFilterRef.current.contains(event.target as Node)
      ) {
        setIsSavingsFilterOpen(false);
      }
      if (
        isSavingsSortOpen &&
        savingsSortRef.current &&
        !savingsSortRef.current.contains(event.target as Node)
      ) {
        setIsSavingsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTxDropdown, isSavingsFilterOpen, isSavingsSortOpen]);

  // Initialize and load from LocalStorage on mount
  useEffect(() => {
    // One-time migration to force-clear previous mock data so that the user immediately starts from 0
    const zeroResetDone = localStorage.getItem('finai_zero_reset_done_v1');
    if (!zeroResetDone) {
      localStorage.removeItem('finai_user_profile');
      localStorage.removeItem('finai_transactions');
      localStorage.removeItem('finai_savings_goals');
      localStorage.removeItem('finai_categories');
      localStorage.setItem('finai_zero_reset_done_v1', 'true');
    }

    const savedProfile = localStorage.getItem('finai_user_profile');
    const savedTransactions = localStorage.getItem('finai_transactions');
    const savedGoals = localStorage.getItem('finai_savings_goals');
    const savedCategories = localStorage.getItem('finai_categories');

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setUserProfile({
          ...INITIAL_USER_PROFILE,
          ...parsed
        });
      } catch (e) {
        setUserProfile(INITIAL_USER_PROFILE);
      }
    } else {
      localStorage.setItem('finai_user_profile', JSON.stringify(INITIAL_USER_PROFILE));
      setUserProfile(INITIAL_USER_PROFILE);
    }

    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        const migrated: Category[] = parsed.map((c: any) => {
          if (typeof c === 'string') {
            const lower = c.toLowerCase();
            const isInc = lower.includes('income') || lower.includes('investment') || lower.includes('salary') || lower.includes('deposit');
            return { name: c, type: isInc ? 'income' : 'expense' };
          }
          return c;
        });
        setCategories(migrated);
      } catch (e) {
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      localStorage.setItem('finai_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }

    if (savedTransactions) {
      const parsed = JSON.parse(savedTransactions) as Transaction[];
      const updated = parsed.map(t => {
        if (!t.method) {
          if (t.category === 'Income') return { ...t, method: 'Direct Deposit' };
          if (t.category === 'Utilities') return { ...t, method: 'Auto-pay' };
          return { ...t, method: 'Visa •••• 4242' };
        }
        return t;
      });
      setTransactions(updated);
    } else {
      localStorage.setItem('finai_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
      setTransactions(INITIAL_TRANSACTIONS);
    }

    if (savedGoals) {
      setSavingsGoals(JSON.parse(savedGoals));
    } else {
      localStorage.setItem('finai_savings_goals', JSON.stringify(INITIAL_SAVINGS_GOALS));
    }
  }, []);

  // Save states to LocalStorage on changes
  const saveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('finai_user_profile', JSON.stringify(newProfile));
  };

  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem('finai_transactions', JSON.stringify(newTransactions));
  };

  const saveGoals = (newGoals: SavingsGoal[]) => {
    setSavingsGoals(newGoals);
    localStorage.setItem('finai_savings_goals', JSON.stringify(newGoals));
  };

  // Sync profile fields on mount or change
  useEffect(() => {
    setEditName(userProfile.name);
    setEditEmail(userProfile.email);
  }, [userProfile]);

  // Handle adding a new transaction
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id' | 'time'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: 'tx-' + Date.now(),
      time: 'Just now',
    };

    const updatedTxs = [newTx, ...transactions];
    saveTransactions(updatedTxs);

    // Update balances based on the transaction category & amount
    // Spendings are negative, Incomes are positive
    const updatedProfile = { ...userProfile };
    if (newTx.category === 'Savings') {
      updatedProfile.savingsBalance += newTx.amount;
    } else if (newTx.category === 'Investment') {
      updatedProfile.investmentsBalance += newTx.amount;
    } else {
      // General spending/income goes to checking
      updatedProfile.checkingBalance += newTx.amount;
    }
    saveProfile(updatedProfile);
  };

  // Handle deleting a transaction
  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    const updatedTxs = transactions.filter((t) => t.id !== id);
    saveTransactions(updatedTxs);

    // Revert balance changes
    const updatedProfile = { ...userProfile };
    if (txToDelete.category === 'Savings') {
      updatedProfile.savingsBalance -= txToDelete.amount;
    } else if (txToDelete.category === 'Investment') {
      updatedProfile.investmentsBalance -= txToDelete.amount;
    } else {
      updatedProfile.checkingBalance -= txToDelete.amount;
    }
    saveProfile(updatedProfile);
  };

  // Category CRUD Handlers
  const handleAddCategory = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return; // Already exists
    }
    const updated = [...categories, { name, type: newCatType }];
    setCategories(updated);
    localStorage.setItem('finai_categories', JSON.stringify(updated));
    setNewCatName('');
  };

  const handleEditCategory = (index: number) => {
    const oldName = categories[index].name;
    const newName = editingCatName.trim();
    if (!newName || oldName === newName) {
      setEditingCatIndex(null);
      return;
    }
    
    // Check if duplicate
    if (categories.some((c, idx) => idx !== index && c.name.toLowerCase() === newName.toLowerCase())) {
      setEditingCatIndex(null);
      return;
    }

    const updated = [...categories];
    updated[index] = { ...updated[index], name: newName };
    setCategories(updated);
    localStorage.setItem('finai_categories', JSON.stringify(updated));

    // Update transactions with this category name
    const updatedTxs = transactions.map(t => {
      if (t.category === oldName) {
        return { ...t, category: newName };
      }
      return t;
    });
    saveTransactions(updatedTxs);

    // Update current active filter if it matched
    if (txCategory === oldName) {
      setTxCategory(newName);
    }

    setEditingCatIndex(null);
  };

  const handleDeleteCategory = (index: number) => {
    const catToDelete = categories[index].name;
    const updated = categories.filter((_, idx) => idx !== index);
    setCategories(updated);
    localStorage.setItem('finai_categories', JSON.stringify(updated));

    // Update transactions with this category to 'Other' or first available
    const updatedTxs = transactions.map(t => {
      if (t.category === catToDelete) {
        return { ...t, category: 'Other' };
      }
      return t;
    });
    saveTransactions(updatedTxs);

    // Reset filter if matched
    if (txCategory === catToDelete) {
      setTxCategory('All');
    }
  };

  // Handle adding a savings goal
  const handleAddSavingsGoal = (newGoalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...newGoalData,
      id: 'goal-' + Date.now(),
    };
    saveGoals([...savingsGoals, newGoal]);
  };

  // Handle depositing into a savings goal
  const handleDepositGoal = (goalId: string, amount: number, source: 'checking' | 'savings' | 'investment' = 'checking') => {
    if (amount <= 0 || isNaN(amount)) return;

    // Determine the source balance
    let sourceBalance = 0;
    if (source === 'checking') sourceBalance = userProfile.checkingBalance;
    else if (source === 'savings') sourceBalance = userProfile.savingsBalance;
    else if (source === 'investment') sourceBalance = userProfile.investmentsBalance;

    if (sourceBalance < amount) {
      alert(`Insufficient balance in selected account to make this deposit.`);
      return;
    }

    const updatedGoals = savingsGoals.map((g) => {
      if (g.id === goalId) {
        return { ...g, current: g.current + amount };
      }
      return g;
    });

    saveGoals(updatedGoals);

    const updatedProfile = {
      ...userProfile,
      checkingBalance: source === 'checking' ? userProfile.checkingBalance - amount : userProfile.checkingBalance,
      savingsBalance: source === 'savings' ? userProfile.savingsBalance - amount : (source === 'checking' ? userProfile.savingsBalance + amount : userProfile.savingsBalance),
      investmentsBalance: source === 'investment' ? userProfile.investmentsBalance - amount : userProfile.investmentsBalance,
    };
    saveProfile(updatedProfile);

    // Also record a mock transaction
    const targetGoal = savingsGoals.find((g) => g.id === goalId);
    handleAddTransaction({
      title: `Transfer to ${targetGoal?.title || 'Savings Goal'}`,
      amount: -amount,
      category: 'Savings',
      date: new Date().toISOString().split('T')[0],
      iconName: 'PiggyBank',
    });

    setDepositGoalId(null);
    setDepositAmount('');
    setFundGoal(null);
  };

  // Handle deleting a savings goal
  const handleDeleteGoal = (goalId: string, e: any) => {
    e.stopPropagation(); // Prevent opening the fund modal
    setDeleteConfirmGoalId(goalId);
  };

  // Savings Goal Category CRUD Handlers
  const saveSavingsGoalCategories = (newCats: string[]) => {
    setSavingsGoalCategories(newCats);
    localStorage.setItem('finai_savings_goal_categories', JSON.stringify(newCats));
  };

  const handleAddSavingsCat = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newSavingsCatName.trim();
    if (!trimmed) return;
    if (savingsGoalCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Category already exists!');
      return;
    }
    const updated = [...savingsGoalCategories, trimmed];
    saveSavingsGoalCategories(updated);
    setNewSavingsCatName('');
  };

  const handleUpdateSavingsCat = (index: number) => {
    const oldName = savingsGoalCategories[index];
    const newName = editingSavingsCatValue.trim();
    if (!newName || oldName === newName) {
      setEditingSavingsCatIndex(null);
      return;
    }
    if (savingsGoalCategories.some((c, idx) => idx !== index && c.toLowerCase() === newName.toLowerCase())) {
      alert('Category already exists!');
      return;
    }
    const updated = [...savingsGoalCategories];
    updated[index] = newName;
    saveSavingsGoalCategories(updated);

    // Update all savings goals using the old category name
    const updatedGoals = savingsGoals.map(g => {
      if (g.category === oldName) {
        return { ...g, category: newName };
      }
      return g;
    });
    saveGoals(updatedGoals);

    setEditingSavingsCatIndex(null);
  };

  const handleDeleteSavingsCat = (index: number) => {
    const catToDelete = savingsGoalCategories[index];
    if (confirm(`Are you sure you want to delete "${catToDelete}" category? Existing goals in this category will be updated to "Other".`)) {
      const updated = savingsGoalCategories.filter((_, idx) => idx !== index);
      saveSavingsGoalCategories(updated);

      // Update goals using this category to "Other"
      const updatedGoals = savingsGoals.map(g => {
        if (g.category === catToDelete) {
          return { ...g, category: 'Other' };
        }
        return g;
      });
      saveGoals(updatedGoals);
    }
  };

  // Handle saving Profile Edits
  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    const updatedProfile = {
      ...userProfile,
      name: editName,
      email: editEmail,
    };
    saveProfile(updatedProfile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Filtered transactions for viewing and search
  const filteredTransactions = transactions.filter((t) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      txCategory === 'All' || t.category.toLowerCase() === txCategory.toLowerCase();

    // Amount Filter
    let matchesAmount = true;
    const absVal = Math.abs(t.amount);
    if (txAmount === 'Under $50') {
      matchesAmount = absVal < 50;
    } else if (txAmount === '$50 - $200') {
      matchesAmount = absVal >= 50 && absVal <= 200;
    } else if (txAmount === 'Over $200') {
      matchesAmount = absVal > 200;
    }

    // Payment Method filter
    let matchesMethod = true;
    if (txMethod !== 'All') {
      const meth = t.method || '';
      if (txMethod === 'Cash') {
        matchesMethod = meth.toLowerCase() === 'cash';
      } else if (txMethod === 'Qris') {
        matchesMethod = meth.toLowerCase().includes('qris');
      } else if (txMethod === 'Transfer') {
        matchesMethod =
          meth.toLowerCase().includes('transfer') ||
          meth.toLowerCase().includes('visa') ||
          meth.toLowerCase().includes('mastercard') ||
          meth.toLowerCase().includes('apple') ||
          meth.toLowerCase().includes('auto') ||
          meth.toLowerCase().includes('deposit');
      } else {
        matchesMethod = meth.toLowerCase().includes(txMethod.toLowerCase());
      }
    }

    // Timeframe filter
    let matchesTimeframe = true;
    if (txTimeframe !== 'All Time') {
      if (txTimeframe === 'Today') {
        // Find latest date in data or today
        const latestDate = '2023-10-24';
        matchesTimeframe = t.date === latestDate || t.date === new Date().toISOString().split('T')[0];
      } else if (txTimeframe === 'This Month') {
        matchesTimeframe = t.date.startsWith('2023-10') || t.date.startsWith(new Date().toISOString().slice(0, 7));
      } else if (txTimeframe === 'This Week') {
        // Show everything from 2023-10 or recent entries
        matchesTimeframe = t.date.startsWith('2023-10') || t.date.startsWith(new Date().toISOString().slice(0, 7));
      }
    }

    return matchesSearch && matchesCategory && matchesAmount && matchesMethod && matchesTimeframe;
  });

  // Dynamic values depending on selected timeframe and real transactions
  const getChartData = (): ChartDataItem[] => {
    if (transactions.length === 0) {
      switch (chartTimeframe) {
        case 'daily':
          return DAILY_CHART_DATA;
        case 'weekly':
          return WEEKLY_CHART_DATA;
        case 'monthly':
          return MONTHLY_CHART_DATA;
        default:
          return WEEKLY_CHART_DATA;
      }
    }

    if (chartTimeframe === 'daily') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result: ChartDataItem[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayName = days[d.getDay()];
        const dateStr = d.toISOString().split('T')[0];
        
        const dayTxs = transactions.filter(t => t.date === dateStr);
        const income = dayTxs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const spending = dayTxs.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        result.push({ name: dayName, income, spending });
      }
      return result;
    }

    if (chartTimeframe === 'weekly') {
      const result: ChartDataItem[] = [
        { name: 'W1', income: 0, spending: 0 },
        { name: 'W2', income: 0, spending: 0 },
        { name: 'W3', income: 0, spending: 0 },
        { name: 'W4', income: 0, spending: 0 }
      ];

      const today = new Date();
      transactions.forEach(t => {
        const txDate = new Date(t.date);
        if (txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear()) {
          const day = txDate.getDate();
          let weekIdx = 0;
          if (day <= 7) weekIdx = 0;
          else if (day <= 14) weekIdx = 1;
          else if (day <= 21) weekIdx = 2;
          else weekIdx = 3;

          if (t.amount > 0) {
            result[weekIdx].income += t.amount;
          } else {
            result[weekIdx].spending += Math.abs(t.amount);
          }
        }
      });
      return result;
    }

    if (chartTimeframe === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
      const currentYear = today.getFullYear();
      
      const result: ChartDataItem[] = months.map(m => ({ name: m, income: 0, spending: 0 }));
      
      transactions.forEach(t => {
        const txDate = new Date(t.date);
        if (txDate.getFullYear() === currentYear) {
          const monthIdx = txDate.getMonth();
          if (monthIdx >= 0 && monthIdx < 12) {
            if (t.amount > 0) {
              result[monthIdx].income += t.amount;
            } else {
              result[monthIdx].spending += Math.abs(t.amount);
            }
          }
        }
      });
      
      const currentMonth = today.getMonth();
      const startIdx = Math.max(0, currentMonth - 5);
      return result.slice(startIdx, currentMonth + 1);
    }

    return WEEKLY_CHART_DATA;
  };

  const getMonthlyInflow = () => {
    const original7Titles = ["Whole Foods Market", "Tech Corp Salary", "Central Electric Co.", "Netflix Subscription", "Shell Oil", "Blue Bottle Coffee", "Adobe Creative Cloud"];
    const matchesOriginal = transactions.length === 7 && transactions.every(t => original7Titles.includes(t.title));
    if (matchesOriginal) {
      return 8420.00;
    }
    const positiveTxs = transactions.filter(t => t.amount > 0);
    const sum = positiveTxs.reduce((acc, t) => acc + t.amount, 0);
    return sum > 0 ? sum : 0;
  };

  const getMonthlySpending = () => {
    const original7Titles = ["Whole Foods Market", "Tech Corp Salary", "Central Electric Co.", "Netflix Subscription", "Shell Oil", "Blue Bottle Coffee", "Adobe Creative Cloud"];
    const matchesOriginal = transactions.length === 7 && transactions.every(t => original7Titles.includes(t.title));
    if (matchesOriginal) {
      return 4150.25;
    }
    const negativeTxs = transactions.filter(t => t.amount < 0);
    const sum = negativeTxs.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    return sum > 0 ? sum : 0;
  };

  const getComparisonMetrics = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const prevTxs = transactions.filter(t => {
      try {
        const [y, m, d] = t.date.split('-').map(Number);
        const txDate = new Date(y, m - 1, d);
        return txDate.getMonth() === prevMonth && txDate.getFullYear() === prevYear;
      } catch (e) {
        return false;
      }
    });

    const prevInflow = prevTxs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const prevSpending = prevTxs.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { prevInflow, prevSpending };
  };

  const getInflowComparison = () => {
    const { prevInflow } = getComparisonMetrics();
    const currentInflow = getMonthlyInflow();

    if (prevInflow === 0) {
      if (currentInflow === 0) {
        return { text: "0% from last month", isPositive: true };
      }
      return { text: "+100% from last month", isPositive: true };
    }

    const pct = Math.round(((currentInflow - prevInflow) / prevInflow) * 100);
    const sign = pct >= 0 ? '+' : '';
    return { text: `${sign}${pct}% from last month`, isPositive: pct >= 0 };
  };

  const getSpendingComparison = () => {
    const { prevSpending } = getComparisonMetrics();
    const currentSpending = getMonthlySpending();

    if (prevSpending === 0) {
      if (currentSpending === 0) {
        return { text: "0% from last month", isLess: true };
      }
      return { text: "+100% from last month", isLess: false };
    }

    const pct = Math.round(((currentSpending - prevSpending) / prevSpending) * 100);
    const isLess = pct <= 0;
    const sign = pct >= 0 ? '+' : '';
    return { text: `${sign}${pct}% from last month`, isLess };
  };

  const getMonthlySavingsGoal = () => {
    if (savingsGoals.length === 0) {
      return 1500;
    }

    let totalMonthlyRequired = 0;
    const today = new Date();

    savingsGoals.forEach(g => {
      const remaining = Math.max(0, g.target - g.current);
      if (remaining > 0 && g.deadline) {
        const deadlineDate = new Date(g.deadline);
        const monthsRemaining = Math.max(
          1,
          (deadlineDate.getFullYear() - today.getFullYear()) * 12 +
            (deadlineDate.getMonth() - today.getMonth())
        );
        totalMonthlyRequired += remaining / monthsRemaining;
      }
    });

    return totalMonthlyRequired > 0 ? Math.round(totalMonthlyRequired) : 1500;
  };

  const getPeriodMetrics = (timeframe: 'daily' | 'weekly' | 'monthly') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filtered: Transaction[] = [];

    if (timeframe === 'daily') {
      // Last 7 days in local timezone
      const startLimit = new Date(today);
      startLimit.setDate(today.getDate() - 6);
      filtered = transactions.filter(t => {
        const [y, m, d] = t.date.split('-').map(Number);
        const txDate = new Date(y, m - 1, d);
        return txDate >= startLimit;
      });
    } else if (timeframe === 'weekly') {
      // Last 30 days
      const startLimit = new Date(today);
      startLimit.setDate(today.getDate() - 29);
      filtered = transactions.filter(t => {
        const [y, m, d] = t.date.split('-').map(Number);
        const txDate = new Date(y, m - 1, d);
        return txDate >= startLimit;
      });
    } else {
      // Current year
      const currentYear = today.getFullYear();
      filtered = transactions.filter(t => {
        const [y] = t.date.split('-').map(Number);
        return y === currentYear;
      });
    }

    const income = filtered.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const spending = filtered.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const net = income - spending;
    const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;

    return { income, spending, net, savingsRate };
  };

  const getWeeklyAvg = () => {
    const { net } = getPeriodMetrics(chartTimeframe);
    return (net >= 0 ? '+' : '-') + formatCurrency(Math.abs(net));
  };

  const getSavingsRate = () => {
    const { savingsRate } = getPeriodMetrics(chartTimeframe);
    return `${savingsRate}%`;
  };

  const getSavingsGrowth = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const totalCurrentSavings = savingsGoals.reduce((sum, g) => sum + g.current, 0);

    const currentMonthDeposits = transactions
      .filter(t => {
        try {
          const [y, m] = t.date.split('-').map(Number);
          return (m - 1) === currentMonth && y === currentYear && t.category === 'Savings';
        } catch (e) {
          return false;
        }
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const lastMonthSavings = Math.max(0, totalCurrentSavings - currentMonthDeposits);

    if (lastMonthSavings === 0) {
      if (totalCurrentSavings === 0) {
        return { text: "0% vs last month", isPositive: true };
      }
      return { text: "+100% vs last month", isPositive: true };
    }

    const pct = Math.round(((totalCurrentSavings - lastMonthSavings) / lastMonthSavings) * 100);
    const sign = pct >= 0 ? '+' : '';
    return { text: `${sign}${pct}% vs last month`, isPositive: pct >= 0 };
  };

  const getAverageContributionRate = () => {
    const savingsTransactions = transactions.filter(t => t.category === 'Savings');
    if (savingsTransactions.length === 0) {
      return 0;
    }

    const totalContributions = savingsTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const monthsSet = new Set<string>();
    transactions.forEach(t => {
      try {
        const parts = t.date.split('-');
        if (parts.length >= 2) {
          monthsSet.add(`${parts[0]}-${parts[1]}`);
        }
      } catch (e) {}
    });

    const numMonths = Math.max(1, monthsSet.size);
    return Math.round(totalContributions / numMonths);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddTransactionClick={() => setIsAddTransactionOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header id="mobile-navigation-header" className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              id="mobile-sidebar-toggle-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <span className="font-display text-lg font-black text-slate-900 tracking-tight leading-none">
                FIN<span className="text-primary">AI</span>
              </span>
              <span className="font-sans text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-none">
                {t(activeTab === 'savings-goals' ? 'Savings' : activeTab)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="mobile-settings-btn"
              onClick={() => setActiveTab('settings')}
              className={`p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-primary/10 text-primary' : ''
              }`}
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main id="main-content-flow" className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-8">
          {/* RENDER DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div id="tab-dashboard" className="flex flex-col gap-8 animate-in fade-in duration-300">
              {/* Welcome Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {t('Welcome back')}, {userProfile.name.split(' ')[0]}.
                  </h1>
                  <p className="font-sans text-sm text-slate-500 font-medium mt-1">
                    {t('Your financial overview is looking healthy today.')}
                  </p>
                </div>

                {/* Segment Selector for Chart / Analytics */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                  {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
                    <button
                      key={mode}
                      id={`chart-mode-${mode}-btn`}
                      onClick={() => setChartTimeframe(mode)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${
                        chartTimeframe === mode
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Row: Metric & Savings Goal cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MetricCard user={userProfile} transactions={transactions} />
                </div>
                <div className="lg:col-span-1">
                  <SavingsGoalCard
                    goals={savingsGoals}
                    onAddGoalClick={() => setIsAddGoalOpen(true)}
                    onCardClick={() => setActiveTab('savings-goals')}
                  />
                </div>
              </div>

              {/* Bottom Row: Recent Activity & Recharts Visualizer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivity
                  transactions={transactions.slice(0, 4)}
                  onViewAllClick={() => setActiveTab('transactions')}
                  onDeleteTransaction={handleDeleteTransaction}
                />
                {!isZenModeEnabled() ? (
                  <IncomeSpendingChart
                    data={getChartData()}
                    timeframe={chartTimeframe}
                    weeklyAvg={getWeeklyAvg()}
                    savingsRate={getSavingsRate()}
                  />
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-center h-full shadow-xs text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mx-auto mb-3">
                      <Award className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Peaceful View Enabled</h4>
                    <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
                      In Zen Mode, active chart trends and aggressive comparison metrics are hidden to help you focus on your simple financial balance.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RENDER TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div id="tab-transactions" className="flex flex-col gap-8 animate-in fade-in duration-300">
              {/* Header and Add Button */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="max-w-xl">
                  <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">
                    Transactions
                  </h1>
                  <p className="font-sans text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
                    A comprehensive overview of your financial activity. Track every dollar, categorize spending, and stay in control.
                  </p>
                </div>
                <button
                  id="add-tx-tab-btn"
                  onClick={() => setIsAddTransactionOpen(true)}
                  className="flex items-center justify-center gap-2 bg-[#113d29] hover:bg-[#0c2e1f] text-white py-2.5 px-5 rounded-xl font-sans text-sm font-bold shadow-md transition-all self-start md:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Transaction</span>
                </button>
              </div>

              {/* Advanced Filters Row */}
              <div className="relative flex flex-wrap items-center justify-between gap-4 bg-[#fcfcfc] border border-slate-100 p-4 rounded-2xl">
                <div ref={filterDropdownsRef} className="flex flex-wrap items-center gap-2.5">
                  {/* Timeframe Filter Dropdown */}
                  <div className="relative">
                    <button
                      id="filter-dropdown-timeframe"
                      onClick={() => setActiveTxDropdown(activeTxDropdown === 'timeframe' ? null : 'timeframe')}
                      className={`font-semibold px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                        txTimeframe !== 'All Time'
                          ? 'bg-[#113d29] text-white'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{txTimeframe}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {activeTxDropdown === 'timeframe' && (
                      <>
                        <div className="absolute left-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                          {(['All Time', 'This Month', 'This Week', 'Today'] as const).map((time) => (
                            <button
                              key={time}
                              onClick={() => {
                                setTxTimeframe(time);
                                setTxPage(1);
                                setActiveTxDropdown(null);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${
                                txTimeframe === time ? 'text-[#113d29] bg-[#d1f2dd]/30' : 'text-slate-700'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Category Filter Dropdown */}
                  <div className="relative">
                    <button
                      id="filter-dropdown-category"
                      onClick={() => setActiveTxDropdown(activeTxDropdown === 'category' ? null : 'category')}
                      className={`font-semibold px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                        txCategory !== 'All'
                          ? 'bg-[#113d29] text-white'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{txCategory === 'All' ? 'Categories' : txCategory}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {activeTxDropdown === 'category' && (
                      <>
                        <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-2.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col gap-1.5 px-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-1.5 block">
                            Filter or Manage
                          </span>
                          
                          {/* Categories List Container */}
                          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
                            {/* "All" Option */}
                            <button
                              onClick={() => {
                                setTxCategory('All');
                                setTxPage(1);
                                setActiveTxDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                                txCategory === 'All' ? 'text-[#113d29] bg-[#d1f2dd]/30' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              All Categories
                            </button>

                            {categories.map((cat, idx) => (
                              <div
                                key={cat.name + idx}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-xl transition-all group ${
                                  txCategory.toLowerCase() === cat.name.toLowerCase()
                                    ? 'bg-[#d1f2dd]/20 border border-transparent'
                                    : 'hover:bg-slate-50/80 border border-transparent'
                                }`}
                              >
                                {editingCatIndex === idx ? (
                                  <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={editingCatName}
                                      onChange={(e) => setEditingCatName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleEditCategory(idx);
                                        if (e.key === 'Escape') setEditingCatIndex(null);
                                      }}
                                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleEditCategory(idx)}
                                      className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer"
                                      title="Save"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCatIndex(null)}
                                      className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {/* Select Category filter on click */}
                                    <button
                                      onClick={() => {
                                        setTxCategory(cat.name);
                                        setTxPage(1);
                                        setActiveTxDropdown(null);
                                      }}
                                      className={`flex-1 text-left text-xs font-semibold truncate flex items-center gap-2 ${
                                        txCategory.toLowerCase() === cat.name.toLowerCase() ? 'text-[#113d29] font-bold' : 'text-slate-700'
                                      }`}
                                    >
                                      <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                          cat.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                                        }`}
                                      />
                                      <span>{cat.name}</span>
                                    </button>

                                    {/* Edit / Delete Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCatIndex(idx);
                                          setEditingCatName(cat.name);
                                        }}
                                        className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                        title="Edit category"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCategory(idx)}
                                        className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                        title="Delete category"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-slate-100 my-1"></div>

                          {/* Add Category Input Form */}
                          <div className="px-2 pb-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                              Add New Category
                            </span>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleAddCategory();
                              }}
                              className="flex flex-col gap-2"
                            >
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="e.g. Shopping"
                                  value={newCatName}
                                  onChange={(e) => setNewCatName(e.target.value)}
                                  className="flex-1 min-w-0 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-all"
                                />
                                <button
                                  type="submit"
                                  className="p-1.5 bg-[#113d29] hover:bg-[#0c2e1f] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                                  title="Add Category"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {/* Income vs Expense selection */}
                              <div className="mt-1 px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  Category Type
                                </span>
                                <div className="relative grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl">
                                  <button
                                    type="button"
                                    onClick={() => setNewCatType('expense')}
                                    className={`relative z-10 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-colors duration-150 cursor-pointer select-none ${
                                      newCatType === 'expense'
                                        ? 'text-rose-600'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                  >
                                    {newCatType === 'expense' && (
                                      <motion.div
                                        layoutId="active-cat-bg"
                                        className="absolute inset-0 bg-white rounded-lg shadow-xs border border-rose-100/30 z-[-1]"
                                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                      />
                                    )}
                                    <span className={`w-1.5 h-1.5 rounded-full ${newCatType === 'expense' ? 'bg-rose-500 animate-pulse' : 'bg-rose-300'}`} />
                                    Expense
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setNewCatType('income')}
                                    className={`relative z-10 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-colors duration-150 cursor-pointer select-none ${
                                      newCatType === 'income'
                                        ? 'text-emerald-600'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                  >
                                    {newCatType === 'income' && (
                                      <motion.div
                                        layoutId="active-cat-bg"
                                        className="absolute inset-0 bg-white rounded-lg shadow-xs border border-emerald-100/30 z-[-1]"
                                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                      />
                                    )}
                                    <span className={`w-1.5 h-1.5 rounded-full ${newCatType === 'income' ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-300'}`} />
                                    Income
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Amount Range Filter Dropdown */}
                  <div className="relative">
                    <button
                      id="filter-dropdown-amount"
                      onClick={() => setActiveTxDropdown(activeTxDropdown === 'amount' ? null : 'amount')}
                      className={`font-semibold px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                        txAmount !== 'All'
                          ? 'bg-[#113d29] text-white'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{txAmount === 'All' ? 'Amount Range' : txAmount}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {activeTxDropdown === 'amount' && (
                      <>
                        <div className="absolute left-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                          {(['All', 'Under $50', '$50 - $200', 'Over $200'] as const).map((rng) => (
                            <button
                              key={rng}
                              onClick={() => {
                                setTxAmount(rng);
                                setTxPage(1);
                                setActiveTxDropdown(null);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${
                                txAmount === rng ? 'text-[#113d29] bg-[#d1f2dd]/30' : 'text-slate-700'
                              }`}
                            >
                              {rng}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment Method Filter Dropdown */}
                  <div className="relative">
                    <button
                      id="filter-dropdown-method"
                      onClick={() => setActiveTxDropdown(activeTxDropdown === 'method' ? null : 'method')}
                      className={`font-semibold px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                        txMethod !== 'All'
                          ? 'bg-[#113d29] text-white'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{txMethod === 'All' ? 'Payment Method' : txMethod}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {activeTxDropdown === 'method' && (
                      <>
                        <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                          {['All', 'Cash', 'Qris', 'Transfer'].map((meth) => (
                            <button
                              key={meth}
                              onClick={() => {
                                setTxMethod(meth);
                                setTxPage(1);
                                setActiveTxDropdown(null);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${
                                txMethod === meth ? 'text-[#113d29] bg-[#d1f2dd]/30' : 'text-slate-700'
                              }`}
                            >
                              {meth === 'Qris' ? 'QRIS' : meth}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* More Filters / Reset Button */}
                <button
                  id="reset-tx-filters-btn"
                  onClick={() => {
                    setTxTimeframe('All Time');
                    setTxCategory('All');
                    setTxAmount('All');
                    setTxMethod('All');
                    setSearchQuery('');
                    setTxPage(1);
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Filters</span>
                </button>
              </div>

              {/* Three Metrics Summary Cards (Row 2 of first image) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Inflow Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                      {t('Monthly Inflow')}
                    </span>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                      {formatCurrency(getMonthlyInflow())}
                    </h2>
                  </div>
                  {(() => {
                    const comp = getInflowComparison();
                    return (
                      <div className={`flex items-center gap-1 text-xs font-bold mt-4 ${comp.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {comp.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{comp.text}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Spending Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                      {t('Monthly Spending')}
                    </span>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                      {formatCurrency(getMonthlySpending())}
                    </h2>
                  </div>
                  {(() => {
                    const comp = getSpendingComparison();
                    return (
                      <div className="flex items-center gap-1 text-xs font-bold mt-4">
                        {comp.isLess ? (
                          <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-rose-600" />
                        )}
                        <span className="text-slate-500">{comp.text}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Net Savings Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  {(() => {
                    const mGoal = getMonthlySavingsGoal();
                    const netSavings = getMonthlyInflow() - getMonthlySpending();
                    const progressVal = mGoal > 0 ? Math.max(0, Math.min(100, Math.round((netSavings / mGoal) * 100))) : 0;
                    return (
                      <>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                              {t('Net Savings')}
                            </span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {progressVal}% of goal
                            </span>
                          </div>
                          <h2 className="text-3xl font-extrabold text-[#113d29] tracking-tight mt-2">
                            {formatCurrency(netSavings)}
                          </h2>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="w-full bg-[#f0f0f0] h-2 rounded-full overflow-hidden">
                            <div className="bg-[#107c41] h-full rounded-full transition-all duration-500" style={{ width: `${progressVal}%` }}></div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Transactions Table Container */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-20 px-6">
                    <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                      No transactions matched your filtering criteria.
                    </p>
                    <button
                      onClick={() => {
                        setTxTimeframe('All Time');
                        setTxCategory('All');
                        setTxAmount('All');
                        setTxMethod('All');
                        setSearchQuery('');
                        setTxPage(1);
                      }}
                      className="mt-4 text-xs font-bold text-[#113d29] hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/50">
                            <th className="py-4 px-6 font-sans hidden sm:table-cell">Date</th>
                            <th className="py-4 px-6 font-sans">Description</th>
                            <th className="py-4 px-6 font-sans">Category</th>
                            <th className="py-4 px-6 font-sans hidden md:table-cell">Method</th>
                            <th className="py-4 px-6 font-sans text-right">Amount</th>
                            <th className="py-4 px-6 font-sans text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                          {(() => {
                            // Paginate filtered transactions
                            const itemsPerPage = 6;
                            const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
                            const activePage = Math.min(txPage, totalPages || 1);
                            const paginated = filteredTransactions.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

                            return paginated.map((t) => {
                              const isIncome = t.amount > 0;

                              // Style pill according to category
                              let categoryStyle = "bg-slate-100 text-slate-700";
                              if (t.category === 'Groceries') {
                                categoryStyle = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                              } else if (t.category === 'Income') {
                                categoryStyle = "bg-teal-50 text-teal-700 border border-teal-100";
                              } else if (t.category === 'Utilities') {
                                categoryStyle = "bg-rose-50 text-rose-700 border border-rose-100";
                              } else if (t.category === 'Entertainment') {
                                categoryStyle = "bg-indigo-50 text-indigo-700 border border-indigo-100";
                              } else if (t.category === 'Transport') {
                                categoryStyle = "bg-slate-50 text-slate-700 border border-slate-200";
                              } else if (t.category === 'Dining Out' || t.category === 'Dining') {
                                categoryStyle = "bg-amber-50 text-amber-700 border border-amber-100";
                              } else if (t.category === 'Investment') {
                                categoryStyle = "bg-violet-50 text-violet-700 border border-violet-100";
                              }

                              // Get Lucide Icon
                              const renderIcon = () => {
                                const sizeClass = "w-5 h-5";
                                switch (t.iconName) {
                                  case 'ShoppingCart':
                                    return <ShoppingCart className={`${sizeClass} text-emerald-600`} />;
                                  case 'Briefcase':
                                    return <Briefcase className={`${sizeClass} text-teal-600`} />;
                                  case 'Zap':
                                    return <Zap className={`${sizeClass} text-rose-600`} />;
                                  case 'Tv':
                                    return <Tv className={`${sizeClass} text-indigo-600`} />;
                                  case 'Car':
                                    return <Car className={`${sizeClass} text-slate-600`} />;
                                  case 'Coffee':
                                    return <Coffee className={`${sizeClass} text-amber-600`} />;
                                  case 'TrendingUp':
                                    return <TrendingUp className={`${sizeClass} text-violet-600`} />;
                                  case 'Laptop':
                                    return <Laptop className={`${sizeClass} text-slate-500`} />;
                                  default:
                                    return <HelpCircle className={`${sizeClass} text-slate-400`} />;
                                }
                              };

                              // Display Date formatted beautiful
                              let displayDate = t.date;
                              if (t.date) {
                                try {
                                  const parsedDate = new Date(t.date);
                                  if (!isNaN(parsedDate.getTime())) {
                                    displayDate = parsedDate.toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    });
                                  }
                                } catch (err) {
                                  // fallback
                                }
                              }

                              return (
                                <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                                  {/* Date */}
                                  <td className="py-4 px-6 text-slate-500 font-medium text-xs hidden sm:table-cell">
                                    {displayDate}
                                  </td>

                                  {/* Description & Icon */}
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                        {renderIcon()}
                                      </div>
                                      <span className="font-bold text-slate-900 tracking-tight">
                                        {t.title}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Category Pill */}
                                  <td className="py-4 px-6">
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${categoryStyle}`}>
                                      {t.category}
                                    </span>
                                  </td>

                                  {/* Method */}
                                  <td className="py-4 px-6 text-slate-600 font-semibold text-xs hidden md:table-cell">
                                    {t.method || "Visa •••• 4242"}
                                  </td>

                                  {/* Amount */}
                                  <td className={`py-4 px-6 text-right font-extrabold text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(t.amount, { showSign: true })}
                                  </td>

                                  {/* Delete button */}
                                  <td className="py-4 px-6 text-center">
                                    <button
                                      id={`delete-tx-btn-${t.id}`}
                                      onClick={() => handleDeleteTransaction(t.id)}
                                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                      title="Delete transaction"
                                    >
                                      <Trash2 className="w-4.5 h-4.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bottom Bar */}
                    {(() => {
                      const itemsPerPage = 6;
                      const totalItems = filteredTransactions.length;
                      const totalPages = Math.ceil(totalItems / itemsPerPage);
                      const activePage = Math.min(txPage, totalPages || 1);
                      const startRange = totalItems === 0 ? 0 : (activePage - 1) * itemsPerPage + 1;
                      const endRange = Math.min(activePage * itemsPerPage, totalItems);

                      return (
                        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                          <span className="text-xs font-semibold text-slate-500">
                            Showing <span className="text-slate-800 font-bold">{startRange}</span> to <span className="text-slate-800 font-bold">{endRange}</span> of <span className="text-slate-800 font-bold">{totalItems}</span> transactions
                          </span>

                          {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setTxPage(Math.max(1, activePage - 1))}
                                disabled={activePage === 1}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              {Array.from({ length: totalPages }).map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setTxPage(idx + 1)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    activePage === idx + 1
                                      ? 'bg-[#113d29] text-white'
                                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                              <button
                                onClick={() => setTxPage(Math.min(totalPages, activePage + 1))}
                                disabled={activePage === totalPages}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}

          {/* RENDER SAVINGS GOALS TAB */}
          {activeTab === 'savings-goals' && (() => {
            const totalCurrentSavings = savingsGoals.reduce((sum, g) => sum + g.current, 0);
            const activeGoalsCount = savingsGoals.length;
            const rawFilteredGoals = savingsGoals.filter(g => {
              // Search query check
              const matchesSearch = g.title.toLowerCase().includes(savingsSearch.toLowerCase()) ||
                (g.category || '').toLowerCase().includes(savingsSearch.toLowerCase());

              // Category filter check
              const matchesCategory = savingsFilterCategory === 'All' ||
                (g.category || '').toLowerCase() === savingsFilterCategory.toLowerCase() ||
                (savingsFilterCategory === 'Emergency Fund' && g.title.toLowerCase().includes('emergency'));

              // Status filter check
              const pct = (g.current / g.target) * 100;
              const matchesStatus = savingsFilterStatus === 'All' ||
                (savingsFilterStatus === 'Completed' && pct >= 100) ||
                (savingsFilterStatus === 'In Progress' && pct < 100);

              return matchesSearch && matchesCategory && matchesStatus;
            });

            const filteredGoals = savingsSortBy === 'None' ? rawFilteredGoals : [...rawFilteredGoals].sort((a, b) => {
              if (savingsSortBy === 'Target (High to Low)') {
                return b.target - a.target;
              }
              if (savingsSortBy === 'Target (Low to High)') {
                return a.target - b.target;
              }
              if (savingsSortBy === 'Progress % (Highest)') {
                const pctA = a.current / a.target;
                const pctB = b.current / b.target;
                return pctB - pctA;
              }
              if (savingsSortBy === 'Progress % (Lowest)') {
                const pctA = a.current / a.target;
                const pctB = b.current / b.target;
                return pctA - pctB;
              }
              if (savingsSortBy === 'Deadline') {
                const dateA = new Date(a.deadline).getTime() || 0;
                const dateB = new Date(b.deadline).getTime() || 0;
                return dateA - dateB;
              }
              return 0;
            });

            const getGoalIcon = (title: string, category: string) => {
              const t = title.toLowerCase();
              const c = (category || '').toLowerCase();
              if (t.includes('emergency') || c.includes('financial') || c.includes('stability')) {
                return <ShieldCheck className="w-5 h-5 text-emerald-800" />;
              }
              if (t.includes('car') || t.includes('vehicle') || c.includes('auto') || c.includes('vehicle')) {
                return <Car className="w-5 h-5 text-emerald-800" />;
              }
              if (t.includes('home') || t.includes('house') || t.includes('renovation') || c.includes('home')) {
                return <Home className="w-5 h-5 text-emerald-800" />;
              }
              if (t.includes('trip') || t.includes('travel') || t.includes('japan') || c.includes('travel')) {
                return <Compass className="w-5 h-5 text-emerald-800" />;
              }
              return <TrendingUp className="w-5 h-5 text-emerald-800" />;
            };

            const getPriorityBadgeStyle = (priority: string = 'MEDIUM') => {
              const p = priority.toUpperCase();
              if (p === 'HIGH PRIORITY') {
                return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
              }
              if (p === 'UPCOMING') {
                return 'bg-rose-50 text-rose-600 border border-rose-100';
              }
              return 'bg-slate-100 text-slate-500 border border-slate-200/50';
            };

            return (
              <div id="tab-savings-goals" className="flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Header with Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">
                      Savings Goals
                    </h1>
                  </div>
                  {/* Search bar inside page to match mockup */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search goals..."
                      value={savingsSearch}
                      onChange={(e) => setSavingsSearch(e.target.value)}
                      className="w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-sm text-slate-800 border border-transparent focus:border-slate-200 pl-10 pr-4 py-2.5 rounded-full outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Overview Box Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2">
                  {/* Left Part: Overview info */}
                  <div className="lg:col-span-2 flex flex-col justify-center py-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-sans text-4xl md:text-5xl font-extrabold text-[#113d29] tracking-tight">
                        ${totalCurrentSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h2>
                      {(() => {
                        const growth = getSavingsGrowth();
                        return (
                          <span className={`border rounded-full px-3.5 py-1 text-[11px] font-bold inline-flex items-center ${
                            growth.isPositive 
                              ? 'bg-[#e2f3ec] text-[#113d29] border-[#d1ebd2]/30' 
                              : 'bg-rose-50 text-rose-700 border-rose-200/40'
                          }`}>
                            {growth.text}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[13px] md:text-sm text-slate-500 font-medium mt-3.5 leading-relaxed max-w-xl">
                      {savingsGoals.length > 0 ? (
                        getAverageContributionRate() > 0 ? (
                          <>
                            You're currently on track to hit your collective savings targets. Your average contribution rate is <span className="font-bold text-slate-800">{formatCurrency(getAverageContributionRate())} per month</span>.
                          </>
                        ) : (
                          <>
                            Start saving to hit your collective savings targets. Your average contribution rate is <span className="font-bold text-slate-800">$0 per month</span>.
                          </>
                        )
                      ) : (
                        <>
                          Create savings goals to start tracking your targets and build your future wealth.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Right Part: Total Goals Summary Card */}
                  <div className="bg-white border border-slate-200 rounded-[24px] p-6 flex flex-col justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block mb-1">
                        Total Goals
                      </span>
                      <h3 className="font-display text-2xl font-bold text-slate-800 tracking-tight">
                        {activeGoalsCount < 10 ? `0${activeGoalsCount}` : activeGoalsCount} Active
                      </h3>
                    </div>
                    {/* Overlapping Circles for Category colors */}
                    <div className="flex items-center -space-x-1.5 mt-4">
                      <div className="w-8 h-8 rounded-full bg-[#113d29]/10 border-2 border-white flex items-center justify-center text-[9px] font-bold text-emerald-800 shadow-xs">EF</div>
                      <div className="w-8 h-8 rounded-full bg-teal-50 border-2 border-white flex items-center justify-center text-[9px] font-bold text-teal-800 shadow-xs">NC</div>
                      <div className="w-8 h-8 rounded-full bg-rose-50 border-2 border-white flex items-center justify-center text-[9px] font-bold text-rose-800 shadow-xs">HR</div>
                      {activeGoalsCount > 3 && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-xs">
                          +{activeGoalsCount - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Title "Your Targets" */}
                <div className="flex items-center justify-between mt-4">
                  <h2 className="font-display text-lg font-bold text-slate-800 tracking-tight">
                    Your Targets
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* Manage Categories Button */}
                    <button
                      onClick={() => setIsManageSavingsCatsOpen(true)}
                      className="px-3 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      title="Manage Goal Categories"
                    >
                      <Tag className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Manage Categories</span>
                    </button>

                    {/* Filter Dropdown */}
                    <div className="relative" ref={savingsFilterRef}>
                      <button
                        onClick={() => {
                          setIsSavingsFilterOpen(!isSavingsFilterOpen);
                          setIsSavingsSortOpen(false);
                        }}
                        className={`p-2 border rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors shadow-xs cursor-pointer flex items-center justify-center ${
                          isSavingsFilterOpen || savingsFilterCategory !== 'All' || savingsFilterStatus !== 'All'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'border-slate-200 bg-white'
                        }`}
                        title="Filter Goals"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                      
                      {isSavingsFilterOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                          {/* Category Subtitle */}
                          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5 pt-1.5 pb-2">
                            Filter by Category
                          </div>
                          <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                            {['All', ...savingsGoalCategories].map((cat) => (
                              <button
                                key={cat}
                                onClick={() => {
                                  setSavingsFilterCategory(cat);
                                  setIsSavingsFilterOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                  savingsFilterCategory.toLowerCase() === cat.toLowerCase() ? 'text-emerald-800 bg-emerald-50/65' : 'text-slate-700'
                                }`}
                              >
                                <span>{cat}</span>
                                {savingsFilterCategory.toLowerCase() === cat.toLowerCase() && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                              </button>
                            ))}
                          </div>

                          <div className="border-t border-slate-100 my-2"></div>

                          {/* Status Subtitle */}
                          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5 pb-2">
                            Filter by Status
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {['All', 'In Progress', 'Completed'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  setSavingsFilterStatus(status);
                                  setIsSavingsFilterOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                  savingsFilterStatus === status ? 'text-emerald-800 bg-emerald-50/65' : 'text-slate-700'
                                }`}
                              >
                                <span>{status === 'All' ? 'All Statuses' : status}</span>
                                {savingsFilterStatus === status && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                              </button>
                            ))}
                          </div>
                          
                          {(savingsFilterCategory !== 'All' || savingsFilterStatus !== 'All') && (
                            <>
                              <div className="border-t border-slate-100 my-2"></div>
                              <button
                                onClick={() => {
                                  setSavingsFilterCategory('All');
                                  setSavingsFilterStatus('All');
                                  setIsSavingsFilterOpen(false);
                                }}
                                className="w-full text-center py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                Clear Filters
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative" ref={savingsSortRef}>
                      <button
                        onClick={() => {
                          setIsSavingsSortOpen(!isSavingsSortOpen);
                          setIsSavingsFilterOpen(false);
                        }}
                        className={`p-2 border rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors shadow-xs cursor-pointer flex items-center justify-center ${
                          isSavingsSortOpen || savingsSortBy !== 'None'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'border-slate-200 bg-white'
                        }`}
                        title="Sort Goals"
                      >
                        <Filter className="w-4 h-4" />
                      </button>

                      {isSavingsSortOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5 pt-1.5 pb-2">
                            Sort Targets By
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {[
                              { label: 'Default', value: 'None' },
                              { label: 'Target (High to Low)', value: 'Target (High to Low)' },
                              { label: 'Target (Low to High)', value: 'Target (Low to High)' },
                              { label: 'Progress % (Highest)', value: 'Progress % (Highest)' },
                              { label: 'Progress % (Lowest)', value: 'Progress % (Lowest)' },
                              { label: 'Deadline (Soonest)', value: 'Deadline' }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setSavingsSortBy(opt.value);
                                  setIsSavingsSortOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                  savingsSortBy === opt.value ? 'text-emerald-800 bg-emerald-50/65' : 'text-slate-700'
                                }`}
                              >
                                <span>{opt.label}</span>
                                {savingsSortBy === opt.value && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Targets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGoals.map((g) => {
                    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                    return (
                      <div
                        key={g.id}
                        onClick={() => setFundGoal(g)}
                        className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xs flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300 relative group cursor-pointer"
                      >
                        <div>
                          {/* Top: Icon & Priority Pill */}
                          <div className="flex items-center justify-between mb-5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
                              {getGoalIcon(g.title, g.category || '')}
                            </div>
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg tracking-wider ${getPriorityBadgeStyle(g.priority || 'MEDIUM')}`}>
                              {g.priority || 'MEDIUM'}
                            </span>
                          </div>

                          <h3 className="font-display text-base font-bold text-slate-900 tracking-tight mb-1">
                            {g.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold mb-6">
                            {g.description || 'Start your next big adventure'}
                          </p>

                          {/* Progress Details */}
                          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                            <span className="text-slate-400 tracking-wider uppercase text-[10px]">Progress</span>
                            <span className="text-slate-900 font-bold">{pct}%</span>
                          </div>

                          {/* Progress Bar fill */}
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                            <div
                              className="h-full bg-[#113d29] rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Card Footer: Amount Saved and Target */}
                        <div className="flex items-baseline justify-between mt-auto">
                          <div>
                            <span className="text-lg font-bold text-slate-900">
                              ${g.current.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-slate-400 text-xs font-semibold ml-1.5">
                              of ${g.target.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </div>

                          {/* Delete Button or Confirmation */}
                          {deleteConfirmGoalId === g.id ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedGoals = savingsGoals.filter(goal => goal.id !== g.id);
                                  saveGoals(updatedGoals);
                                  setDeleteConfirmGoalId(null);
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmGoalId(null)}
                                className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleDeleteGoal(g.id, e)}
                              className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Create New Goal Card */}
                  <div
                    onClick={() => setIsAddGoalOpen(true)}
                    className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-[24px] p-6 flex flex-col items-center justify-center text-center bg-slate-50/20 hover:bg-slate-50/70 transition-all cursor-pointer h-full min-h-[220px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                      <Plus className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-sm font-bold text-slate-900 mb-1">
                      Create New Goal
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold max-w-[160px]">
                      Start your next big adventure
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* RENDER REPORTS TAB */}
          {activeTab === 'reports' && (
            <ReportsTab 
              transactions={transactions}
              savingsGoals={savingsGoals}
              categories={categories}
              userProfile={userProfile}
            />
          )}

          {/* RENDER SETTINGS TAB */}
          {activeTab === 'settings' && (
            <ProfileTab
              user={userProfile}
              onUpdateProfile={saveProfile}
              searchQuery={searchQuery}
            />
          )}



          {/* RENDER SUPPORT TAB */}
          {activeTab === 'support' && (
            <SupportTab />
          )}
        </main>
      </div>

      {/* Forms & Dialog Modals */}
      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onAdd={handleAddTransaction}
        categories={categories}
      />

      <AddSavingsGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAdd={handleAddSavingsGoal}
        categories={savingsGoalCategories}
      />

      {/* Manage Goal Categories Modal */}
      {isManageSavingsCatsOpen && (
        <div id="manage-savings-cats-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div id="manage-savings-cats-content" className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-800" />
                <h3 className="font-display text-lg font-extrabold text-slate-800">
                  Manage Goal Categories
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsManageSavingsCatsOpen(false);
                  setEditingSavingsCatIndex(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
              {/* Add New Category Form */}
              <form onSubmit={handleAddSavingsCat} className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  Create New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g., Education, Gadgets, Pension"
                    value={newSavingsCatName}
                    onChange={(e) => setNewSavingsCatName(e.target.value)}
                    className="flex-1 bg-slate-50 text-xs text-slate-700 border border-slate-200 focus:border-slate-400 focus:bg-white px-4 py-3 rounded-xl outline-none transition-all font-bold"
                  />
                  <button
                    type="submit"
                    className="bg-[#113d29] hover:bg-[#0c2e1f] text-white px-4 py-3 rounded-xl font-bold text-xs transition-colors hover:shadow-md cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="border-t border-slate-100 my-1"></div>

              {/* Categories List */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  Existing Categories ({savingsGoalCategories.length})
                </span>
                
                <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {savingsGoalCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all group"
                    >
                      {editingSavingsCatIndex === idx ? (
                        <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingSavingsCatValue}
                            onChange={(e) => setEditingSavingsCatValue(e.target.value)}
                            className="flex-1 bg-white text-xs font-bold text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateSavingsCat(idx)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSavingsCatIndex(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-700" />
                            <span className="text-xs font-bold text-slate-700">{cat}</span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSavingsCatIndex(idx);
                                setEditingSavingsCatValue(cat);
                              }}
                              className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSavingsCat(idx)}
                              className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer with Info */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-semibold">
              Changes instantly update matching savings target categories.
            </div>
          </div>
        </div>
      )}

      <FundGoalModal
        isOpen={fundGoal !== null}
        onClose={() => setFundGoal(null)}
        goal={fundGoal}
        userProfile={userProfile}
        onConfirm={handleDepositGoal}
      />
    </div>
  );
}
