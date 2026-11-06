import React, { useState } from 'react';
import {
  FileText,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Flame,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { isFirebaseConfigured, initFirebase } from '../services/firebase.js';

export const AuthView: React.FC = () => {
  const { login, register, loginWithGoogle, demoLogin, sendResetEmail, isFirebaseActive } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // Firebase Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [configSuccess, setConfigSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (!name.trim()) {
          setError('Name is required.');
          setIsLoading(false);
          return;
        }
        await register(name, email, password);
      } else if (mode === 'forgot') {
        await sendResetEmail(email);
        setForgotMessage('If an account exists with this email, password reset instructions have been dispatched.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in was canceled or failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await demoLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to launch demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };
    localStorage.setItem('invoicify_firebase_config', JSON.stringify(config));
    initFirebase(config);
    setConfigSuccess(true);
    setTimeout(() => {
      setShowConfigModal(false);
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#123B5D] to-[#1E4E75] shadow-lg mb-4 text-white">
          <FileText className="w-7 h-7 text-[#55B9E8]" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#123B5D] tracking-tight">
          Invoicify <span className="text-[#55B9E8]">PRO</span>
        </h2>
        <p className="mt-1.5 text-xs text-[#718596] font-medium flex items-center justify-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-500" />
          <span>Firebase Authentication & Cloud Workspace</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-[#DCE5EB]">
          {/* Mode Switcher */}
          <div className="flex border-b border-[#DCE5EB] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold transition-colors ${
                mode === 'login'
                  ? 'border-b-2 border-[#123B5D] text-[#123B5D]'
                  : 'text-[#718596] hover:text-[#183247]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold transition-colors ${
                mode === 'register'
                  ? 'border-b-2 border-[#123B5D] text-[#123B5D]'
                  : 'text-[#718596] hover:text-[#183247]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {forgotMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{forgotMessage}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 text-[#183247] border border-[#DCE5EB] rounded-xl text-xs font-semibold shadow-xs transition-colors mb-4 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DCE5EB]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-[#718596] bg-white px-3">
              Or with email & password
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Full Name / Business Owner *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718596]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander Hayes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718596]" />
                <input
                  type="email"
                  required
                  placeholder="billing@yourdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-[#183247]">
                    Password *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-[#55B9E8] hover:text-[#123B5D]"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718596]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <span>
                {isLoading
                  ? 'Verifying...'
                  : mode === 'login'
                  ? 'Sign In to Account'
                  : mode === 'register'
                  ? 'Create My Account'
                  : 'Send Password Reset Link'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#55B9E8]" />
            </button>
          </form>

          {/* Quick 1-Click Demo Login Banner */}
          <div className="mt-6 pt-4 border-t border-[#DCE5EB]">
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#EAF6FC] hover:bg-[#EAF6FC]/80 text-[#123B5D] border border-[#55B9E8]/30 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#55B9E8]" />
              <span>Launch 1-Click Demo Account</span>
            </button>
          </div>

          {/* Firebase Project Settings Link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="text-[11px] text-[#718596] hover:text-[#123B5D] inline-flex items-center gap-1"
            >
              <Settings className="w-3 h-3 text-[#55B9E8]" />
              <span>Configure Custom Firebase Credentials</span>
            </button>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-[#718596]">
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-4 h-4 text-[#55B9E8] mb-1" />
            <span>Encrypted User Isolation</span>
          </div>
          <div className="flex flex-col items-center">
            <Flame className="w-4 h-4 text-amber-500 mb-1" />
            <span>Cloud Invoices Storage</span>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-4 h-4 text-[#55B9E8] mb-1" />
            <span>GitHub Pages Ready</span>
          </div>
        </div>
      </div>

      {/* Firebase Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DCE5EB] w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#DCE5EB] mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-[#123B5D]">Firebase Project Setup</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[#718596] hover:text-[#183247] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {configSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 text-center font-semibold">
                Firebase credentials saved! Reloading application...
              </div>
            ) : (
              <form onSubmit={handleSaveFirebaseConfig} className="space-y-3 text-xs">
                <p className="text-[#718596] text-[11px] mb-2">
                  Paste your Firebase web application credentials from the Firebase Console (Project Settings ➔ General ➔ Your apps):
                </p>

                <div>
                  <label className="block font-semibold text-[#183247] mb-0.5">API Key (apiKey) *</label>
                  <input
                    type="text"
                    required
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg focus:outline-none focus:border-[#55B9E8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#183247] mb-0.5">Auth Domain *</label>
                    <input
                      type="text"
                      required
                      placeholder="project.firebaseapp.com"
                      value={authDomain}
                      onChange={(e) => setAuthDomain(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg focus:outline-none focus:border-[#55B9E8]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#183247] mb-0.5">Project ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="my-project-123"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg focus:outline-none focus:border-[#55B9E8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#183247] mb-0.5">App ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="1:123456789:web:abcdef"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg focus:outline-none focus:border-[#55B9E8]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#183247] mb-0.5">Messaging Sender ID</label>
                    <input
                      type="text"
                      placeholder="123456789"
                      value={messagingSenderId}
                      onChange={(e) => setMessagingSenderId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg focus:outline-none focus:border-[#55B9E8]"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#DCE5EB]">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-3 py-1.5 border border-[#DCE5EB] rounded-lg text-[#718596] hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#123B5D] text-white rounded-lg font-semibold hover:bg-[#123B5D]/90"
                  >
                    Save & Initialize Firebase
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
