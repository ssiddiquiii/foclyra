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
 * Beta Status Modal
 * Explains that FocusFlow is in an active Public Beta development phase,
 * while assuring the user that core features (local storage, notes, video)
 * are rock-solid, production-ready, and safe for daily learning.
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
      className="max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-sm flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="beta-modal-title" className="text-lg font-bold text-foreground tracking-tight">
                Foclyra Studio
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Public Beta
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Version 1.0.0-beta • Local-First Study Studio
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close beta information"
          className="min-h-9 min-w-9 rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </div>

      {/* Core Message Card */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
          <span>Active Development, Reliable for Daily Use</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Foclyra is currently in Public Beta. We are continuously adding refinements and new superpowers, but the core engine is <strong>rock-solid, tested, and safe for daily deep work</strong>.
        </p>
      </div>

      {/* 3 Pillars of Stability */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">100% Safe & Local-First</span>
            <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
              All your courses, watch progress, timestamps, and notes stay encrypted inside your browser's IndexedDB. Your data never leaves your device and works offline.
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">Distraction-Free Architecture</span>
            <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
              Algorithm feeds, recommendations, comments, and sidebars are permanently stripped away so you can finish what you start.
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Hammer size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">Active Weekly Updates</span>
            <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
              We regularly ship optimizations for mobile responsiveness, player controls, and YouTube playlist synchronization.
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
        <button
          type="button"
          onClick={handleOpenFeedback}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <MessageSquarePlus size={15} />
          <span>Have an Idea or Bug? Send Feedback</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition cursor-pointer shadow-sm text-center"
        >
          Got it
        </button>
      </div>
    </Dialog>
  );
}
