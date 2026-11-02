import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Cloud, ShieldCheck, Mail, ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../hooks/useUIStore';
import { trackEvent } from '../services/analytics';
import { useEffect } from 'react';

/**
 * Editorial Cloud Sign-In & Registration Modal.
 * Matches Landing Page and Studio Dashboard minimalist editorial aesthetic.
 */
export default function AuthModal({ isOpen: propIsOpen, onClose: propOnClose, context: propContext }) {
  const { authModalOpen, closeAuthModal, authModalContext } = useUIStore();
  const isOpen = propIsOpen !== undefined ? propIsOpen : authModalOpen;
  const onClose = propOnClose !== undefined ? propOnClose : closeAuthModal;
  const context = propContext !== undefined ? propContext : authModalContext;
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isConfigured } = useAuth();
  const [mode, setMode] = useState('google'); // 'google' | 'email_signin' | 'email_signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      trackEvent('auth_modal_opened', { context: context || 'default' });
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
      if (mode === 'email_signup') {
        const result = await signUpWithEmail(email, password, fullName);
        trackEvent('user_signed_up', { method: 'email', context });
        if (result?.session) {
          onClose();
        } else {
          setSuccessMsg('Account created! Please check your email to confirm registration or sign in.');
        }
      } else {
        await signInWithEmail(email, password);
        trackEvent('user_signed_in', { method: 'email', context });
        onClose();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[28px] p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-zinc-200/50 dark:bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-950 dark:text-zinc-50 text-[11px] font-semibold mb-3">
              <Sparkles size={12} />
              <span>{isGuestLimit ? 'Guest Trial Complete' : isRegisteredLimit ? 'Course Limit Reached' : 'Welcome to Foclyra'}</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-semibold text-[#111111] dark:text-white tracking-[-0.025em]">
              {isGuestLimit 
                ? 'Unlock 5 Free Course Slots' 
                : isRegisteredLimit 
                ? '5/5 Study Playlists In Use' 
                : 'Sign in to Foclyra Cloud'}
            </h2>
            
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
              {isGuestLimit
                ? "You've enjoyed your 1 free guest trial! Create a free account to unlock up to 5 courses, automatic cloud backup, and multi-device study notes."
                : isRegisteredLimit
                ? 'You have reached the 5-playlist limit. You can always re-import any of your previous playlists without consuming a slot!'
                : 'Keep your notes, watch progress, and study workflows securely synchronized across all your devices.'}
            </p>
          </div>

          {/* Feature Badges Bento Row */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 text-[11px] shadow-2xs">
              <ShieldCheck size={15} className="text-emerald-500 flex-shrink-0" />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">5 Study Courses</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 text-[11px] shadow-2xs">
              <Cloud size={15} className="text-zinc-950 dark:text-zinc-100 flex-shrink-0" />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Cloud Note Backup</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold shadow-2xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
            <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-400 font-semibold tracking-wider">Or continue with email</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'email_signup' && (
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Turing"
                  className="w-full h-10 px-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white shadow-2xs transition"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full h-10 pl-10 pr-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white shadow-2xs transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-10 pr-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white shadow-2xs transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium transition cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
            >
              <span>{loading ? 'Processing...' : mode === 'email_signup' ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight size={13} />
            </button>
          </form>

          {/* Toggle Sign in / Sign up Mode */}
          <div className="mt-4 text-center">
            {mode === 'email_signup' ? (
              <button
                type="button"
                onClick={() => setMode('email_signin')}
                className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition underline cursor-pointer"
              >
                Already have an account? Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('email_signup')}
                className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition underline cursor-pointer"
              >
                Don't have an account? Sign up for free
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
