import React from 'react';
import { 
  ShieldAlert, 
  X, 
  BookOpen, 
  AlertTriangle, 
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Dialog from './ui/Dialog';

/**
 * Educational Policy Enforcement Modal.
 * Displayed when user attempts to import non-educational or prohibited content (music, movies, documentaries, vlogs, gaming).
 * 
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   data?: {
 *     title?: string,
 *     decision?: string,
 *     reason?: string,
 *     violations?: string[],
 *     categories?: string[]
 *   }
 * }} props
 */
export default function EducationalPolicyModal({ isOpen, onClose, data = {} }) {
  if (!isOpen) return null;

  const isReview = data?.decision === 'REVIEW';
  const violations = Array.isArray(data?.violations) ? data.violations : [];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="educational-policy-title"
      placement="center"
      className="max-h-[calc(100vh-4rem)] w-full max-w-md overflow-y-auto rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-6 sm:p-7 shadow-2xl space-y-5 select-none"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs shrink-0">
            {isReview ? <AlertTriangle className="size-5" /> : <ShieldAlert className="size-5" />}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10.5px] font-semibold mb-1">
              <Sparkles className="size-3 text-amber-500" />
              <span>{isReview ? 'Verification Required' : 'Educational Policy Guard'}</span>
            </div>
            <h2 id="educational-policy-title" className="text-lg sm:text-xl font-bold text-[#111111] dark:text-white tracking-[-0.02em] leading-snug">
              {isReview ? 'Unverified Content' : 'Learning Content Only'}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close notice"
          className="size-8 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Course Title Preview */}
      {data?.title && (
        <div className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80">
          <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Attempted Import</p>
          <p className="text-xs sm:text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 mt-0.5">
            {data.title}
          </p>
        </div>
      )}

      {/* Explanatory Message */}
      <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
        {data?.reason || 'Foclyra is an intentional study space reserved exclusively for structured tutorials, coding bootcamps, academic lectures, and skill courses.'}
      </p>

      {/* Violations List if present */}
      {violations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Policy Violations ({violations.length})
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {violations.slice(0, 5).map((violation, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/15 text-[11px] text-red-700 dark:text-red-300"
              >
                <XCircle className="size-3.5 shrink-0 mt-0.5 text-red-500" />
                <span className="leading-snug">{violation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allowed Content Reference */}
      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80 space-y-1.5">
        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>What you can import:</span>
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
          Programming courses, mathematics & science lessons, language learning, cooking tutorials, professional development, and technical crash courses.
        </p>
      </div>

      {/* Action Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer"
        >
          Understood
        </button>
      </div>
    </Dialog>
  );
}

