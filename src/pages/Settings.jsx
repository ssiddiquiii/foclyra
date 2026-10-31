import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { clearProgressAndNotes, exportBackup, importBackup } from '../services/dataCommands';
import { useUIStore } from '../hooks/useUIStore';
import { useAuth } from '../hooks/useAuth';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/FoclyraDB';
import { REGISTERED_MAX_PLAYLISTS } from '../services/quotaService';
import { toast } from '../components/ui/toast';

/**
 * Settings & Console Management Component.
 * Supports:
 * - Account Profile, Cloud Sync & Security Sessions
 * - Danger Zone: Account Deletion (GDPR / Right to be Forgotten)
 * - YouTube API Key management (custom key support)
 * - Local backup JSON export and import
 * - Watch progress and notes clearing
 * - Community feedback reporting
 */
export default function Settings() {
  const { openFeedbackModal, openAuthModal } = useUIStore();
  const { user, profile, signOut, signOutAllDevices, deleteAccount } = useAuth();
  
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
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
    if (stored.trim() === 'AIzaSyAExIAyfPvaaNixl5cz7HZJfNwQdniXP_o') {
      localStorage.removeItem('foclyra_custom_youtube_api_key');
      return '';
    }
    return stored;
  });
  const [keySaved, setKeySaved] = useState(false);

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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 animate-page-entry">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-normal">Settings & Preferences</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed">
          Manage your account profile, cloud sync, security sessions, and local backups.
        </p>
      </div>

      {/* 1. Account & Cloud Profile Section */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-5 bg-card border border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={displayName} 
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/40 shadow-xs flex-shrink-0" 
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base flex-shrink-0">
                {user ? displayName.charAt(0).toUpperCase() : <User size={20} />}
              </div>
            )}
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground truncate">
                  {user ? displayName : 'Guest User'}
                </h2>
                {user && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isGoogleUser 
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {isGoogleUser ? 'Google Account' : 'Email Account'}
                  </span>
                )}
                {user && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                    <Cloud size={12} />
                    <span>Cloud Sync Active</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {user ? user.email : 'You are currently browsing locally without a cloud account (1 trial course).'}
              </p>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={signOut}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition flex items-center gap-1.5 cursor-pointer"
                title="Sign out from this device"
              >
                <LogOut size={13} className="text-muted-foreground" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('default')}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles size={13} />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>

        {/* Quota & Security Details (if logged in) */}
        {user && (
          <div className="pt-2 border-t border-border/60 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Course Limit Meter */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Layers size={13} className="text-primary" />
                    <span>Study Courses Quota</span>
                  </span>
                  <span className="font-bold text-foreground">{activeCount} / {REGISTERED_MAX_PLAYLISTS}</span>
                </div>
                <div className="w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (activeCount / REGISTERED_MAX_PLAYLISTS) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Multi-Device Session Security */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground block flex items-center gap-1.5">
                    <Smartphone size={13} className="text-muted-foreground" />
                    <span>Active Sessions</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    Logged in across authorized devices
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOutAllDevices}
                  className="px-3 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer flex-shrink-0"
                  title="Sign out of all sessions across all phones and computers"
                >
                  Sign Out All Devices
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. YouTube API Configuration */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4 bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 flex-shrink-0">
            <Key size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-normal">YouTube API Configuration (Optional)</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Foclyra includes an automatic serverless proxy with zero-key fallback. You can also provide a personal Google Cloud YouTube Data API v3 key.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Personal API Key
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="AIzaSy... (Leave empty to use built-in proxy)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-muted/60 border border-border text-foreground text-xs font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground transition"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs flex-shrink-0"
              >
                {keySaved ? <CheckCircle2 size={14} /> : null}
                <span>{keySaved ? 'Saved!' : 'Save Key'}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>Status: <strong className={customKey.trim() ? 'text-emerald-500' : 'text-primary'}>{customKey.trim() ? 'Personal Key Active' : 'Automatic Proxy Active'}</strong></span>
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
                className="text-muted-foreground hover:text-destructive transition underline cursor-pointer"
              >
                Clear & Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Local Data Backups */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-5 bg-card border border-border shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-normal mb-1">Local Data Backups</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Foclyra is a local-first application. Your watch progress and notes are stored entirely in your browser.
            We recommend exporting periodic backups to keep your data secure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2.5 px-5 py-3 bg-muted/40 border border-border hover:bg-muted transition rounded-xl font-semibold text-foreground text-xs sm:text-sm cursor-pointer shadow-xs"
          >
            <Download size={16} className="text-muted-foreground" />
            <span>Export Backup JSON</span>
          </button>

          {/* Import button wrapper */}
          <label className={`flex items-center justify-center gap-2.5 px-5 py-3 bg-muted/40 border border-border hover:bg-muted transition rounded-xl font-semibold text-foreground text-xs sm:text-sm shadow-xs ${isImporting ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
            <Upload size={16} className="text-muted-foreground" />
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

      {/* 4. Progress Data Management */}
      <div className="rounded-2xl p-5 sm:p-6 border border-border space-y-4 bg-card shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-normal mb-1">Progress & Notes Reset</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Reset your watch times, checkmarks, and notes to zero. Your course catalogs will stay safe and untouched.
          </p>
        </div>

        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-4 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground hover:bg-muted transition text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={14} className="text-muted-foreground" />
            <span>Clear Watch Progress & Notes</span>
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-4">
            <div className="flex items-start gap-3 text-amber-600 dark:text-amber-400 text-xs">
              <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Confirm Reset Progress & Notes</span>
                <span className="leading-relaxed">Are you sure? All completed checkmarks, watch progress, and notes will be cleared. All course catalogs will remain untouched.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExecuteReset}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-xs"
              >
                Yes, Clear Progress & Notes
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border text-foreground hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Danger Zone: Delete Account (GDPR Compliance) */}
      {user && (
        <div className="rounded-2xl p-5 sm:p-6 border border-red-500/30 bg-red-500/[0.03] space-y-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-base mb-1">
              <AlertTriangle size={18} />
              <span>Danger Zone: Delete Account</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Permanently delete your Foclyra account and purge all associated cloud data including courses, progress, and synchronized notes. This action is irreversible.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete My Account</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 space-y-3.5">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                To confirm permanent deletion of your account and cloud data, please type <strong className="font-mono bg-red-500/20 px-1.5 py-0.5 rounded text-foreground font-bold">DELETE</strong> below:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="text"
                  value={deleteInputText}
                  onChange={(e) => setDeleteInputText(e.target.value)}
                  placeholder="Type DELETE"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-card border border-red-500/40 text-foreground text-xs font-mono focus:outline-none focus:border-red-500 placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  disabled={deleteInputText.trim() !== 'DELETE' || isDeletingAccount}
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
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
                  className="px-3.5 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Community & Feedback Section */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4 bg-card border border-border shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-normal mb-1">Feedback & Error Reporting</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Spotted an issue, missing video duration, or have a suggestion to make Foclyra better?
            We read every single piece of feedback!
          </p>
        </div>
        <div className="pt-1">
          <button
            type="button"
            onClick={openFeedbackModal}
            className="px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <MessageSquarePlus size={16} />
            <span>Send Feedback or Report Bug</span>
          </button>
        </div>
      </div>
    </div>
  );
}
