import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  GraduationCap,
  Pause,
  Sun, 
  Moon,
  Volume2,
  Maximize2,
  ArrowRight,
  ArrowUp,
  FileText,
  Clock,
  CheckCircle2,
  Download,
  Flame,
  Cloud,
  Link2,
  Plus
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../services/analytics';

/**
 * Vidyst-style squircle app tile for intentional editorial accents.
 * Responsive across 320px mobile up to 1440px+ desktop.
 */
function BrandTile({ children, bg = 'bg-[#111111] dark:bg-white', text = 'text-white dark:text-[#111111]', rotate = '-rotate-3', size = 'sm' }) {
  const dims =
    size === 'lg'
      ? 'h-[0.8em] w-[0.8em] rounded-[24%] mx-[0.1em] sm:mx-[0.12em] -translate-y-[0.06em]'
      : 'size-8 sm:size-9 lg:size-10 rounded-[9px] sm:rounded-[11px] lg:rounded-[12px]';
  return (
    <span
      className={`inline-flex items-center justify-center align-middle shadow-[0_6px_16px_-4px_rgba(0,0,0,0.16)] ${dims} ${bg} ${text} ${rotate} select-none shrink-0 transition-transform duration-200 hover:rotate-0 hover:scale-105`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('foclyra'); // 'foclyra' | 'youtube'
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressSec, setProgressSec] = useState(252); // 04:12
  const [selectedTimestamp, setSelectedTimestamp] = useState('04:12');
  const [pomodoroSec, setPomodoroSec] = useState(1305); // 21:45 remaining
  const [activeFaq, setActiveFaq] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(24);
  const githubRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setShowScrollTop(scrollY > 350);

      if (githubRef.current) {
        const rect = githubRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const distFromBottom = windowHeight - rect.top;
        if (distFromBottom > 0) {
          // GitHub icon has entered the viewport: dynamically push button up to stick cleanly 16px above it
          const neededBottom = distFromBottom + 16;
          setBottomOffset(Math.max(24, Math.round(neededBottom)));
        } else {
          setBottomOffset(24);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToSection = (e, targetId) => {
    if (e) e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      const headerOffset = 72;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      window.history.pushState(null, '', `#${targetId}`);
    }
  };

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const timer = setTimeout(() => {
        scrollToSection(null, id);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const PREVIEW_COURSE = {
    header: 'Product Strategy & Systems • 4 of 18 lectures completed',
    lectureTitle: 'Lecture 04: Modular Architecture & Unit Economics',
    docName: 'Course_Study_Notes.docx',
    notes: [
      {
        time: '04:12',
        secs: 252,
        tag: 'Core System Decoupling',
        desc: 'Separate high-throughput read pipelines from transactional writes to keep latency predictable as usage scales.'
      },
      {
        time: '09:45',
        secs: 585,
        tag: 'Unit Economics & Margin',
        desc: 'Track gross margin per active workspace alongside infrastructure cost to maintain a sustainable 3x+ LTV/CAC ratio.'
      }
    ]
  };

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
    navigate('/studio');
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
    trackEvent('landing_faq_toggle', { faq_index: index });
  };

  const FAQS = [
    {
      tag: 'Courses',
      q: "What can I study on Foclyra?",
      a: "Any educational playlist or video series on YouTube: business case studies, finance lectures, coding bootcamps, and university courses."
    },
    {
      tag: 'Playlists',
      q: "Which YouTube links work?",
      a: "Any public or unlisted YouTube playlist (up to 200 videos) or single video. Paste the link and your structured course is ready instantly."
    },
    {
      tag: 'Accounts',
      q: "Do I need an account to use it?",
      a: "No. You can start studying 1 playlist immediately without signing in. A free account lets you save up to 5 playlists with automatic sync."
    },
    {
      tag: 'Notes',
      q: "How do notes and Word export work?",
      a: "Notes save with the exact video timecode. Click any timecode to jump back to that moment, and export everything to Word (.docx) anytime."
    },
    {
      tag: 'Pricing',
      q: "Is Foclyra free?",
      a: "Yes. Foclyra is completely free with no paywalls or trial periods."
    }
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white dark:bg-[#0a0a0c] text-[#111111] dark:text-[#f5f5f7] flex flex-col font-sans antialiased selection:bg-[#F5C542]/40">
      {/* =========================================================================
          1. Top Navigation
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-[#efefef] dark:border-zinc-800/70">
        <div className="max-w-[1200px] mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <img src="/logo.svg" alt="Foclyra" className="size-5 sm:size-6 transition-transform group-hover:scale-105 shrink-0" />
              <span className="font-semibold text-[15px] sm:text-[16px] tracking-[-0.02em] text-[#111111] dark:text-white">
                Foclyra
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-[13.5px] lg:text-[14px] font-normal text-[#666666] dark:text-zinc-400">
              <a href="#studio" onClick={(e) => scrollToSection(e, 'studio')} className="hover:text-[#111111] dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer">Workspace</a>
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-[#111111] dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer">Features</a>
              <a href="#workflow" onClick={(e) => scrollToSection(e, 'workflow')} className="hover:text-[#111111] dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer">How It Works</a>
              <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="hover:text-[#111111] dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="flex size-7 sm:size-8 md:size-9 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] dark:bg-zinc-800/90 text-[#111111] dark:text-zinc-200 hover:bg-[#e5e5e5] dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              {isDark ? <Sun className="size-3.5 sm:size-4" /> : <Moon className="size-3.5 sm:size-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleLaunchApp('nav_cta')}
              className="flex h-7 sm:h-8 md:h-9 shrink-0 items-center justify-center rounded-full bg-[#111111] dark:bg-white px-3 sm:px-3.5 md:px-4 text-[11.5px] sm:text-[12.5px] md:text-[13.5px] font-medium text-white dark:text-[#111111] hover:opacity-90 transition cursor-pointer whitespace-nowrap"
            >
              <span>{user ? 'Dashboard' : 'Open Studio'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. Hero Section - Fully responsive down to 320px
         ========================================================================= */}
      <section id="top" className="px-3.5 sm:px-6 pt-10 sm:pt-16 md:pt-22 text-center">
        <h1 className="mx-auto max-w-[1080px] text-[clamp(23px,6.2vw,76px)] leading-[1.08] font-semibold tracking-[-0.045em] text-[#111111] dark:text-white">
          <span className="block">
            Turn{' '}
            <BrandTile bg="bg-[#FF0033]" text="text-white" rotate="-rotate-4" size="lg">
              <Play className="size-[46%] fill-white text-white ml-[2%]" />
            </BrandTile>
            YouTube playlists
          </span>
          <span className="block">
            <span className="bg-[linear-gradient(180deg,#111_0%,#111_30%,#9e9e9e_100%)] dark:bg-[linear-gradient(180deg,#fff_0%,#fff_30%,#666_100%)] bg-clip-text pb-[.08em] text-transparent">
              into{' '}
            </span>
            <BrandTile bg="bg-[#F5C542]" text="text-[#111111]" rotate="rotate-3" size="lg">
              <GraduationCap className="size-[54%]" strokeWidth={2.2} />
            </BrandTile>
            <span className="bg-[linear-gradient(180deg,#111_0%,#111_30%,#9e9e9e_100%)] dark:bg-[linear-gradient(180deg,#fff_0%,#fff_30%,#666_100%)] bg-clip-text pb-[.08em] text-transparent">
              structured courses.
            </span>
          </span>
        </h1>

        <p className="mx-auto mt-3.5 sm:mt-5 max-w-[660px] text-[13.5px] sm:text-[15.5px] md:text-[17px] leading-[1.6] text-[#555555] dark:text-zinc-400 font-normal">
          Import any YouTube playlist into a distraction-free study workspace.
          <br className="hidden sm:inline" />{' '}
          Watch without recommendations, take timestamped notes, and export to Word (.docx).
        </p>

        <div className="relative mt-5 sm:mt-8 w-full inline-flex flex-col items-center">
          <button
            type="button"
            onClick={() => handleLaunchApp('hero_main_pill')}
            className="inline-flex w-auto h-9 sm:h-11 md:h-12 items-center justify-center gap-1.5 sm:gap-2.5 rounded-full bg-[#111111] dark:bg-white px-4 sm:px-6 md:px-7 text-[12.5px] sm:text-[14.5px] md:text-[15.5px] font-medium text-white dark:text-[#111111] hover:bg-[#333333] dark:hover:bg-zinc-200 transition active:scale-[.98] cursor-pointer shadow-sm whitespace-nowrap"
          >
            <span>Import a Playlist Free</span>
            <ArrowRight className="size-3.5 sm:size-4 shrink-0" />
          </button>

          <p className="mt-3 sm:mt-4 text-[11.5px] sm:text-[13px] md:text-[13.5px] text-[#6f6f6f] dark:text-zinc-500 text-center max-w-[290px] sm:max-w-none leading-relaxed">
            Try 1 playlist immediately without login • Up to 5 playlists with a free account
          </p>
        </div>
      </section>

      {/* =========================================================================
          3. Interactive Watch Workspace Preview - 320px to 4K Responsive
         ========================================================================= */}
      <section id="studio" className="px-3.5 sm:px-6 pt-7 sm:pt-11">
        <div className="mx-auto max-w-[1140px]">
          {/* Single Standard Mode Switcher Chip */}
          <div className="flex justify-center mb-4 sm:mb-5 w-full">
            <div className="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('foclyra')}
                className={`flex h-7 sm:h-8 md:h-9 items-center justify-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-4 md:px-5 text-[11px] sm:text-[12.5px] md:text-[13px] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  viewMode === 'foclyra'
                    ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                    : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                <span className="size-1.5 rounded-full bg-[#63d94e] shrink-0" />
                <span>Foclyra Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('youtube')}
                className={`flex h-7 sm:h-8 md:h-9 items-center justify-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-4 md:px-5 text-[11px] sm:text-[12.5px] md:text-[13px] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  viewMode === 'youtube'
                    ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                    : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                <span>Standard YouTube Tab</span>
              </button>
            </div>
          </div>

          <div className="rounded-[18px] sm:rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-2 sm:p-4 border border-[#e5e5e5] dark:border-zinc-800/80">
            <div className="rounded-[14px] sm:rounded-[20px] bg-white dark:bg-[#111113] border border-[#e5e5e5] dark:border-zinc-800 overflow-hidden">
              {/* Window Top Bar */}
              <div className="h-9 sm:h-11 px-3 sm:px-4 bg-[#fafafa] dark:bg-zinc-900/80 border-b border-[#efefef] dark:border-zinc-800 flex items-center justify-between text-[11px] sm:text-[12px]">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-2">
                  <span className="size-2 sm:size-3 rounded-full bg-[#ff5f57] shrink-0" />
                  <span className="size-2 sm:size-3 rounded-full bg-[#febc2e] shrink-0" />
                  <span className="size-2 sm:size-3 rounded-full bg-[#28c840] shrink-0" />
                  <span className="ml-1 sm:ml-2 text-[#6f6f6f] dark:text-zinc-400 font-medium truncate hidden md:inline">
                    {PREVIEW_COURSE.header}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:py-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-800 font-medium text-[#111111] dark:text-zinc-200 shrink-0 text-[10.5px] sm:text-[11.5px]">
                  <span className="size-1.5 rounded-full bg-[#f4525f] shrink-0" />
                  <span className="font-mono">{formatTime(pomodoroSec)}</span>
                  <span className="text-[#8d8d8d] hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Pomodoro</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[11.5px] md:text-[12px] text-[#666666] dark:text-zinc-400 shrink-0">
                  <span className="text-[#16a34a] dark:text-[#63d94e] font-medium">Saved in browser</span>
                </div>
              </div>

              {viewMode === 'foclyra' ? (
                <div className="p-2.5 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5">
                  {/* Left: Lecture Video Player (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col gap-2.5 sm:gap-3">
                    <div
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="group relative aspect-video rounded-[10px] sm:rounded-[16px] bg-[#0b1311] overflow-hidden flex flex-col justify-between p-2.5 sm:p-4 cursor-pointer"
                    >
                      {/* Foclyra Watch -> Done Task Product Illustration */}
                      <img
                        src="/foclyra-watch-done.jpg"
                        alt="Watch lectures and complete course tasks"
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02] select-none pointer-events-none"
                      />
                      {/* Subtle Top & Bottom Edge Scrims Keeping Center Graphic 100% Clear */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45)_0%,transparent_28%,transparent_68%,rgba(0,0,0,0.75)_100%)] pointer-events-none"
                      />

                      <div className="flex items-center justify-between z-10 gap-2">
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/50 border border-white/15 text-white/95 text-[9.5px] sm:text-[11px] font-medium backdrop-blur-md whitespace-nowrap">
                          Theater Mode
                        </span>
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/60 border border-white/10 text-white/95 font-mono text-[9.5px] sm:text-[11px] backdrop-blur-md whitespace-nowrap">
                          {formatTime(progressSec)} / 48:10
                        </span>
                      </div>

                      <div className="w-full space-y-1.5 sm:space-y-2 z-10">
                        <div className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-xs">
                          <div
                            className="h-full bg-[#34d399] rounded-full transition-all duration-300"
                            style={{ width: `${(progressSec / 600) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-white/90">
                          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 pr-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsPlaying(!isPlaying);
                              }}
                              className="size-6 sm:size-7 rounded-full bg-white text-[#111111] flex items-center justify-center shadow-sm shrink-0 hover:scale-105 transition cursor-pointer"
                              aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                            >
                              {isPlaying ? (
                                <Pause className="size-2.5 sm:size-3 fill-[#111111]" />
                              ) : (
                                <Play className="size-2.5 sm:size-3 fill-[#111111] ml-0.5" />
                              )}
                            </button>
                            <Volume2 className="size-3 shrink-0 hidden sm:inline" />
                            <span className="font-mono shrink-0">{formatTime(progressSec)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <span className="px-1.5 py-0.5 rounded bg-black/50 border border-white/15 text-[9px] sm:text-[10px] font-mono text-white">1.25x</span>
                            <Maximize2 className="size-2.5 sm:size-3" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-0.5 gap-1.5 sm:gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] sm:text-[15px] font-semibold tracking-[-0.01em] text-[#111111] dark:text-white leading-snug">
                          {PREVIEW_COURSE.lectureTitle}
                        </div>
                        <div className="text-[11.5px] sm:text-[13px] text-[#6f6f6f] dark:text-zinc-400">
                          Auto-resumes where you left off
                        </div>
                      </div>
                      <span className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#16a34a]/10 text-[#15803d] dark:text-[#63d94e] text-[10.5px] sm:text-[12px] font-medium shrink-0 whitespace-nowrap">
                        <CheckCircle2 className="size-3 shrink-0" />
                        <span>Completed</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Real Lesson Notes Panel (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between rounded-[12px] sm:rounded-[16px] bg-[#f8f8f8] dark:bg-zinc-900/70 p-3 sm:p-4 border border-[#efefef] dark:border-zinc-800 space-y-2.5 sm:space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5] dark:border-zinc-800 gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-semibold tracking-[-0.01em] text-[#111111] dark:text-white whitespace-nowrap">
                          <FileText className="size-3 sm:size-3.5 text-[#6f6f6f] shrink-0" />
                          <span>Lesson Notes ({PREVIEW_COURSE.notes.length})</span>
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[#6f6f6f] dark:text-zinc-400 font-mono whitespace-nowrap">
                          Enter to save
                        </span>
                      </div>

                      {PREVIEW_COURSE.notes.map((note) => (
                        <div
                          key={note.time}
                          onClick={() => { setSelectedTimestamp(note.time); setProgressSec(note.secs); }}
                          className={`p-2.5 sm:p-3 rounded-[10px] sm:rounded-[12px] border transition cursor-pointer text-left ${
                            selectedTimestamp === note.time
                              ? 'bg-white dark:bg-zinc-800 border-[#111111]/20 dark:border-white/20 shadow-2xs'
                              : 'bg-white/60 dark:bg-zinc-900/40 border-[#e5e5e5] dark:border-zinc-800 hover:bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[12px] font-mono font-medium text-[#111111] dark:text-white">
                            <Clock className={`size-3 shrink-0 ${selectedTimestamp === note.time ? 'text-[#16a34a]' : 'text-[#6f6f6f]'}`} />
                            <span className="underline">{note.time}</span>
                            <span className="text-[#6f6f6f] font-sans">• {note.tag}</span>
                          </div>
                          <p className="mt-1 text-[11.5px] sm:text-[12.5px] leading-[1.5] text-[#444444] dark:text-zinc-300 bg-[#f4f4f4] dark:bg-zinc-950 p-2 rounded-lg font-sans">
                            {note.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 sm:pt-2 flex justify-center lg:block">
                      <button
                        type="button"
                        onClick={() => handleLaunchApp('demo_export')}
                        className="inline-flex lg:w-full h-8 sm:h-9 lg:h-10 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[11px] sm:text-[12.5px] lg:text-[13px] font-medium items-center justify-center gap-1.5 sm:gap-2 hover:opacity-90 transition cursor-pointer px-3.5 sm:px-5 lg:px-3 whitespace-nowrap"
                      >
                        <Download className="size-3 sm:size-3.5 shrink-0" />
                        <span>Download {PREVIEW_COURSE.docName}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Grounded Comparison: What Standard YouTube Shows vs Foclyra */
                <div className="p-4 sm:p-8 lg:p-10 text-center space-y-4 sm:space-y-5">
                  <h3 className="text-[17px] sm:text-[21px] leading-[1.25] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    What gets in your way on a standard YouTube tab
                  </h3>
                  <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left">
                    <div className="p-3.5 sm:p-4 rounded-[12px] sm:rounded-[16px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1">
                      <div className="text-[13px] sm:text-[14px] font-semibold text-[#111111] dark:text-white">Recommended Sidebar</div>
                      <p className="text-[12px] sm:text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                        Unrelated videos and Shorts sit right next to your lecture player.
                      </p>
                    </div>
                    <div className="p-3.5 sm:p-4 rounded-[12px] sm:rounded-[16px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1">
                      <div className="text-[13px] sm:text-[14px] font-semibold text-[#111111] dark:text-white">No Course Progress</div>
                      <p className="text-[12px] sm:text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                        No clear checklist showing how many lectures in a 50-video playlist you have completed.
                      </p>
                    </div>
                    <div className="p-3.5 sm:p-4 rounded-[12px] sm:rounded-[16px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1">
                      <div className="text-[13px] sm:text-[14px] font-semibold text-[#111111] dark:text-white">Separate Note Apps</div>
                      <p className="text-[12px] sm:text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                        Switching windows to write notes without clickable video timestamps.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('foclyra')}
                    className="inline-flex h-8 sm:h-9 md:h-10 items-center justify-center gap-2 rounded-full bg-[#111111] dark:bg-white px-3.5 sm:px-5 text-[11.5px] sm:text-[13px] font-medium text-white dark:text-[#111111] cursor-pointer whitespace-nowrap"
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
          4. Features Bento Grid - 4 Real Capabilities (320px Responsive)
         ========================================================================= */}
      <section id="features" className="px-3.5 sm:px-6 pt-14 sm:pt-22 lg:pt-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center max-w-[900px] mx-auto">
            <div className="text-[12.5px] sm:text-[14px] font-medium text-[#6f6f6f] dark:text-zinc-400">Features</div>
            <h2 className="mt-1.5 sm:mt-2 text-[clamp(24px,5vw,44px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Everything you need to finish a playlist.
            </h2>
            <p className="mt-2.5 sm:mt-4 text-[14px] sm:text-[16.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
              Your video player, lecture checklist, timestamped notes, and focus timer in one tab.
            </p>
          </div>

          <div className="mt-7 sm:mt-11 grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-12">
            {/* Card 1: Clean Playlist & Video Player (7 cols) */}
            <div className="lg:col-span-7 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-0 sm:min-h-[240px]">
              <div className="space-y-2 sm:space-y-2.5 max-w-lg">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BrandTile bg="bg-[#FF0033]" text="text-white" rotate="-rotate-3">
                    <Play className="size-3.5 sm:size-4 fill-white text-white ml-0.5" />
                  </BrandTile>
                  <h3 className="text-[17px] sm:text-[19px] md:text-[18.5px] lg:text-[21px] leading-[1.22] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Distraction-free playlist player
                  </h3>
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] lg:text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Import any YouTube playlist (up to 200 videos) and study in Theater Mode with zero sidebar distractions, Shorts, or comments.
                </p>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <CheckCircle2 className="size-3 sm:size-3.5 text-[#16a34a] shrink-0" />
                  <span>No sidebar recommendations</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <CheckCircle2 className="size-3 sm:size-3.5 text-[#16a34a] shrink-0" />
                  <span>No comments feed</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <CheckCircle2 className="size-3 sm:size-3.5 text-[#16a34a] shrink-0" />
                  <span>Auto-resumes playback</span>
                </span>
              </div>
            </div>

            {/* Card 2: Timestamped Notes (5 cols) */}
            <div className="lg:col-span-5 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-0 sm:min-h-[240px]">
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BrandTile bg="bg-[#F5C542]" text="text-[#111111]" rotate="rotate-3">
                    <Clock className="size-3.5 sm:size-4" strokeWidth={2.3} />
                  </BrandTile>
                  <h3 className="text-[17px] sm:text-[19px] md:text-[18.5px] lg:text-[21px] leading-[1.22] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Timestamped lecture notes
                  </h3>
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] lg:text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Every note links to the exact video second. Click any timestamp to jump right back to that concept or formula.
                </p>
              </div>

              <div className="mt-4 sm:mt-6 rounded-[14px] sm:rounded-[18px] bg-white dark:bg-zinc-800 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-[12px] font-mono text-[#111111] dark:text-white font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3 text-[#16a34a] shrink-0" />
                    <span>04:12 • DCF Valuation</span>
                  </span>
                  <span className="text-[#16a34a] dark:text-[#63d94e] shrink-0">Jump to 04:12</span>
                </div>
                <p className="mt-1.5 text-[11.5px] sm:text-[12.5px] text-[#666666] dark:text-zinc-400">
                  Effective cost of debt = Rd × (1 − Tax Rate).
                </p>
              </div>
            </div>

            {/* Card 3: Word (.docx) Export (5 cols) */}
            <div className="lg:col-span-5 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-0 sm:min-h-[240px]">
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BrandTile bg="bg-[#2563EB]" text="text-white" rotate="-rotate-2">
                    <FileText className="size-3.5 sm:size-4" />
                  </BrandTile>
                  <h3 className="text-[17px] sm:text-[19px] md:text-[18.5px] lg:text-[21px] leading-[1.22] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Course-wise Word (.docx) export
                  </h3>
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] lg:text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Export notes from a single course or your entire library as a formatted Microsoft Word (.docx) study guide.
                </p>
              </div>

              <div className="mt-4 sm:mt-6 flex items-center justify-between rounded-[14px] sm:rounded-[18px] bg-white dark:bg-zinc-800 px-3.5 py-2.5 sm:px-4 sm:py-3.5">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="size-7 sm:size-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0">
                    <FileText className="size-3.5" />
                  </span>
                  <span className="text-[12px] sm:text-[13px] font-medium text-[#111111] dark:text-white truncate">
                    Valuation_Notes.docx
                  </span>
                </div>
                <Download className="size-3.5 text-[#6f6f6f] shrink-0" />
              </div>
            </div>

            {/* Card 4: Pomodoro, Streak & Cloud Sync (7 cols) */}
            <div className="lg:col-span-7 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-0 sm:min-h-[240px]">
              <div className="space-y-2 sm:space-y-2.5 max-w-lg">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BrandTile bg="bg-[#FF6B2C]" text="text-white" rotate="rotate-2">
                    <Flame className="size-3.5 sm:size-4 fill-white text-white" />
                  </BrandTile>
                  <h3 className="text-[17px] sm:text-[19px] md:text-[18.5px] lg:text-[21px] leading-[1.22] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Pomodoro timer, streaks &amp; cloud sync
                  </h3>
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] lg:text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Stay consistent with a built-in focus timer, daily study streaks, and automatic cloud sync across devices.
                </p>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <Clock className="size-3 sm:size-3.5 text-[#f4525f] shrink-0" />
                  <span>Built-in Pomodoro timer</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <Flame className="size-3 sm:size-3.5 text-[#FF6B2C] shrink-0" />
                  <span>Daily study streak</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <Cloud className="size-3 sm:size-3.5 text-[#2563EB] shrink-0" />
                  <span>Automatic cloud sync</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. How It Works - 3 Clear Steps (320px Responsive)
         ========================================================================= */}
      <section id="workflow" className="px-3.5 sm:px-6 pt-14 sm:pt-22 lg:pt-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center max-w-[900px] mx-auto">
            <div className="text-[12.5px] sm:text-[14px] font-medium text-[#6f6f6f] dark:text-zinc-400">How It Works</div>
            <h2 className="mt-1.5 sm:mt-2 text-[clamp(24px,5vw,44px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Start studying in three steps.
            </h2>
          </div>

          <div className="mt-7 sm:mt-11 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                step: '01',
                icon: <Link2 className="size-3.5 sm:size-4" />,
                title: 'Paste a YouTube link',
                desc: 'Paste any public or unlisted YouTube playlist or video URL, or pick one of the starter courses on the dashboard.'
              },
              {
                step: '02',
                icon: <Clock className="size-3.5 sm:size-4" />,
                title: 'Watch & write timestamped notes',
                desc: 'Study in Theater Mode with a built-in Pomodoro timer and save notes tied to the exact video second.'
              },
              {
                step: '03',
                icon: <Download className="size-3.5 sm:size-4" />,
                title: 'Track progress & export to Word',
                desc: 'Mark lectures complete as you go and download your notes as a formatted Word (.docx) document anytime.'
              }
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-4 sm:p-6 md:p-5 lg:p-7 flex flex-col justify-between min-h-0 sm:min-h-[205px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] sm:text-[13px] font-mono font-medium text-[#8d8d8d]">{item.step}</span>
                  <span className="size-7 sm:size-8 rounded-full bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-200 flex items-center justify-center shadow-2xs shrink-0">
                    {item.icon}
                  </span>
                </div>
                <div className="space-y-1.5 sm:space-y-2 mt-4 sm:mt-6">
                  <h3 className="text-[16.5px] sm:text-[18px] md:text-[16.5px] lg:text-[19.5px] leading-[1.25] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-[13.5px] sm:text-[14.5px] md:text-[13.5px] lg:text-[14.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FAQ Section - Split Editorial Layout (320px Responsive)
         ========================================================================= */}
      <section id="faq" className="px-3.5 sm:px-6 pt-14 sm:pt-22 lg:pt-32">
        <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-9 lg:gap-12 items-start">
          {/* Left Sticky Editorial Column (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-2.5 sm:space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 text-[12px] sm:text-[13px] font-medium text-[#111111] dark:text-zinc-200">
              <span>FAQ</span>
            </div>

            <h2 className="text-[clamp(24px,4vw,38px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Common questions, straight answers.
            </h2>

            <p className="text-[14px] sm:text-[15.5px] leading-[1.6] text-[#666666] dark:text-zinc-400 max-w-[400px]">
              Everything you need to know about course links, note taking, and how Foclyra works.
            </p>
          </div>

          {/* Right Smooth Pill Cards Stack (7 cols) */}
          <div className="lg:col-span-7 space-y-2 sm:space-y-2.5">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className={`rounded-[16px] sm:rounded-[22px] transition-colors duration-300 ${
                    isOpen
                      ? 'bg-[#f4f4f4] dark:bg-zinc-900 ring-1 ring-[#111111]/10 dark:ring-white/10'
                      : 'bg-[#f8f8f8] hover:bg-[#f2f2f2] dark:bg-zinc-900/50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full px-3.5 py-3 sm:px-6 sm:py-4.5 flex items-center justify-between gap-2 sm:gap-4 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-1">
                      <span className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-[10px] sm:text-[11px] font-mono font-medium text-[#6f6f6f] dark:text-zinc-300 border border-[#e5e5e5] dark:border-zinc-700 shrink-0 whitespace-nowrap">
                        {faq.tag}
                      </span>
                      <span className="text-[13.5px] sm:text-[16px] lg:text-[16.5px] font-semibold tracking-[-0.015em] text-[#111111] dark:text-white leading-snug">
                        {faq.q}
                      </span>
                    </div>

                    <span
                      className={`size-6.5 sm:size-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen
                          ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] rotate-45'
                          : 'bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-300'
                      }`}
                    >
                      <Plus className="size-3.5 sm:size-4" />
                    </span>
                  </button>

                  {/* Smooth CSS Grid Height Animation */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-3.5 pb-4 sm:px-6 sm:pb-5 pt-0 text-[13px] sm:text-[14.5px] leading-[1.65] text-[#555555] dark:text-zinc-400">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. Final CTA Section (320px Responsive)
         ========================================================================= */}
      <section aria-labelledby="cta-h" className="px-3.5 sm:px-6 pt-14 sm:pt-22 lg:pt-32 pb-12 sm:pb-20">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[22px] sm:rounded-[30px] bg-[#f4f4f4] dark:bg-zinc-900/90 px-4 sm:px-8 py-10 sm:py-16 lg:py-20 text-center">
          {/* Study Toolkit Icon Cluster */}
          <div className="mb-4 sm:mb-6 inline-flex items-center justify-center">
            <span className="size-9 sm:size-11 rounded-[10px] sm:rounded-[13px] bg-[#FF0033] text-white flex items-center justify-center shadow-md -rotate-6 z-10 ring-4 ring-[#f4f4f4] dark:ring-zinc-900">
              <Play className="size-3.5 sm:size-4 fill-white text-white ml-0.5" />
            </span>
            <span className="size-9 sm:size-11 rounded-[10px] sm:rounded-[13px] bg-[#F5C542] text-[#111111] flex items-center justify-center shadow-md -ml-2 -translate-y-1 z-20 ring-4 ring-[#f4f4f4] dark:ring-zinc-900">
              <Clock className="size-3.5 sm:size-4" strokeWidth={2.4} />
            </span>
            <span className="size-9 sm:size-11 rounded-[10px] sm:rounded-[13px] bg-[#2563EB] text-white flex items-center justify-center shadow-md -ml-2 rotate-6 z-30 ring-4 ring-[#f4f4f4] dark:ring-zinc-900">
              <FileText className="size-3.5 sm:size-4" />
            </span>
          </div>

          <h2
            id="cta-h"
            className="mx-auto max-w-[900px] text-[clamp(23px,5vw,44px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white"
          >
            Ready to study your next playlist?
          </h2>

          <p className="mx-auto mt-2.5 sm:mt-4 max-w-[720px] text-[14px] sm:text-[16.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
            Paste any YouTube playlist URL or try a starter course on the dashboard. No login required.
          </p>

          <div className="mt-5 sm:mt-8 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => handleLaunchApp('footer_banner')}
              className="inline-flex w-auto h-9 sm:h-11 md:h-12 items-center justify-center gap-1.5 sm:gap-2.5 rounded-full bg-[#111111] dark:bg-white px-4 sm:px-6 md:px-7 text-[12.5px] sm:text-[14.5px] md:text-[15.5px] font-medium text-white dark:text-[#111111] hover:bg-[#333333] dark:hover:bg-zinc-200 transition active:scale-[.98] cursor-pointer shadow-sm whitespace-nowrap"
            >
              <span>Open Foclyra Studio</span>
              <ArrowRight className="size-3.5 sm:size-4 shrink-0" />
            </button>

            <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-5 gap-y-1.5 text-[11.5px] sm:text-[13px] text-[#6f6f6f] dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <CheckCircle2 className="size-3 sm:size-3.5 text-[#16a34a] shrink-0" />
                <span>1 playlist in guest mode</span>
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Cloud className="size-3 sm:size-3.5 text-[#2563EB] shrink-0" />
                <span>Up to 5 playlists + cloud sync free</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. Footer - Clean Minimalist Editorial (320px to 1440px+ Responsive)
         ========================================================================= */}
      <footer className="relative px-3.5 sm:px-6 pt-10 sm:pt-14 pb-6 border-t border-[#efefef] dark:border-zinc-800/70 overflow-hidden">
        <div className="mx-auto max-w-[1200px]">
          {/* Top Zone: Brand Info (Left) + Architectural Shaded Watermark (Right) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 pb-8 sm:pb-12">
            {/* Left Column: Brand Info & CTA */}
            <div className="w-full md:max-w-[340px] lg:max-w-[400px] space-y-3.5 sm:space-y-4 shrink-0 z-10">
              <Link to="/" className="inline-flex items-center gap-2 group">
                <img src="/logo.svg" alt="Foclyra" className="size-6 sm:size-7 transition-transform group-hover:scale-105 shrink-0" />
                <span className="font-semibold text-[16.5px] sm:text-[18px] tracking-[-0.02em] text-[#111111] dark:text-white">
                  foclyra
                </span>
              </Link>

              <p className="text-[13.5px] sm:text-[14.5px] leading-[1.6] text-[#555555] dark:text-zinc-400 font-normal">
                Distraction-free YouTube study workspace, built for tech, business, and self-directed learners.
              </p>

              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => handleLaunchApp('footer_cta_pill')}
                  className="inline-flex h-8 sm:h-9 md:h-10 items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-[#111111] dark:bg-white px-3.5 sm:px-4 md:px-5 text-[12px] sm:text-[13px] font-medium text-white dark:text-[#111111] hover:opacity-90 transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <Play className="size-2.5 sm:size-3 fill-current shrink-0" />
                  <span>Open Foclyra Studio</span>
                </button>
              </div>
            </div>

            {/* Right Column: Shaded Watermark filling the empty space with zero overlap */}
            <div
              aria-hidden="true"
              className="flex-1 flex justify-center md:justify-end items-end select-none pointer-events-none overflow-hidden pt-2 md:pt-0"
            >
              <span className="block text-[clamp(62px,23vw,120px)] md:text-[clamp(88px,13.5vw,145px)] lg:text-[clamp(135px,15.5vw,210px)] leading-[0.82] font-bold tracking-[-0.065em] bg-[linear-gradient(180deg,#e4e4e9_0%,#f2f2f5_62%,rgba(255,255,255,0.05)_100%)] dark:bg-[linear-gradient(180deg,#242429_0%,#16161a_62%,rgba(10,10,12,0.05)_100%)] bg-clip-text text-transparent pb-[0.06em]">
                foclyra
              </span>
            </div>
          </div>

          {/* Bottom Copyright & Social Bar */}
          <div className="pt-5 sm:pt-6 border-t border-[#efefef] dark:border-zinc-800/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] sm:text-[13px] text-[#6f6f6f] dark:text-zinc-400 text-center sm:text-left">
            <div>
              © {new Date().getFullYear()} Foclyra. All rights reserved.
            </div>

            <div ref={githubRef} className="flex items-center gap-2 shrink-0">
              <a
                href="https://github.com/ssiddiquiii/foclyra"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="size-8 sm:size-9 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 text-[#111111] dark:text-zinc-200 flex items-center justify-center hover:bg-[#e5e5e5] dark:hover:bg-zinc-800 transition shrink-0"
                title="GitHub Repository"
              >
                <svg viewBox="0 0 24 24" className="size-3.5 sm:size-4" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          8. Bottom-Left Floating Scroll-To-Top Button
          Positioned on the bottom-left to leave bottom-right clear for Pomodoro timer & toasts
         ========================================================================= */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ bottom: `${bottomOffset}px` }}
            aria-label="Scroll to top"
            className="fixed right-4 sm:right-6 z-40 size-10 sm:size-11 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800/90 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-[border-color,background-color,color,box-shadow,transform] flex items-center justify-center cursor-pointer active:scale-90 group"
            title="Scroll to top"
          >
            <ArrowUp className="size-4 sm:size-4.5 transition-transform duration-200 group-hover:-translate-y-0.5 text-current" strokeWidth={2.4} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
