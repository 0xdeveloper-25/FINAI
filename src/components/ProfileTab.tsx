import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  ShieldCheck,
  ChevronRight,
  Plus,
  Check,
  Building2,
  Trash2,
  Loader2,
  AlertTriangle,
  Sparkles,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserProfile } from '../types';
import { t } from '../utils';

interface ProfileTabProps {
  user: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  searchQuery: string;
}

interface LinkedAccount {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  connected: boolean;
  lastSync: string;
}

export default function ProfileTab({ user, onUpdateProfile, searchQuery }: ProfileTabProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Local States mirroring mockup settings
  const [displayLanguage, setDisplayLanguage] = useState<string>(() => {
    return localStorage.getItem('finai_display_language') || 'English (US)';
  });
  const [currencyDisplay, setCurrencyDisplay] = useState<string>(() => {
    return localStorage.getItem('finai_currency_display') || 'USD ($)';
  });
  const [zenMode, setZenMode] = useState<boolean>(() => {
    return localStorage.getItem('finai_zen_mode') === 'true';
  });

  // Security
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(() => {
    return localStorage.getItem('finai_is_2fa_enabled') === 'true';
  });

  // Notifications
  const [pushAlerts, setPushAlerts] = useState<boolean>(() => {
    const val = localStorage.getItem('finai_push_alerts');
    return val === null ? true : val === 'true';
  });
  const [weeklySummary, setWeeklySummary] = useState<boolean>(() => {
    const val = localStorage.getItem('finai_weekly_summary');
    return val === null ? true : val === 'true';
  });
  const [largeTransaction, setLargeTransaction] = useState<boolean>(() => {
    return localStorage.getItem('finai_large_transaction') === 'true';
  });
  const [marketUpdates, setMarketUpdates] = useState<boolean>(() => {
    return localStorage.getItem('finai_market_updates') === 'true';
  });

  // Linked Accounts
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>(() => {
    const saved = localStorage.getItem('finai_linked_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return [
      {
        id: 'acct-1',
        bankName: 'Chase Bank',
        accountType: 'Checking',
        accountNumber: '8842',
        connected: true,
        lastSync: '2h ago'
      }
    ];
  });

  // Modals visibility
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isLinkBankModalOpen, setIsLinkBankModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isPasswordModalOpen) {
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isPasswordModalOpen]);

  // Modal input fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 2FA state inside modal
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [authCodeError, setAuthCodeError] = useState('');

  // Link bank state inside modal
  const [selectedBank, setSelectedBank] = useState('');
  const [bankUsername, setBankUsername] = useState('');
  const [bankPassword, setBankPassword] = useState('');
  const [isLinkingBankLoading, setIsLinkingBankLoading] = useState(false);

  // Status/Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check if any settings have changed from last saved state
  const hasChanges = useMemo(() => {
    const savedDisplayLanguage = localStorage.getItem('finai_display_language') || 'English (US)';
    const savedCurrencyDisplay = localStorage.getItem('finai_currency_display') || 'USD ($)';
    const savedZenMode = localStorage.getItem('finai_zen_mode') === 'true';
    const savedIs2FAEnabled = localStorage.getItem('finai_is_2fa_enabled') === 'true';
    
    const pa = localStorage.getItem('finai_push_alerts');
    const savedPushAlerts = pa === null ? true : pa === 'true';
    
    const ws = localStorage.getItem('finai_weekly_summary');
    const savedWeeklySummary = ws === null ? true : ws === 'true';
    
    const savedLargeTransaction = localStorage.getItem('finai_large_transaction') === 'true';
    const savedMarketUpdates = localStorage.getItem('finai_market_updates') === 'true';

    const savedAccsRaw = localStorage.getItem('finai_linked_accounts');
    let savedAccs = [
      {
        id: 'acct-1',
        bankName: 'Chase Bank',
        accountType: 'Checking',
        accountNumber: '8842',
        connected: true,
        lastSync: '2h ago'
      }
    ];
    if (savedAccsRaw) {
      try {
        savedAccs = JSON.parse(savedAccsRaw);
      } catch (e) {
        // use default
      }
    }

    const linkedAccountsChanged = JSON.stringify(linkedAccounts) !== JSON.stringify(savedAccs);

    return (
      displayLanguage !== savedDisplayLanguage ||
      currencyDisplay !== savedCurrencyDisplay ||
      zenMode !== savedZenMode ||
      is2FAEnabled !== savedIs2FAEnabled ||
      pushAlerts !== savedPushAlerts ||
      weeklySummary !== savedWeeklySummary ||
      largeTransaction !== savedLargeTransaction ||
      marketUpdates !== savedMarketUpdates ||
      linkedAccountsChanged
    );
  }, [
    displayLanguage,
    currencyDisplay,
    zenMode,
    is2FAEnabled,
    pushAlerts,
    weeklySummary,
    largeTransaction,
    marketUpdates,
    linkedAccounts
  ]);

  // Check if search match occurs for items
  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Re-save all state variables to localStorage
  const handleSaveAllChanges = () => {
    localStorage.setItem('finai_display_language', displayLanguage);
    localStorage.setItem('finai_currency_display', currencyDisplay);
    localStorage.setItem('finai_zen_mode', String(zenMode));
    localStorage.setItem('finai_is_2fa_enabled', String(is2FAEnabled));
    localStorage.setItem('finai_push_alerts', String(pushAlerts));
    localStorage.setItem('finai_weekly_summary', String(weeklySummary));
    localStorage.setItem('finai_large_transaction', String(largeTransaction));
    localStorage.setItem('finai_market_updates', String(marketUpdates));
    localStorage.setItem('finai_linked_accounts', JSON.stringify(linkedAccounts));

    // Also update a general event so other components (like charts) know of Zen Mode or Currency updates!
    window.dispatchEvent(new Event('finai_settings_updated'));
    
    showToast('Changes saved successfully! Your preferences have been updated.', 'success');
  };

  const handleCancelChanges = () => {
    // Reload state from localstorage
    setDisplayLanguage(localStorage.getItem('finai_display_language') || 'English (US)');
    setCurrencyDisplay(localStorage.getItem('finai_currency_display') || 'USD ($)');
    setZenMode(localStorage.getItem('finai_zen_mode') === 'true');
    setIs2FAEnabled(localStorage.getItem('finai_is_2fa_enabled') === 'true');
    
    const pa = localStorage.getItem('finai_push_alerts');
    setPushAlerts(pa === null ? true : pa === 'true');
    const ws = localStorage.getItem('finai_weekly_summary');
    setWeeklySummary(ws === null ? true : ws === 'true');
    setLargeTransaction(localStorage.getItem('finai_large_transaction') === 'true');
    setMarketUpdates(localStorage.getItem('finai_market_updates') === 'true');

    const savedAccs = localStorage.getItem('finai_linked_accounts');
    if (savedAccs) {
      try {
        setLinkedAccounts(JSON.parse(savedAccs));
      } catch (e) {
        // ignore
      }
    }
    showToast('Settings reverted to last saved state.', 'info');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(false);
    showToast('Password updated successfully!', 'success');
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (authCodeInput.length !== 6 || !/^\d+$/.test(authCodeInput)) {
      setAuthCodeError('Please enter a valid 6-digit numerical code.');
      return;
    }

    setAuthCodeError('');
    setIs2FAEnabled(true);
    localStorage.setItem('finai_is_2fa_enabled', 'true');
    setAuthCodeInput('');
    setIs2FAModalOpen(false);
    showToast('Two-Factor Authentication (2FA) is now enabled!', 'success');
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    localStorage.setItem('finai_is_2fa_enabled', 'false');
    showToast('Two-Factor Authentication (2FA) has been disabled.', 'info');
  };

  const handleConnectBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) {
      showToast('Please select a bank.', 'error');
      return;
    }
    if (!bankUsername || !bankPassword) {
      showToast('Please provide your login credentials.', 'error');
      return;
    }

    setIsLinkingBankLoading(true);

    setTimeout(() => {
      const newAcc: LinkedAccount = {
        id: 'acct-' + Date.now(),
        bankName: selectedBank,
        accountType: 'Checking',
        accountNumber: Math.floor(1000 + Math.random() * 9000).toString(),
        connected: true,
        lastSync: 'Just now'
      };

      const updated = [...linkedAccounts, newAcc];
      setLinkedAccounts(updated);
      setIsLinkingBankLoading(false);
      setIsLinkBankModalOpen(false);
      setSelectedBank('');
      setBankUsername('');
      setBankPassword('');
      showToast(`${newAcc.bankName} successfully connected!`, 'success');
    }, 1500);
  };

  const handleDisconnectBank = (accountId: string, bankName: string) => {
    const updated = linkedAccounts.filter(acc => acc.id !== accountId);
    setLinkedAccounts(updated);
    showToast(`Disconnected from ${bankName}.`, 'info');
  };

  // Custom Toggle switch component
  const ToggleSwitch = ({ checked, onChange, id }: { checked: boolean; onChange: (val: boolean) => void; id?: string }) => (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[#113d29]' : 'bg-slate-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div id="tab-profile-settings" className="flex flex-col gap-10 max-w-4xl animate-in fade-in duration-300 pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl shadow-lg border text-sm font-semibold ${
              toastType === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : toastType === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {toastType === 'success' && <Check className="w-4 h-4 text-emerald-700" />}
            {toastType === 'error' && <AlertTriangle className="w-4 h-4 text-rose-700" />}
            {toastType === 'info' && <Info className="w-4 h-4 text-blue-700" />}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: GENERAL PREFERENCES */}
      {(matchesSearch('Display Language') || matchesSearch('Currency Display') || matchesSearch('Zen Mode') || matchesSearch('General Preferences')) && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 id="heading-general-preferences" className="font-display text-lg font-bold text-slate-800 tracking-tight">
              {t('General Preferences')}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {t('Manage your basic account configurations and appearance.')}
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-xs flex flex-col divide-y divide-slate-100">
            {/* Display Language */}
            {matchesSearch('Display Language') && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 first:pt-1 gap-4">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{t('Display Language')}</span>
                  <span className="text-xs text-slate-500 font-medium">{t('Select your preferred interface language.')}</span>
                </div>
                <div className="relative">
                  <select
                    id="select-display-language"
                    value={displayLanguage}
                    onChange={(e) => setDisplayLanguage(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 rounded-xl pl-4 pr-10 py-2.5 outline-none cursor-pointer min-w-[160px] transition-all"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Español">Español</option>
                    <option value="Français">Français</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Currency Display */}
            {matchesSearch('Currency Display') && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 last:pb-1 gap-4">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{t('Currency Display')}</span>
                  <span className="text-xs text-slate-500 font-medium">{t('Set the primary currency for your financial reports.')}</span>
                </div>
                <div className="relative">
                  <select
                    id="select-currency-display"
                    value={currencyDisplay}
                    onChange={(e) => setCurrencyDisplay(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 rounded-xl pl-4 pr-10 py-2.5 outline-none cursor-pointer min-w-[160px] transition-all"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="IDR (Rp)">IDR (Rp)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: SECURITY */}
      {(matchesSearch('Change Password') || matchesSearch('Security')) && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 id="heading-security" className="font-display text-lg font-bold text-slate-800 tracking-tight">
              Security
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Protect your financial data with advanced authentication.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-xs flex flex-col gap-5">
            {/* Change Password */}
            {matchesSearch('Change Password') && (
              <button
                type="button"
                id="btn-trigger-change-password"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center justify-between text-left w-full hover:bg-slate-50/70 p-3 -m-3 rounded-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block group-hover:text-slate-900 transition-colors">Change Password</span>
                    <span className="text-xs text-slate-500 font-medium">Update your security credentials regularly.</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-8 border-t border-slate-200/80 gap-4 mt-4">
        <button
          type="button"
          id="btn-trigger-deactivate-account"
          onClick={() => setIsDeactivateModalOpen(true)}
          className="text-xs font-black text-rose-600 hover:text-rose-700 tracking-wider uppercase cursor-pointer text-left self-start sm:self-center py-2.5"
        >
          Delete Account
        </button>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {hasChanges && (
              <motion.button
                type="button"
                id="btn-cancel-settings-changes"
                onClick={handleCancelChanges}
                initial={{ opacity: 0, scale: 0.95, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-bold px-6 py-2.5 text-xs tracking-wider cursor-pointer transition-colors uppercase"
              >
                {t('Cancel')}
              </motion.button>
            )}
          </AnimatePresence>
          <button
            type="button"
            id="btn-save-settings-changes"
            onClick={handleSaveAllChanges}
            className="bg-[#113d29] hover:bg-[#0c2e1f] text-white font-bold px-7 py-2.5 text-xs tracking-wider rounded-full shadow-sm cursor-pointer transition-all uppercase hover:-translate-y-[1px] active:translate-y-0"
          >
            {t('Save Changes')}
          </button>
        </div>
      </div>

      {/* --- ALL MODALS --- */}

      {/* PASSWORD MODAL */}
      {isMounted && createPortal(
        <AnimatePresence>
          {isPasswordModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                onClick={() => setIsPasswordModalOpen(false)}
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-6 w-full max-w-md z-10 overflow-hidden relative"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900">Change Password</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
                  {passwordError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm pl-4 pr-11 py-3 rounded-xl outline-none focus:bg-white focus:border-[#113d29] transition-all"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm pl-4 pr-11 py-3 rounded-xl outline-none focus:bg-white focus:border-[#113d29] transition-all"
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm pl-4 pr-11 py-3 rounded-xl outline-none focus:bg-white focus:border-[#113d29] transition-all"
                        placeholder="Verify new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsPasswordModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#113d29] hover:bg-[#0c2e1f] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 2FA MODAL */}
      {isMounted && createPortal(
        <AnimatePresence>
          {is2FAModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                onClick={() => setIs2FAModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-6 w-full max-w-md z-10 overflow-hidden relative text-center"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-800">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900">Set Up Two-Factor Authentication</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIs2FAModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* QR Code and simulation text */}
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-inner">
                    {/* Visual simulated QR code */}
                    <div className="grid grid-cols-5 gap-1.5 w-32 h-32 bg-white p-2 border rounded-lg">
                      {[...Array(25)].map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-xs ${
                            (i % 3 === 0 && i % 2 === 0) || i === 0 || i === 4 || i === 20 || i === 24 || i === 12 || i === 8 || i === 18
                              ? 'bg-slate-900'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-left w-full">
                    <span className="text-xs font-bold text-slate-800 block mb-1">Scan QR Code</span>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Open your Google Authenticator or secondary auth application, scan the code above, or enter the manual key below to activate security:
                    </p>
                    <code className="block text-center bg-slate-100 border border-slate-200 rounded-lg py-2 mt-3 font-mono text-[11px] font-bold text-slate-700 tracking-wider">
                      FINAI-AUTH-KEY-6742-X90
                    </code>
                  </div>
                </div>

                <form onSubmit={handleVerify2FA} className="flex flex-col gap-4 text-left">
                  {authCodeError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{authCodeError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verification Pin</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={authCodeInput}
                      onChange={(e) => setAuthCodeInput(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-sm px-4 py-3 rounded-xl outline-none focus:bg-white focus:border-[#113d29] text-center font-mono tracking-widest font-extrabold text-slate-800"
                      placeholder="000 000"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button
                      type="button"
                      onClick={() => setIs2FAModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#113d29] hover:bg-[#0c2e1f] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      Verify & Activate
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* LINK NEW BANK MODAL */}
      {isMounted && createPortal(
        <AnimatePresence>
          {isLinkBankModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                onClick={() => setIsLinkBankModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-6 w-full max-w-md z-10 overflow-hidden relative"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-slate-100" />
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900">Link External Account</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLinkBankModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleConnectBankSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Institution</label>
                    <select
                      required
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-sm px-4 py-3 rounded-xl outline-none focus:bg-white focus:border-[#113d29] cursor-pointer"
                    >
                      <option value="">-- Choose a Bank --</option>
                      <option value="Chase Bank">Chase Bank</option>
                      <option value="Bank of America">Bank of America</option>
                      <option value="Wells Fargo">Wells Fargo</option>
                      <option value="Citibank">Citibank</option>
                      <option value="HSBC Bank">HSBC Bank</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Online Banking Username</label>
                    <input
                      type="text"
                      required
                      value={bankUsername}
                      onChange={(e) => setBankUsername(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-sm px-4 py-3 rounded-xl outline-none focus:bg-white focus:border-[#113d29] transition-all"
                      placeholder="Enter bank login username"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Online Banking Password</label>
                    <input
                      type="password"
                      required
                      value={bankPassword}
                      onChange={(e) => setBankPassword(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-sm px-4 py-3 rounded-xl outline-none focus:bg-white focus:border-[#113d29] transition-all"
                      placeholder="••••••••••••"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 flex items-start gap-2.5 border border-slate-100 text-slate-500 text-xs leading-relaxed mt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      Your connection credentials are encrypted end-to-end. We do not store or read your plaintext password context.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsLinkBankModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLinkingBankLoading}
                      className="bg-[#113d29] hover:bg-[#0c2e1f] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 min-w-[120px]"
                    >
                      {isLinkingBankLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Linking...</span>
                        </>
                      ) : (
                        <span>Connect Securely</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* DEACTIVATE ACCOUNT MODAL */}
      {isMounted && createPortal(
        <AnimatePresence>
          {isDeactivateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                onClick={() => setIsDeactivateModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-6 w-full max-w-md z-10 overflow-hidden relative"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900">Delete FINAI Account</h3>
                </div>

                <div className="flex flex-col gap-4">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Are you absolutely sure you want to delete your FINAI account? This action is permanent and will result in:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-slate-500 font-medium flex flex-col gap-1.5">
                    <li>Deleting all transaction history and logs</li>
                    <li>Removing connected savings goal parameters</li>
                    <li>Wiping offline client container keys & tokens</li>
                    <li>Terminating your premium membership privileges</li>
                  </ul>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsDeactivateModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      Keep Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeactivateModalOpen(false);
                        // Clear localstorage and reload page as simple mock
                        localStorage.clear();
                        showToast('Account has been successfully deleted and reset.', 'info');
                        setTimeout(() => window.location.reload(), 1500);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Confirm Deletion
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
