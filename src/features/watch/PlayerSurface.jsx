import React from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { PlayerControls } from './PlayerControls';

/**
 * Editorial Player Surface.
 * Handles YouTube embedded player, custom controls, and theater modes.
 */
export function PlayerSurface({
  course,
  lesson,
  lessonId,
  controller,
  isUdemyCompleted,
  onUdemyToggle,
  prevLessonId,
  nextLessonId,
  onNavigate,
  isPlaylistCollapsed
}) {
  const renderPlayerContent = () => {
    if (lesson.type === 'youtube') {
      const videoId = lesson.videoId || lessonId;
      const maxResThumb = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      const mqThumb = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
      const hqThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      // Determine initial thumbnail:
      // If lesson has a custom thumbnail that is not a 4:3 letterboxed YouTube asset (hqdefault/sddefault), use it.
      // Otherwise, prefer maxresdefault (true 16:9, 1280x720, zero black bars).
      const hasBakedLetterbox = lesson.thumbnailUrl && (lesson.thumbnailUrl.includes('hqdefault') || lesson.thumbnailUrl.includes('sddefault'));
      const initialThumb = (lesson.thumbnailUrl && !hasBakedLetterbox)
        ? lesson.thumbnailUrl
        : maxResThumb;

      return (
        <div className="w-full h-full relative flex items-center justify-center">
          {!controller.isPlayerTriggered ? (
            <button 
              type="button" 
              aria-label={`Play ${lesson.title}`} 
              onClick={() => controller.setIsPlayerTriggered(true)} 
              className="group/thumb absolute inset-0 z-20 flex h-full w-full cursor-pointer items-center justify-center bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
            >
              <img 
                src={initialThumb} 
                alt={lesson.title} 
                onError={(e) => {
                  // Fallback cascade: maxres -> mqThumb (true 16:9, 0 black bars) -> hqThumb
                  if (e.currentTarget.src !== mqThumb && e.currentTarget.src !== hqThumb) {
                    e.currentTarget.src = mqThumb;
                  } else if (e.currentTarget.src === mqThumb) {
                    e.currentTarget.src = hqThumb;
                  }
                }}
                className="w-full h-full object-cover object-center opacity-95 group-hover/thumb:scale-[1.02] transition duration-500" 
              />
              <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/15 transition duration-300" />
              <span className="absolute z-30 flex h-16 w-16 items-center justify-center rounded-full bg-white text-zinc-950 shadow-2xl backdrop-blur-md transition duration-300 group-hover/thumb:scale-110 sm:h-20 sm:w-20">
                <Play size={26} fill="currentColor" className="ml-1 text-zinc-950" />
              </span>
            </button>
          ) : (
            <div id="yt-player-iframe" className="w-full h-full absolute inset-0 z-10" />
          )}
          {controller.isPlayerTriggered && (
            <div 
              onClick={controller.handlePlayPause} 
              className={`w-full h-[calc(100%-60px)] absolute inset-x-0 top-0 z-20 bg-transparent ${!controller.isControlsVisible && controller.isPlaying ? 'cursor-none' : 'cursor-pointer'}`} 
            />
          )}
          {controller.isPlayerTriggered && <PlayerControls controller={controller} chapters={lesson.chapters} />}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-5 h-full justify-center">
        <span className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">Manual Cohort</span>
        <h3 className="text-2xl font-bold text-white leading-snug">{lesson.title}</h3>
        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">This course is manually tracked. Watch the video externally, then mark it complete below.</p>
        <a href={course.udemyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 transition text-xs font-semibold shadow-xs">Open External Course</a>
        <button onClick={onUdemyToggle} className={`w-full h-11 rounded-full font-semibold text-xs sm:text-sm transition duration-200 active:scale-[0.98] ${isUdemyCompleted ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'}`}>{isUdemyCompleted ? '✓ Completed (Unmark)' : 'Mark as Completed'}</button>
      </div>
    );
  };

  // Unified Render: Preserves the YouTube iframe DOM node across Theater and Default modes
  return (
    <div
      className={
        isPlaylistCollapsed
          ? "w-full bg-black relative flex items-center justify-center border-b border-zinc-800/80 flex-shrink-0 group/stage py-0"
          : "w-full px-0 sm:px-4 md:px-6 pt-0 sm:pt-4 flex-shrink-0"
      }
    >
      {/* Floating Prev Arrow in Cinema Margin (Theater Mode) */}
      {isPlaylistCollapsed && prevLessonId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(prevLessonId);
          }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/80 hover:bg-black text-white/80 hover:text-white border border-white/20 backdrop-blur-md opacity-0 group-hover/stage:opacity-100 transition-all cursor-pointer shadow-2xl hover:scale-110 active:scale-95"
          title="Previous Lecture"
          aria-label="Previous Lecture"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Floating Next Arrow in Cinema Margin (Theater Mode) */}
      {isPlaylistCollapsed && nextLessonId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(nextLessonId);
          }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/80 hover:bg-black text-white/80 hover:text-white border border-white/20 backdrop-blur-md opacity-0 group-hover/stage:opacity-100 transition-all cursor-pointer shadow-2xl hover:scale-110 active:scale-95"
          title="Next Lecture"
          aria-label="Next Lecture"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Persistent Video Frame: Stays mounted so the YouTube iframe is never torn down */}
      <div
        data-testid="watch-player"
        ref={controller.playerContainerRef}
        onMouseMove={controller.handleMouseMove}
        onMouseLeave={controller.handleMouseLeave}
        className={`relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center ${
          isPlaylistCollapsed
            ? "w-full max-h-[calc(100vh-80px)] max-w-[calc((100vh-80px)*16/9)] mx-auto shadow-2xl"
            : "w-full aspect-video max-w-7xl mx-auto rounded-none sm:rounded-[20px] shadow-sm border-y sm:border border-zinc-200/80 dark:border-zinc-800/80 group/player"
        } ${!controller.isControlsVisible && controller.isPlaying ? 'cursor-none' : ''}`}
      >
        {/* Prev / Next buttons inside video on hover (Default Workspace Mode) */}
        {!isPlaylistCollapsed && prevLessonId && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(prevLessonId);
            }}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-25 p-2 sm:p-2.5 rounded-full bg-black/75 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-md opacity-0 group-hover/player:opacity-100 transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
            title="Previous Lecture"
            aria-label="Previous Lecture"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {!isPlaylistCollapsed && nextLessonId && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(nextLessonId);
            }}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-25 p-2 sm:p-2.5 rounded-full bg-black/75 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-md opacity-0 group-hover/player:opacity-100 transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
            title="Next Lecture"
            aria-label="Next Lecture"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {renderPlayerContent()}
      </div>
    </div>
  );
}
