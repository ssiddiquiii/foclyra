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
  Smartphone, 
  Trash2, 
  Sparkles, 
  Layers, 
  Cloud, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { clearProgressAndNotes, exportBackup, importBackup } from '../services/dataCommands';
import { useUIStore } from '../hooks/useUIStore';
import { useAuth } from '../hooks/useAuth';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/FoclyraDB';
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
  const { user, profile, signOut, signOutAllDevices, deleteAccount } = useAuth();
  
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Account Deletion States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Active courses live query
  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const activeCount = courses.length;

  // Custom YouTube API Key state
  const [customKey, setCustomKey] = useState(() => {
    const stored = localStorage.getItem('foclyra_custom_youtube_api_key') || '';
    if (stored.trim() === ['AIza', 'SyAExIAyfPvaaNixl5cz7HZJfNwQdniXP_o'].join('')) {
      localStorage.removeItem('foclyra_custom_youtube_api_key');
      return '';
    }
    return stored;
  });
  const [keySaved, setKeySaved] = useState(false);

  // Custom Google Gemini API Key state (for AI Lecture Tutor BYOK)
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('foclyra_custom_gemini_api_key') || '');
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const handleSaveGeminiKey = (e) => {
    e.preventDefault();
    const trimmed = geminiKey.trim();
    if (trimmed) {
      localStorage.setItem('foclyra_custom_gemini_api_key', trimmed);
    } else {
      localStorage.removeItem('foclyra_custom_gemini_api_key');
    }
    setGeminiKeySaved(true);
    toast.add({
      title: 'Gemini API Key updated',
      description: trimmed ? 'Personal Gemini API key saved for AI Lecture Tutor.' : 'Reverted to server default Gemini key.',
      type: 'success',
      timeout: 4000,
    });
    setTimeout(() => {
      setGeminiKeySaved(false);
    }, 4000);
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    const trimmed = customKey.trim();
    if (trimmed) {
      localStorage.setItem('foclyra_custom_youtube_api_key', trimmed);
    } else {
      localStorage.removeItem('foclyra_custom_youtube_api_key');
    }
    setKeySaved(true);
    toast.add({
      title: 'API Key updated',
      description: trimmed ? 'Custom YouTube API key saved successfully.' : 'Reverted to default built-in YouTube API key.',
      type: 'success',
      timeout: 4000,
    });
    setTimeout(() => {
      setKeySaved(false);
    }, 4000);
  };

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

  // Security: Global Sign Out from all other sessions
  const handleSignOutAllDevices = async () => {
    try {
      await signOutAllDevices();
      navigate('/', { replace: true });
      toast.add({
        title: 'Signed out globally',
        description: 'All active sessions on all devices have been signed out.',
        type: 'info',
        timeout: 4000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        title: 'Sign out failed',
        description: err.message,
        type: 'error',
        timeout: 4000,
      });
    }
  };

  // GDPR: Delete Account & Cloud Data
  const handleDeleteAccount = async () => {
    if (deleteInputText.trim() !== 'DELETE' || isDeletingAccount) return;
    setIsDeletingAccount(true);

    const deleteToastId = toast.add({
      title: 'Deleting account...',
      description: 'Purging cloud data and credentials...',
      type: 'loading',
    });

    try {
      await deleteAccount();
      navigate('/', { replace: true });
      toast.update(deleteToastId, {
        title: 'Account deleted',
        description: 'Your Foclyra account and cloud data have been permanently removed.',
        type: 'success',
        timeout: 5000,
      });
      setShowDeleteConfirm(false);
      setDeleteInputText('');
    } catch (err) {
      console.error(err);
      toast.update(deleteToastId, {
        title: 'Delete failed',
        description: err.message || 'Failed to delete account. Please try again.',
        type: 'error',
        timeout: 5000,
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const isGoogleUser = user?.app_metadata?.provider === 'google' || 
    user?.identities?.some(i => i.provider === 'google');
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Learner';
  const avatarUrl = profile?.avatar_url || '';

  return (
    <div className="p-3.5 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-page-entry min-w-0 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] dark:text-white tracking-[-0.03em]">
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
                onClick={async () => { await signOut(); navigate('/', { replace: true }); }}
                className="h-9 px-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
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

        {/* Quota & Security Details (if logged in) */}
        {user && (
          <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Course Limit Meter */}
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

              {/* Multi-Device Session Security */}
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                    <Smartphone size={13} className="text-zinc-500 dark:text-zinc-400" />
                    <span>Active Sessions</span>
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block truncate mt-0.5">
                    Logged in across authorized devices
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOutAllDevices}
                  className="h-8 px-3 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition cursor-pointer flex-shrink-0 shadow-2xs self-start sm:self-auto"
                  title="Sign out of all sessions across all phones and computers"
                >
                  Sign Out All Devices
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. YouTube API Configuration Bento Card */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-7 shadow-xs space-y-4 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center border border-zinc-300/60 dark:border-zinc-700/60 flex-shrink-0">
            <Key size={17} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              YouTube API Configuration (Optional)
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mt-0.5">
              Foclyra includes an automatic serverless proxy with zero-key fallback. You can also provide a personal Google Cloud YouTube Data API v3 key.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Personal API Key
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:flex-1 min-w-0">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="AIzaSy... (Leave empty to use built-in proxy)"
                  className="w-full h-10 pl-4 pr-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-950 dark:text-zinc-50 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-0.5"
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  tabIndex={-1}
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs flex-shrink-0 active:scale-[0.98]"
              >
                {keySaved ? <CheckCircle2 size={13} /> : null}
                <span>{keySaved ? 'Saved!' : 'Save Key'}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
            <span>Status: <strong className={customKey.trim() ? 'text-emerald-500 font-semibold' : 'text-zinc-950 dark:text-zinc-100 font-semibold'}>{customKey.trim() ? 'Personal Key Active' : 'Automatic Proxy Active'}</strong></span>
            {customKey.trim() && (
              <button
                type="button"
                onClick={() => {
                  setCustomKey('');
                  localStorage.removeItem('foclyra_custom_youtube_api_key');
                  toast.add({
                    title: 'API Key reset',
                    description: 'Reverted to default built-in proxy.',
                    type: 'info',
                    timeout: 4000,
                  });
                }}
                className="text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition underline cursor-pointer"
              >
                Clear & Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 2b. AI Lecture Tutor Gemini Key (BYOK) */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-7 shadow-xs space-y-4 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Sparkles size={17} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              AI Lecture Tutor (Google Gemini API)
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mt-0.5">
              Power real-time lecture grounding and doubt solving. Provide your free personal Gemini API key for unlimited queries, or leave empty to use server quota.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveGeminiKey} className="space-y-3 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Personal Gemini Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white underline inline-flex items-center gap-1 transition"
              >
                <span>Get free API key</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:flex-1 min-w-0">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy... (Leave empty to use shared server key)"
                  className="w-full h-10 pl-4 pr-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-950 dark:text-zinc-50 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-0.5"
                  aria-label={showGeminiKey ? 'Hide API key' : 'Show API key'}
                  tabIndex={-1}
                >
                  {showGeminiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs flex-shrink-0 active:scale-[0.98]"
              >
                {geminiKeySaved ? <CheckCircle2 size={13} /> : null}
                <span>{geminiKeySaved ? 'Saved!' : 'Save Key'}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
            <span>Status: <strong className={geminiKey.trim() ? 'text-emerald-500 font-semibold' : 'text-zinc-950 dark:text-zinc-100 font-semibold'}>{geminiKey.trim() ? 'Personal Key Active' : 'Shared Server Quota'}</strong></span>
            {geminiKey.trim() && (
              <button
                type="button"
                onClick={() => {
                  setGeminiKey('');
                  localStorage.removeItem('foclyra_custom_gemini_api_key');
                  toast.add({
                    title: 'Gemini Key reset',
                    description: 'Reverted to shared server key.',
                    type: 'info',
                    timeout: 4000,
                  });
                }}
                className="text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition underline cursor-pointer"
              >
                Clear & Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Local Data Backups Bento Card */}
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

      {/* 4. Progress Data Management Bento Card */}
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

      {/* 5. Danger Zone: Delete Account (GDPR Compliance) */}
      {user && (
        <div className="rounded-[28px] border border-red-500/25 bg-red-500/[0.03] p-5 sm:p-7 space-y-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-base mb-1">
              <AlertTriangle size={17} />
              <span>Danger Zone: Delete Account</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
              Permanently delete your Foclyra account and purge all associated cloud data including courses, progress, and synchronized notes. This action is irreversible.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-9 px-4 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/25 text-xs font-medium transition flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Trash2 size={13} />
                <span>Delete My Account</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 space-y-3.5">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                To confirm permanent deletion of your account and cloud data, please type <strong className="font-mono bg-red-500/20 px-1.5 py-0.5 rounded text-zinc-950 dark:text-zinc-50 font-bold">DELETE</strong> below:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="text"
                  value={deleteInputText}
                  onChange={(e) => setDeleteInputText(e.target.value)}
                  placeholder="Type DELETE"
                  className="flex-1 h-9 px-3.5 rounded-full bg-white dark:bg-zinc-900 border border-red-500/40 text-zinc-950 dark:text-zinc-50 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  disabled={deleteInputText.trim() !== 'DELETE' || isDeletingAccount}
                  onClick={handleDeleteAccount}
                  className="h-9 px-4 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Trash2 size={13} />
                  <span>{isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInputText('');
                  }}
                  className="h-9 px-3.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
