import React, { useState } from 'react';
import { Download, Upload, ShieldAlert, RotateCcw, Key, CheckCircle2, Sun, Moon } from 'lucide-react';
import { clearProgressAndNotes, exportBackup, importBackup } from '../services/dataCommands';
import { useTheme } from '../hooks/useTheme';
import { useUIStore } from '../hooks/useUIStore';
import { MessageSquarePlus } from 'lucide-react';

/**
 * Settings & Console Management Component.
 * Supports:
 * - Theme selection (Light / Dark mode)
 * - Local backup JSON export and import
 * - YouTube API Key management (custom key support)
 * - Watch progress and notes clearing
 */
export default function Settings() {
  const { isDark, setTheme } = useTheme();
  const { openFeedbackModal, openBetaModal } = useUIStore();
  const [statusMsg, setStatusMsg] = useState({ text: '', type: 'info' });
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Custom YouTube API Key state
  const [customKey, setCustomKey] = useState(() => {
    const stored = localStorage.getItem('focusflow_custom_youtube_api_key') || '';
    if (stored.trim() === 'AIzaSyAExIAyfPvaaNixl5cz7HZJfNwQdniXP_o') {
      localStorage.removeItem('focusflow_custom_youtube_api_key');
      return '';
    }
    return stored;
  });
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    const trimmed = customKey.trim();
    if (trimmed) {
      localStorage.setItem('focusflow_custom_youtube_api_key', trimmed);
    } else {
      localStorage.removeItem('focusflow_custom_youtube_api_key');
    }
    setKeySaved(true);
    setStatusMsg({ text: trimmed ? 'Custom YouTube API key saved successfully.' : 'Reverted to default built-in YouTube API key.', type: 'success' });
    setTimeout(() => {
      setKeySaved(false);
      setStatusMsg({ text: '', type: 'info' });
    }, 3000);
  };

  const handleExport = async () => {
    setStatusMsg({ text: 'Generating backup file...', type: 'info' });
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
      
      setStatusMsg({ text: 'Backup downloaded successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: `Failed to export backup: ${err.message}`, type: 'error' });
    }
  };

  const handleImport = async (e) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || isImporting) return;

    setIsImporting(true);
    setStatusMsg({ text: 'Reading backup file...', type: 'info' });

    try {
      const text = await file.text();
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch {
        throw new SyntaxError('Invalid JSON file format. Please select a valid JSON backup file.');
      }

      await importBackup(parsedData);
      setStatusMsg({ text: 'Backup restored successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      if (err instanceof SyntaxError) {
        setStatusMsg({ text: err.message, type: 'error' });
      } else if (err?.name === 'ZodError' || err?.issues) {
        setStatusMsg({ text: 'Invalid backup schema structure. Schema validation failed.', type: 'error' });
      } else {
        setStatusMsg({ text: `Failed to restore backup: ${err.message || 'Database restoration error'}`, type: 'error' });
      }
    } finally {
      input.value = '';
      setIsImporting(false);
    }
  };

  const handleExecuteReset = async () => {
    try {
      await clearProgressAndNotes();
      setStatusMsg({ text: 'Watch progress and timestamped notes cleared successfully. All course catalogs remain intact.', type: 'success' });
      setShowConfirmReset(false);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: `Reset failed: ${err.message}`, type: 'error' });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 animate-page-entry">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-normal">Settings & Preferences</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed">Customize your theme appearance, local database backups, and YouTube API configuration.</p>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
          statusMsg.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' :
          'bg-muted text-muted-foreground border-border'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Theme Appearance Selector */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 bg-card border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 flex-shrink-0">
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-normal">Interface Theme</h2>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Choose between Option 1 "Obsidian Studio" dark mode and clean "Warm Paper" light mode.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
              !isDark
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun size={16} className="text-amber-500" />
              <span>Light Mode (Warm Paper)</span>
            </div>
            {!isDark && <CheckCircle2 size={16} className="text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
              isDark
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon size={16} className="text-orange-400" />
              <span>Dark Mode (Obsidian)</span>
            </div>
            {isDark && <CheckCircle2 size={16} className="text-primary" />}
          </button>
        </div>
      </div>

      {/* YouTube API Configuration */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 bg-card border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 flex-shrink-0">
            <Key size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-normal">YouTube API Configuration (Optional)</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Foclyra includes an automatic proxy with zero-key fallback. You can also provide a personal Google Cloud YouTube Data API v3 key.
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
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
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
                  localStorage.removeItem('focusflow_custom_youtube_api_key');
                  setStatusMsg({ text: 'Reverted to default built-in proxy.', type: 'info' });
                }}
                className="text-muted-foreground hover:text-destructive transition underline cursor-pointer"
              >
                Clear & Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Local Data Backups */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5 bg-card border border-border shadow-sm">
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
            className="flex items-center justify-center gap-2.5 px-5 py-3 bg-muted/40 border border-border hover:bg-muted transition rounded-xl font-semibold text-foreground text-xs sm:text-sm cursor-pointer shadow-sm"
          >
            <Download size={16} className="text-muted-foreground" />
            <span>Export Backup JSON</span>
          </button>

          {/* Import button wrapper */}
          <label className={`flex items-center justify-center gap-2.5 px-5 py-3 bg-muted/40 border border-border hover:bg-muted transition rounded-xl font-semibold text-foreground text-xs sm:text-sm shadow-sm ${isImporting ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
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

      {/* Progress Data Management */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-border space-y-4 bg-card shadow-sm">
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
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-sm"
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

      {/* System Status & Beta Architecture Section */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 bg-card border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-foreground tracking-normal">About Foclyra Studio</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Public Beta v1.0
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Actively maintained learning environment. The core local storage, markdown notes, and distraction-free YouTube player are stable and reliable for daily use.
            </p>
          </div>
          <button
            type="button"
            onClick={openBetaModal}
            className="px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted border border-border text-foreground text-xs font-semibold transition cursor-pointer flex-shrink-0 self-start sm:self-auto"
          >
            Beta Details & Architecture
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Storage Model</span>
            <span className="text-xs font-semibold text-foreground block">Client-Side IndexedDB</span>
            <span className="text-[11px] text-muted-foreground">100% private on your machine</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Core Stability</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Stable & Battle-Tested
            </span>
            <span className="text-[11px] text-muted-foreground">Safe for continuous study</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Release Cycle</span>
            <span className="text-xs font-semibold text-foreground block">Continuous Ship</span>
            <span className="text-[11px] text-muted-foreground">Weekly improvements</span>
          </div>
        </div>
      </div>

      {/* Community & Feedback Section */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 bg-card border border-border shadow-sm">
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
            className="px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <MessageSquarePlus size={16} />
            <span>Send Feedback or Report Bug</span>
          </button>
        </div>
      </div>
    </div>
  );
}