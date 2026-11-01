import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause,
  ShieldCheck, 
  FileText, 
  Clock, 
  ArrowRight, 
  Download, 
  ChevronDown, 
  Sun, 
  Moon,
  ExternalLink,
  Volume2,
  Maximize2,
  Code,
  EyeOff,
  CheckCircle2,
  BookOpen,
  Layers,
  ListVideo,
  Timer
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../services/analytics';

/**
 * Vidyst-style inline tilted icon tile (`size-[.8em] rounded-[.22em]`)
 */
function InlineTile({ bg = '#111111', color = '#ffffff', rotate = -6, children }) {
  return (
    <span
      aria-hidden="true"
      className="relative top-[-.06em] inline-flex items-center justify-center rounded-[.22em] align-middle select-none shadow-xs"
      style={{
        width: '.8em',
        height: '.8em',
        margin: '0 .06em',
        background: bg,
        color,
        transform: `rotate(${rotate}deg)`
      }}
    >
      {children}
    </span>
  );
}

// Rotating Hero H1 items — strictly what Foclyra actually imports from YouTube
const HERO_ITEMS = [
  {
    label: 'playlists',
    bg: '#FF0000',
    color: '#ffffff',
    rotate: -6,
    svg: <ListVideo style={{ width: '0.46em', height: '0.46em', strokeWidth: 2.2, flexShrink: 0 }} />
  },
  {
    label: 'lectures',
    bg: '#111111',
    color: '#ffffff',
    rotate: 5,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '0.46em', height: '0.46em', flexShrink: 0 }}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  },
  {
    label: 'tutorials',
    bg: '#F5C542',
    color: '#111111',
    rotate: -4,
    svg: <Code style={{ width: '0.46em', height: '0.46em', strokeWidth: 2.3, flexShrink: 0 }} />
  }
];

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickerIndex, setTickerIndex] = useState(0);
  const [pauseAnimations, setPauseAnimations] = useState(false);
  const [viewMode, setViewMode] = useState('foclyra'); // 'foclyra' | 'youtube'
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressSec, setProgressSec] = useState(252); // 04:12
  const [selectedTimestamp, setSelectedTimestamp] = useState('04:12');
  const [pomodoroSec, setPomodoroSec] = useState(1305); // 21:45 remaining
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    if (pauseAnimations) return undefined;
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % HERO_ITEMS.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [pauseAnimations]);

  useEffect(() => {
    if (!isPlaying || pauseAnimations) return undefined;
    const interval = setInterval(() => {
      setProgressSec((prev) => (prev >= 600 ? 250 : prev + 1));
      setPomodoroSec((prev) => (prev <= 60 ? 1500 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, pauseAnimations]);

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
      q: "What does Foclyra actually do?",
      a: "Foclyra imports any public or unlisted YouTube playlist or video link (up to 200 videos) into a clean course workspace. You can watch lectures without YouTube's sidebar recommendations or comments, take timestamped notes below the video, track completion progress, and export your notes to a Word (.docx) file."
    },
    {
      q: "Do I need an account to try it?",
      a: "No. You can import 1 full playlist as a guest right away—your progress and notes are saved locally in your browser's IndexedDB. Signing in with a free account unlocks up to 5 playlists and syncs your courses, progress, and notes across devices via Supabase."
    },
    {
      q: "Is Foclyra free?",
      a: "Yes. Both guest mode and registered accounts are completely free."
    },
    {
      q: "How do timestamped notes and Word export work?",
      a: "While a lecture is playing, typing a note and pressing Enter saves it with the current video timecode (e.g., 04:12). Clicking any saved timecode jumps the video player back to that exact second. At any time, you can export notes for a single course or all courses into a structured .docx file."
    },
    {
      q: "What happens if I clear my browser data or switch laptops?",
      a: "If you sign in with Google or email, your courses, watch progress, and notes sync to the cloud automatically. You can also export and import a full JSON backup anytime from the Settings page."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-[#111111] dark:text-[#f5f5f7] flex flex-col font-sans antialiased selection:bg-[#F5C542]/40">
      {/* =========================================================================
          1. Top Navigation
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-[#efefef] dark:border-zinc-800/70">
        <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo.svg" alt="Foclyra" className="w-6 h-6 transition-transform group-hover:scale-105" />
              <span className="font-semibold text-[16px] tracking-[-0.02em] text-[#111111] dark:text-white">
                foclyra
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
              onClick={() => setPauseAnimations(!pauseAnimations)}
              className="hidden sm:flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#f2f2f2] dark:bg-zinc-800/90 px-3.5 text-[13px] font-medium text-[#111111] dark:text-zinc-200 hover:bg-[#e5e5e5] dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              <span>{pauseAnimations ? 'Resume motion' : 'Pause motion'}</span>
            </button>

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
          2. Hero Section — Clear, Grounded Value Proposition
         ========================================================================= */}
      <section id="top" className="px-6 pt-[96px] sm:pt-[108px] text-center">
        <h1 className="mx-auto max-w-[920px] text-[clamp(44px,6.8vw,92px)] leading-[1.06] font-semibold tracking-[-0.045em] text-[#111111] dark:text-white">
          <span className="block">Turn YouTube</span>

          {/* Rotating line: playlists / lectures / tutorials */}
          <span className="grid justify-center justify-items-center overflow-hidden pt-[.04em] pb-[.1em]">
            <span className="sr-only">playlists, lectures, tutorials</span>
            {HERO_ITEMS.map((item, idx) => {
              const isActive = idx === tickerIndex;
              const isPrev = idx === (tickerIndex - 1 + HERO_ITEMS.length) % HERO_ITEMS.length;
              return (
                <span
                  key={item.label}
                  aria-hidden="true"
                  className="flex items-center gap-[.18em] whitespace-nowrap [grid-area:1/1]"
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive
                      ? 'translateY(0) scale(1)'
                      : isPrev
                      ? 'translateY(-.55em) scale(0.92)'
                      : 'translateY(.55em) scale(0.92)',
                    filter: isActive ? 'blur(0px)' : 'blur(6px)',
                    transition: 'opacity .5s ease, transform .6s cubic-bezier(.34,1.3,.64,1), filter .5s ease',
                    pointerEvents: isActive ? 'auto' : 'none'
                  }}
                >
                  <span
                    className="flex size-[.8em] flex-none items-center justify-center rounded-[.22em] shadow-xs"
                    style={{
                      background: item.bg,
                      color: item.color,
                      transform: `rotate(${item.rotate}deg)`
                    }}
                  >
                    {item.svg}
                  </span>
                  <span>{item.label}</span>
                </span>
              );
            })}
          </span>

          <span className="block bg-[linear-gradient(180deg,#111_0%,#111_25%,#b5b5b5_100%)] dark:bg-[linear-gradient(180deg,#fff_0%,#fff_25%,#52525b_100%)] bg-clip-text pb-[.08em] text-transparent">
            into structured courses.
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-[570px] text-[18px] sm:text-[20px] leading-[1.5] text-pretty text-[#666666] dark:text-zinc-400 font-normal">
          Paste any YouTube playlist or video link to study without sidebar recommendations or comments. Take{' '}
          <span className="relative inline-block px-1.5 text-[#111111] dark:text-amber-200 font-medium">
            <span className="absolute inset-0 bg-[#F5C542]/35 dark:bg-[#F5C542]/20 rounded -rotate-1 -z-10" />
            timestamped notes
          </span>
          , track lecture progress, and export to Word (.docx).
        </p>

        <div className="relative mt-8 inline-flex flex-col items-center">
          <button
            type="button"
            onClick={() => handleLaunchApp('hero_main_pill')}
            className="flex h-[52px] items-center gap-[9px] rounded-full bg-[#111111] dark:bg-white px-[26px] text-[16px] font-medium text-white dark:text-[#111111] hover:bg-[#333333] dark:hover:bg-zinc-200 transition active:scale-[.98] cursor-pointer shadow-sm"
          >
            <Play size={15} className="fill-current" />
            <span>Import a Playlist Free</span>
          </button>

          {/* Odoo Handwritten Note — Accurate to Quota Service */}
          <div className="hidden lg:flex items-center gap-2 absolute -right-56 top-1.5 select-none pointer-events-none">
            <svg className="w-11 h-9 text-[#0284c7] dark:text-sky-400 -rotate-6" viewBox="0 0 60 44" fill="none">
              <path d="M52 34 C 34 36, 18 28, 8 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M16 10 L 7 11 L 10 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="font-handwriting text-[21px] text-[#111111] dark:text-zinc-200 -rotate-3 leading-[1.1] text-left">
              <span>Try 1 playlist without login</span>
              <span className="block text-[16px] text-[#6f6f6f] dark:text-zinc-400">or 5 with a free account!</span>
            </div>
          </div>

          <p className="mt-5 text-[14px] text-[#6f6f6f] dark:text-zinc-500">
            Free to use • Local IndexedDB storage + optional Supabase cloud sync
          </p>
        </div>
      </section>

      {/* =========================================================================
          3. Interactive Watch Workspace Preview (Grounded in Real Watch.jsx UI)
         ========================================================================= */}
      <section id="studio" className="px-6 pt-[64px]">
        <div className="mx-auto max-w-[1160px]">
          {/* Switcher: Foclyra Watch View vs Standard YouTube */}
          <div className="flex items-center justify-center mb-5">
            <div className="inline-flex p-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('foclyra')}
                className={`flex h-10 items-center gap-2 rounded-full px-5 text-[14px] font-semibold transition-all duration-200 active:scale-[.97] cursor-pointer ${
                  viewMode === 'foclyra'
                    ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                    : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                <span className="size-2 rounded-full bg-[#63d94e]" />
                <span>Foclyra Watch View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('youtube')}
                className={`flex h-10 items-center gap-2 rounded-full px-5 text-[14px] font-semibold transition-all duration-200 active:scale-[.97] cursor-pointer ${
                  viewMode === 'youtube'
                    ? 'bg-[#f4525f] text-white shadow-xs'
                    : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                <EyeOff size={14} />
                <span>Standard YouTube Page</span>
              </button>
            </div>
          </div>

          <div className="rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-3 sm:p-4 border border-[#e5e5e5] dark:border-zinc-800/80 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08)]">
            <div className="rounded-[20px] bg-white dark:bg-[#111113] border border-[#e5e5e5] dark:border-zinc-800 overflow-hidden">
              {/* Window Top Bar */}
              <div className="h-11 px-4 bg-[#fafafa] dark:bg-zinc-900/80 border-b border-[#efefef] dark:border-zinc-800 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-[#ff5f57]" />
                  <span className="size-3 rounded-full bg-[#febc2e]" />
                  <span className="size-3 rounded-full bg-[#28c840]" />
                  <span className="ml-2 text-[#6f6f6f] dark:text-zinc-400 font-medium hidden sm:inline">
                    JavaScript Masterclass • 4 of 24 lectures completed (17%)
                  </span>
                </div>

                {/* Real Pomodoro Timer Indicator */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-800 text-[12px] font-medium text-[#111111] dark:text-zinc-200">
                  <Timer size={13} className="text-[#f4525f]" />
                  <span className="font-mono">{formatTime(pomodoroSec)}</span>
                  <span className="text-[#8d8d8d]">•</span>
                  <span className="text-[#111111] dark:text-white font-semibold">Pomodoro Focus</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[12px] text-[#666666] dark:text-zinc-400">
                  <span className="text-[#16a34a] dark:text-[#63d94e] font-medium">● Saved to IndexedDB</span>
                </div>
              </div>

              {viewMode === 'foclyra' ? (
                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Lecture Video Player (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col gap-3.5">
                    <div className="relative aspect-video rounded-[16px] bg-[#0f0f12] overflow-hidden flex flex-col justify-between p-4 sm:p-5">
                      <div className="flex items-center justify-between z-10">
                        <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-medium backdrop-blur-md">
                          Theater Mode • Sidebar Hidden
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
                          Auto-resumes where you left off • Press Space to play/pause
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-800 text-[#16a34a] dark:text-[#63d94e] text-[12px] font-medium">
                        ✓ Mark Complete
                      </span>
                    </div>
                  </div>

                  {/* Right: Real Lesson Notes Panel (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between rounded-[16px] bg-[#f8f8f8] dark:bg-zinc-900/70 p-4 border border-[#efefef] dark:border-zinc-800 space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5] dark:border-zinc-800">
                        <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#111111] dark:text-white flex items-center gap-1.5">
                          <FileText size={14} />
                          <span>Lesson Notes (2)</span>
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
                          <Clock size={11} />
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
                          <Clock size={11} />
                          <span className="underline">09:45</span>
                          <span className="text-[#6f6f6f] font-sans">• Practical use case</span>
                        </div>
                        <p className="mt-1 text-[13px] text-[#555555] dark:text-zinc-400 leading-[1.45]">
                          Used for data privacy, factory functions, and memoization.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchApp('demo_export')}
                        className="w-full h-10 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Download Course Notes (.docx)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Grounded Comparison: What Standard YouTube Shows vs Foclyra */
                <div className="p-8 sm:p-12 text-center space-y-6">
                  <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    What gets in your way on a normal YouTube tab
                  </h3>
                  <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div className="p-4 rounded-[16px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1">
                      <div className="text-[14px] font-semibold text-[#f4525f]">Recommended Sidebar</div>
                      <p className="text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                        Unrelated viral videos and Shorts sit right next to your lecture player.
                      </p>
                    </div>
                    <div className="p-4 rounded-[16px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1">
                      <div className="text-[14px] font-semibold text-[#f4525f]">No Course Progress</div>
                      <p className="text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                        Hard to track which lectures in a 50-video playlist you have actually finished.
                      </p>
                    </div>
                    <div className="p-4 rounded-[16px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1">
                      <div className="text-[14px] font-semibold text-[#f4525f]">Separate Note Apps</div>
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
                    <span>See Foclyra Watch View</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. Editorial Two-Tone Section — Grounded in Video + Timestamped Notes
         ========================================================================= */}
      <section className="px-6 pt-[140px] sm:pt-[168px]">
        <div className="mx-auto max-w-[1160px] text-center">
          <div className="text-[15px] text-[#6f6f6f] dark:text-zinc-400">Side-by-Side Study</div>
          <h2 className="mt-2.5 mx-auto max-w-[820px] text-[clamp(34px,4.8vw,64px)] leading-[1.14] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
            Watch{' '}
            <span className="whitespace-nowrap">
              <InlineTile bg="#FF0000" color="#ffffff" rotate={-5}>
                <Play size={18} className="fill-current" />
              </InlineTile>{' '}
              lectures.
            </span>
            <br />
            <span className="text-[#8d8d8d] dark:text-zinc-500">
              Write{' '}
              <span className="whitespace-nowrap">
                <InlineTile bg="#111111" color="#ffffff" rotate={5}>
                  <FileText size={18} />
                </InlineTile>{' '}
                notes.
              </span>
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-[540px] text-[18px] leading-[1.55] text-pretty text-[#666666] dark:text-zinc-400">
            Your video player, playlist syllabus, and note editor live in one tab. Every note automatically saves the current video timestamp so you can jump back to any explanation in one click.
          </p>
        </div>
      </section>

      {/* =========================================================================
          5. Bento Grid — 4 Real Features From the Codebase
         ========================================================================= */}
      <section id="features" className="px-6 pt-[140px] sm:pt-[168px]">
        <div className="mx-auto max-w-[1240px]">
          <div className="text-center">
            <div className="text-[15px] text-[#6f6f6f] dark:text-zinc-400">What’s Inside</div>
            <h2 className="mt-2.5 text-[clamp(34px,4.8vw,64px)] leading-[1.14] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Built for{' '}
              <span className="whitespace-nowrap">
                <InlineTile bg="#111111" color="#ffffff" rotate={-6}>
                  <Layers size={18} />
                </InlineTile>{' '}
                playlists.
              </span>
              <br />
              <span className="text-[#8d8d8d] dark:text-zinc-500">
                Designed for{' '}
                <span className="whitespace-nowrap">
                  <InlineTile bg="#F5C542" color="#111111" rotate={5}>
                    <BookOpen size={18} />
                  </InlineTile>{' '}
                  completion.
                </span>
              </span>
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            {/* Card 1: Clean Playlist & Video Importer (7 cols) */}
            <div className="lg:col-span-7 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[290px]">
              <div className="space-y-2.5 max-w-md">
                <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  Distraction-free playlist &amp; video player.
                </h3>
                <p className="text-[15px] leading-[1.55] text-[#666666] dark:text-zinc-400 text-pretty">
                  Import any public or unlisted YouTube playlist (up to 200 videos) or single tutorial. Watch in Theater Mode with chapter markers, playback speed controls, and auto-saved resume timestamps—without YouTube’s home feed or comment section.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200 shadow-2xs">
                  ✓ No sidebar recommendations
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200 shadow-2xs">
                  ✓ No comment section
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200 shadow-2xs">
                  ✓ Auto-resumes playback
                </span>
              </div>
            </div>

            {/* Card 2: Timestamped Notes (5 cols) */}
            <div className="lg:col-span-5 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[290px]">
              <div className="space-y-2.5">
                <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  Timestamped lecture notes.
                </h3>
                <p className="text-[15px] leading-[1.55] text-[#666666] dark:text-zinc-400 text-pretty">
                  Every note you save records the exact video timecode. Click any timestamp later to seek the video directly to that point.
                </p>
              </div>

              <div className="mt-6 rounded-[18px] bg-white dark:bg-zinc-800 p-4 shadow-2xs">
                <div className="flex items-center justify-between text-[12px] font-mono text-[#111111] dark:text-white font-medium">
                  <span>[12:40] Event Loop &amp; Microtasks</span>
                  <span className="text-[#16a34a] dark:text-[#63d94e]">Seek video ↗</span>
                </div>
                <p className="mt-1 text-[13px] text-[#666666] dark:text-zinc-400">
                  Promise callbacks run in the microtask queue before the next macrotask.
                </p>
              </div>
            </div>

            {/* Card 3: Word (.docx) Export (5 cols) */}
            <div className="lg:col-span-5 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[290px]">
              <div className="space-y-2.5">
                <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  Course-wise Word (.docx) export.
                </h3>
                <p className="text-[15px] leading-[1.55] text-[#666666] dark:text-zinc-400 text-pretty">
                  Download notes for a single course or export all your notes at once as a formatted Microsoft Word (.docx) file organized by lecture and timestamp.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-[18px] bg-white dark:bg-zinc-800 px-4 py-3.5 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-[#111111] dark:text-white" />
                  <span className="text-[13px] font-medium text-[#111111] dark:text-white">
                    JavaScript_Notes.docx
                  </span>
                </div>
                <span className="font-handwriting text-[18px] text-[#0284c7] dark:text-sky-400 font-bold">
                  1-click download
                </span>
              </div>
            </div>

            {/* Card 4: Pomodoro, Streak & Cloud Sync (7 cols) */}
            <div className="lg:col-span-7 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[290px]">
              <div className="space-y-2.5 max-w-md">
                <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  Pomodoro timer, study streaks &amp; cloud sync.
                </h3>
                <p className="text-[15px] leading-[1.55] text-[#666666] dark:text-zinc-400 text-pretty">
                  Run customizable Pomodoro focus/break timers while you watch, track your daily study streak, and keep data safe in local IndexedDB—with optional Supabase cloud sync and JSON backups.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200 shadow-2xs">
                  ⏱ Built-in Pomodoro timer
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200 shadow-2xs">
                  🔥 Daily streak calendar
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200 shadow-2xs">
                  ☁️ Supabase cloud sync
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. Workflow Section — 3 Factual Steps
         ========================================================================= */}
      <section id="workflow" className="px-6 pt-[140px] sm:pt-[168px]">
        <div className="mx-auto max-w-[1240px]">
          <div className="text-center">
            <div className="text-[15px] text-[#6f6f6f] dark:text-zinc-400">How It Works</div>
            <h2 className="mt-2.5 text-[clamp(34px,4.8vw,64px)] leading-[1.14] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Paste a link.{' '}
              <span className="text-[#8d8d8d] dark:text-zinc-500">Start studying.</span>
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                step: '01',
                title: 'Import a YouTube playlist or video',
                desc: 'Paste any YouTube URL on the dashboard—or pick one of the built-in starter courses to test-drive immediately.'
              },
              {
                step: '02',
                title: 'Watch & capture timestamped notes',
                desc: 'Study in a clean layout with Theater Mode, a floating Pomodoro timer, and notes tied to exact video seconds.'
              },
              {
                step: '03',
                title: 'Track progress & export to Word',
                desc: 'Mark lectures complete, build your daily streak, and download your course notes as a .docx file anytime.'
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
                  <p className="text-[15px] leading-[1.55] text-[#666666] dark:text-zinc-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FAQ Section
         ========================================================================= */}
      <section id="faq" className="px-6 pt-[140px] sm:pt-[168px]">
        <div className="mx-auto max-w-[760px]">
          <div className="text-center">
            <div className="text-[15px] text-[#6f6f6f] dark:text-zinc-400">FAQ</div>
            <h2 className="mt-2.5 text-[clamp(34px,4.8vw,60px)] leading-[1.14] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Questions, <span className="text-[#8d8d8d] dark:text-zinc-500">answered.</span>
            </h2>
          </div>

          <div className="mt-12 divide-y divide-[#e5e5e5] dark:divide-zinc-800 border-y border-[#e5e5e5] dark:border-zinc-800">
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
          8. Final CTA Section
         ========================================================================= */}
      <section aria-labelledby="cta-h" className="px-6 pt-[140px] sm:pt-[168px] pb-20">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[32px] bg-[#f4f4f4] dark:bg-zinc-900/90 px-6 pt-20 pb-20 sm:pt-24 sm:pb-[88px] text-center">
          <h2
            id="cta-h"
            className="mx-auto max-w-[820px] text-[clamp(38px,5.6vw,76px)] leading-[1.12] font-semibold tracking-[-0.04em] text-balance text-[#111111] dark:text-white"
          >
            Stop losing{' '}
            <span className="whitespace-nowrap">
              <InlineTile bg="#111111" color="#ffffff" rotate={-6}>
                <ShieldCheck size={22} />
              </InlineTile>{' '}
              focus.
            </span>{' '}
            <span className="text-[#8d8d8d] dark:text-zinc-500">
              Finish your{' '}
              <span className="whitespace-nowrap">
                <InlineTile bg="#63d94e" color="#111111" rotate={5}>
                  <CheckCircle2 size={22} />
                </InlineTile>{' '}
                playlist.
              </span>
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-[520px] text-[18px] leading-[1.55] text-[#666666] dark:text-zinc-400">
            Paste a YouTube playlist or pick a starter course on the dashboard—no login required to try your first course.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => handleLaunchApp('footer_banner')}
              className="flex h-[52px] items-center gap-[9px] rounded-full bg-[#111111] dark:bg-white px-[28px] text-[16px] font-medium text-white dark:text-[#111111] hover:bg-[#333333] dark:hover:bg-zinc-200 transition active:scale-[.98] cursor-pointer shadow-sm"
            >
              <Play size={15} className="fill-current" />
              <span>Open Foclyra Studio</span>
            </button>
            <span className="mt-4 text-[13px] text-[#6f6f6f] dark:text-zinc-500">
              1 playlist in guest mode • Up to 5 playlists + cloud sync with a free account
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. Footer
         ========================================================================= */}
      <footer className="px-6 py-10 border-t border-[#efefef] dark:border-zinc-800/70">
        <div className="mx-auto max-w-[1240px] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#6f6f6f] dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Foclyra" className="w-5 h-5" />
            <span className="font-semibold text-[#111111] dark:text-white">foclyra</span>
            <span>— Built by Sameed Siddiqui</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/ssiddiquiii/foclyra"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#111111] dark:hover:text-white transition flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink size={12} />
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
