import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause,
  ChevronDown, 
  Sun, 
  Moon,
  Volume2,
  Maximize2
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../services/analytics';

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('foclyra'); // 'foclyra' | 'youtube'
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressSec, setProgressSec] = useState(252); // 04:12
  const [selectedTimestamp, setSelectedTimestamp] = useState('04:12');
  const [pomodoroSec, setPomodoroSec] = useState(1305); // 21:45 remaining
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = setInterval(() => {
      setProgressSec((prev) => (prev >= 600 ? 250 : prev + 1));
      setPomodoroSec((prev) => (prev <= 60 ? 1500 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleLaunchApp = (source = 'hero') => {
    trackEvent('landing_launch_studio_click', { source });
    navigate('/');
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
    trackEvent('landing_faq_toggle', { faq_index: index });
  };

  const FAQS = [
    {
      q: "What does Foclyra do?",
      a: "Foclyra imports any public or unlisted YouTube playlist or video link (up to 200 videos) into a dedicated study workspace. You can watch lectures without YouTube's sidebar recommendations or comments, take timestamped notes alongside the video, track lecture completion, and export your notes to a Word (.docx) document."
    },
    {
      q: "Do I need an account to use it?",
      a: "No. You can import 1 full playlist right away as a guest—your progress and notes are saved locally in your browser's IndexedDB. Creating a free account unlocks up to 5 playlists and syncs your courses, progress, and notes across devices via Supabase."
    },
    {
      q: "Is Foclyra free?",
      a: "Yes. Both guest access and registered accounts are completely free."
    },
    {
      q: "How do timestamped notes and Word export work?",
      a: "While a lecture is playing, typing a note and pressing Enter saves it with the current video timecode (for example, 04:12). Clicking any saved timecode jumps the video player back to that exact second. Whenever you are ready, you can export notes for a single course or all courses as a formatted .docx file."
    },
    {
      q: "Can I back up my data or switch devices?",
      a: "Yes. When signed in with Google or email, your courses, watch progress, and notes sync automatically. You can also download or restore a full JSON backup anytime from the Settings page."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-[#111111] dark:text-[#f5f5f7] flex flex-col font-sans antialiased selection:bg-[#F5C542]/40">
      {/* =========================================================================
          1. Top Navigation
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-[#efefef] dark:border-zinc-800/70">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo.svg" alt="Foclyra" className="w-6 h-6 transition-transform group-hover:scale-105" />
              <span className="font-semibold text-[16px] tracking-[-0.02em] text-[#111111] dark:text-white">
                Foclyra
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-[14px] font-normal text-[#666666] dark:text-zinc-400">
              <a href="#studio" className="hover:text-[#111111] dark:hover:text-white transition-colors">Workspace</a>
              <a href="#features" className="hover:text-[#111111] dark:hover:text-white transition-colors">Features</a>
              <a href="#workflow" className="hover:text-[#111111] dark:hover:text-white transition-colors">How It Works</a>
              <a href="#faq" className="hover:text-[#111111] dark:hover:text-white transition-colors">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] dark:bg-zinc-800/90 text-[#111111] dark:text-zinc-200 hover:bg-[#e5e5e5] dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={() => handleLaunchApp('nav_cta')}
              className="flex h-9 shrink-0 items-center rounded-full bg-[#111111] dark:bg-white px-4 text-[14px] font-medium text-white dark:text-[#111111] hover:opacity-90 transition cursor-pointer"
            >
              <span>{user ? 'Open Dashboard' : 'Open Studio'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. Hero Section
         ========================================================================= */}
      <section id="top" className="px-6 pt-[88px] sm:pt-[104px] text-center">
        <h1 className="mx-auto max-w-[920px] text-[clamp(42px,6.4vw,88px)] leading-[1.06] font-semibold tracking-[-0.045em] text-[#111111] dark:text-white">
          <span className="block">Turn YouTube playlists</span>
          <span className="block bg-[linear-gradient(180deg,#111_0%,#111_30%,#9e9e9e_100%)] dark:bg-[linear-gradient(180deg,#fff_0%,#fff_30%,#666_100%)] bg-clip-text pb-[.08em] text-transparent">
            into structured courses.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-[780px] text-[17px] sm:text-[19px] leading-[1.6] text-[#555555] dark:text-zinc-400 font-normal">
          Import any YouTube playlist or video into a distraction-free study workspace.
          <br className="hidden sm:inline" />{' '}
          Watch without recommendations, take timestamped notes, and export to Word (.docx).
        </p>

        <div className="relative mt-8 inline-flex flex-col items-center">
          <button
            type="button"
            onClick={() => handleLaunchApp('hero_main_pill')}
            className="flex h-[52px] items-center gap-2.5 rounded-full bg-[#111111] dark:bg-white px-7 text-[16px] font-medium text-white dark:text-[#111111] hover:bg-[#333333] dark:hover:bg-zinc-200 transition active:scale-[.98] cursor-pointer shadow-sm"
          >
            <span>Import a Playlist Free</span>
          </button>

          <p className="mt-4 text-[14px] text-[#6f6f6f] dark:text-zinc-500">
            Try 1 playlist immediately without login • Up to 5 playlists with a free account
          </p>
        </div>
      </section>

      {/* =========================================================================
          3. Interactive Watch Workspace Preview
         ========================================================================= */}
      <section id="studio" className="px-6 pt-[56px]">
        <div className="mx-auto max-w-[1140px]">
          {/* Mode Switcher */}
          <div className="flex items-center justify-center mb-5">
            <div className="inline-flex p-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('foclyra')}
                className={`flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  viewMode === 'foclyra'
                    ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                    : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                <span className="size-1.5 rounded-full bg-[#63d94e]" />
                <span>Foclyra Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('youtube')}
                className={`flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  viewMode === 'youtube'
                    ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                    : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                <span>Standard YouTube Tab</span>
              </button>
            </div>
          </div>

          <div className="rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-3 sm:p-4 border border-[#e5e5e5] dark:border-zinc-800/80">
            <div className="rounded-[20px] bg-white dark:bg-[#111113] border border-[#e5e5e5] dark:border-zinc-800 overflow-hidden">
              {/* Window Top Bar */}
              <div className="h-11 px-4 bg-[#fafafa] dark:bg-zinc-900/80 border-b border-[#efefef] dark:border-zinc-800 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-[#ff5f57]" />
                  <span className="size-3 rounded-full bg-[#febc2e]" />
                  <span className="size-3 rounded-full bg-[#28c840]" />
                  <span className="ml-2 text-[#6f6f6f] dark:text-zinc-400 font-medium hidden sm:inline">
                    JavaScript Masterclass • 4 of 24 lectures completed
                  </span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-800 text-[12px] font-medium text-[#111111] dark:text-zinc-200">
                  <span className="size-1.5 rounded-full bg-[#f4525f]" />
                  <span className="font-mono">{formatTime(pomodoroSec)}</span>
                  <span className="text-[#8d8d8d]">•</span>
                  <span>Pomodoro Timer</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[12px] text-[#666666] dark:text-zinc-400">
                  <span className="text-[#16a34a] dark:text-[#63d94e] font-medium">Saved in browser</span>
                </div>
              </div>

              {viewMode === 'foclyra' ? (
                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Lecture Video Player (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col gap-3.5">
                    <div className="relative aspect-video rounded-[16px] bg-[#0f0f12] overflow-hidden flex flex-col justify-between p-4 sm:p-5">
                      <div className="flex items-center justify-between z-10">
                        <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-medium backdrop-blur-md">
                          Theater Mode
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-black/60 text-white/90 font-mono text-[11px]">
                          {formatTime(progressSec)} / 48:10
                        </span>
                      </div>

                      <div className="self-center flex flex-col items-center gap-3 z-10">
                        <button
                          type="button"
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="size-14 rounded-full bg-white text-[#111111] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                        >
                          {isPlaying ? (
                            <Pause size={20} className="fill-[#111111]" />
                          ) : (
                            <Play size={20} className="fill-[#111111] ml-0.5" />
                          )}
                        </button>
                        <span className="text-white/90 text-[13px] font-medium tracking-[-0.01em]">
                          Lecture 04 — Closures &amp; Lexical Scope
                        </span>
                      </div>

                      <div className="w-full space-y-2 z-10">
                        <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${(progressSec / 600) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-white/70">
                          <div className="flex items-center gap-3">
                            <Volume2 size={13} />
                            <span className="font-mono">{formatTime(progressSec)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white">1.25x</span>
                            <Maximize2 size={12} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <div>
                        <div className="text-[15px] font-semibold tracking-[-0.01em] text-[#111111] dark:text-white">
                          Lecture 04: Closures &amp; Lexical Scope in JavaScript
                        </div>
                        <div className="text-[13px] text-[#6f6f6f] dark:text-zinc-400">
                          Auto-resumes where you left off
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-800 text-[#111111] dark:text-zinc-200 text-[12px] font-medium">
                        Completed
                      </span>
                    </div>
                  </div>

                  {/* Right: Real Lesson Notes Panel (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between rounded-[16px] bg-[#f8f8f8] dark:bg-zinc-900/70 p-4 border border-[#efefef] dark:border-zinc-800 space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5] dark:border-zinc-800">
                        <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#111111] dark:text-white">
                          Lesson Notes (2)
                        </span>
                        <span className="text-[11px] text-[#6f6f6f] dark:text-zinc-400 font-mono">
                          Enter to save
                        </span>
                      </div>

                      <div
                        onClick={() => { setSelectedTimestamp('04:12'); setProgressSec(252); }}
                        className={`p-3 rounded-[12px] border transition cursor-pointer text-left ${
                          selectedTimestamp === '04:12'
                            ? 'bg-white dark:bg-zinc-800 border-[#111111]/20 dark:border-white/20 shadow-2xs'
                            : 'bg-white/60 dark:bg-zinc-900/40 border-[#e5e5e5] dark:border-zinc-800 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[12px] font-mono font-medium text-[#111111] dark:text-white">
                          <span className="underline">04:12</span>
                          <span className="text-[#6f6f6f] font-sans">• Click timecode to seek video</span>
                        </div>
                        <p className="mt-1.5 text-[12px] font-mono text-[#333333] dark:text-zinc-300 bg-[#f4f4f4] dark:bg-zinc-950 p-2 rounded-lg">
                          Inner function retains access to outer scope variables even after outer function returns.
                        </p>
                      </div>

                      <div
                        onClick={() => { setSelectedTimestamp('09:45'); setProgressSec(585); }}
                        className={`p-3 rounded-[12px] border transition cursor-pointer text-left ${
                          selectedTimestamp === '09:45'
                            ? 'bg-white dark:bg-zinc-800 border-[#111111]/20 dark:border-white/20 shadow-2xs'
                            : 'bg-white/60 dark:bg-zinc-900/40 border-[#e5e5e5] dark:border-zinc-800 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[12px] font-mono font-medium text-[#111111] dark:text-white">
                          <span className="underline">09:45</span>
                          <span className="text-[#6f6f6f] font-sans">• Practical use case</span>
                        </div>
                        <p className="mt-1 text-[13px] text-[#555555] dark:text-zinc-400 leading-[1.45]">
                          Used for data encapsulation, factory functions, and memoization.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchApp('demo_export')}
                        className="w-full h-10 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer"
                      >
                        <span>Download Course Notes (.docx)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Grounded Comparison: What Standard YouTube Shows vs Foclyra */
                <div className="p-8 sm:p-12 text-center space-y-6">
                  <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    What gets in your way on a standard YouTube tab
                  </h3>
                  <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div className="p-4 rounded-[16px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1">
                      <div className="text-[14px] font-semibold text-[#111111] dark:text-white">Recommended Sidebar</div>
                      <p className="text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                        Unrelated videos and Shorts sit right next to your lecture player.
                      </p>
                    </div>
                    <div className="p-4 rounded-[16px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1">
                      <div className="text-[14px] font-semibold text-[#111111] dark:text-white">No Course Progress</div>
                      <p className="text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                        No clear checklist showing how many lectures in a 50-video playlist you have completed.
                      </p>
                    </div>
                    <div className="p-4 rounded-[16px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1">
                      <div className="text-[14px] font-semibold text-[#111111] dark:text-white">Separate Note Apps</div>
                      <p className="text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                        Switching windows to write notes without clickable video timestamps.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('foclyra')}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111111] dark:bg-white px-5 text-[14px] font-medium text-white dark:text-[#111111] cursor-pointer"
                  >
                    <span>Switch back to Foclyra Workspace</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. Features Bento Grid — 4 Real Capabilities, Zero Fake Icons
         ========================================================================= */}
      <section id="features" className="px-6 pt-[128px] sm:pt-[152px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center max-w-[960px] mx-auto">
            <div className="text-[14px] font-medium text-[#6f6f6f] dark:text-zinc-400">Features</div>
            <h2 className="mt-2 text-[clamp(30px,3.8vw,46px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Everything you need to finish a playlist.
            </h2>
            <p className="mt-4 text-[17px] leading-[1.6] text-[#666666] dark:text-zinc-400">
              Your video player, lecture checklist, timestamped notes, and focus timer in one tab.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            {/* Card 1: Clean Playlist & Video Player (7 cols) */}
            <div className="lg:col-span-7 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[280px]">
              <div className="space-y-2.5 max-w-lg">
                <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  Distraction-free playlist player
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Import any public or unlisted YouTube playlist (up to 200 videos) or single tutorial. Watch in Theater Mode with chapter markers, playback speed controls, and auto-saved resume timestamps—without YouTube’s home feed or comment section.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  No sidebar recommendations
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  No comments feed
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  Auto-resumes playback
                </span>
              </div>
            </div>

            {/* Card 2: Timestamped Notes (5 cols) */}
            <div className="lg:col-span-5 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[280px]">
              <div className="space-y-2.5">
                <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  Timestamped lecture notes
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Every note you save records the exact video timecode. Click any timestamp later to seek the video directly to that explanation.
                </p>
              </div>

              <div className="mt-6 rounded-[18px] bg-white dark:bg-zinc-800 p-4">
                <div className="flex items-center justify-between text-[12px] font-mono text-[#111111] dark:text-white font-medium">
                  <span>04:12 • Event Loop &amp; Microtasks</span>
                  <span className="text-[#16a34a] dark:text-[#63d94e]">Jump to 04:12</span>
                </div>
                <p className="mt-1.5 text-[13px] text-[#666666] dark:text-zinc-400">
                  Promise callbacks run in the microtask queue before the next macrotask.
                </p>
              </div>
            </div>

            {/* Card 3: Word (.docx) Export (5 cols) */}
            <div className="lg:col-span-5 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[280px]">
              <div className="space-y-2.5">
                <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  Course-wise Word (.docx) export
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Download notes for a single course or export all your notes at once as a formatted Microsoft Word (.docx) document organized by lecture and timestamp.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-[18px] bg-white dark:bg-zinc-800 px-4 py-3.5">
                <span className="text-[13px] font-medium text-[#111111] dark:text-white">
                  JavaScript_Masterclass_Notes.docx
                </span>
                <span className="text-[12px] font-medium text-[#6f6f6f] dark:text-zinc-400">
                  .docx file
                </span>
              </div>
            </div>

            {/* Card 4: Pomodoro, Streak & Cloud Sync (7 cols) */}
            <div className="lg:col-span-7 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[280px]">
              <div className="space-y-2.5 max-w-lg">
                <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  Pomodoro timer, study streaks &amp; cloud sync
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Run customizable Pomodoro focus/break sessions while you watch, track your daily study streak, and keep your data stored locally in IndexedDB—with optional Supabase cloud sync and JSON backups.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  Built-in Pomodoro timer
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  Daily study streak
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  Supabase cloud sync
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. How It Works — 3 Clear Steps
         ========================================================================= */}
      <section id="workflow" className="px-6 pt-[128px] sm:pt-[152px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center max-w-[960px] mx-auto">
            <div className="text-[14px] font-medium text-[#6f6f6f] dark:text-zinc-400">How It Works</div>
            <h2 className="mt-2 text-[clamp(30px,3.8vw,46px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Start studying in three steps.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                step: '01',
                title: 'Paste a YouTube link',
                desc: 'Paste any public or unlisted YouTube playlist or video URL—or pick one of the starter courses on the dashboard.'
              },
              {
                step: '02',
                title: 'Watch & write timestamped notes',
                desc: 'Study in Theater Mode with a built-in Pomodoro timer and save notes tied to the exact video second.'
              },
              {
                step: '03',
                title: 'Track progress & export to Word',
                desc: 'Mark lectures complete as you go and download your notes as a formatted Word (.docx) document anytime.'
              }
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-8 flex flex-col justify-between min-h-[210px]"
              >
                <span className="text-[13px] font-mono font-medium text-[#8d8d8d]">{item.step}</span>
                <div className="space-y-2 mt-6">
                  <h3 className="text-[20px] leading-[1.25] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FAQ Section
         ========================================================================= */}
      <section id="faq" className="px-6 pt-[128px] sm:pt-[152px]">
        <div className="mx-auto max-w-[760px]">
          <div className="text-center">
            <div className="text-[14px] font-medium text-[#6f6f6f] dark:text-zinc-400">FAQ</div>
            <h2 className="mt-2 text-[clamp(30px,3.8vw,46px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Frequently asked questions
            </h2>
          </div>

          <div className="mt-10 divide-y divide-[#e5e5e5] dark:divide-zinc-800 border-y border-[#e5e5e5] dark:border-zinc-800">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={faq.q} className="py-5">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left text-[17px] font-semibold tracking-[-0.015em] text-[#111111] dark:text-white hover:opacity-75 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[#6f6f6f] transition-transform duration-200 flex-shrink-0 ml-4 ${
                        isOpen ? 'rotate-180 text-[#111111] dark:text-white' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400 pr-6">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. Final CTA Section
         ========================================================================= */}
      <section aria-labelledby="cta-h" className="px-6 pt-[128px] sm:pt-[152px] pb-20">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-[#f4f4f4] dark:bg-zinc-900/90 px-6 py-20 sm:py-24 text-center">
          <h2
            id="cta-h"
            className="mx-auto max-w-[960px] text-[clamp(30px,3.8vw,46px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white"
          >
            Ready to study your next playlist?
          </h2>

          <p className="mx-auto mt-4 max-w-[780px] text-[17px] leading-[1.6] text-[#666666] dark:text-zinc-400">
            Paste any YouTube playlist URL or try a starter course on the dashboard—no login required for your first course.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => handleLaunchApp('footer_banner')}
              className="flex h-[52px] items-center gap-2 rounded-full bg-[#111111] dark:bg-white px-7 text-[16px] font-medium text-white dark:text-[#111111] hover:bg-[#333333] dark:hover:bg-zinc-200 transition active:scale-[.98] cursor-pointer shadow-sm"
            >
              <span>Open Foclyra Studio</span>
            </button>
            <span className="mt-4 text-[13px] text-[#6f6f6f] dark:text-zinc-500">
              1 playlist in guest mode • Up to 5 playlists + cloud sync with a free account
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. Footer
         ========================================================================= */}
      <footer className="px-6 py-10 border-t border-[#efefef] dark:border-zinc-800/70">
        <div className="mx-auto max-w-[1200px] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#6f6f6f] dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Foclyra" className="w-5 h-5" />
            <span className="font-semibold text-[#111111] dark:text-white">Foclyra</span>
            <span>— Built by Sameed Siddiqui</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/ssiddiquiii/foclyra"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#111111] dark:hover:text-white transition"
            >
              GitHub
            </a>
            <button
              type="button"
              onClick={() => handleLaunchApp('footer_link')}
              className="hover:text-[#111111] dark:hover:text-white transition cursor-pointer"
            >
              Open Studio
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
