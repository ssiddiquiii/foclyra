import { migrateGuestPlaylistToAccount } from '../services/cloudSyncService';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Cloud, ShieldCheck, Mail, ArrowRight, Lock, CheckCircle2, AlertCircle, Check, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../hooks/useUIStore';
import { trackEvent } from '../services/analytics';

/**
 * Editorial Cloud Sign-In & Registration Modal.
 * Matches Landing Page and Studio Dashboard minimalist editorial aesthetic.
 * Fully responsive across all devices (320px mobile to 4K desktop, landscape & portrait).
 */
export default function AuthModal({ isOpen: propIsOpen, onClose: propOnClose, context: propContext }) {
  const { authModalOpen, closeAuthModal, authModalContext } = useUIStore();
  const isOpen = propIsOpen !== undefined ? propIsOpen : authModalOpen;
  const onClose = propOnClose !== undefined ? propOnClose : closeAuthModal;
  const context = propContext !== undefined ? propContext : authModalContext;
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isConfigured } = useAuth();
  const navigate = useNavigate();
  
  // Default to signup when opening from guest limit, otherwise signin
  const [authMode, setAuthMode] = useState(() => (context === 'guest_limit' ? 'signup' : 'signin'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      trackEvent('auth_modal_opened', { context: context || 'default' });
      if (context === 'guest_limit') {
        setAuthMode('signup');
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, context]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      setErrorMsg('Supabase credentials are not configured yet. Add VITE_SUPABASE_URL in your .env file.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      trackEvent('auth_attempt', { method: 'google', context });
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!isConfigured) {
      setErrorMsg('Supabase is not configured yet. Add VITE_SUPABASE_URL in .env.');
      return;
    }
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (authMode === 'signup') {
        const result = await signUpWithEmail(email, password, fullName);
        trackEvent('user_signed_up', { method: 'email', context });
        if (result?.session?.user) {
          await migrateGuestPlaylistToAccount(result.session.user).catch(() => {});
          onClose();
          const intended = sessionStorage.getItem('foclyra_intended_path');
          sessionStorage.removeItem('foclyra_intended_path');
          navigate(intended || '/studio');
        } else {
          setSuccessMsg('Account created! Please check your email to confirm registration, or sign in now.');
        }
      } else {
        const result = await signInWithEmail(email, password);
        trackEvent('user_signed_in', { method: 'email', context });
        if (result?.session?.user) {
          await migrateGuestPlaylistToAccount(result.session.user).catch(() => {});
        }
        onClose();
        const intended = sessionStorage.getItem('foclyra_intended_path');
        sessionStorage.removeItem('foclyra_intended_path');
        navigate(intended || '/studio');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const isGuestLimit = context === 'guest_limit';
  const isRegisteredLimit = context === 'registered_limit';

  return (
    <AnimatePresence>
      <div 
        data-testid="auth-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-[420px] max-h-[calc(100dvh-2rem)] flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[26px] sm:rounded-[28px] shadow-2xl overflow-hidden my-auto"
        >
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-zinc-200/50 dark:bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-zinc-300/40 dark:bg-zinc-700/30 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>

          {/* Interior Scrollable Content */}
          <div className="overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-4">
            {/* Header */}
            <div className="pr-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-950 dark:text-zinc-50 text-[10.5px] font-semibold mb-2">
                <Sparkles size={11} />
                <span>
                  {isGuestLimit 
                    ? 'Guest Trial Complete' 
                    : isRegisteredLimit 
                    ? 'Quota Limit Reached' 
                    : authMode === 'signup' 
                    ? 'Get Started Free' 
                    : 'Welcome to Foclyra'}
                </span>
              </div>
              
              <h2 className="text-xl sm:text-[22px] font-semibold text-[#111111] dark:text-white tracking-[-0.025em] leading-snug">
                {isGuestLimit 
                  ? 'Unlock 5 Free Course Slots' 
                  : isRegisteredLimit 
                  ? '5/5 Study Playlists In Use' 
                  : authMode === 'signup'
                  ? 'Create your Foclyra Account'
                  : 'Sign in to Foclyra Cloud'}
              </h2>
              
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                {isGuestLimit
                  ? "Create a free account to unlock up to 5 study courses, automatic cloud backup, and multi-device notes."
                  : isRegisteredLimit
                  ? 'You have reached the 5-playlist quota. You can delete or archive a course in Studio anytime to make space!'
                  : authMode === 'signup'
                  ? 'Join free to save up to 5 courses, sync timestamped notes, and export study guides.'
                  : 'Keep your notes, watch progress, and study workflows synchronized across all devices.'}
              </p>
            </div>

            {/* 2-Tab Mode Switcher Capsule (Sign In vs Create Account) */}
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200/80 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 h-8 rounded-full text-xs font-semibold transition cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 h-8 rounded-full text-xs font-semibold transition cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Compact Value Strip */}
            <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 font-medium px-1">
              <span className="inline-flex items-center gap-1.5">
                <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />
                <span>5 Courses</span>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Cloud size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />
                <span>Cloud Backup</span>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />
                <span>100% Free</span>
              </span>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs">
                <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{successMsg}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 h-10.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold shadow-2xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{loading ? 'Connecting...' : authMode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-400 dark:text-zinc-500 font-semibold tracking-wider">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Full Name</label>
                  <div className="relative">
                    <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Turing"
                      className="w-full h-9.5 pl-9 pr-3.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white shadow-2xs transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full h-9.5 pl-9 pr-3.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white shadow-2xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-9.5 pl-9 pr-3.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white shadow-2xs transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10.5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium transition cursor-pointer disabled:opacity-50 mt-1 flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
              >
                <span>{loading ? 'Processing...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={13} />
              </button>
            </form>

            {/* Secondary Toggle Link */}
            <div className="pt-1 text-center">
              {authMode === 'signup' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11.5px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition underline underline-offset-2 cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11.5px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition underline underline-offset-2 cursor-pointer"
                >
                  Don't have an account? Sign up for free
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
