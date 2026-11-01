import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause,
  ChevronDown, 
  Sun, 
  Moon,
  Volume2,
  Maximize2,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  Download,
  Flame,
  Cloud,
  Link2,
  ListVideo,
  Database,
  Plus
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../services/analytics';

/**
 * Vidyst-style squircle app tile for intentional editorial accents.
 * Uses subtle rotation and crisp contrast so it feels custom-crafted rather than generic outline icons.
 */
function BrandTile({ children, bg = 'bg-[#111111] dark:bg-white', text = 'text-white dark:text-[#111111]', rotate = '-rotate-3', size = 'sm' }) {
  const dims =
    size === 'lg'
      ? 'h-[0.82em] w-[0.82em] rounded-[24%] mx-[0.12em] -translate-y-[0.06em]'
      : 'size-9 rounded-[11px]';
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
  const [previewTrack, setPreviewTrack] = useState('business'); // 'business' | 'tech' | 'strategy'
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressSec, setProgressSec] = useState(252); // 04:12
  const [selectedTimestamp, setSelectedTimestamp] = useState('04:12');
  const [pomodoroSec, setPomodoroSec] = useState(1305); // 21:45 remaining
  const [activeFaq, setActiveFaq] = useState(0);

  const TRACKS = {
    business: {
      label: 'Business & Finance',
      header: 'Financial Valuation & Modeling • 4 of 18 lectures completed',
      lectureTitle: 'Lecture 04: DCF Valuation & Discount Rates (WACC)',
      docName: 'Financial_Valuation_Model_Notes.docx',
      notes: [
        {
          time: '04:12',
          secs: 252,
          tag: 'Cost of Debt & Tax Shield',
          desc: 'Interest expense is tax-deductible; effective after-tax cost of debt equals Rd × (1 − Marginal Tax Rate).'
        },
        {
          time: '09:45',
          secs: 585,
          tag: 'Terminal Value Multiples',
          desc: 'Cross-reference the Gordon Growth method with peer EV/EBITDA multiples to stress-test implied exit margins.'
        }
      ]
    },
    tech: {
      label: 'Tech & Engineering',
      header: 'Distributed Systems & Architecture • 5 of 24 lectures completed',
      lectureTitle: 'Lecture 05: Cache Invalidation & Eventual Consistency',
      docName: 'Distributed_Systems_Notes.docx',
      notes: [
        {
          time: '04:12',
          secs: 252,
          tag: 'Cache-Aside vs Write-Through',
          desc: 'Cache-aside checks Redis first; falls back to PostgreSQL and populates cache on miss for optimal read throughput.'
        },
        {
          time: '09:45',
          secs: 585,
          tag: 'Stampede Mitigation',
          desc: 'Use mutex locking or probabilistic early expiration to prevent database crashes during high-traffic cache expiry.'
        }
      ]
    },
    strategy: {
      label: 'Product & MBA Strategy',
      header: 'Product Strategy & Growth • 3 of 16 lectures completed',
      lectureTitle: 'Lecture 03: Unit Economics & CAC Payback Periods',
      docName: 'Product_Strategy_GTM_Notes.docx',
      notes: [
        {
          time: '04:12',
          secs: 252,
          tag: 'CAC Payback Benchmark',
          desc: 'Target CAC payback under 12 months for B2B SaaS to preserve runway and maintain positive net cash flow.'
        },
        {
          time: '09:45',
          secs: 585,
          tag: 'LTV / CAC Rule of Thumb',
          desc: 'A 3x+ ratio indicates sustainable unit economics before scaling paid acquisition channels.'
        }
      ]
    }
  };

  const currentTrack = TRACKS[previewTrack] || TRACKS.business;

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
      tag: 'Courses',
      q: "What can I study on Foclyra?",
      a: "Any educational playlist or video series on YouTube—business case studies, finance lectures, coding bootcamps, and university courses."
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
        <h1 className="mx-auto max-w-[960px] text-[clamp(42px,6.4vw,88px)] leading-[1.06] font-semibold tracking-[-0.045em] text-[#111111] dark:text-white">
          <span className="block">
            Turn{' '}
            <BrandTile bg="bg-[#FF0033]" text="text-white" rotate="-rotate-4" size="lg">
              <Play className="size-[46%] fill-white text-white ml-[2%]" />
            </BrandTile>
            YouTube playlists
          </span>
          <span className="block bg-[linear-gradient(180deg,#111_0%,#111_30%,#9e9e9e_100%)] dark:bg-[linear-gradient(180deg,#fff_0%,#fff_30%,#666_100%)] bg-clip-text pb-[.08em] text-transparent">
            into structured courses.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-[820px] text-[17px] sm:text-[19px] leading-[1.6] text-[#555555] dark:text-zinc-400 font-normal">
          Import any YouTube playlist or video into a distraction-free study workspace.
          <br className="hidden sm:inline" />{' '}
          Built for tech, business, finance, and university students—watch without recommendations, take timestamped notes, and export to Word (.docx).
        </p>

        <div className="relative mt-8 inline-flex flex-col items-center">
          <button
            type="button"
            onClick={() => handleLaunchApp('hero_main_pill')}
            className="flex h-[52px] items-center gap-2.5 rounded-full bg-[#111111] dark:bg-white px-7 text-[16px] font-medium text-white dark:text-[#111111] hover:bg-[#333333] dark:hover:bg-zinc-200 transition active:scale-[.98] cursor-pointer shadow-sm"
          >
            <span>Import a Playlist Free</span>
            <ArrowRight size={17} />
          </button>

          <p className="mt-4 text-[14px] text-[#6f6f6f] dark:text-zinc-500">
            Try 1 playlist immediately without login • Up to 5 playlists with a free account
          </p>

          {/* Cross-Discipline Category Ribbon */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#666666] dark:text-zinc-400">
            <span className="font-medium text-[#111111] dark:text-white mr-1">Designed for:</span>
            <span className="px-3 py-1 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800">
              Business &amp; Finance
            </span>
            <span className="px-3 py-1 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800">
              Tech &amp; Computer Science
            </span>
            <span className="px-3 py-1 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800">
              Product &amp; Strategy
            </span>
            <span className="px-3 py-1 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800">
              University Prep
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. Interactive Watch Workspace Preview
         ========================================================================= */}
      <section id="studio" className="px-6 pt-[56px]">
        <div className="mx-auto max-w-[1140px]">
          {/* Controls: Mode Switcher & Example Domain Tracks */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            {/* Domain Switcher */}
            <div className="inline-flex p-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[12px]">
              {Object.entries(TRACKS).map(([key, track]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setPreviewTrack(key);
                    setSelectedTimestamp('04:12');
                    setProgressSec(252);
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    previewTrack === key
                      ? 'bg-white dark:bg-zinc-800 text-[#111111] dark:text-white shadow-2xs'
                      : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  {track.label}
                </button>
              ))}
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex p-1 rounded-full bg-[#f2f2f2] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('foclyra')}
                className={`flex h-8 items-center gap-2 rounded-full px-3.5 text-[12px] font-medium transition-all duration-200 cursor-pointer ${
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
                className={`flex h-8 items-center gap-2 rounded-full px-3.5 text-[12px] font-medium transition-all duration-200 cursor-pointer ${
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
                    {currentTrack.header}
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
                        <span className="text-white/90 text-[13px] font-medium tracking-[-0.01em] text-center max-w-[90%]">
                          {currentTrack.lectureTitle}
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
                      <div className="min-w-0 pr-3">
                        <div className="text-[15px] font-semibold tracking-[-0.01em] text-[#111111] dark:text-white truncate">
                          {currentTrack.lectureTitle}
                        </div>
                        <div className="text-[13px] text-[#6f6f6f] dark:text-zinc-400">
                          Auto-resumes where you left off
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16a34a]/10 text-[#15803d] dark:text-[#63d94e] text-[12px] font-medium shrink-0">
                        <CheckCircle2 size={13} />
                        <span>Completed</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Real Lesson Notes Panel (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between rounded-[16px] bg-[#f8f8f8] dark:bg-zinc-900/70 p-4 border border-[#efefef] dark:border-zinc-800 space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5] dark:border-zinc-800">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.01em] text-[#111111] dark:text-white">
                          <FileText size={14} className="text-[#6f6f6f]" />
                          <span>Lesson Notes ({currentTrack.notes.length})</span>
                        </span>
                        <span className="text-[11px] text-[#6f6f6f] dark:text-zinc-400 font-mono">
                          Enter to save
                        </span>
                      </div>

                      {currentTrack.notes.map((note) => (
                        <div
                          key={note.time}
                          onClick={() => { setSelectedTimestamp(note.time); setProgressSec(note.secs); }}
                          className={`p-3 rounded-[12px] border transition cursor-pointer text-left ${
                            selectedTimestamp === note.time
                              ? 'bg-white dark:bg-zinc-800 border-[#111111]/20 dark:border-white/20 shadow-2xs'
                              : 'bg-white/60 dark:bg-zinc-900/40 border-[#e5e5e5] dark:border-zinc-800 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-[12px] font-mono font-medium text-[#111111] dark:text-white">
                            <Clock size={12} className={selectedTimestamp === note.time ? 'text-[#16a34a]' : 'text-[#6f6f6f]'} />
                            <span className="underline">{note.time}</span>
                            <span className="text-[#6f6f6f] font-sans">• {note.tag}</span>
                          </div>
                          <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[#444444] dark:text-zinc-300 bg-[#f4f4f4] dark:bg-zinc-950 p-2 rounded-lg font-sans">
                            {note.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchApp('demo_export')}
                        className="w-full h-10 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Download {currentTrack.docName}</span>
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
            <div className="lg:col-span-7 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[290px]">
              <div className="space-y-3 max-w-lg">
                <div className="flex items-center gap-3">
                  <BrandTile bg="bg-[#FF0033]" text="text-white" rotate="-rotate-3">
                    <Play size={16} className="fill-white text-white ml-0.5" />
                  </BrandTile>
                  <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Distraction-free playlist player
                  </h3>
                </div>
                <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Import any public or unlisted YouTube playlist (up to 200 videos)—from computer science bootcamps and financial modeling to MBA case studies and university lecture series. Watch in Theater Mode with chapter markers and auto-resume, free from recommendations or comments.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  <CheckCircle2 size={14} className="text-[#16a34a]" />
                  <span>No sidebar recommendations</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  <CheckCircle2 size={14} className="text-[#16a34a]" />
                  <span>No comments feed</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  <CheckCircle2 size={14} className="text-[#16a34a]" />
                  <span>Auto-resumes playback</span>
                </span>
              </div>
            </div>

            {/* Card 2: Timestamped Notes (5 cols) */}
            <div className="lg:col-span-5 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[290px]">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BrandTile bg="bg-[#F5C542]" text="text-[#111111]" rotate="rotate-3">
                    <Clock size={16} strokeWidth={2.3} />
                  </BrandTile>
                  <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Timestamped lecture notes
                  </h3>
                </div>
                <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Every note you save records the exact video second. Perfect for capturing business formulas, code snippets, financial metrics, and slide definitions.
                </p>
              </div>

              <div className="mt-6 rounded-[18px] bg-white dark:bg-zinc-800 p-4">
                <div className="flex items-center justify-between text-[12px] font-mono text-[#111111] dark:text-white font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={12} className="text-[#16a34a]" />
                    <span>04:12 • DCF Valuation &amp; WACC</span>
                  </span>
                  <span className="text-[#16a34a] dark:text-[#63d94e]">Jump to 04:12</span>
                </div>
                <p className="mt-1.5 text-[13px] text-[#666666] dark:text-zinc-400">
                  Interest expense is tax-deductible; effective cost of debt is Rd × (1 − Tax Rate).
                </p>
              </div>
            </div>

            {/* Card 3: Word (.docx) Export (5 cols) */}
            <div className="lg:col-span-5 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[290px]">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BrandTile bg="bg-[#2563EB]" text="text-white" rotate="-rotate-2">
                    <FileText size={16} />
                  </BrandTile>
                  <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Course-wise Word (.docx) export
                  </h3>
                </div>
                <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Download comprehensive study guides for a single course or export your entire notes library as formatted Microsoft Word (.docx) documents—ready for exam revision or team sharing.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-[18px] bg-white dark:bg-zinc-800 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="size-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
                    <FileText size={15} />
                  </span>
                  <span className="text-[13px] font-medium text-[#111111] dark:text-white">
                    Financial_Valuation_Model_Notes.docx
                  </span>
                </div>
                <Download size={15} className="text-[#6f6f6f]" />
              </div>
            </div>

            {/* Card 4: Pomodoro, Streak & Cloud Sync (7 cols) */}
            <div className="lg:col-span-7 rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-9 flex flex-col justify-between min-h-[290px]">
              <div className="space-y-3 max-w-lg">
                <div className="flex items-center gap-3">
                  <BrandTile bg="bg-[#FF6B2C]" text="text-white" rotate="rotate-2">
                    <Flame size={16} className="fill-white text-white" />
                  </BrandTile>
                  <h3 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                    Pomodoro timer, study streaks &amp; cloud sync
                  </h3>
                </div>
                <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                  Structure your revision sessions with customizable focus intervals, build your daily study streak, and keep your data stored locally in IndexedDB—with optional Supabase cloud sync across your devices.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  <Clock size={14} className="text-[#f4525f]" />
                  <span>Built-in Pomodoro timer</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  <Flame size={14} className="text-[#FF6B2C]" />
                  <span>Daily study streak</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
                  <Cloud size={14} className="text-[#2563EB]" />
                  <span>Supabase cloud sync</span>
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
                icon: <Link2 size={15} />,
                title: 'Paste a YouTube link',
                desc: 'Paste any public or unlisted YouTube playlist or video URL—or pick one of the starter courses on the dashboard.'
              },
              {
                step: '02',
                icon: <Clock size={15} />,
                title: 'Watch & write timestamped notes',
                desc: 'Study in Theater Mode with a built-in Pomodoro timer and save notes tied to the exact video second.'
              },
              {
                step: '03',
                icon: <Download size={15} />,
                title: 'Track progress & export to Word',
                desc: 'Mark lectures complete as you go and download your notes as a formatted Word (.docx) document anytime.'
              }
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-[28px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-7 sm:p-8 flex flex-col justify-between min-h-[215px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-mono font-medium text-[#8d8d8d]">{item.step}</span>
                  <span className="size-8 rounded-full bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-200 flex items-center justify-center shadow-2xs">
                    {item.icon}
                  </span>
                </div>
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
          6. FAQ Section — Split Editorial Layout + Smooth CSS Grid Accordion
         ========================================================================= */}
      <section id="faq" className="px-6 pt-[128px] sm:pt-[152px]">
        <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Sticky Editorial Column (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 text-[13px] font-medium text-[#111111] dark:text-zinc-200">
              <span>FAQ</span>
            </div>

            <h2 className="text-[clamp(30px,3.6vw,44px)] leading-[1.1] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Common questions, straight answers.
            </h2>

            <p className="text-[16px] leading-[1.6] text-[#666666] dark:text-zinc-400 max-w-[400px]">
              Everything you need to know about course links, note taking, and how Foclyra works.
            </p>
          </div>

          {/* Right Smooth Pill Cards Stack (7 cols) */}
          <div className="lg:col-span-7 space-y-2.5">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className={`rounded-[22px] transition-colors duration-300 ${
                    isOpen
                      ? 'bg-[#f4f4f4] dark:bg-zinc-900 ring-1 ring-[#111111]/10 dark:ring-white/10'
                      : 'bg-[#f8f8f8] hover:bg-[#f2f2f2] dark:bg-zinc-900/50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-[11px] font-mono font-medium text-[#6f6f6f] dark:text-zinc-300 border border-[#e5e5e5] dark:border-zinc-700">
                        {faq.tag}
                      </span>
                      <span className="text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] text-[#111111] dark:text-white">
                        {faq.q}
                      </span>
                    </div>

                    <span
                      className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen
                          ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] rotate-45'
                          : 'bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-300'
                      }`}
                    >
                      <Plus size={16} />
                    </span>
                  </button>

                  {/* Smooth CSS Grid Height Animation */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 pt-0 text-[15px] leading-[1.65] text-[#555555] dark:text-zinc-400">
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
          7. Final CTA Section
         ========================================================================= */}
      <section aria-labelledby="cta-h" className="px-6 pt-[128px] sm:pt-[152px] pb-20">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-[#f4f4f4] dark:bg-zinc-900/90 px-6 py-20 sm:py-24 text-center">
          {/* Study Toolkit Icon Cluster */}
          <div className="mb-6 inline-flex items-center justify-center">
            <span className="size-11 rounded-[13px] bg-[#FF0033] text-white flex items-center justify-center shadow-md -rotate-6 z-10 ring-4 ring-[#f4f4f4] dark:ring-zinc-900">
              <Play size={18} className="fill-white text-white ml-0.5" />
            </span>
            <span className="size-11 rounded-[13px] bg-[#F5C542] text-[#111111] flex items-center justify-center shadow-md -ml-2 -translate-y-1 z-20 ring-4 ring-[#f4f4f4] dark:ring-zinc-900">
              <Clock size={18} strokeWidth={2.4} />
            </span>
            <span className="size-11 rounded-[13px] bg-[#2563EB] text-white flex items-center justify-center shadow-md -ml-2 rotate-6 z-30 ring-4 ring-[#f4f4f4] dark:ring-zinc-900">
              <FileText size={18} />
            </span>
          </div>

          <h2
            id="cta-h"
            className="mx-auto max-w-[960px] text-[clamp(30px,3.8vw,46px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white"
          >
            Ready to study your next playlist?
          </h2>

          <p className="mx-auto mt-4 max-w-[820px] text-[17px] leading-[1.6] text-[#666666] dark:text-zinc-400">
            Paste any YouTube playlist URL or try a starter course on the dashboard—no login required.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => handleLaunchApp('footer_banner')}
              className="flex h-[52px] items-center gap-2.5 rounded-full bg-[#111111] dark:bg-white px-7 text-[16px] font-medium text-white dark:text-[#111111] hover:bg-[#333333] dark:hover:bg-zinc-200 transition active:scale-[.98] cursor-pointer shadow-sm"
            >
              <span>Open Foclyra Studio</span>
              <ArrowRight size={17} />
            </button>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-[#6f6f6f] dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#16a34a]" />
                <span>1 playlist in guest mode</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Cloud size={14} className="text-[#2563EB]" />
                <span>Up to 5 playlists + cloud sync with a free account</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. Footer — Vidyst-Inspired Multi-Column Editorial + Giant Wordmark
         ========================================================================= */}
      <footer className="px-6 pt-16 pb-0 border-t border-[#efefef] dark:border-zinc-800/70 overflow-hidden">
        <div className="mx-auto max-w-[1200px]">
          {/* Top Multi-Column Grid */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 pb-14">
            {/* Brand Column (Left 4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <img src="/logo.svg" alt="Foclyra" className="w-7 h-7" />
                <span className="font-semibold text-[18px] tracking-[-0.02em] text-[#111111] dark:text-white">
                  foclyra
                </span>
              </Link>

              <p className="max-w-[300px] text-[14px] leading-[1.6] text-[#666666] dark:text-zinc-400">
                Distraction-free YouTube study workspace, built for tech, business, and self-directed learners.
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => handleLaunchApp('footer_cta_pill')}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111111] dark:bg-white px-5 text-[13px] font-medium text-white dark:text-[#111111] hover:opacity-90 transition cursor-pointer"
                >
                  <Play size={13} className="fill-current" />
                  <span>Open Foclyra Studio</span>
                </button>
              </div>
            </div>

            {/* Links Columns (Right 8 cols -> 4 columns of 2) */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-[14px]">
              {/* Column 1: Product */}
              <div className="space-y-3.5">
                <div className="font-semibold text-[13px] tracking-[-0.01em] text-[#111111] dark:text-white">
                  Product
                </div>
                <ul className="space-y-2.5 text-[#666666] dark:text-zinc-400">
                  <li>
                    <a href="#studio" className="hover:text-[#111111] dark:hover:text-white transition">
                      Workspace Preview
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-[#111111] dark:hover:text-white transition">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#workflow" className="hover:text-[#111111] dark:hover:text-white transition">
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-[#111111] dark:hover:text-white transition">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 2: Study Tools (with icons like Vidyst's "Streams to") */}
              <div className="space-y-3.5">
                <div className="font-semibold text-[13px] tracking-[-0.01em] text-[#111111] dark:text-white">
                  Study Tools
                </div>
                <ul className="space-y-2.5 text-[#666666] dark:text-zinc-400">
                  <li className="flex items-center gap-2">
                    <ListVideo size={14} className="text-[#8d8d8d] shrink-0" />
                    <span>YouTube Playlists</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock size={14} className="text-[#8d8d8d] shrink-0" />
                    <span>Timestamped Notes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText size={14} className="text-[#8d8d8d] shrink-0" />
                    <span>Word (.docx) Export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Flame size={14} className="text-[#8d8d8d] shrink-0" />
                    <span>Pomodoro &amp; Streaks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Database size={14} className="text-[#8d8d8d] shrink-0" />
                    <span>JSON Backup</span>
                  </li>
                </ul>
              </div>

              {/* Column 3: Compare */}
              <div className="space-y-3.5">
                <div className="font-semibold text-[13px] tracking-[-0.01em] text-[#111111] dark:text-white">
                  Compare
                </div>
                <ul className="space-y-2.5 text-[#666666] dark:text-zinc-400">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('youtube');
                        document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-[#111111] dark:hover:text-white transition text-left cursor-pointer"
                    >
                      Foclyra vs YouTube Tab
                    </button>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-[#111111] dark:hover:text-white transition">
                      Foclyra vs Separate Notes
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-[#111111] dark:hover:text-white transition">
                      Guest vs Cloud Account
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 4: Quick Access */}
              <div className="space-y-3.5">
                <div className="font-semibold text-[13px] tracking-[-0.01em] text-[#111111] dark:text-white">
                  Quick Access
                </div>
                <ul className="space-y-2.5 text-[#666666] dark:text-zinc-400">
                  <li>
                    <Link to="/" className="hover:text-[#111111] dark:hover:text-white transition">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="hover:text-[#111111] dark:hover:text-white transition">
                      Settings &amp; Backup
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://github.com/ssiddiquiii/foclyra"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#111111] dark:hover:text-white transition"
                    >
                      GitHub Repository
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Middle Copyright & Social Bar */}
          <div className="py-6 border-t border-[#efefef] dark:border-zinc-800/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#6f6f6f] dark:text-zinc-400">
            <div>
              © {new Date().getFullYear()} Foclyra · Built by Sameed Siddiqui.
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://github.com/ssiddiquiii/foclyra"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="size-9 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 text-[#111111] dark:text-zinc-200 flex items-center justify-center hover:bg-[#e5e5e5] dark:hover:bg-zinc-800 transition"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/sameed-siddiqui"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="size-9 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 text-[#111111] dark:text-zinc-200 flex items-center justify-center hover:bg-[#e5e5e5] dark:hover:bg-zinc-800 transition"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Giant Clipped Wordmark Watermark (Vidyst Signature) */}
          <div
            aria-hidden="true"
            className="mt-2 select-none pointer-events-none text-center overflow-hidden leading-[0.78]"
          >
            <span className="block text-[clamp(96px,21vw,270px)] font-semibold tracking-[-0.06em] text-[#f2f2f2] dark:text-zinc-900/80 translate-y-[14%]">
              foclyra
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
