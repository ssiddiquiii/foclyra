import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Upload, 
  ShieldAlert, 
  RotateCcw, 
  Key, 
  CheckCircle2, 
  MessageSquarePlus, 
  User, 
  LogOut, 
  Sparkles, 
  Layers, 
  Cloud, 
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { clearProgressAndNotes, exportBackup, importBackup } from '../services/dataCommands';
import { useUIStore } from '../hooks/useUIStore';
import { useAuth } from '../hooks/useAuth';
import { useClerk } from '@clerk/clerk-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/FoclyraDB';
import { ENABLE_AI_FEATURES } from '../config/features';
import { REGISTERED_MAX_PLAYLISTS } from '../services/quotaService';
import { toast } from '../components/ui/toast';

/**
 * Editorial Settings & Preferences Console.
 * Matches Landing Page and Studio Dashboard minimalist editorial aesthetic.
 * @returns {React.JSX.Element}
 */
export default function Settings() {
  const navigate = useNavigate();
  const { openFeedbackModal, openAuthModal } = useUIStore();
  const { user, profile, signOut } = useAuth();
  const clerk = useClerk();
  
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Active courses live query
  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const activeCount = courses.length;

  const handleExport = async () => {
    const exportToastId = toast.add({
      title: 'Exporting backup...',
      description: 'Generating backup file...',
      type: 'loading',
    });
    try {
      const backupData = await exportBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `foclyra-backup-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.update(exportToastId, {
        title: 'Backup exported',
        description: 'Backup downloaded successfully.',
        type: 'success',
        timeout: 4000,
      });
    } catch (err) {
      console.error(err);
      toast.update(exportToastId, {
        title: 'Export failed',
        description: `Failed to export backup: ${err.message}`,
        type: 'error',
        timeout: 4000,
      });
    }
  };

  const handleImport = async (e) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || isImporting) return;

    setIsImporting(true);
    const importToastId = toast.add({
      title: 'Importing backup...',
      description: 'Reading backup file...',
      type: 'loading',
    });

    try {
      const text = await file.text();
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch {
        throw new SyntaxError('Invalid JSON file format. Please select a valid JSON backup file.');
      }
      await importBackup(parsedData);
      toast.update(importToastId, {
        title: 'Backup restored',
        description: 'Backup restored successfully.',
        type: 'success',
        timeout: 4000,
      });
    } catch (err) {
      console.error(err);
      let errorDescription;
      if (err instanceof SyntaxError) {
        errorDescription = err.message;
      } else if (err?.name === 'ZodError' || err?.issues) {
        errorDescription = 'Invalid backup schema structure. Schema validation failed.';
      } else {
        errorDescription = `Failed to restore backup: ${err.message || 'Database restoration error'}`;
      }
      toast.update(importToastId, {
        title: 'Restore failed',
        description: errorDescription,
        type: 'error',
        timeout: 4500,
      });
    } finally {
      input.value = '';
      setIsImporting(false);
    }
  };

  const handleExecuteReset = async () => {
    try {
      await clearProgressAndNotes();
      toast.add({
        title: 'Progress & notes cleared',
        description: 'Watch progress and timestamped notes cleared successfully. All course catalogs remain intact.',
        type: 'success',
        timeout: 4000,
      });
      setShowConfirmReset(false);
    } catch (err) {
      console.error(err);
      toast.add({
        title: 'Reset failed',
        description: `Reset failed: ${err.message}`,
        type: 'error',
        timeout: 4000,
      });
    }
  };

  const isGoogleUser = user?.app_metadata?.provider === 'google' || 
    user?.identities?.some(i => i.provider === 'google');
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Learner';
  const avatarUrl = profile?.avatar_url || '';

  return (
    <div className="p-3.5 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-page-entry min-w-0 w-full font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white tracking-[-0.03em]">
          Settings & Preferences
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 leading-relaxed">
          Manage your account profile, cloud sync, security sessions, and local backups.
        </p>
      </div>

      {/* 1. Account & Cloud Profile Bento Card */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-4 sm:p-7 shadow-xs space-y-5 backdrop-blur-xs min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3.5 min-w-0 w-full">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={displayName} 
                className="w-11 sm:w-12 h-11 sm:h-12 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700 shadow-xs flex-shrink-0" 
              />
            ) : (
              <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300/60 dark:border-zinc-700/60 flex items-center justify-center font-bold text-base flex-shrink-0">
                {user ? displayName.charAt(0).toUpperCase() : <User size={18} />}
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50 truncate">
                  {user ? displayName : 'Guest User'}
                </h2>
                {user && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isGoogleUser 
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                      : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300/70 dark:border-zinc-700/70'
                  }`}>
                    {isGoogleUser ? 'Google Account' : 'Email Account'}
                  </span>
                )}
                {user && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Cloud size={12} />
                    <span>Cloud Sync Active</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed break-words">
                {user ? user.email : 'You are currently browsing locally without a cloud account (1 trial course).'}
              </p>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (clerk?.openUserProfile) {
                    clerk.openUserProfile();
                  }
                }}
                className="h-9 px-4 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                title="Manage active devices, password, and account security"
              >
                <ShieldCheck size={14} className="text-emerald-400 dark:text-emerald-600" />
                <span>Manage Account & Security</span>
              </button>
              <button
                type="button"
                onClick={async () => { await signOut(); navigate('/', { replace: true }); }}
                className="h-9 px-3.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sign out from this device"
              >
                <LogOut size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('default')}
              className="h-9 px-4 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] shrink-0"
            >
              <Sparkles size={13} />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>

        {/* Quota Details (if logged in) */}
        {user && (
          <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                  <Layers size={13} className="text-zinc-900 dark:text-zinc-100" />
                  <span>Study Courses Quota</span>
                </span>
                <span className="font-bold text-zinc-950 dark:text-zinc-50 font-mono">{activeCount} / {REGISTERED_MAX_PLAYLISTS}</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (activeCount / REGISTERED_MAX_PLAYLISTS) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. API Keys Bento Card */}
      {ENABLE_AI_FEATURES && (
        <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xs">
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight mb-1">
              API Keys
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed max-w-xl">
              Add your own OpenAI, Google Gemini, Anthropic, or YouTube Data API keys for unlimited usage. Keys are stored encrypted in your browser.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/api-keys')}
            className="h-9 px-4 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto active:scale-[0.98]"
          >
            <span>Manage keys</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {/* 4. Local Data Backups Bento Card */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-7 shadow-xs space-y-4 backdrop-blur-xs">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight mb-1">
            Local Data Backups
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
            Foclyra is a local-first application. Your watch progress and notes are stored entirely in your browser.
            We recommend exporting periodic backups to keep your data secure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2.5 h-11 px-5 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition rounded-full font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm cursor-pointer shadow-2xs"
          >
            <Download size={15} className="text-zinc-500 dark:text-zinc-400" />
            <span>Export Backup JSON</span>
          </button>

          {/* Import button wrapper */}
          <label className={`flex items-center justify-center gap-2.5 h-11 px-5 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition rounded-full font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm shadow-2xs ${isImporting ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
            <Upload size={15} className="text-zinc-500 dark:text-zinc-400" />
            <span>{isImporting ? 'Restoring Backup...' : 'Import Backup JSON'}</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport} 
              disabled={isImporting} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* 5. Progress Data Management Bento Card */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-7 shadow-xs space-y-4 backdrop-blur-xs">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight mb-1">
            Progress & Notes Reset
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
            Reset your watch times, checkmarks, and notes to zero. Your course catalogs will stay safe and untouched.
          </p>
        </div>

        {!showConfirmReset ? (
          <div className="pt-1">
            <button
              onClick={() => setShowConfirmReset(true)}
              className="h-9 px-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-xs font-medium flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <RotateCcw size={13} className="text-zinc-500 dark:text-zinc-400" />
              <span>Clear Watch Progress & Notes</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3.5">
            <div className="flex items-start gap-3 text-amber-600 dark:text-amber-400 text-xs">
              <ShieldAlert size={17} className="flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Confirm Reset Progress & Notes</span>
                <span className="leading-relaxed">Are you sure? All completed checkmarks, watch progress, and notes will be cleared. All course catalogs will remain untouched.</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleExecuteReset}
                className="h-8.5 px-4 text-xs font-medium rounded-full bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-xs"
              >
                Yes, Clear Progress & Notes
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="h-8.5 px-4 text-xs font-medium rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Community & Feedback Bento Card */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-7 shadow-xs space-y-4 backdrop-blur-xs">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight mb-1">
            Feedback & Error Reporting
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
            Spotted an issue, missing video duration, or have a suggestion to make Foclyra better?
            We read every single piece of feedback!
          </p>
        </div>
        <div className="pt-1">
          <button
            type="button"
            onClick={openFeedbackModal}
            className="h-9 px-4 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <MessageSquarePlus size={14} />
            <span>Send Feedback or Report Bug</span>
          </button>
        </div>
      </div>
    </div>
  );
}
