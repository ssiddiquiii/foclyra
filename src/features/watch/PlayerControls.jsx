import React from 'react';
import { Gauge, Maximize, Pause, Play, Settings, Sliders, Type, Volume2, VolumeX } from 'lucide-react';
import { formatSeconds, QUALITY_OPTIONS } from './watchConstants';
import { usePlayerTime } from './playerTimeStore';

const controlClass = 'flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md text-zinc-300 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer';

export function PlayerControls({ controller, chapters }) {
  globalThis.__foclyraRenderProbe?.('PlayerControls');
  const { currentTime, duration } = usePlayerTime(controller.timeStore);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleTimelineKeyDown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextTime = event.key === 'Home'
      ? 0
      : event.key === 'End'
      ? duration
      : Math.min(duration, Math.max(0, currentTime + (event.key === 'ArrowRight' ? 5 : -5)));
    controller.triggerPlayerSeek(nextTime);
  };

  return (
    <div 
      data-testid="player-controls" 
      className={`absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2.5 pb-2 pt-6 sm:px-4 sm:pb-2.5 sm:pt-8 transition-opacity duration-300 ${controller.isControlsVisible || !controller.isPlaying ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      {/* Sleek YouTube-Style Seekbar Timeline */}
      <div 
        role="slider" 
        aria-label="Seek video" 
        aria-valuemin={0} 
        aria-valuemax={Math.round(duration)} 
        aria-valuenow={Math.round(currentTime)} 
        tabIndex={0} 
        ref={controller.progressBarRef} 
        onClick={controller.handleProgressBarClick} 
        onKeyDown={handleTimelineKeyDown} 
        className="group/timeline relative flex h-4 sm:h-5 w-full cursor-pointer items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <span className="relative block h-1 w-full overflow-visible rounded-full bg-zinc-700/60 transition-all group-hover/timeline:h-1.5">
          <span 
            className="block h-full rounded-full bg-gradient-to-r from-primary via-accent to-yellow-400 transition-all duration-75" 
            style={{ width: `${progressPercent}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3 w-3 rounded-full bg-white shadow-md border border-primary scale-0 group-hover/timeline:scale-100 transition-transform" />
          </span>
          {duration > 0 && chapters?.map((chapter, index) => {
            const left = Math.min(100, Math.max(0, (chapter.timestamp / duration) * 100));
            return (
              <button 
                type="button" 
                key={index} 
                aria-label={`Seek to ${chapter.title} at ${chapter.formattedTime}`} 
                style={{ left: `${left}%` }} 
                onClick={event => { event.stopPropagation(); controller.triggerPlayerSeek(chapter.timestamp); }} 
                className="group/marker absolute top-1/2 z-30 -ml-1.5 h-3 w-3 -translate-y-1/2 rounded-full border border-primary bg-white shadow-xs transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              >
                <span className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 hidden -translate-x-1/2 flex-col items-center whitespace-nowrap group-hover/marker:flex">
                  <span className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-zinc-950 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg">
                    <span className="font-mono text-primary">{chapter.formattedTime}</span>
                    <span className="font-semibold text-zinc-300">{chapter.title}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </span>
      </div>

      {/* Compact Control Buttons Row */}
      <div className="flex min-w-0 items-center justify-between text-xs text-white">
        <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <button 
            type="button" 
            aria-label={controller.isPlaying ? 'Pause video' : 'Play video'} 
            onClick={controller.handlePlayPause} 
            className={controlClass}
          >
            {controller.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button 
            type="button" 
            aria-label={controller.playerMuted ? 'Unmute video' : 'Mute video'} 
            onClick={controller.handleMuteToggle} 
            className={controlClass}
          >
            {controller.playerMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <span className="min-w-0 select-none truncate px-1.5 text-[11px] sm:text-xs font-mono font-medium text-zinc-300">
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </span>
        </div>

        <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
          <details className="group/settings static">
            <summary aria-label="Player settings" className={`${controlClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
              <Settings size={16} />
            </summary>
            <div className="absolute bottom-11 right-1.5 sm:right-2.5 z-40 grid w-[min(16rem,calc(100vw-1.5rem))] grid-cols-3 rounded-xl border border-zinc-700/80 bg-zinc-950/98 backdrop-blur-xl p-1.5 shadow-2xl">
              <button 
                type="button" 
                onClick={controller.handleSpeedCycle} 
                className="flex min-h-10 min-w-0 flex-col items-center justify-center rounded-lg px-1 text-[11px] text-zinc-200 hover:bg-zinc-800 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer" 
                title="Change Playback Speed"
              >
                <span className="flex items-center gap-1 font-medium"><Gauge size={13} /> Speed</span>
                <span className="truncate text-zinc-400 font-mono text-[10px] mt-0.5">{controller.playbackSpeed === 1 ? 'Normal' : `${controller.playbackSpeed}x`}</span>
              </button>
              <button 
                type="button" 
                onClick={controller.handleQualityCycle} 
                className="flex min-h-10 min-w-0 flex-col items-center justify-center rounded-lg px-1 text-[11px] text-zinc-200 hover:bg-zinc-800 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer" 
                title="Change Video Quality / Resolution"
              >
                <span className="flex items-center gap-1 font-medium"><Sliders size={13} /> Quality</span>
                <span className="truncate text-zinc-400 text-[10px] mt-0.5">{QUALITY_OPTIONS.find(option => option.value === controller.qualityLevel)?.label || 'Auto'}</span>
              </button>
              <button 
                type="button" 
                aria-pressed={controller.captionsEnabled} 
                onClick={controller.handleCCToggle} 
                className="flex min-h-10 min-w-0 flex-col items-center justify-center rounded-lg px-1 text-[11px] text-zinc-200 hover:bg-zinc-800 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer" 
                title="Toggle Captions (CC)"
              >
                <span className="flex items-center gap-1 font-medium"><Type size={13} /> Captions</span>
                <span className="text-zinc-400 text-[10px] mt-0.5">{controller.captionsEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>
          </details>
          <button 
            type="button" 
            aria-label="Enter fullscreen" 
            onClick={controller.handleFullscreenToggle} 
            className={controlClass}
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
