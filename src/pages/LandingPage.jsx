import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { 
  Play, 
  BookOpen,
  MessageSquare,
  Send,
  Sparkle,
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
import { WobbleCard } from '../components/ui/wobble-card';

/**
 * Vidyst-style squircle app tile for intentional editorial accents.
 * Responsive across 320px mobile up to 1440px+ desktop.
 */
function BrandTile({ children, bg = 'bg-[#111111] dark:bg-white', text = 'text-white dark:text-[#111111]', rotate = '-rotate-3', size = 'sm' }) {
  const dims =
    size === 'lg'
      ? 'h-[0.82em] w-[0.82em] rounded-[24%] mx-1.5 sm:mx-2.5 -translate-y-[0.06em]'
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

const HERO_MORPH_ICONS = [
  {
    key: 'book',
    bg: 'bg-[#111111] dark:bg-white',
    text: 'text-white dark:text-[#111111]',
    rotate: 'rotate-3',
    render: () => <BookOpen className="size-[50%]" strokeWidth={2.2} />,
  },
  {
    key: 'clock',
    bg: 'bg-[#F5C542]',
    text: 'text-[#111111]',
    rotate: '-rotate-3',
    render: () => <Clock className="size-[50%]" strokeWidth={2.3} />,
  },
  {
    key: 'tutor',
    bg: 'bg-[#10B981]',
    text: 'text-white',
    rotate: 'rotate-2',
    render: () => <MessageSquare className="size-[48%]" strokeWidth={2.2} />,
  },
  {
    key: 'docx',
    bg: 'bg-[#2563EB]',
    text: 'text-white',
    rotate: '-rotate-2',
    render: () => <FileText className="size-[48%]" strokeWidth={2.2} />,
  },
];

function AnimatedHeroTile({ reduceMotion }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_MORPH_ICONS.length);
    }, 2400);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const active = HERO_MORPH_ICONS[index];

  return (
    <span
      className={`relative inline-flex items-center justify-center align-middle h-[0.82em] w-[0.82em] rounded-[24%] mx-1.5 sm:mx-2.5 -translate-y-[0.06em] shadow-[0_6px_16px_-4px_rgba(0,0,0,0.18)] ${active.bg} ${active.text} ${active.rotate} select-none shrink-0 overflow-hidden transition-all duration-500 ease-out`}
      aria-hidden="true"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={active.key}
          initial={reduceMotion ? { opacity: 1 } : { y: 14, opacity: 0, scale: 0.72, filter: 'blur(3px)' }}
          animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={reduceMotion ? { opacity: 0 } : { y: -14, opacity: 0, scale: 0.72, filter: 'blur(3px)' }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          className="inset-0 flex items-center justify-center w-full h-full"
        >
          {active.render()}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const GRADUAL_DELAY_STEP = 0.06;
const GRADUAL_DURATION = 0.6;

/**
 * GradualSpacing character animator for editorial hero text and inline BrandTiles.
 */
function GradualChar({ char, index, isInView, reduceMotion, gradient = false }) {
  return (
    <motion.span
      initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: GRADUAL_DURATION, delay: index * GRADUAL_DELAY_STEP, ease: [0.2, 0.65, 0.3, 0.9] }
      }
      className={`inline-block ${
        gradient
          ? 'bg-[linear-gradient(180deg,#111_0%,#111_30%,#9e9e9e_100%)] dark:bg-[linear-gradient(180deg,#fff_0%,#fff_30%,#666_100%)] bg-clip-text text-transparent pb-[.08em]'
          : ''
      }`}
    >
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  );
}

function GradualWord({ word, startIndex, isInView, reduceMotion, gradient = false }) {
  return (
    <span className="inline-block whitespace-nowrap">
      {word.split('').map((char, i) => (
        <GradualChar
          key={i}
          char={char}
          index={startIndex + i}
          isInView={isInView}
          reduceMotion={reduceMotion}
          gradient={gradient}
        />
      ))}
    </span>
  );
}

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const shouldReduceMotion = useReducedMotion();

  const [viewMode, setViewMode] = useState('foclyra');
  const [previewTab, setPreviewTab] = useState('notes'); // 'notes' | 'ai' // 'foclyra' | 'youtube'
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressSec, setProgressSec] = useState(252); // 04:12
  const [selectedTimestamp, setSelectedTimestamp] = useState('04:12');
  const [pomodoroSec, setPomodoroSec] = useState(1305); // 21:45 remaining
  const [activeFaq, setActiveFaq] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(24);
  const footerBarRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setShowScrollTop(scrollY > 350);

      if (footerBarRef.current) {
        const rect = footerBarRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const distFromBottom = windowHeight - rect.top;
        if (distFromBottom > 0) {
          // Footer bar has entered the viewport: dynamically push button up to stick cleanly 16px above it
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
    header: 'Python for Beginners • 4 of 18 lectures completed',
    lectureTitle: 'Lecture 04: Functions, Loops & Return Values',
    docName: 'Python_Course_Notes.docx',
    notes: [
      {
        time: '04:12',
        secs: 252,
        tag: 'Functions & def',
        desc: 'Functions group code into reusable blocks so you do not repeat logic.'
      },
      {
        time: '09:45',
        secs: 585,
        tag: 'For Loops',
        desc: 'Use for loops to iterate through lists and process items step by step.'
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
        <h1
          ref={heroRef}
          className="mx-auto max-w-[1080px] text-[clamp(24px,6vw,72px)] leading-[1.12] sm:leading-[1.08] font-bold tracking-[-0.035em] sm:tracking-[-0.045em] text-[#111111] dark:text-white"
        >
          <span className="block whitespace-nowrap">
            <GradualWord
              word="Study"
              startIndex={0}
              isInView={isHeroInView}
              reduceMotion={shouldReduceMotion}
            />
            <motion.span
              initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: GRADUAL_DURATION, delay: 5 * GRADUAL_DELAY_STEP, ease: [0.2, 0.65, 0.3, 0.9] }
              }
              className="inline-block align-middle"
            >
              <BrandTile bg="bg-[#FF0033]" text="text-white" rotate="-rotate-3" size="lg">
                <Play className="size-[46%] fill-white text-white ml-[2%]" />
              </BrandTile>
            </motion.span>
            <GradualWord
              word="YouTube"
              startIndex={6}
              isInView={isHeroInView}
              reduceMotion={shouldReduceMotion}
            />
          </span>
          <span className="block whitespace-nowrap mt-0.5 sm:mt-1">
            <GradualWord
              word="like"
              startIndex={14}
              isInView={isHeroInView}
              reduceMotion={shouldReduceMotion}
              gradient={false}
            />{' '}
            <GradualWord
              word="a"
              startIndex={19}
              isInView={isHeroInView}
              reduceMotion={shouldReduceMotion}
              gradient={false}
            />{' '}
            <GradualWord
              word="real"
              startIndex={21}
              isInView={isHeroInView}
              reduceMotion={shouldReduceMotion}
              gradient={false}
            />
            <motion.span
              initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: GRADUAL_DURATION, delay: 25 * GRADUAL_DELAY_STEP, ease: [0.2, 0.65, 0.3, 0.9] }
              }
              className="inline-block align-middle"
            >
              <AnimatedHeroTile reduceMotion={shouldReduceMotion} />
            </motion.span>
            <GradualWord
              word="course."
              startIndex={26}
              isInView={isHeroInView}
              reduceMotion={shouldReduceMotion}
              gradient={false}
            />
          </span>
        </h1>

        {/* Seamless Subtitle: Short, punchy, catchy */}
        <p className="mx-auto mt-4 sm:mt-5 max-w-[540px] text-[14.5px] sm:text-[16.5px] md:text-[17.5px] text-[#555555] dark:text-zinc-400 leading-[1.55] font-normal px-2">
          No Shorts. No rabbit holes. Just your playlist, timestamped notes, and a smart tutor in one clean workspace.
        </p>

        {/* Confident Editorial CTA & Trust Signal */}
        <div className="relative mt-6 sm:mt-8 w-full inline-flex flex-col items-center">
          <button
            type="button"
            onClick={() => handleLaunchApp('hero_main_pill')}
            className="group inline-flex w-auto h-11 sm:h-12 md:h-12.5 items-center justify-center gap-2.5 rounded-full bg-[#111111] dark:bg-white px-6 sm:px-7 md:px-8 text-[14px] sm:text-[15px] font-medium text-white dark:text-[#111111] hover:bg-[#262626] dark:hover:bg-zinc-200 transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_24px_-4px_rgba(255,255,255,0.15)] whitespace-nowrap"
          >
            <span>Start Studying Free</span>
            <ArrowRight className="size-4 shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
          </button>

          <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11.5px] sm:text-[13px] text-[#666666] dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#333333] dark:text-zinc-300">
              <span className="size-1.5 rounded-full bg-[#16a34a] dark:bg-[#4ade80]" />
              <span>Try your first playlist without signing up</span>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
            <span>5 courses free forever</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. Interactive Watch Workspace Preview - 320px to 4K Responsive
         ========================================================================= */}
      <section id="studio" className="px-3.5 sm:px-6 pt-10 sm:pt-14 md:pt-18 pb-4">
        <div className="mx-auto max-w-[1140px]">
          {/* Unified Apple-Grade Chassis with Ambient Pedestal Glow */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-[92%] max-w-[880px] h-[340px] bg-gradient-to-b from-emerald-500/15 via-teal-500/8 to-transparent dark:from-emerald-400/20 dark:via-teal-400/10 dark:to-transparent blur-3xl pointer-events-none rounded-full"
            />
            <div className="relative rounded-[22px] sm:rounded-[32px] bg-white dark:bg-[#0c0d11] border border-[#e5e5e5] dark:border-zinc-800 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_90px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
            {/* Sleek Window Top Bar with Right-Aligned Swap Toggle */}
            <div className="min-h-12 sm:h-14 px-3.5 sm:px-5 py-2 sm:py-0 bg-[#fafafa] dark:bg-[#111217] border-b border-[#efefef] dark:border-zinc-800/90 flex items-center justify-between gap-3 text-[11.5px] sm:text-[12.5px]">
              {/* Left: Window Dots & Course Title */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="size-2.5 sm:size-3 rounded-full bg-[#ff5f57]" />
                  <span className="size-2.5 sm:size-3 rounded-full bg-[#febc2e]" />
                  <span className="size-2.5 sm:size-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="ml-2 text-[#777777] dark:text-zinc-400 font-medium truncate hidden md:inline">
                  {PREVIEW_COURSE.header}
                </span>
              </div>

              {/* Right: Status Indicators & Swap Toggle */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                <div className="hidden lg:flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0f0f2] dark:bg-zinc-800/90 font-medium text-[#111111] dark:text-zinc-200 shrink-0 text-[11px] shadow-2xs">
                    <span className="size-1.5 rounded-full bg-[#f4525f] animate-pulse shrink-0" />
                    <span className="font-mono font-semibold">{formatTime(pomodoroSec)}</span>
                    <span className="text-[#8d8d8d] hidden xl:inline">•</span>
                    <span className="text-[#555555] dark:text-zinc-400 hidden xl:inline">Pomodoro</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11.5px] text-[#666666] dark:text-zinc-400 shrink-0">
                    <span className="size-1.5 rounded-full bg-[#16a34a] dark:bg-[#63d94e]" />
                    <span className="text-[#16a34a] dark:text-[#63d94e] font-medium">Auto-saved</span>
                  </div>
                </div>

                {/* Swap Toggle Positioned on Right Edge of Frame Top Bar */}
                <div className="relative inline-flex items-center p-0.5 rounded-full bg-[#e9e9ec] dark:bg-zinc-900 border border-[#dedee3] dark:border-zinc-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('foclyra')}
                    className={`relative flex h-6.5 sm:h-7.5 items-center justify-center gap-1.5 rounded-full px-3 sm:px-3.5 text-[11px] sm:text-[12px] font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap select-none ${
                      viewMode === 'foclyra'
                        ? 'text-white dark:text-[#111111]'
                        : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                    }`}
                  >
                    {viewMode === 'foclyra' && (
                      <motion.div
                        layoutId="landingViewModePill"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        className="absolute inset-0 bg-[#111111] dark:bg-white rounded-full shadow-2xs"
                      />
                    )}
                    <span className="relative z-10 size-1.5 rounded-full bg-[#63d94e] shrink-0" />
                    <span className="relative z-10">Foclyra Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('youtube')}
                    className={`relative flex h-6.5 sm:h-7.5 items-center justify-center gap-1.5 rounded-full px-3 sm:px-3.5 text-[11px] sm:text-[12px] font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap select-none ${
                      viewMode === 'youtube'
                        ? 'text-white dark:text-[#111111]'
                        : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                    }`}
                  >
                    {viewMode === 'youtube' && (
                      <motion.div
                        layoutId="landingViewModePill"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        className="absolute inset-0 bg-[#111111] dark:bg-white rounded-full shadow-2xs"
                      />
                    )}
                    <span className="relative z-10">Standard YouTube Tab</span>
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === 'foclyra' ? (
                <motion.div
                  key="foclyra"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5"
                >
                  {/* Left: Cinematic Lecture Player Stage (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <div
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="group relative aspect-video rounded-[14px] sm:rounded-[20px] bg-[#07080b] overflow-hidden flex flex-col justify-between p-3 sm:p-4.5 cursor-pointer border border-white/[0.08] shadow-inner select-none"
                  >
                    {/* Lecture Screen Canvas (No nested window buttons) */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0e1017] via-[#090b10] to-[#06070a] flex flex-col justify-center px-4 sm:px-8 py-3 sm:py-5 overflow-hidden">
                      {/* Soft studio ambient light */}
                      <div
                        aria-hidden="true"
                        className="absolute -top-24 -left-24 size-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute -bottom-24 -right-24 size-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"
                      />

                      {/* Minimalist Lecture Stage Display */}
                      <div className="relative w-full max-w-[480px] mx-auto text-left font-mono">
                        <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3 border-b border-white/[0.08] text-[10px] sm:text-[11.5px] text-zinc-400 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="size-1.5 sm:size-2 rounded-full bg-emerald-400" />
                            <span className="text-zinc-200 font-medium font-sans text-[11px] sm:text-[12px]">Lecture 04 • Python 3.12</span>
                          </div>
                          <span className="text-zinc-500 font-sans text-[10px] sm:text-[11px]">1080p HD</span>
                        </div>

                        {/* Syntax Highlighted Clean Code with Line Numbers */}
                        <div className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-[12.5px] leading-[1.65] font-mono text-zinc-300">
                          <div className="text-zinc-500">
                            <span className="text-zinc-600 select-none mr-2 sm:mr-3 inline-block w-4 text-right">01</span># Pure functions & return values
                          </div>
                          <div>
                            <span className="text-zinc-600 select-none mr-2 sm:mr-3 inline-block w-4 text-right">02</span>
                            <span className="text-[#f43f5e] font-semibold">def </span>
                            <span className="text-[#38bdf8] font-semibold">calculate_total</span>
                            <span className="text-zinc-300">(items, discount=</span>
                            <span className="text-[#a78bfa]">0.10</span>
                            <span className="text-zinc-300">):</span>
                          </div>
                          <div className="pl-4 sm:pl-6">
                            <span className="text-zinc-600 select-none mr-2 sm:mr-3 inline-block w-4 text-right">03</span>
                            <span className="text-zinc-300">subtotal = </span>
                            <span className="text-[#fbbf24]">sum</span>
                            <span className="text-zinc-300">(item[</span>
                            <span className="text-[#34d399]">'price'</span>
                            <span className="text-zinc-300">] </span>
                            <span className="text-[#f43f5e]">for </span>
                            <span className="text-zinc-300">item </span>
                            <span className="text-[#f43f5e]">in </span>
                            <span className="text-zinc-300">items)</span>
                          </div>
                          <div className="pl-4 sm:pl-6">
                            <span className="text-zinc-600 select-none mr-2 sm:mr-3 inline-block w-4 text-right">04</span>
                            <span className="text-[#f43f5e] font-semibold">return </span>
                            <span className="text-zinc-300">subtotal * (</span>
                            <span className="text-[#a78bfa]">1</span>
                            <span className="text-zinc-300"> - discount)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subtle Edge Scrim for Controls */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,transparent_22%,transparent_68%,rgba(0,0,0,0.75)_100%)] pointer-events-none"
                    />

                    <div className="flex items-center justify-between z-10 gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/15 text-white/95 text-[10px] sm:text-[11px] font-medium backdrop-blur-md whitespace-nowrap">
                        Theater Mode
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-white/95 font-mono text-[10px] sm:text-[11px] backdrop-blur-md whitespace-nowrap">
                        {formatTime(progressSec)} / 48:10
                      </span>
                    </div>

                    <div className="w-full space-y-1.5 sm:space-y-2 z-10">
                      <div className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-xs">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                          style={{ width: `${(progressSec / 600) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] sm:text-[12px] text-white/90">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPlaying(!isPlaying);
                            }}
                            className="size-7 sm:size-8 rounded-full bg-white text-[#111111] flex items-center justify-center shadow-md shrink-0 hover:scale-105 active:scale-95 transition cursor-pointer"
                            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                          >
                            {isPlaying ? (
                              <Pause className="size-3 fill-[#111111]" />
                            ) : (
                              <Play className="size-3 fill-[#111111] ml-0.5" />
                            )}
                          </button>
                          <Volume2 className="size-3.5 shrink-0 hidden sm:inline opacity-80" />
                          <span className="font-mono shrink-0">{formatTime(progressSec)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/15 text-[10px] sm:text-[11px] font-mono text-white">1.25x</span>
                          <Maximize2 className="size-3 sm:size-3.5 opacity-80" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-1.5 sm:gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] sm:text-[15.5px] font-semibold tracking-[-0.015em] text-[#111111] dark:text-white leading-snug">
                        {PREVIEW_COURSE.lectureTitle}
                      </div>
                      <div className="text-[12px] sm:text-[13px] text-[#6f6f6f] dark:text-zinc-400">
                        Auto-resumes where you left off • No recommendation rabbit holes
                      </div>
                    </div>
                    <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] sm:text-[12px] font-medium shrink-0 border border-emerald-500/20 whitespace-nowrap">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span>Completed</span>
                    </span>
                  </div>
                </div>

                {/* Right: Apple Notes Style Lesson Notes Panel (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-[16px] sm:rounded-[20px] bg-[#fafafa] dark:bg-[#121318] p-3.5 sm:p-5 border border-[#eaeaea] dark:border-zinc-800/80 gap-3">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#e5e5e5] dark:border-zinc-800 gap-2">
                      <div className="inline-flex p-0.5 rounded-full bg-[#efefef] dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('notes')}
                          className={`px-2.5 py-1 rounded-full text-[11px] sm:text-[11.5px] font-medium transition cursor-pointer select-none ${
                            previewTab === 'notes'
                              ? 'bg-white dark:bg-zinc-800 text-[#111111] dark:text-white shadow-2xs font-semibold'
                              : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                          }`}
                        >
                          Notes ({PREVIEW_COURSE.notes.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('ai')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-[11.5px] font-medium transition cursor-pointer select-none ${
                            previewTab === 'ai'
                              ? 'bg-white dark:bg-zinc-800 text-[#111111] dark:text-white shadow-2xs font-semibold'
                              : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                          }`}
                        >
                          <MessageSquare className="size-3" />
                          <span>AI Chat</span>
                        </button>
                      </div>

                      <span className="text-[10.5px] sm:text-[11px] text-[#888888] dark:text-zinc-500 font-mono whitespace-nowrap">
                        {previewTab === 'notes' ? 'Auto-synced' : 'In-Context AI'}
                      </span>
                    </div>

                    {previewTab === 'notes' ? (
                      PREVIEW_COURSE.notes.map((note) => {
                      const isSelected = selectedTimestamp === note.time;
                      return (
                        <div
                          key={note.time}
                          onClick={() => { setSelectedTimestamp(note.time); setProgressSec(note.secs); }}
                          className={`group p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] border transition-all duration-200 cursor-pointer text-left ${
                            isSelected
                              ? 'bg-white dark:bg-zinc-800/90 border-[#111111]/25 dark:border-white/20 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]'
                              : 'bg-white/70 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/70 hover:bg-white dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold transition shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-100 dark:bg-white/5 text-[#666666] dark:text-zinc-400 border border-transparent group-hover:border-zinc-300/60 dark:group-hover:border-zinc-700'
                              }`}
                            >
                              <Clock className={`size-3 shrink-0 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
                              <span>{note.time}</span>
                            </span>
                            <span className="text-[12.5px] sm:text-[13px] font-semibold tracking-[-0.01em] text-[#111111] dark:text-white truncate">
                              {note.tag}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[12px] sm:text-[13px] leading-[1.55] text-[#555555] dark:text-zinc-400 font-normal">
                            {note.desc}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    /* Interactive AI Chat Preview */
                    <div className="space-y-3 pt-0.5 text-left">
                      {/* User Bubble */}
                      <div className="flex justify-end">
                        <div className="max-w-[88%] rounded-2xl px-3.5 py-2 text-[11.5px] sm:text-[12px] bg-zinc-800 text-white font-normal shadow-2xs leading-relaxed">
                          What makes calculate_total a pure function?
                        </div>
                      </div>

                      {/* AI Answer: Borderless & In-Context */}
                      <div className="flex flex-col items-start w-full text-[11.5px] sm:text-[12px] leading-relaxed text-zinc-800 dark:text-zinc-200">
                        <p>
                          In <strong>Lecture 04 (04:12)</strong>, <code className="font-mono text-[10.5px] px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">calculate_total</code> never alters outside data and always returns the same discount computation for the given inputs.
                        </p>
                      </div>

                      {/* Mock Input Bar */}
                      <div className="pt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 py-2 text-[11px] sm:text-[11.5px] text-zinc-400">
                            Ask about this chapter...
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLaunchApp('demo_ai_send')}
                            className="size-9 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0 hover:bg-zinc-700 transition cursor-pointer"
                            title="Open Studio"
                          >
                            <Send size={13} />
                          </button>
                        </div>
                        <div className="mt-1.5 text-[10.5px] text-zinc-500 dark:text-zinc-400 px-0.5">
                          29 of 30 doubts left today &middot; Saved to this lecture
                        </div>
                      </div>
                    </div>
                  )}
                  </div>

                  <div className="pt-1.5 sm:pt-2">
                    {previewTab === 'notes' ? (
                      <button
                        type="button"
                        onClick={() => handleLaunchApp('demo_export')}
                        className="w-full h-9.5 sm:h-10.5 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[12px] sm:text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition cursor-pointer shadow-xs px-4 sm:px-6 whitespace-nowrap"
                      >
                        <Download className="size-3.5 sm:size-4 shrink-0" />
                        <span className="sm:hidden">Download Notes (.docx)</span>
                        <span className="hidden sm:inline truncate">Download {PREVIEW_COURSE.docName}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLaunchApp('demo_ai_cta')}
                        className="w-full h-9.5 sm:h-10.5 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[12px] sm:text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition cursor-pointer shadow-xs px-4 sm:px-6 whitespace-nowrap"
                      >
                        <MessageSquare className="size-3.5 sm:size-4 shrink-0" />
                        <span>Ask Doubts in Studio &rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Grounded Comparison: What Standard YouTube Shows vs Foclyra */
              <motion.div
                key="youtube"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="p-5 sm:p-8 lg:p-10 text-center space-y-5 sm:space-y-6"
              >
                <h3 className="text-[18px] sm:text-[22px] leading-[1.25] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                  What gets in your way on a standard YouTube tab
                </h3>
                <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 text-left">
                  <div className="p-4 rounded-[14px] sm:rounded-[18px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1.5 border border-[#e5e5e5] dark:border-zinc-800/80">
                    <div className="text-[13px] sm:text-[14px] font-semibold text-[#111111] dark:text-white">Recommended Sidebar</div>
                    <p className="text-[12px] sm:text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                      Unrelated videos and Shorts sit right next to your lecture player.
                    </p>
                  </div>
                  <div className="p-4 rounded-[14px] sm:rounded-[18px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1.5 border border-[#e5e5e5] dark:border-zinc-800/80">
                    <div className="text-[13px] sm:text-[14px] font-semibold text-[#111111] dark:text-white">No Course Progress</div>
                    <p className="text-[12px] sm:text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                      No clear checklist showing how many lectures in a 50-video playlist you have completed.
                    </p>
                  </div>
                  <div className="p-4 rounded-[14px] sm:rounded-[18px] bg-[#f4f4f4] dark:bg-zinc-900 space-y-1.5 border border-[#e5e5e5] dark:border-zinc-800/80">
                    <div className="text-[13px] sm:text-[14px] font-semibold text-[#111111] dark:text-white">Separate Note Apps</div>
                    <p className="text-[12px] sm:text-[13px] text-[#666666] dark:text-zinc-400 leading-[1.5]">
                      Switching windows to write notes without clickable video timestamps.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('foclyra')}
                  className="inline-flex h-9 sm:h-10 md:h-11 items-center justify-center gap-2 rounded-full bg-[#111111] dark:bg-white px-5 sm:px-6 text-[12.5px] sm:text-[13.5px] font-medium text-white dark:text-[#111111] cursor-pointer whitespace-nowrap active:scale-[0.98] transition"
                >
                  <span>Switch back to Foclyra Workspace</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
            <h2 className="mt-1.5 sm:mt-2 text-[clamp(24px,5vw,44px)] leading-[1.12] font-bold tracking-[-0.035em] text-[#111111] dark:text-white">
              Everything you need to finish a playlist.
            </h2>
            <p className="mt-2.5 sm:mt-4 text-[14px] sm:text-[16.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
              Your video player, lecture checklist, timestamped notes, and focus timer in one tab.
            </p>
          </div>

          <div className="mt-7 sm:mt-11 grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-12">
            {/* Card 1: Clean Playlist & Video Player (7 cols) */}
            <WobbleCard
              containerClassName="lg:col-span-7 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90"
              className="p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-5 h-full"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BrandTile bg="bg-[#FF0033]" text="text-white" rotate="-rotate-3">
                    <Play className="size-3.5 sm:size-4 fill-white text-white ml-0.5" />
                  </BrandTile>
                  <h3 className="text-[17px] sm:text-[19px] md:text-[18.5px] lg:text-[20px] leading-[1.22] font-bold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Distraction-free playlist player
                  </h3>
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Import any YouTube playlist (up to 200 videos) and study in Theater Mode with zero sidebar distractions, Shorts, or comments.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
            </WobbleCard>

            {/* Card 2: In-Context AI Tutor (5 cols) */}
            <WobbleCard
              containerClassName="lg:col-span-5 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90"
              className="p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-5 h-full"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BrandTile bg="bg-[#10B981]" text="text-white" rotate="rotate-2">
                    <MessageSquare className="size-3.5 sm:size-4" />
                  </BrandTile>
                  <h3 className="text-[17px] sm:text-[19px] md:text-[18.5px] lg:text-[20px] leading-[1.22] font-bold tracking-[-0.02em] text-[#111111] dark:text-white">
                    In-context AI tutor
                  </h3>
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Ask questions grounded in the current chapter and exact video timestamp. 30 daily questions with zero hallucinations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <Sparkle className="size-3 sm:size-3.5 text-emerald-500 shrink-0" />
                  <span>Grounded in Lecture</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <CheckCircle2 className="size-3 sm:size-3.5 text-emerald-500 shrink-0" />
                  <span>Saves directly to notes</span>
                </span>
              </div>
            </WobbleCard>

            {/* Card 3: Timestamped Notes (5 cols) */}
            <WobbleCard
              containerClassName="lg:col-span-5 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90"
              className="p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-4 h-full"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BrandTile bg="bg-[#F5C542]" text="text-[#111111]" rotate="rotate-3">
                    <Clock className="size-3.5 sm:size-4" strokeWidth={2.3} />
                  </BrandTile>
                  <h3 className="text-[17px] sm:text-[19px] md:text-[18.5px] lg:text-[20px] leading-[1.22] font-bold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Timestamped lecture notes
                  </h3>
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Every note links to the exact video second. Click any timestamp to jump right back to that concept or formula.
                </p>
              </div>

              <div className="rounded-[14px] sm:rounded-[18px] bg-white dark:bg-zinc-800/90 border border-zinc-200/70 dark:border-zinc-700/60 p-3.5 sm:p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-mono font-medium bg-[#16a34a]/10 text-[#15803d] dark:text-[#4ade80] border border-[#16a34a]/20">
                      <Clock className="size-2.5 shrink-0" />
                      <span>04:12</span>
                    </span>
                    <span className="text-[12px] sm:text-[13px] font-semibold text-[#111111] dark:text-white tracking-[-0.01em]">
                      Key Concept
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#16a34a] dark:text-[#4ade80] font-medium">Jump to 04:12</span>
                </div>
                <p className="mt-1.5 text-[12px] sm:text-[13px] leading-relaxed text-[#555555] dark:text-zinc-400">
                  Break down complex topics into small, manageable steps.
                </p>
              </div>
            </WobbleCard>

            {/* Card 4: Word (.docx) Export (7 cols) */}
            <WobbleCard
              containerClassName="lg:col-span-7 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90"
              className="p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-4 h-full"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BrandTile bg="bg-[#2563EB]" text="text-white" rotate="-rotate-2">
                    <FileText className="size-3.5 sm:size-4" />
                  </BrandTile>
                  <h3 className="text-[17px] sm:text-[19px] md:text-[18.5px] lg:text-[20px] leading-[1.22] font-bold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Course-wise Word (.docx) export
                  </h3>
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Export notes from a single course or your entire library as a formatted Microsoft Word (.docx) study guide.
                </p>
              </div>

              <div className="rounded-[14px] sm:rounded-[18px] bg-white dark:bg-zinc-800/90 border border-zinc-200/70 dark:border-zinc-700/60 p-3.5 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="size-6 rounded-md bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0">
                      <FileText className="size-3.5" />
                    </span>
                    <span className="text-[12px] sm:text-[13px] font-semibold text-[#111111] dark:text-white truncate">
                      Valuation_Notes.docx
                    </span>
                  </div>
                  <Download className="size-3.5 text-[#6f6f6f] shrink-0" />
                </div>
                <p className="mt-1.5 text-[12px] sm:text-[13px] leading-relaxed text-[#555555] dark:text-zinc-400">
                  Organized by lecture title with clickable timestamps and clean headings.
                </p>
              </div>
            </WobbleCard>

            {/* Card 5: Pomodoro, Streak & Cloud Sync (12 cols) */}
            <WobbleCard
              containerClassName="md:col-span-2 lg:col-span-12 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90"
              className="p-5 sm:p-6 lg:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 h-full"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BrandTile bg="bg-[#FF6B2C]" text="text-white" rotate="rotate-2">
                    <Flame className="size-3.5 sm:size-4 fill-white text-white" />
                  </BrandTile>
                  <h3 className="text-[17px] sm:text-[19px] md:text-[18.5px] lg:text-[20px] leading-[1.22] font-bold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Pomodoro timer, streaks &amp; cloud sync
                  </h3>
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Stay consistent with a built-in focus timer, daily study streaks, and automatic cloud sync across devices.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <Clock className="size-3 sm:size-3.5 text-[#f4525f] shrink-0" />
                  <span>Built-in Pomodoro timer</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <Flame className="size-3 sm:size-3.5 text-[#FF6B2C] shrink-0" />
                  <span>Daily study streak</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white dark:bg-zinc-800 text-[11.5px] sm:text-[12.5px] font-medium text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                  <Cloud className="size-3 sm:size-3.5 text-[#2563EB] shrink-0" />
                  <span>Automatic cloud sync</span>
                </span>
              </div>
            </WobbleCard>
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
            <h2 className="mt-1.5 sm:mt-2 text-[clamp(24px,5vw,44px)] leading-[1.12] font-bold tracking-[-0.035em] text-[#111111] dark:text-white">
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
                title: 'Watch, ask AI & write notes',
                desc: 'Study in Theater Mode, ask doubts to the in-context AI tutor, and save notes tied to the exact video second.'
              },
              {
                step: '03',
                icon: <Download className="size-3.5 sm:size-4" />,
                title: 'Track progress & export to Word',
                desc: 'Mark lectures complete as you go and download your notes as a formatted Word (.docx) document anytime.'
              }
            ].map((item) => (
              <WobbleCard
                key={item.step}
                containerClassName="rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90 min-h-0 sm:min-h-[205px]"
                className="p-4 sm:p-6 md:p-5 lg:p-7 flex flex-col justify-between h-full"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] sm:text-[13px] font-mono font-medium text-[#8d8d8d]">{item.step}</span>
                  <span className="size-7 sm:size-8 rounded-full bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-200 flex items-center justify-center shadow-2xs shrink-0">
                    {item.icon}
                  </span>
                </div>
                <div className="space-y-1.5 sm:space-y-2 mt-4 sm:mt-6">
                  <h3 className="text-[16.5px] sm:text-[18px] md:text-[16.5px] lg:text-[19.5px] leading-[1.25] font-bold tracking-[-0.02em] text-[#111111] dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-[13.5px] sm:text-[14.5px] md:text-[13.5px] lg:text-[14.5px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                    {item.desc}
                  </p>
                </div>
              </WobbleCard>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FAQ Section - Split Editorial Layout (320px Responsive)
         ========================================================================= */}
      <section id="faq" className="px-3.5 sm:px-6 pt-14 sm:pt-22 lg:pt-32">
        <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Sticky Header (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[11.5px] sm:text-[12px] font-medium text-[#6f6f6f] dark:text-zinc-400">
              <span className="size-1.5 rounded-full bg-[#111111] dark:bg-white" />
              <span>FAQ</span>
            </div>

            <h2 className="text-[clamp(24px,4vw,38px)] leading-[1.12] font-bold tracking-[-0.035em] text-[#111111] dark:text-white">
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
            className="mx-auto max-w-[900px] text-[clamp(23px,5vw,44px)] leading-[1.12] font-bold tracking-[-0.035em] text-[#111111] dark:text-white"
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
                <span className="font-bold text-[16.5px] sm:text-[18px] tracking-[-0.02em] text-[#111111] dark:text-white">
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
              <span className="block font-heading text-[clamp(62px,23vw,120px)] md:text-[clamp(88px,13.5vw,145px)] lg:text-[clamp(135px,15.5vw,210px)] leading-[0.82] font-semibold tracking-[-0.05em] bg-[linear-gradient(180deg,#d4d4dc_0%,#e2e2ea_65%,rgba(215,215,224,0.65)_100%)] dark:bg-[linear-gradient(180deg,#32323b_0%,#23232b_65%,rgba(35,35,43,0.72)_100%)] bg-clip-text text-transparent pb-[0.06em]">
                foclyra
              </span>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div ref={footerBarRef} className="pt-5 sm:pt-6 border-t border-[#efefef] dark:border-zinc-800/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] sm:text-[13px] text-[#6f6f6f] dark:text-zinc-400 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <span>© {new Date().getFullYear()} Foclyra. All rights reserved.</span>
              <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
              <div className="flex items-center gap-3 font-medium">
                <Link
                  to="/privacy"
                  className="hover:text-[#111111] dark:hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  Privacy Policy
                </Link>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <Link
                  to="/terms"
                  className="hover:text-[#111111] dark:hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  Terms of Service
                </Link>
              </div>
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
