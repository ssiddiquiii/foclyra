import React from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Trash2, 
  X, 
  ArrowRight, 
  BookOpen,
  Sparkles
} from 'lucide-react';
import Dialog from './ui/Dialog';

/**
 * Editorial Quota Limit Reached Modal.
 * Replaces the confusing auth/signup prompt when a registered user reaches the 5/5 course quota.
 * Provides a respectful, clear, and reassuring explanation of the 5 free study slots without distractions.
 * 
 * @param {{ isOpen: boolean, onClose: () => void, data?: { current?: number, max?: number } }} props
 * @returns {React.JSX.Element | null}
 */
export default function QuotaModal({ isOpen, onClose, data = { current: 5, max: 5 } }) {
  if (!isOpen) return null;

  const currentCount = data?.current || 5;
  const maxLimit = data?.max || 5;

  const handleManageCourses = () => {
    onClose();
    // Smooth scroll down to the course library section on Dashboard
    const courseSection = document.getElementById('courses-section') || document.querySelector('section[aria-label="Your Courses"]');
    if (courseSection) {
      courseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="quota-modal-title"
      placement="center"
      className="max-h-[calc(100vh-4rem)] w-full max-w-md overflow-y-auto rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-6 sm:p-7 shadow-2xl space-y-5 select-none"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-[#F5C542]/15 border border-[#F5C542]/30 flex items-center justify-center text-[#d97706] dark:text-[#F5C542] shadow-2xs shrink-0">
            <BookOpen className="size-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-semibold mb-1">
              <Sparkles className="size-3 text-[#d97706] dark:text-[#F5C542]" />
              <span>{currentCount}/{maxLimit} Study Slots Active</span>
            </div>
            <h2 id="quota-modal-title" className="text-lg sm:text-xl font-bold text-[#111111] dark:text-white tracking-[-0.02em] leading-snug">
              All 5 Study Slots In Use
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close quota notice"
          className="size-8 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Sweet Explanatory Text */}
      <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
        You have filled all <strong className="font-semibold text-zinc-950 dark:text-white">5 of your free course slots</strong>. To protect your attention and keep your learning distraction-free, Foclyra caps active courses at 5 at a time.
      </p>

      {/* Visual Slots Capacity Box */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-zinc-500 dark:text-zinc-400">Library Capacity</span>
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">100% Full ({currentCount}/{maxLimit})</span>
        </div>

        {/* 5-Slot Visual Pills */}
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((slot) => (
            <div
              key={slot}
              className="h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 transition"
              title={`Slot ${slot} in use`}
            >
              <CheckCircle2 className="size-3" />
              <span className="text-[9px] font-mono font-semibold">Slot {slot}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal pt-1">
          Every slot includes full video progress tracking, timestamped notes, and Word (.docx) study exports.
        </p>
      </div>

      {/* Reassurance & Next Steps */}
      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/30 p-3.5 space-y-1.5 text-left">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111111] dark:text-white">
          <Trash2 className="size-3.5 text-zinc-400" />
          <span>How to free up a slot:</span>
        </div>
        <p className="text-[11.5px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Simply delete or complete any older course from your dashboard whenever you're ready. Once a slot opens up, you can import this new playlist immediately.
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
          💡 Tip: You can re-import past courses anytime without penalty.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={handleManageCourses}
          className="w-full h-10 sm:h-11 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] font-semibold text-xs sm:text-sm hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <span>Manage My Courses</span>
          <ArrowRight className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-9 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium text-xs hover:bg-zinc-100 dark:hover:bg-zinc-850 transition cursor-pointer"
        >
          Got It
        </button>
      </div>
    </Dialog>
  );
}

