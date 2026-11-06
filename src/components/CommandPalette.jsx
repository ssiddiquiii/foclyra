import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Settings, X, MessageSquarePlus, Key } from 'lucide-react';
import Dialog from './ui/Dialog';
import { useUIStore } from '../hooks/useUIStore';

/**
 * Editorial Command Palette & Global Search Modal (Ctrl + K or ⌘K).
 * Allows power learners to jump to pages and see shortcuts.
 * Matches Landing Page and Studio Dashboard minimalist editorial aesthetic.
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
      className="max-h-[calc(100dvh-5rem)] w-full max-w-2xl overflow-hidden rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-2xl"
    >
      <h2 id="command-palette-title" className="sr-only">Command palette</h2>
      {/* Search Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 backdrop-blur-md">
        <Search size={16} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
        <input
          aria-label="Search commands and pages"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or page name... (Press Esc to close)"
          className="w-full bg-transparent text-zinc-950 dark:text-zinc-50 text-sm font-medium focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          autoFocus
        />
        <button 
          onClick={onClose}
          aria-label="Close command palette"
          className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center flex-shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* Results Container */}
      <div className="p-3.5 max-h-96 overflow-y-auto space-y-4">
        {/* Quick Navigation Commands */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-2">Quick Navigation</span>
            <button
              onClick={() => handleSelectRoute('/studio')}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-800/60 transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={15} className="text-zinc-900 dark:text-zinc-100" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Studio Dashboard</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">Alt + D</span>
            </button>

            <button
              onClick={() => handleSelectRoute('/api-keys')}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-800/60 transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Key size={15} className="text-amber-500" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">AI & Cloud API Keys (Vault)</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">Alt + K</span>
            </button>

            <button
              onClick={() => handleSelectRoute('/settings')}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-800/60 transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Settings size={15} className="text-zinc-500 dark:text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Settings & Preferences</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">Alt + S</span>
            </button>

            <button
              onClick={handleFeedback}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-800/60 transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <MessageSquarePlus size={15} className="text-zinc-900 dark:text-zinc-100" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Send Feedback / Report Issue</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">Feedback</span>
            </button>
          </div>

          {/* Keyboard Shortcuts Cheat Sheet */}
          <div className="p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2.5">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Power Learner Shortcuts</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
              <div><kbd className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-mono text-[10px] shadow-2xs mr-1.5">Ctrl + K</kbd> Palette</div>
              <div><kbd className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-mono text-[10px] shadow-2xs mr-1.5">Space</kbd> Play / Pause</div>
              <div><kbd className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-mono text-[10px] shadow-2xs mr-1.5">Alt + D</kbd> Dashboard</div>
              <div><kbd className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-mono text-[10px] shadow-2xs mr-1.5">Alt + S</kbd> Settings</div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
