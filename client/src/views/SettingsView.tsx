import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle,
  AlertCircle,
  Lock,
  Download,
  Palette,
  FileText,
  DollarSign,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { UserSettings, CURRENCIES, PAYMENT_TERMS_OPTIONS, InvoiceTemplateId } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    defaultCurrency: 'INR',
    defaultCurrencySymbol: '₹',
    defaultTax: 18.0,
    defaultPaymentTerms: 'Net 30',
    invoicePrefix: 'INV-2026-',
    nextInvoiceNumber: 1001,
    defaultTemplate: 'modern-blue',
    defaultAccentColor: '#123B5D',
    defaultFontFamily: 'Inter',
    defaultNotes: 'Thank you for your business! Please remit payment within the agreed terms.',
    defaultTerms:
      '1. Payment is required as per agreed terms.\n2. Invoices past due date may incur standard late interest.',
    dateFormat: 'YYYY-MM-DD',
    darkMode: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSettings();
      if (res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCurrencyChange = (code: string) => {
    const sel = CURRENCIES.find((c) => c.code === code);
    setSettings({
      ...settings,
      defaultCurrency: code,
      defaultCurrencySymbol: sel?.symbol || '₹',
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      const res = await api.updateSettings(settings);
      if (res.settings) {
        setSettings(res.settings);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(false);

      await api.changePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleBackupExport = async () => {
    try {
      const [invRes, clientRes, prodRes] = await Promise.all([
        api.getInvoices({ limit: 1000 }),
        api.getClients(),
        api.getProducts(),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        user: { name: user?.name, email: user?.email },
        settings,
        invoices: invRes.invoices || [],
        clients: clientRes.clients || [],
        products: prodRes.products || [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `InvoicePro_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      alert('Failed to generate export backup.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex justify-center">
        <RefreshCw className="w-6 h-6 text-[#55B9E8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Workspace & Invoice Defaults
          </h1>
          <p className="text-xs text-[#718596] mt-0.5">
            Configure system numbering formats, standard payment terms and account security.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Defaults Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider pb-3 border-b border-[#DCE5EB]">
            Invoice Numbering & Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-mono font-bold text-[#123B5D] focus:outline-none focus:border-[#55B9E8]"
              />
              <span className="text-[10px] text-[#718596] mt-1 block">
                Example output: {settings.invoicePrefix}{settings.nextInvoiceNumber}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Next Invoice Number Counter
              </label>
              <input
                type="number"
                min="1"
                value={settings.nextInvoiceNumber}
                onChange={(e) =>
                  setSettings({ ...settings, nextInvoiceNumber: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-mono font-bold text-[#123B5D] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Default Currency
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.defaultTax}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTax: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Default Payment Terms
              </label>
              <select
                value={settings.defaultPaymentTerms}
                onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              >
                {PAYMENT_TERMS_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Default Invoice Template
              </label>
              <select
                value={settings.defaultTemplate}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTemplate: e.target.value as InvoiceTemplateId })
                }
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              >
                <option value="modern-blue">Modern Blue</option>
                <option value="minimal-white">Minimal White</option>
                <option value="corporate-pro">Corporate Pro</option>
                <option value="elegant-business">Elegant Business</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Default Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.defaultAccentColor}
                  onChange={(e) => setSettings({ ...settings, defaultAccentColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-[#DCE5EB] cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.defaultAccentColor}
                  onChange={(e) => setSettings({ ...settings, defaultAccentColor: e.target.value })}
                  className="w-32 px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-mono text-[#183247]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Default Invoice Notes
            </label>
            <textarea
              rows={2}
              value={settings.defaultNotes}
              onChange={(e) => setSettings({ ...settings, defaultNotes: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Default Terms & Conditions
            </label>
            <textarea
              rows={3}
              value={settings.defaultTerms}
              onChange={(e) => setSettings({ ...settings, defaultTerms: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8] resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#55B9E8]" />
              <span>{isSaving ? 'Saving...' : 'Save Defaults'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Security: Change Password */}
      <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider pb-3 border-b border-[#DCE5EB] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#55B9E8]" />
          Account Security & Password
        </h2>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Password updated successfully!</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="flex items-center gap-2 px-4 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5 text-[#55B9E8]" />
            <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      {/* Data Backup / Export */}
      <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider">
            Workspace Backup & Data Portability
          </h2>
          <p className="text-xs text-[#718596] mt-0.5">
            Download a complete JSON export of all your invoices, client ledgers, settings and items.
          </p>
        </div>

        <button
          onClick={handleBackupExport}
          className="flex items-center gap-2 px-4 py-2 bg-[#EAF6FC] hover:bg-[#EAF6FC]/80 text-[#123B5D] border border-[#55B9E8]/30 text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-[#55B9E8]" />
          <span>Export All Data (JSON)</span>
        </button>
      </div>
    </div>
  );
};

