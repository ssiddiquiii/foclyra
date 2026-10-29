import React, { useState } from 'react';
import { Download, Upload, ShieldAlert, RotateCcw, Key, CheckCircle2 } from 'lucide-react';
import { clearProgressAndNotes, exportBackup, importBackup } from '../services/dataCommands';
import { useUIStore } from '../hooks/useUIStore';
import { MessageSquarePlus } from 'lucide-react';
import { toast } from '../components/ui/toast';

/**
 * Settings & Console Management Component.
 * Supports:
 * - Theme selection (Light / Dark mode)
 * - Local backup JSON export and import
 * - YouTube API Key management (custom key support)
 * - Watch progress and notes clearing
 */
export default function Settings() {
  const { openFeedbackModal } = useUIStore();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 animate-page-entry">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-normal">Settings & Preferences</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed">Manage your local database backups, YouTube API configuration, and data preferences.</p>
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