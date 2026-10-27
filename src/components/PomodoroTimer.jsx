import React, { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEYS = {
  END_TIME: 'foclyra_pomo_end_time',
  MODE: 'foclyra_pomo_mode',
  RUNNING: 'foclyra_pomo_running',
  REMAINING: 'foclyra_pomo_remaining',
  SESSIONS: 'foclyra_pomo_sessions',
  CUSTOM_FOCUS: 'foclyra_pomo_custom_focus',
  CUSTOM_BREAK: 'foclyra_pomo_custom_break'
};

/**
 * Ultra-Smooth Lightweight Pomodoro Focus & Recovery System.
 * - Accurate timestamp-based timing resilient to tab sleep and page navigation.
 * - Automatic real-time countdown during rest breaks with zero freeze.
 * - Live browser tab title indicator: (24:50) 🎯 Focus | Foclyra
 * - Soothing Web Audio synthesizer chimes.
 * - Non-intrusive floating pill with full customizable durations.
 */
export default function PomodoroTimer() {
  const { pauseActivePlayer } = useUIStore();

  // Durations in minutes
  const [focusMins, setFocusMins] = useState(() => 
    parseInt(localStorage.getItem(STORAGE_KEYS.CUSTOM_FOCUS) || '25', 10)
  );
  const [breakMins, setBreakMins] = useState(() => 
    parseInt(localStorage.getItem(STORAGE_KEYS.CUSTOM_BREAK) || '5', 10)
  );

  const [mode, setMode] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.MODE) || 'focus'
  ); // 'focus' | 'break'

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

  // Remaining seconds calculation
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

  // Format MM:SS
  const formatTime = (seconds) => {
    const safeSecs = Math.max(0, seconds || 0);
    const m = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Play pleasant acoustic synth chime
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

  // Main countdown interval
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

  // Update browser tab title
  useEffect(() => {
    if (isRunning) {
      const icon = mode === 'focus' ? '🎯 Focus' : '☕ Break';
      document.title = `(${formatTime(timeLeft)}) ${icon} | Foclyra`;
    } else {
      document.title = 'Foclyra — Distraction-Free Study Studio';
    }

    return () => {
      document.title = 'Foclyra — Distraction-Free Study Studio';
    };
  }, [isRunning, timeLeft, mode]);

  // Handle Session Completion (Focus -> Break or Break -> Focus)
  const handleSessionComplete = () => {
    localStorage.removeItem(STORAGE_KEYS.END_TIME);

    if (mode === 'focus') {
      // Completed Focus Session!
      const nextSessions = sessionsCompleted + 1;
      setSessionsCompleted(nextSessions);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, nextSessions.toString());

      playChime(true);
      pauseActivePlayer();

      // Seamlessly switch to Break mode and auto-run the countdown
      const breakSecs = breakMins * 60;
      setMode('break');
      localStorage.setItem(STORAGE_KEYS.MODE, 'break');
      setTimeLeft(breakSecs);
      localStorage.setItem(STORAGE_KEYS.REMAINING, breakSecs.toString());

      // Auto-start break timer so it never freezes
      const breakEndTime = Date.now() + breakSecs * 1000;
      localStorage.setItem(STORAGE_KEYS.END_TIME, breakEndTime.toString());
      localStorage.setItem(STORAGE_KEYS.RUNNING, 'true');
      setIsRunning(true);
      setStrictLockActive(true);

    } else {
      // Break Session Finished -> Back to Focus!
      playChime(false);
      setStrictLockActive(false);

      const focusSecs = focusMins * 60;
      setMode('focus');
      localStorage.setItem(STORAGE_KEYS.MODE, 'focus');
      setTimeLeft(focusSecs);
      localStorage.setItem(STORAGE_KEYS.REMAINING, focusSecs.toString());

      // Ready for next focus
      setIsRunning(false);
      localStorage.setItem(STORAGE_KEYS.RUNNING, 'false');
    }
  };

  // Toggle Start / Pause
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

  // Reset Timer to current mode duration
  const handleReset = () => {
    setIsRunning(false);
    localStorage.setItem(STORAGE_KEYS.RUNNING, 'false');
    localStorage.removeItem(STORAGE_KEYS.END_TIME);
    const secs = mode === 'focus' ? focusMins * 60 : breakMins * 60;
    setTimeLeft(secs);
    localStorage.setItem(STORAGE_KEYS.REMAINING, secs.toString());
  };

  // Add 1 minute to break during rest
  const handleAddMinuteBreak = () => {
    const newRemaining = timeLeft + 60;
    setTimeLeft(newRemaining);
    localStorage.setItem(STORAGE_KEYS.REMAINING, newRemaining.toString());
    if (isRunning) {
      const newEndTime = Date.now() + newRemaining * 1000;
      localStorage.setItem(STORAGE_KEYS.END_TIME, newEndTime.toString());
    }
  };

  // End break and switch back to focus mode
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

  // Save custom durations
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
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Coffee size={38} className="animate-pulse" />
          </div>

          <div className="space-y-2 max-w-md">
            <span className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ☕ Rest & Re-energize
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-normal">
              Focus Sprint Complete!
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Step away from the screen, stretch, take a sip of water, and rest your eyes. Your next study session will be sharper!
            </p>
          </div>

          {/* Smooth Dynamic Countdown Display */}
          <div className="glass-panel px-8 py-5 rounded-3xl border border-emerald-500/30 space-y-1 bg-card border-border shadow-2xl">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Rest Time Remaining</span>
            <div className="text-4xl sm:text-5xl font-extrabold font-mono text-emerald-400 tracking-wider">
              {formatTime(timeLeft)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isRunning ? 'Counting down smoothly...' : 'Timer paused'}
            </div>
          </div>

          {/* Rest Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={toggleStartPause}
              className="px-4 py-2 rounded-xl bg-muted/50 border border-border hover:bg-muted text-foreground text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} />}
              <span>{isRunning ? 'Pause Rest' : 'Resume Countdown'}</span>
            </button>

            <button
              onClick={handleAddMinuteBreak}
              className="px-4 py-2 rounded-xl bg-muted/50 border border-border hover:bg-muted text-foreground text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} />
              <span>+1 Min Rest</span>
            </button>

            <button
              onClick={handleEndBreak}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              Ready to Focus Now →
            </button>
          </div>
        </div>
      )}

      {/* 🎯 FLOATING POMODORO WIDGET */}
      <aside aria-label="Pomodoro focus timer" className="fixed bottom-3 right-3 sm:right-4 z-50 will-change-transform">
        {!isExpanded ? (
          /* Collapsed Pill Button */
          <button
            onClick={() => setIsExpanded(true)}
            aria-label={`Open Pomodoro timer, ${formatTime(timeLeft)} remaining in ${mode} mode`}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full font-bold text-xs shadow-2xl border backdrop-blur-md transition-all duration-300 hover:scale-105 cursor-pointer ${
              isRunning
                ? mode === 'focus'
                  ? 'bg-primary/25 border-primary/60 text-white shadow-primary/20 animate-pulse'
                  : 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300 shadow-emerald-500/20 animate-pulse'
                : 'bg-card border-border text-foreground hover:bg-muted hover:border-border/80'
            }`}
          >
            {mode === 'focus' ? (
              <Flame size={15} className="text-primary fill-primary" />
            ) : (
              <Coffee size={15} className="text-emerald-400" />
            )}
            <span className="font-mono text-xs sm:text-sm font-extrabold">{formatTime(timeLeft)}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider hidden sm:inline">
              ({mode})
            </span>
            {sessionsCompleted > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                {sessionsCompleted}
              </span>
            )}
          </button>
        ) : (
          /* Expanded Floating Panel */
          <div className="w-80 glass-panel rounded-2xl p-4 sm:p-5 border border-primary/30 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 bg-card/98 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={17} className="text-primary fill-primary" />
                <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">Focus & Rest Timer</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-muted-foreground hover:text-primary transition p-1.5 rounded-lg hover:bg-muted cursor-pointer"
                  title="Customize Durations"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-muted cursor-pointer"
                  title={soundEnabled ? 'Chime Sound Enabled' : 'Sound Muted'}
                >
                  {soundEnabled ? <Volume2 size={14} className="text-primary" /> : <VolumeX size={14} />}
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Custom Duration Editor */}
            {isEditing ? (
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Customize Minutes:</span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Focus (min):</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={focusMins}
                      onChange={(e) => setFocusMins(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-card border border-border rounded-lg p-2 text-foreground font-bold focus:outline-none focus:border-primary text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Break (min):</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={breakMins}
                      onChange={(e) => setBreakMins(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-card border border-border rounded-lg p-2 text-foreground font-bold focus:outline-none focus:border-primary text-center"
                    />
                  </div>
                </div>
                <button
                  onClick={saveCustomDurations}
                  className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Check size={14} />
                  <span>Save Times</span>
                </button>
              </div>
            ) : (
              /* Mode Selector Tabs */
              <div className="grid grid-cols-2 gap-1 bg-muted/50 p-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-border">
                <button
                  onClick={() => {
                    setMode('focus');
                    localStorage.setItem(STORAGE_KEYS.MODE, 'focus');
                    setIsRunning(false);
                    setTimeLeft(focusMins * 60);
                  }}
                  className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                    mode === 'focus' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Focus ({focusMins}m)
                </button>
                <button
                  onClick={() => {
                    setMode('break');
                    localStorage.setItem(STORAGE_KEYS.MODE, 'break');
                    setIsRunning(false);
                    setTimeLeft(breakMins * 60);
                  }}
                  className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                    mode === 'break' ? 'bg-emerald-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Break ({breakMins}m)
                </button>
              </div>
            )}

            {/* Countdown Clock Display */}
            <div className="text-center py-1 space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono text-foreground tracking-wider">
                {formatTime(timeLeft)}
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden border border-border">
                <div
                  className={`h-full transition-all duration-300 ${
                    mode === 'focus' ? 'bg-gradient-to-r from-primary to-accent' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={toggleStartPause}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : mode === 'focus'
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/30'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                <span>{isRunning ? 'Pause' : mode === 'focus' ? 'Start Focus' : 'Start Break'}</span>
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Sessions Counter Footer */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold">
                <Flame size={13} className="text-amber-400" />
                <span>Today's Focus Cycles:</span>
              </span>
              <span className="font-bold text-foreground">{sessionsCompleted} Finished</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
