import React from 'react';
import { Gauge, Maximize, Pause, Play, Settings, Sliders, Type, Volume2, VolumeX } from 'lucide-react';
import { formatSeconds, QUALITY_OPTIONS } from './watchConstants';
import { usePlayerTime } from './playerTimeStore';

const controlClass = 'flex h-11 w-11 items-center justify-center rounded text-zinc-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

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
    <div data-testid="player-controls" className={`absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-8 transition-opacity duration-300 sm:gap-2 sm:px-5 sm:pb-3.5 sm:pt-10 ${controller.isControlsVisible || !controller.isPlaying ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div role="slider" aria-label="Seek video" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(currentTime)} tabIndex={0} ref={controller.progressBarRef} onClick={controller.handleProgressBarClick} onKeyDown={handleTimelineKeyDown} className="group/timeline relative flex h-7 sm:h-6 w-full cursor-pointer items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary py-1 sm:py-0">
        <span className="relative block h-2 w-full overflow-visible rounded-full border border-zinc-700/60 bg-zinc-800/90 sm:h-2.5">
          <span className="block h-full rounded-full bg-gradient-to-r from-primary via-accent to-yellow-400 shadow-lg shadow-primary/30 transition-all duration-75" style={{ width: `${progressPercent}%` }}>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full bg-white shadow-md border-2 border-primary transition-transform scale-95 group-hover/timeline:scale-125" />
          </span>
          {duration > 0 && chapters?.map((chapter, index) => {
            const left = Math.min(100, Math.max(0, (chapter.timestamp / duration) * 100));
            return (
              <button type="button" key={index} aria-label={`Seek to ${chapter.title} at ${chapter.formattedTime}`} style={{ left: `${left}%` }} onClick={event => { event.stopPropagation(); controller.triggerPlayerSeek(chapter.timestamp); }} className="group/marker absolute top-1/2 z-30 -ml-2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-md transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <span className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden -translate-x-1/2 flex-col items-center whitespace-nowrap group-hover/marker:flex">
                  <span className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold text-white shadow-xl">
                    <span className="font-mono text-primary">{chapter.formattedTime}</span>
                    <span className="font-semibold text-zinc-300">{chapter.title}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </span>
      </div>
      <div className="flex min-w-0 items-center justify-between text-xs text-white">
        <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
          <button type="button" aria-label={controller.isPlaying ? 'Pause video' : 'Play video'} onClick={controller.handlePlayPause} className={controlClass}>
            {controller.isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
          </button>
          <button type="button" aria-label={controller.playerMuted ? 'Unmute video' : 'Mute video'} onClick={controller.handleMuteToggle} className={controlClass}>
            {controller.playerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <span className="min-w-0 select-none truncate px-2 text-xs font-mono font-medium text-zinc-200 sm:text-xs">
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-1.5">
          <details className="group/settings static">
            <summary aria-label="Player settings" className={`${controlClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
              <Settings size={20} />
            </summary>
            <div className="absolute bottom-12 right-1 sm:right-2 z-40 grid w-[min(16.5rem,calc(100vw-1.5rem))] grid-cols-3 rounded-xl border border-zinc-700/80 bg-zinc-950/98 backdrop-blur-md p-1.5 shadow-2xl">
              <button type="button" onClick={controller.handleSpeedCycle} className="flex min-h-11 min-w-0 flex-col items-center justify-center rounded-lg px-1 text-[10px] text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Change Playback Speed">
                <span className="flex items-center gap-1"><Gauge size={14} /> Speed</span>
                <span className="truncate">{controller.playbackSpeed === 1 ? 'Normal' : `${controller.playbackSpeed}x`}</span>
              </button>
              <button type="button" onClick={controller.handleQualityCycle} className="flex min-h-11 min-w-0 flex-col items-center justify-center rounded-lg px-1 text-[10px] text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Change Video Quality / Resolution">
                <span className="flex items-center gap-1"><Sliders size={14} /> Quality</span>
                <span className="truncate">{QUALITY_OPTIONS.find(option => option.value === controller.qualityLevel)?.label || 'Auto'}</span>
              </button>
              <button type="button" aria-pressed={controller.captionsEnabled} onClick={controller.handleCCToggle} className="flex min-h-11 min-w-0 flex-col items-center justify-center rounded-lg px-1 text-[10px] text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Toggle Captions (CC)">
                <span className="flex items-center gap-1"><Type size={14} /> Captions</span>
                <span>{controller.captionsEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>
          </details>
          <button type="button" aria-label="Enter fullscreen" onClick={controller.handleFullscreenToggle} className={controlClass}>
            <Maximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
