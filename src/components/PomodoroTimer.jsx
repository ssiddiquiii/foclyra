import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Coffee, 
  X, 
  Volume2, 
  VolumeX, 
  Edit3, 
  Check, 
  Plus
} from 'lucide-react';
import { useUIStore } from '../hooks/useUIStore';
import { trackEvent } from '../services/analytics';

const STORAGE_KEYS = {
  END_TIME: 'foclyra_pomo_end_time',
  MODE: 'foclyra_pomo_mode',
  RUNNING: 'foclyra_pomo_running',
  REMAINING: 'foclyra_pomo_remaining',
  SESSIONS: 'foclyra_pomo_sessions',
  CUSTOM_FOCUS: 'foclyra_pomo_custom_focus',
  CUSTOM_BREAK: 'foclyra_pomo_custom_break'
};

export default function PomodoroTimer() {
  const { pauseActivePlayer } = useUIStore();
  const location = useLocation();
  const isWatchPage = location.pathname.includes('/lessons/');

  const [focusMins, setFocusMins] = useState(() => 
    parseInt(localStorage.getItem(STORAGE_KEYS.CUSTOM_FOCUS) || '25', 10)
  );
  const [breakMins, setBreakMins] = useState(() => 
    parseInt(localStorage.getItem(STORAGE_KEYS.CUSTOM_BREAK) || '5', 10)
  );

  const [mode, setMode] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.MODE) || 'focus'
  );

  const [isRunning, setIsRunning] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.RUNNING) === 'true'
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [strictLockActive, setStrictLockActive] = useState(false);

  const [sessionsCompleted, setSessionsCompleted] = useState(() => 
    parseInt(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '0', 10)
  );

  const [timeLeft, setTimeLeft] = useState(() => {
    const isRun = localStorage.getItem(STORAGE_KEYS.RUNNING) === 'true';
    if (isRun) {
      const endTime = parseInt(localStorage.getItem(STORAGE_KEYS.END_TIME) || '0', 10);
      const diff = Math.ceil((endTime - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    const rem = parseInt(localStorage.getItem(STORAGE_KEYS.REMAINING) || '0', 10);
    return rem > 0 ? rem : (mode === 'focus' ? focusMins * 60 : breakMins * 60);
  });

  const formatTime = (seconds) => {
    const safeSecs = Math.max(0, seconds || 0);
    const m = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const playChime = useCallback((isBreak = false) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const notes = isBreak ? [587.33, 739.99, 880.00] : [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.65);
      });
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    let timer = null;

    if (isRunning) {
      let endTime = parseInt(localStorage.getItem(STORAGE_KEYS.END_TIME) || '0', 10);
      if (!endTime || endTime <= Date.now()) {
        endTime = Date.now() + timeLeft * 1000;
        localStorage.setItem(STORAGE_KEYS.END_TIME, endTime.toString());
      }

      timer = setInterval(() => {
        const remaining = Math.ceil((endTime - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(timer);
          handleSessionComplete();
        } else {
          setTimeLeft(remaining);
          localStorage.setItem(STORAGE_KEYS.REMAINING, remaining.toString());
        }
      }, 500);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, mode, focusMins, breakMins]);

  useEffect(() => {
    if (isRunning) {
      const icon = mode === 'focus' ? '🎯 Focus' : '☕ Break';
      document.title = `(${formatTime(timeLeft)}) ${icon} | Foclyra`;
    } else {
      document.title = 'Foclyra · Distraction-Free Study Studio';
    }

    return () => {
      document.title = 'Foclyra · Distraction-Free Study Studio';
    };
  }, [isRunning, timeLeft, mode]);

  const handleSessionComplete = () => {
    localStorage.removeItem(STORAGE_KEYS.END_TIME);

    if (mode === 'focus') {
      const nextSessions = sessionsCompleted + 1;
      setSessionsCompleted(nextSessions);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, nextSessions.toString());

      playChime(true);
      pauseActivePlayer();
      trackEvent('pomodoro_completed', { mode: 'focus', durationMinutes: focusMins });

      const breakSecs = breakMins * 60;
      setMode('break');
      localStorage.setItem(STORAGE_KEYS.MODE, 'break');
      setTimeLeft(breakSecs);
      localStorage.setItem(STORAGE_KEYS.REMAINING, breakSecs.toString());

      const breakEndTime = Date.now() + breakSecs * 1000;
      localStorage.setItem(STORAGE_KEYS.END_TIME, breakEndTime.toString());
      localStorage.setItem(STORAGE_KEYS.RUNNING, 'true');
      setIsRunning(true);
      setStrictLockActive(true);
    } else {
      playChime(false);
      setStrictLockActive(false);

      const focusSecs = focusMins * 60;
      setMode('focus');
      localStorage.setItem(STORAGE_KEYS.MODE, 'focus');
      setTimeLeft(focusSecs);
      localStorage.setItem(STORAGE_KEYS.REMAINING, focusSecs.toString());

      setIsRunning(false);
      localStorage.setItem(STORAGE_KEYS.RUNNING, 'false');
    }
  };

  const toggleStartPause = () => {
    if (isRunning) {
      setIsRunning(false);
      localStorage.setItem(STORAGE_KEYS.RUNNING, 'false');
      localStorage.removeItem(STORAGE_KEYS.END_TIME);
      localStorage.setItem(STORAGE_KEYS.REMAINING, timeLeft.toString());
    } else {
      const targetTime = Date.now() + timeLeft * 1000;
      localStorage.setItem(STORAGE_KEYS.END_TIME, targetTime.toString());
      localStorage.setItem(STORAGE_KEYS.RUNNING, 'true');
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    localStorage.setItem(STORAGE_KEYS.RUNNING, 'false');
    localStorage.removeItem(STORAGE_KEYS.END_TIME);
    const secs = mode === 'focus' ? focusMins * 60 : breakMins * 60;
    setTimeLeft(secs);
    localStorage.setItem(STORAGE_KEYS.REMAINING, secs.toString());
  };

  const handleAddMinuteBreak = () => {
    const newRemaining = timeLeft + 60;
    setTimeLeft(newRemaining);
    localStorage.setItem(STORAGE_KEYS.REMAINING, newRemaining.toString());
    if (isRunning) {
      const newEndTime = Date.now() + newRemaining * 1000;
      localStorage.setItem(STORAGE_KEYS.END_TIME, newEndTime.toString());
    }
  };

  const handleEndBreak = () => {
    setStrictLockActive(false);
    setIsRunning(false);
    localStorage.setItem(STORAGE_KEYS.RUNNING, 'false');
    localStorage.removeItem(STORAGE_KEYS.END_TIME);
    setMode('focus');
    localStorage.setItem(STORAGE_KEYS.MODE, 'focus');
    const secs = focusMins * 60;
    setTimeLeft(secs);
    localStorage.setItem(STORAGE_KEYS.REMAINING, secs.toString());
  };

  const saveCustomDurations = () => {
    const f = Math.max(1, Math.min(120, focusMins || 25));
    const b = Math.max(1, Math.min(60, breakMins || 5));
    setFocusMins(f);
    setBreakMins(b);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_FOCUS, f.toString());
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BREAK, b.toString());
    setIsEditing(false);
    handleReset();
  };

  const totalModeDuration = (mode === 'focus' ? focusMins : breakMins) * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalModeDuration - timeLeft) / totalModeDuration) * 100));

  return (
    <>
      {/* ☕ SMOOTH REST TIME RECOVERY OVERLAY */}
      {strictLockActive && (
        <div className="fixed inset-0 z-[100] bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in duration-300">
          <div className="size-16 sm:size-20 rounded-[22px] bg-[#16a34a]/10 border border-[#16a34a]/25 text-[#16a34a] dark:text-[#63d94e] flex items-center justify-center shadow-sm">
            <Coffee className="size-8 sm:size-9" />
          </div>

          <div className="space-y-2 max-w-md">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-full bg-[#f4f4f4] dark:bg-zinc-900 text-[#111111] dark:text-zinc-200 border border-[#e5e5e5] dark:border-zinc-800">
              <span className="size-1.5 rounded-full bg-[#63d94e]" />
              <span>Rest &amp; Re-energize</span>
            </span>
            <h1 className="text-[24px] sm:text-[32px] font-semibold tracking-[-0.03em] text-[#111111] dark:text-white leading-tight">
              Focus sprint complete.
            </h1>
            <p className="text-[#666666] dark:text-zinc-400 text-[13.5px] sm:text-[15px] leading-[1.6]">
              Step away from the screen, stretch, take a sip of water, and rest your eyes before your next lecture.
            </p>
          </div>

          {/* Smooth Dynamic Countdown Display */}
          <div className="px-8 py-5 rounded-[24px] bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-medium text-[#6f6f6f] dark:text-zinc-400 block">Rest time remaining</span>
            <div className="text-4xl sm:text-5xl font-semibold font-mono text-[#111111] dark:text-white tracking-tight">
              {formatTime(timeLeft)}
            </div>
            <div className="text-[11.5px] text-[#6f6f6f] dark:text-zinc-500">
              {isRunning ? 'Counting down...' : 'Timer paused'}
            </div>
          </div>

          {/* Rest Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={toggleStartPause}
              className="h-9 sm:h-10 px-4 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 text-[#111111] dark:text-white text-[12.5px] sm:text-[13px] font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              {isRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              <span>{isRunning ? 'Pause Rest' : 'Resume'}</span>
            </button>

            <button
              type="button"
              onClick={handleAddMinuteBreak}
              className="h-9 sm:h-10 px-4 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 text-[#111111] dark:text-white text-[12.5px] sm:text-[13px] font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>+1 Min</span>
            </button>

            <button
              type="button"
              onClick={handleEndBreak}
              className="h-9 sm:h-10 px-5 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[12.5px] sm:text-[13px] font-medium transition hover:opacity-90 cursor-pointer"
            >
              Ready to Focus →
            </button>
          </div>
        </div>
      )}

      {/* 🎯 FLOATING POMODORO WIDGET */}
      <aside aria-label="Pomodoro focus timer" className={isWatchPage ? "fixed bottom-3 left-4 sm:left-6 z-40 will-change-transform" : "fixed bottom-3 right-3 sm:right-4 z-50 will-change-transform"}>
        {!isExpanded ? (
          /* Collapsed Pill Button — Matches Landing Page Preview Pill */
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-label={`Open Pomodoro timer, ${formatTime(timeLeft)} remaining in ${mode} mode`}
            className={`inline-flex h-8 sm:h-9 items-center gap-2 px-3 sm:px-3.5 rounded-full font-medium text-[11.5px] sm:text-[12.5px] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] border backdrop-blur-md transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
              isRunning
                ? 'bg-[#111111] dark:bg-white border-[#111111] dark:border-white text-white dark:text-[#111111]'
                : 'bg-[#f4f4f4]/95 dark:bg-zinc-900/95 border-[#e5e5e5] dark:border-zinc-800 text-[#111111] dark:text-white hover:bg-[#eaeaea] dark:hover:bg-zinc-800'
            }`}
          >
            <span className={`size-2 rounded-full shrink-0 ${mode === 'focus' ? 'bg-[#f4525f]' : 'bg-[#63d94e]'} ${isRunning ? 'animate-pulse' : ''}`} />
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            <span className="text-[#8d8d8d] hidden sm:inline">•</span>
            <span className="hidden sm:inline capitalize">{mode === 'focus' ? 'Pomodoro' : 'Break'}</span>
            {sessionsCompleted > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#FF6B2C]/15 text-[#FF6B2C] text-[10px] font-mono font-semibold">
                {sessionsCompleted}
              </span>
            )}
          </button>
        ) : (
          /* Expanded Floating Bento Panel */
          <div className="w-[296px] sm:w-80 rounded-[22px] p-4 sm:p-5 border border-[#e5e5e5] dark:border-zinc-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] space-y-3.5 animate-in zoom-in-95 duration-200 bg-[#f4f4f4] dark:bg-[#141417]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-[8px] bg-[#FF6B2C] text-white flex items-center justify-center shadow-2xs">
                  <Flame className="size-3.5 fill-white" />
                </span>
                <h3 className="text-[13.5px] font-semibold tracking-[-0.015em] text-[#111111] dark:text-white">
                  Pomodoro Timer
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="size-7 rounded-full bg-white dark:bg-zinc-800 text-[#666666] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white transition flex items-center justify-center cursor-pointer"
                  title="Customize Durations"
                >
                  <Edit3 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="size-7 rounded-full bg-white dark:bg-zinc-800 text-[#666666] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white transition flex items-center justify-center cursor-pointer"
                  title={soundEnabled ? 'Chime Sound Enabled' : 'Sound Muted'}
                >
                  {soundEnabled ? <Volume2 className="size-3.5 text-[#111111] dark:text-white" /> : <VolumeX className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="size-7 rounded-full bg-white dark:bg-zinc-800 text-[#666666] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white transition flex items-center justify-center cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Custom Duration Editor */}
            {isEditing ? (
              <div className="p-3.5 rounded-[16px] bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 space-y-3">
                <span className="text-[11px] font-medium text-[#6f6f6f] dark:text-zinc-400 block">Customize duration (minutes)</span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[11px] text-[#666666] dark:text-zinc-400 block mb-1">Focus</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={focusMins}
                      onChange={(e) => setFocusMins(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-[#f4f4f4] dark:bg-zinc-800 border border-[#e5e5e5] dark:border-zinc-700 rounded-xl p-2 text-[#111111] dark:text-white font-mono font-semibold focus:outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#666666] dark:text-zinc-400 block mb-1">Break</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={breakMins}
                      onChange={(e) => setBreakMins(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-[#f4f4f4] dark:bg-zinc-800 border border-[#e5e5e5] dark:border-zinc-700 rounded-xl p-2 text-[#111111] dark:text-white font-mono font-semibold focus:outline-none text-center"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={saveCustomDurations}
                  className="w-full h-9 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[12px] font-medium rounded-full hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="size-3.5" />
                  <span>Save Durations</span>
                </button>
              </div>
            ) : (
              /* Mode Selector Chip — Matches Landing Page Switcher */
              <div className="grid grid-cols-2 p-1 rounded-full bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[11.5px] font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setMode('focus');
                    localStorage.setItem(STORAGE_KEYS.MODE, 'focus');
                    setIsRunning(false);
                    setTimeLeft(focusMins * 60);
                  }}
                  className={`h-7 rounded-full transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'focus'
                      ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-2xs'
                      : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-[#f4525f]" />
                  <span>Focus ({focusMins}m)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('break');
                    localStorage.setItem(STORAGE_KEYS.MODE, 'break');
                    setIsRunning(false);
                    setTimeLeft(breakMins * 60);
                  }}
                  className={`h-7 rounded-full transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'break'
                      ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-2xs'
                      : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-[#63d94e]" />
                  <span>Break ({breakMins}m)</span>
                </button>
              </div>
            )}

            {/* Countdown Clock Display Card */}
            <div className="rounded-[16px] bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 p-4 text-center space-y-2.5">
              <div className="text-4xl font-semibold font-mono text-[#111111] dark:text-white tracking-tight">
                {formatTime(timeLeft)}
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full bg-[#f2f2f2] dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    mode === 'focus' ? 'bg-[#111111] dark:bg-white' : 'bg-[#16a34a] dark:bg-[#34d399]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={toggleStartPause}
                className="flex-1 h-9 rounded-full font-medium text-[12.5px] transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer bg-[#111111] dark:bg-white text-white dark:text-[#111111] hover:opacity-90"
              >
                {isRunning ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
                <span>{isRunning ? 'Pause' : mode === 'focus' ? 'Start Focus' : 'Start Break'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="size-9 rounded-full bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[#666666] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                title="Reset Timer"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            {/* Sessions Counter Footer */}
            <div className="pt-2 border-t border-[#e5e5e5] dark:border-zinc-800 flex items-center justify-between text-[11.5px] text-[#666666] dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Flame className="size-3.5 text-[#FF6B2C]" />
                <span>Focus cycles today</span>
              </span>
              <span className="font-mono font-semibold text-[#111111] dark:text-white">{sessionsCompleted} done</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
