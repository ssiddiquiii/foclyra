import React from 'react';
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Circle } from 'lucide-react';

/**
 * Editorial Watch Details bar.
 * Clean lecture title, channel badge, and high-contrast control pills.
 */
export function WatchDetails({
  course,
  lesson,
  currentIndex = 0,
  totalLessons = 1,
  isCompleted = false,
  onToggleComplete,
  prevLessonId,
  nextLessonId,
  onNavigate
}) {
  return (
    <div className="px-3 sm:px-6 py-3.5 max-w-7xl w-full mx-auto border-b border-zinc-200/80 dark:border-zinc-800/80">
      {/* Title */}
      <h1 className="text-base sm:text-lg md:text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug">
        {lesson.title}
      </h1>

      {/* Meta & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 pt-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[180px] sm:max-w-xs">
            {course.channelName || 'YouTube Creator'}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="font-mono text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 font-medium flex-shrink-0 border border-zinc-200/70 dark:border-zinc-700/70">
            Lecture {currentIndex + 1} of {totalLessons}
          </span>
        </div>

        {/* Quick Progress & Navigation Controls: Next button right aligned */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2.5">
          {onToggleComplete && (
            <button
              type="button"
              onClick={onToggleComplete}
              className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium transition cursor-pointer active:scale-[0.98] shadow-2xs shrink-0 ${
                isCompleted
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border border-zinc-950 dark:border-white'
                  : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/80'
              }`}
            >
              {isCompleted ? (
                <div className="w-3.5 h-3.5 rounded-full bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white flex items-center justify-center shrink-0">
                  <Check size={10} strokeWidth={3} />
                </div>
              ) : (
                <Circle size={13} className="text-zinc-400" />
              )}
              <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto sm:ml-0 shrink-0">
            {prevLessonId && (
              <button
                type="button"
                onClick={() => onNavigate(prevLessonId)}
                className="flex items-center gap-1 h-8 px-3 rounded-full bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800/80 text-xs font-medium transition cursor-pointer shadow-2xs shrink-0"
                title="Previous Lecture"
              >
                <ChevronLeft size={13} />
                <span className="hidden sm:inline">Prev</span>
              </button>
            )}

            {nextLessonId && (
              <button
                type="button"
                onClick={() => onNavigate(nextLessonId)}
                className="flex items-center gap-1 h-8 px-3.5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium shadow-xs transition cursor-pointer active:scale-[0.98] shrink-0"
                title="Next Lecture"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
