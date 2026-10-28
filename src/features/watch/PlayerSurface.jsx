import React from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { PlayerControls } from './PlayerControls';

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
  isPlaylistCollapsed,
  onTogglePlaylist,
  lessonsCount
}) {
  return (
    <div className={`w-full bg-black relative flex items-center justify-center border-b border-border/50 flex-shrink-0 group/stage ${isPlaylistCollapsed ? 'py-1 sm:py-2' : ''}`}>
      {/* Floating Left Prev Lecture Arrow (Positioned in side cinema stage) */}
      {prevLessonId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(prevLessonId);
          }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/80 hover:bg-zinc-900 text-white/80 hover:text-white border border-white/20 backdrop-blur-md opacity-0 group-hover/stage:opacity-100 transition-all cursor-pointer shadow-2xl hover:scale-110 active:scale-95"
          title="Previous Lecture"
          aria-label="Previous Lecture"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Floating Right Next Lecture Arrow (Positioned in side cinema stage) */}
      {nextLessonId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(nextLessonId);
          }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/80 hover:bg-zinc-900 text-white/80 hover:text-white border border-white/20 backdrop-blur-md opacity-0 group-hover/stage:opacity-100 transition-all cursor-pointer shadow-2xl hover:scale-110 active:scale-95"
          title="Next Lecture"
          aria-label="Next Lecture"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Viewport-Fitted Cinema Video Container (Strict 16:9 Aspect Ratio - zero internal pillarboxes) */}
      <div 
        data-testid="watch-player" 
        ref={controller.playerContainerRef} 
        onMouseMove={controller.handleMouseMove} 
        onMouseLeave={controller.handleMouseLeave} 
        className={`relative aspect-video w-full mx-auto overflow-hidden bg-black flex items-center justify-center shadow-2xl ${
          isPlaylistCollapsed 
            ? 'max-h-[calc(100vh-210px)] max-w-[calc((100vh-210px)*16/9)] 2xl:max-h-[calc(100vh-190px)] 2xl:max-w-[calc((100vh-190px)*16/9)]' 
            : 'max-h-[calc(100vh-220px)] max-w-[calc((100vh-220px)*16/9)]'
        } ${!controller.isControlsVisible && controller.isPlaying ? 'cursor-none' : ''}`}
      >
        {lesson.type === 'youtube' ? (
          <div className="w-full h-full relative flex items-center justify-center">
            {!controller.isPlayerTriggered ? (
              <button 
                type="button" 
                aria-label={`Play ${lesson.title}`} 
                onClick={() => controller.setIsPlayerTriggered(true)} 
                className="group/thumb absolute inset-0 z-20 flex h-full w-full cursor-pointer items-center justify-center bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
              >
                <img 
                  src={lesson.thumbnailUrl || `https://i.ytimg.com/vi/${lesson.videoId || lessonId}/hqdefault.jpg`} 
                  alt={lesson.title} 
                  className="w-full h-full object-contain opacity-90 group-hover/thumb:scale-[1.01] transition duration-500" 
                />
                <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition duration-300" />
                <span className="absolute z-30 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-primary/80 text-primary-foreground shadow-2xl backdrop-blur-md transition duration-300 group-hover/thumb:scale-110 sm:h-20 sm:w-20">
                  <Play size={28} fill="currentColor" className="ml-1 text-zinc-950" />
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
        ) : (
          <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-6 h-full justify-center">
            <span className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded bg-accent/20 text-accent border border-accent/30">Udemy Cohort</span>
            <h3 className="text-2xl font-bold text-white leading-snug">{lesson.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">This course is manually tracked. Visit Udemy.com to watch the video, then mark it complete below.</p>
            <a href={course.udemyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-zinc-900 border border-border text-white hover:bg-zinc-800 transition font-medium">Open Course on Udemy</a>
            <button onClick={onUdemyToggle} className={`w-full py-4 rounded-xl font-bold transition duration-200 active:scale-98 ${isUdemyCompleted ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-primary text-white hover:bg-primary/95 shadow-lg shadow-primary/20'}`}>{isUdemyCompleted ? '✓ Completed (Unmark)' : 'Mark as Completed'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
