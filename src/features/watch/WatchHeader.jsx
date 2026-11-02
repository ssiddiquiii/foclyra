import React from 'react';
import { ArrowLeft, ListVideo } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Editorial Watch Header Bar.
 * Sticky translucent bar with pill navigation and theater mode switcher.
 */
export function WatchHeader({ courseId, courseTitle, lessonTitle, isPlaylistCollapsed, onTogglePlaylist, lessonsCount }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 px-[max(0.75rem,env(safe-area-inset-left))] py-2 sm:px-6 sm:py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <Link 
          to={`/courses/${courseId}`} 
          aria-label="Back to Course Detail" 
          className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-white shadow-2xs" 
          title="Back to Course Detail"
        >
          <ArrowLeft size={14} />
        </Link>
        <div className="min-w-0">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold truncate">
            {courseTitle}
          </span>
          <h2 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {lessonTitle}
          </h2>
        </div>
      </div>

      {/* Desktop Playlist Toggle (Theater vs Sidebar) */}
      <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onTogglePlaylist}
          className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full border text-xs font-medium shadow-2xs transition cursor-pointer group active:scale-[0.98] ${
            isPlaylistCollapsed 
              ? 'border-zinc-950 dark:border-white bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' 
              : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
          title={isPlaylistCollapsed ? "Open course playlist drawer" : "Collapse playlist for full theater mode"}
          aria-label={isPlaylistCollapsed ? "Open course playlist" : "Collapse playlist for theater mode"}
        >
          <ListVideo size={13} className={`transition-transform group-hover:scale-110 ${isPlaylistCollapsed ? 'text-white dark:text-zinc-950' : 'text-zinc-500 dark:text-zinc-400'}`} />
          <span>{isPlaylistCollapsed ? `Show Playlist (${lessonsCount || 0})` : 'Theater Mode'}</span>
        </button>
      </div>
    </div>
  );
}
