import React from 'react';
import { ArrowLeft, ListVideo } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WatchHeader({ courseId, courseTitle, lessonTitle, isPlaylistCollapsed, onTogglePlaylist, lessonsCount }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-[max(.5rem,env(safe-area-inset-left))] py-1.5 backdrop-blur-xl sm:gap-3 sm:px-6 sm:py-2.5">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Link 
          to={`/courses/${courseId}`} 
          aria-label="Back to Course Detail" 
          className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
          title="Back to Course Detail"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-bold truncate">{courseTitle}</span>
          <h2 className="text-xs sm:text-sm font-semibold text-foreground truncate">{lessonTitle}</h2>
        </div>
      </div>

      {/* Desktop Playlist Toggle (Theater vs Sidebar) */}
      <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onTogglePlaylist}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition cursor-pointer group active:scale-95 ${
            isPlaylistCollapsed 
              ? 'border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary' 
              : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title={isPlaylistCollapsed ? "Open course playlist drawer" : "Collapse playlist for full theater mode"}
          aria-label={isPlaylistCollapsed ? "Open course playlist" : "Collapse playlist for theater mode"}
        >
          <ListVideo size={15} className={`transition-transform group-hover:scale-110 ${isPlaylistCollapsed ? 'text-primary' : 'text-muted-foreground'}`} />
          <span>{isPlaylistCollapsed ? `Show Playlist (${lessonsCount || 0})` : 'Theater Mode'}</span>
        </button>
      </div>
    </div>
  );
}
