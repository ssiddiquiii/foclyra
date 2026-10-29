import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Cloud, ShieldCheck, Mail, ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../hooks/useUIStore';

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

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      setErrorMsg('Supabase credentials are not configured yet. Add VITE_SUPABASE_URL in your .env file.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
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
        if (result?.session) {
          onClose();
        } else {
          setSuccessMsg('Account created! Please check your email to confirm registration or sign in.');
        }
      } else {
        await signInWithEmail(email, password);
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
          className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-semibold mb-3">
              <Sparkles size={13} />
              <span>{isGuestLimit ? 'Guest Trial Complete' : isRegisteredLimit ? 'Course Limit Reached' : 'Welcome to Foclyra'}</span>
            </div>
            
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {isGuestLimit 
                ? 'Unlock 5 Free Course Slots' 
                : isRegisteredLimit 
                ? '5/5 Study Playlists In Use' 
                : 'Sign in to Foclyra Cloud'}
            </h2>
            
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {isGuestLimit
                ? "You've enjoyed your 1 free guest trial! Create a free account to unlock up to 5 courses, automatic cloud backup, and multi-device study notes."
                : isRegisteredLimit
                ? 'You have reached the 5-playlist limit. You can always re-import any of your previous playlists without consuming a slot!'
                : 'Keep your notes, watch progress, and study workflows securely synchronized across all your devices.'}
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[11px]">
              <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
              <span className="text-muted-foreground font-medium">5 Study Courses</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[11px]">
              <Cloud size={16} className="text-primary flex-shrink-0" />
              <span className="text-muted-foreground font-medium">Cloud Note Backup</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-sm transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
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
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold">Or continue with email</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'email_signup' && (
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Turing"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/40 text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/40 text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition cursor-pointer disabled:opacity-50 mt-1"
            >
              <span>{loading ? 'Processing...' : mode === 'email_signup' ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Toggle Sign in / Sign up Mode */}
          <div className="mt-4 text-center">
            {mode === 'email_signup' ? (
              <button
                type="button"
                onClick={() => setMode('email_signin')}
                className="text-[11px] text-muted-foreground hover:text-foreground transition underline cursor-pointer"
              >
                Already have an account? Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('email_signup')}
                className="text-[11px] text-muted-foreground hover:text-foreground transition underline cursor-pointer"
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
