import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { toast } from '../components/ui/toast';
import { trackEvent } from '../services/analytics';

/**
 * Editorial Password Reset Page.
 * Landed upon when user clicks the password recovery link sent to their email.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, user } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);

  useEffect(() => {
    // Check if recovery session is active
    async function checkSession() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsRecoveryReady(true);
      }
    }

    checkSession();

    // Listen for PASSWORD_RECOVERY event
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || session) {
          setIsRecoveryReady(true);
        }
      });
      return () => subscription?.unsubscribe();
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(newPassword);
      trackEvent('password_reset_completed');
      setSuccess(true);
      toast.add({
        title: 'Password updated',
        description: 'Your password has been successfully reset. Redirecting to your Studio...',
        type: 'success',
        timeout: 4000,
      });

      setTimeout(() => {
        navigate('/studio', { replace: true });
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update password. Your recovery link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-white dark:bg-[#0a0a0c] text-[#111111] dark:text-[#f5f5f7] selection:bg-[#F5C542]/40">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center">
        <Link to="/" className="flex items-center gap-2 mb-4 group">
          <img src="/logo.svg" alt="Foclyra" className="size-8 transition-transform group-hover:scale-105" />
          <span className="font-semibold text-lg tracking-[-0.02em] text-zinc-950 dark:text-white">Foclyra</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 dark:bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header Badge */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-semibold mb-2">
            <KeyRound size={11} className="text-amber-500" />
            <span>Account Security</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {success ? 'Password Reset Complete' : 'Set New Password'}
          </h1>
          <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            {success
              ? 'Your password has been changed successfully. You can now use your new credentials to sign in.'
              : 'Choose a strong password with at least 6 characters for your Foclyra account.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {success ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
              <span>Password successfully updated! Redirecting to Studio...</span>
            </div>

            <Link
              to="/studio"
              className="w-full h-10.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow-sm"
            >
              <span>Go to Studio Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-10 pl-9.5 pr-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <ShieldCheck size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your new password"
                  className="w-full h-10 pl-9.5 pr-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] mt-2"
            >
              <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
              <ArrowRight size={14} />
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/"
                className="text-[11.5px] text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition underline underline-offset-2"
              >
                Back to Foclyra Home
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
