import React, { useState } from 'react';
import { Flame, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { buildMonthlyActivityCalendar } from '../utils/streakUtils';
import Dialog from './ui/Dialog';

/**
 * Editorial Streak & Monthly Activity Calendar Modal.
 * Matches Landing Page and Studio Dashboard minimalist editorial aesthetic.
 */
export default function StreakModal({ isOpen, onClose, stats, streakCount, activeDates }) {
  const [viewDate, setViewDate] = useState(new Date());

  if (!isOpen) return null;

  const currentYear = viewDate.getFullYear();
  const currentMonthIndex = viewDate.getMonth();
  const calendar = buildMonthlyActivityCalendar(activeDates, viewDate);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonthIndex + 1, 1));
  };

  const weekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="streak-dialog-title"
      className="relative max-h-[calc(100dvh-2rem)] w-full max-w-sm space-y-4 overflow-y-auto rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 sm:p-6 shadow-2xl sm:max-w-md"
    >
      {/* Modal Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Flame size={16} className="fill-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 id="streak-dialog-title" className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Streak Calendar</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/25">
                {streakCount} {streakCount === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">Watch at least 10 minutes daily to maintain your streak.</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          aria-label="Close streak calendar"
          className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer flex items-center justify-center flex-shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* Month & Year Navigation Control */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between bg-zinc-100/70 dark:bg-zinc-900/60 p-2 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70">
          <button
            onClick={handlePrevMonth}
            className="h-7 px-2.5 rounded-full hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-medium shadow-2xs"
            title="Previous Month"
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1.5 text-zinc-950 dark:text-zinc-50 font-semibold text-xs sm:text-sm tracking-tight">
            <Calendar size={13} className="text-zinc-500 dark:text-zinc-400" />
            <span>{calendar.label}</span>
          </div>

          <button
            onClick={handleNextMonth}
            className="h-7 px-2.5 rounded-full hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-medium shadow-2xs"
            title="Next Month"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Monthly Grid */}
        <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/70 space-y-1.5 min-h-[200px] flex flex-col justify-start">
          {/* Day Name Columns */}
          <div className="grid grid-cols-7 gap-1 text-center border-b border-zinc-200/60 dark:border-zinc-800/60 pb-1.5">
            {weekHeaders.map((dayName, idx) => (
              <span key={idx} className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {dayName}
              </span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 pt-0.5">
            {/* Empty Offset Cells */}
            {Array.from({ length: calendar.leadingEmptyDays }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-7 rounded-lg bg-transparent" />
            ))}

            {/* Days of the Month */}
            {calendar.days.map(({ day: dayNum, isToday, isActive }) => {
              return (
                <div
                  key={dayNum}
                  className={`h-7 sm:h-8 rounded-xl border flex flex-col items-center justify-center transition text-center cursor-default ${
                    isActive 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs' 
                      : 'bg-white dark:bg-zinc-900 border-zinc-200/70 dark:border-zinc-800/70 text-zinc-600 dark:text-zinc-400'
                  } ${isToday ? 'ring-2 ring-zinc-950 dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-zinc-950' : ''}`}
                  title={`${calendar.label} ${dayNum}: ${isActive ? 'Active learning recorded' : 'No activity recorded'}`}
                >
                  <span className="text-[11px] font-medium block leading-none">{dayNum}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5 shadow-2xs" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Learning Stats Footer Bento Row */}
      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
        <div className="p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs">
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Watch Time</span>
          <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-50 block mt-0.5 font-mono">{stats.totalHours} Hours</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs">
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Total Courses</span>
          <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-50 block mt-0.5 font-mono">{stats.totalCourses} Enrolled</span>
        </div>
      </div>
    </Dialog>
  );
}
