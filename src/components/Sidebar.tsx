import { LayoutGrid, FileText, PiggyBank, BarChart3, User, Settings, CreditCard, HelpCircle, Plus } from 'lucide-react';
import { NavTab } from '../types';
import { t } from '../utils';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onAddTransactionClick: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  onAddTransactionClick,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutGrid },
    { id: 'transactions' as NavTab, label: 'Transactions', icon: FileText },
    { id: 'savings-goals' as NavTab, label: 'Savings Goals', icon: PiggyBank },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
    { id: 'support' as NavTab, label: 'Support', icon: HelpCircle },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-6 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex flex-col select-none">
            <span className="font-display text-2xl font-black text-slate-900 tracking-tight">
              FIN<span className="text-primary">AI</span>
            </span>
            <span className="font-sans text-xs text-slate-500 font-medium tracking-wide">Personal Finance</span>
          </div>
 
          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`relative flex items-center gap-3.5 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 group text-left ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-primary' : 'text-slate-400'
                    }`}
                  />
                  <span>{t(item.label)}</span>
                  {isActive && (
                    <div
                      id={`nav-active-indicator-${item.id}`}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-primary rounded-l-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
 
        {/* Add Transaction Button */}
        <div className="mt-auto pt-4">
          <button
            id="sidebar-add-transaction-btn"
            onClick={() => {
              onAddTransactionClick();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#002b1a] text-white py-3 px-4 rounded-md font-sans text-sm font-medium shadow-sm transition-all duration-300 hover:-translate-y-[2px] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Add Transaction')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
