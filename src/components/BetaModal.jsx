import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Hammer, 
  MessageSquarePlus, 
  CheckCircle2, 
  X
} from 'lucide-react';
import Dialog from './ui/Dialog';
import { useUIStore } from '../hooks/useUIStore';

/**
 * Editorial Beta Status Modal.
 * Matches Landing Page and Studio Dashboard minimalist editorial aesthetic.
 */
export default function BetaModal({ isOpen, onClose }) {
  const { openFeedbackModal } = useUIStore();

  if (!isOpen) return null;

  const handleOpenFeedback = () => {
    onClose();
    setTimeout(() => openFeedbackModal(), 50);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="beta-modal-title"
      placement="center"
      className="max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-6 sm:p-7 shadow-2xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center text-zinc-950 dark:text-zinc-50 shadow-2xs flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="beta-modal-title" className="text-lg font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                Foclyra Studio
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Public Beta
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Version 1.0.0-beta • Local-First Study Studio
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close beta information"
          className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center flex-shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* Core Message Card */}
      <div className="p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-950 dark:text-zinc-50">
          <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
          <span>Active Development, Reliable for Daily Use</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Foclyra is currently in Public Beta. We are continuously adding refinements and new superpowers, but the core engine is <strong>rock-solid, tested, and safe for daily deep work</strong>.
        </p>
      </div>

      {/* 3 Pillars of Stability Bento Cards */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck size={15} />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50 block">100% Safe & Local-First</span>
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed block mt-0.5">
              All your courses, watch progress, timestamps, and notes stay encrypted inside your browser's IndexedDB. Your data never leaves your device and works offline.
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap size={15} />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50 block">Distraction-Free Architecture</span>
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed block mt-0.5">
              Algorithm feeds, recommendations, comments, and sidebars are permanently stripped away so you can finish what you start.
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Hammer size={15} />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50 block">Active Weekly Updates</span>
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed block mt-0.5">
              We regularly ship optimizations for mobile responsiveness, player controls, and YouTube playlist synchronization.
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={handleOpenFeedback}
          className="w-full sm:w-auto h-9 px-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <MessageSquarePlus size={14} />
          <span>Have an Idea or Bug? Send Feedback</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto h-9 px-5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium transition cursor-pointer shadow-xs text-center active:scale-[0.98]"
        >
          Got it
        </button>
      </div>
    </Dialog>
  );
}
