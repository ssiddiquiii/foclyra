import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Settings, X, MessageSquarePlus } from 'lucide-react';
import Dialog from './ui/Dialog';
import { useUIStore } from '../hooks/useUIStore';

/**
 * Command Palette & Global Search Modal (Ctrl + K or ⌘K)
 * Allows power learners to jump to pages and see shortcuts.
 * Theme-aware and lightweight.
 */
export default function CommandPalette({ isOpen, onClose, returnFocusRef }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { openFeedbackModal } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFeedback = () => {
    onClose();
    setTimeout(() => openFeedbackModal(), 50);
  };

  const handleSelectRoute = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="command-palette-title"
      placement="top"
      returnFocusRef={returnFocusRef}
      className="max-h-[calc(100dvh-5rem)] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
    >
      <h2 id="command-palette-title" className="sr-only">Command palette</h2>
      {/* Search Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-muted/40">
        <Search size={18} className="text-muted-foreground flex-shrink-0" />
        <input
          aria-label="Search commands and pages"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or page name... (Press Esc to close)"
          className="w-full bg-transparent text-foreground text-sm font-medium focus:outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        <button 
          onClick={onClose}
          aria-label="Close command palette"
          className="min-h-11 min-w-11 rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </div>

      {/* Results Container */}
      <div className="p-3 max-h-96 overflow-y-auto space-y-4">
        {/* Quick Navigation Commands */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Quick Navigation</span>
            <button
              onClick={() => handleSelectRoute('/studio')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-muted border border-transparent hover:border-border transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={16} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">Dashboard & Masterclasses</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">Alt + D</span>
            </button>

            <button
              onClick={() => handleSelectRoute('/settings')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-muted border border-transparent hover:border-border transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Settings size={16} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Settings & Preferences</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">Alt + S</span>
            </button>

            <button
              onClick={handleFeedback}
              className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-muted border border-transparent hover:border-border transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <MessageSquarePlus size={16} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">Send Feedback / Report Issue</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">Feedback</span>
            </button>
          </div>

          {/* Keyboard Shortcuts Cheat Sheet */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">⌨️ Power Learner Shortcuts</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div><kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-mono">Ctrl + K</kbd> Command Palette</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-mono">Space</kbd> Play / Pause Video</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-mono">Alt + D</kbd> Dashboard</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-mono">Alt + S</kbd> Settings</div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
