import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Play, 
  Pause,
  ShieldCheck, 
  FileText, 
  Clock, 
  ArrowRight, 
  Zap, 
  Download, 
  CheckCircle2, 
  ChevronDown, 
  Database, 
  Lock, 
  Flame, 
  Sun, 
  Moon,
  ExternalLink,
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

  // Interactive Live Motion State (Vidyst simulation)
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');
  const [selectedTimestamp, setSelectedTimestamp] = useState('04:12');
  const [typedNoteIndex, setTypedNoteIndex] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  // Live video simulation counter
  const [progressSec, setProgressSec] = useState(252); // 04:12

  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = setInterval(() => {
      setProgressSec((prev) => (prev >= 600 ? 250 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Format seconds to mm:ss
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
      q: "Is Foclyra completely free to use?",
      a: "Yes, 100% free forever. No credit cards, no premium paywalls, and no subscription tiers."
    },
    {
      q: "Do I need an account to start studying?",
      a: "No! Foclyra works instantly out-of-the-box. Your courses, timestamps, and notes are saved to your browser's private local IndexedDB. Cloud sync with Google/Supabase is entirely optional."
    },
    {
      q: "How does Foclyra stop YouTube algorithm rabbit holes?",
      a: "Foclyra uses a dedicated serverless proxy that extracts only the video stream and chapter metadata. Recommendations, trending sidebars, clickbait feeds, and comment sections are completely eliminated."
    },
    {
      q: "Can I export my notes to Microsoft Word or PDF?",
      a: "Yes! In one click, Foclyra compiles all your timestamped lecture notes, code snippets, and key takeaways into a beautifully formatted .docx document with a cover page and table of contents."
    },
    {
      q: "Does it work on mobile or tablets?",
      a: "Yes, Foclyra is a certified Progressive Web App (PWA). You can install it on iOS, Android, or Mac with offline note storage."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-400 selection:text-black">
      {/* =========================================================================
          1. Sleek Minimalist Header (Vidyst Style)
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="Foclyra" className="w-8 h-8 transition-transform group-hover:scale-105" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-foreground text-lg tracking-tight">Foclyra</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">
                Studio
              </span>
            </div>
          </Link>

          {/* Quick Nav Anchor Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-muted-foreground">
            <a href="#demo" className="hover:text-foreground transition-colors">Live Demo</a>
            <a href="#bento" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs & Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="w-9 h-9 rounded-full border border-border/80 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Vidyst Style Pill Button */}
            <button
              type="button"
              onClick={() => handleLaunchApp('nav_cta')}
              className="px-5 py-2 rounded-full bg-foreground text-background text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>{user ? 'Open Studio' : 'Launch Studio'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. Hero Section (80% Vidyst Scale + 20% Odoo Hand-Drawn Charm)
         ========================================================================= */}
      <section className="relative pt-16 sm:pt-24 pb-16 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Subtle Live Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/80 border border-border/80 text-foreground text-xs font-semibold shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>The High-Retention YouTube Study Studio</span>
          </motion.div>

          {/* Massive Vidyst-Scale Typography with Odoo Hand-Drawn Highlights */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-tight leading-[1.08] text-center max-w-4xl mx-auto"
          >
            <span className="block bg-gradient-to-b from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
              Master any skill on YouTube.
            </span>
            <span className="inline-block mt-2">
              With{' '}
              {/* Odoo Style Marker Highlighter Effect */}
              <span className="relative inline-block mx-1">
                <span className="absolute -inset-1 sm:-inset-1.5 bg-amber-300 dark:bg-amber-400/35 rounded-md -rotate-1 -skew-x-2 -z-10 shadow-xs" />
                <span className="text-slate-950 dark:text-amber-200 relative font-black">
                  zero rabbit holes.
                </span>
                {/* Odoo Style Hand-Drawn Underline SVG */}
                <svg className="absolute -bottom-2.5 left-0 w-full h-3 text-sky-500 dark:text-sky-400 overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M2 7 C 25 2, 65 3, 98 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed pt-2"
          >
            Streamline video lectures into deep focus. Take synchronized timestamped notes, sprint with built-in Pomodoro cycles, and export complete Word (.docx) study syllabi in one click.
          </motion.p>

          {/* Primary CTA + Odoo Hand-Drawn Doodle Arrow & Price Note */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Vidyst Style Massive Pill Button */}
            <button
              type="button"
              onClick={() => handleLaunchApp('hero_main_pill')}
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-foreground text-background font-bold text-sm sm:text-base hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10 flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Play size={16} className="fill-current" />
              <span>Start Learning Free</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>

            {/* Odoo Style Hand-Drawn Curved Arrow & Annotation Note */}
            <div className="hidden lg:flex items-center gap-2 absolute -right-28 top-3 select-none">
              <svg className="w-14 h-12 text-primary -rotate-12" viewBox="0 0 60 50" fill="none">
                <path d="M10 40 C 25 35, 45 30, 48 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
                <path d="M40 10 L 48 10 L 48 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="font-handwriting text-2xl text-primary font-bold -rotate-6 leading-tight">
                <span>US$ 0 / forever</span>
                <span className="block text-sm text-muted-foreground">no credit card needed!</span>
              </div>
            </div>
          </motion.div>

          {/* Small Vidyst-Style Trust Badge */}
          <div className="text-[11px] text-muted-foreground pt-1">
            <span>Free for everyone • Works 100% offline via IndexedDB • No registration barrier</span>
          </div>
        </div>

        {/* =========================================================================
            3. Live Motion Product Stage (Vidyst's Signature Video / App Simulation)
           ========================================================================= */}
        <div id="demo" className="max-w-5xl mx-auto px-4 sm:px-6 pt-12">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="rounded-3xl border border-border/80 bg-card shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-300 hover:border-primary/50"
          >
            {/* macOS Title Bar */}
            <div className="h-11 px-5 bg-muted/60 border-b border-border/80 flex items-center justify-between">
              {/* Traffic Light Dots */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80 cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 cursor-pointer" />
              </div>

              {/* Center App Pill (Vidyst Live Status Indicator) */}
              <div className="px-3.5 py-1 rounded-full bg-background/90 border border-border text-[11px] font-mono text-foreground flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold text-foreground">● DEEP FOCUS ACTIVE</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">CS50 Lecture 04: Pointers</span>
              </div>

              {/* Right Side Pill */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                <span className="hidden sm:inline">PWA Engine 0ms</span>
              </div>
            </div>

            {/* Live Interactive Workspace (Video Stage + Synchronized Notes) */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-background/50">
              {/* Left Side: Clean Video Surface (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="relative aspect-video rounded-2xl bg-slate-950 border border-border/80 overflow-hidden flex flex-col justify-between p-4 sm:p-5 shadow-2xl group">
                  {/* Top Overlay Badges */}
                  <div className="flex items-center justify-between z-10">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] font-bold tracking-wider backdrop-blur-md">
                      RECOMMENDATION FEEDS: BLOCKED
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/70 text-white font-mono text-[10px] backdrop-blur-md">
                      {formatTime(progressSec)} / 48:10
                    </span>
                  </div>

                  {/* Center Video Graphic / Visualizer */}
                  <div className="self-center flex flex-col items-center gap-3 z-10">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      title={isPlaying ? "Pause Demo" : "Play Demo"}
                    >
                      {isPlaying ? (
                        <Pause size={24} className="fill-slate-900" />
                      ) : (
                        <Play size={24} className="fill-slate-900 ml-1" />
                      )}
                    </button>
                    <span className="text-white text-xs font-semibold tracking-wide drop-shadow-md">
                      Harvard CS50: Memory & Pointers Explained
                    </span>
                  </div>

                  {/* Subtle Grid Animation Background */}
                  <div className="absolute inset-0 bg-radial from-transparent to-black/80 pointer-events-none" />

                  {/* Bottom Controls Bar */}
                  <div className="w-full space-y-2 z-10">
                    {/* Live Progress Bar */}
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                      <motion.div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(progressSec / 600) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/80">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white transition">
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <Volume2 size={14} />
                        <span className="font-mono text-[10px]">{formatTime(progressSec)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono">1080p HD</span>
                        <Maximize2 size={13} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Info Strip */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <div>
                    <h3 className="font-bold text-foreground">Lecture 04: Dynamic Memory Allocation</h3>
                    <p className="text-[11px] text-muted-foreground">Harvard CS50 • David J. Malan</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold">
                    Lesson 4 of 24
                  </span>
                </div>
              </div>

              {/* Right Side: Timestamped Notes & Pomodoro (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                {/* Live Pomodoro Sprint Card */}
                <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                      <Flame size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Deep Work Sprint</span>
                      <span className="text-sm font-mono font-bold text-foreground">21:45 Remaining</span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Synchronized Notes Stream */}
                <div className="flex-1 p-4 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText size={14} className="text-primary" />
                      <span>Synchronized Notes (3)</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">Auto-saved 0.5s ago</span>
                  </div>

                  {/* Note Item 1 */}
                  <div 
                    onClick={() => { setSelectedTimestamp('04:12'); setProgressSec(252); }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedTimestamp === '04:12' 
                        ? 'bg-primary/10 border-primary/40 shadow-xs' 
                        : 'bg-muted/40 border-border/50 hover:bg-muted/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono font-bold">
                      <Clock size={11} />
                      <span className="underline">04:12</span>
                      <span className="text-muted-foreground">• Pointer variable address</span>
                    </div>
                    <p className="text-[11px] text-foreground font-mono bg-background/80 p-2 rounded-lg border border-border/60 mt-1.5">
                      int *p = &x; // stores address
                    </p>
                  </div>

                  {/* Note Item 2 */}
                  <div 
                    onClick={() => { setSelectedTimestamp('09:45'); setProgressSec(585); }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedTimestamp === '09:45' 
                        ? 'bg-primary/10 border-primary/40 shadow-xs' 
                        : 'bg-muted/40 border-border/50 hover:bg-muted/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono font-bold">
                      <Clock size={11} />
                      <span className="underline">09:45</span>
                      <span className="text-muted-foreground">• Heap vs Stack Allocation</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      malloc() allocates on heap memory. Always pair with free() to avoid memory leaks.
                    </p>
                  </div>

                  {/* Odoo Style Word Export Badge Doodle */}
                  <div className="relative pt-2">
                    <button
                      type="button"
                      onClick={() => handleLaunchApp('demo_export')}
                      className="w-full py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Export CS50_Syllabus.docx</span>
                    </button>
                    {/* Handwritten sticker */}
                    <div className="absolute -top-3 right-2 bg-amber-300 dark:bg-amber-400 text-slate-950 font-handwriting text-base font-bold px-2 py-0.5 rounded shadow-sm rotate-2">
                      1-click syllabus! ✨
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          4. Bento Grid Showcase (Sleek Vidyst Cards + Odoo Hand-Drawn Touches)
         ========================================================================= */}
      <section id="bento" className="py-20 border-t border-border/60 bg-muted/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Section Heading */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Engineered For Focus</span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Why Serious Learners Switch To Foclyra
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Everything required to complete long courses and retain complex topics without algorithmic interruptions.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Bento Card 1: Anti-Distraction Shield (7 cols) */}
            <div className="md:col-span-7 p-7 sm:p-8 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="text-2xl font-bold text-foreground">The Anti-Distraction Shield</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  YouTube’s recommendation algorithm is built to maximize ad clicks, not your retention. Foclyra strips out the home feed, autoplay traps, and comment wars.
                </p>
              </div>

              {/* Odoo Style Visual Comparison */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-left space-y-1">
                  <span className="text-[10px] font-bold uppercase text-rose-500 block">Standard YouTube</span>
                  <p className="text-xs text-muted-foreground">Clickbait thumbnails, 15s unskippable ads, comment rabbit holes.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-left space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-500 block">Foclyra Studio</span>
                  <p className="text-xs text-muted-foreground">Pure lecture video, zero ads, timestamped notes.</p>
                </div>
              </div>
            </div>

            {/* Bento Card 2: 1-Click Timecode Notes (5 cols) */}
            <div className="md:col-span-5 p-7 sm:p-8 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <FileText size={22} />
                </div>
                <h3 className="text-2xl font-bold text-foreground">1-Click Timecode Notes</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Click spacebar or the note trigger to lock your thoughts to the exact second. Click any timestamp later to jump straight to that concept.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/60 border border-border text-xs font-mono text-muted-foreground space-y-1">
                <div className="text-foreground font-semibold flex items-center gap-1.5">
                  <span className="text-primary font-bold">[12:40]</span>
                  <span>Database indexing trade-offs</span>
                </div>
                <p className="text-[11px] text-muted-foreground">B-Tree lookups O(log n) vs Hash indexes O(1)</p>
              </div>
            </div>

            {/* Bento Card 3: 1-Click Word (.docx) Export (5 cols) */}
            <div className="md:col-span-5 p-7 sm:p-8 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Download size={22} />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Word (.docx) Export</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Export 30 hours of video study notes into an executive Microsoft Word document with a cover page, headings, and code blocks.
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <FileText size={16} />
                <span>CS50_Syllabus_Guide.docx (Generated)</span>
              </div>
            </div>

            {/* Bento Card 4: Local-First IndexedDB Engine (7 cols) */}
            <div className="md:col-span-7 p-7 sm:p-8 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Zap size={22} />
                </div>
                <h3 className="text-2xl font-bold text-foreground">0ms Local-First Architecture</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Built on Dexie.js (IndexedDB). Your notes and playback progress save locally in under 1 millisecond. Never lose your study history if your Wi-Fi drops.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                <span className="flex items-center gap-2">
                  <Database size={14} className="text-emerald-500" />
                  <span>100% Private Local Storage</span>
                </span>
                <span className="flex items-center gap-2">
                  <Lock size={14} className="text-primary" />
                  <span>Supabase Sync (Optional)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. 3-Step Simple Workflow
         ========================================================================= */}
      <section id="workflow" className="py-20 border-t border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Simple 3-Step Flow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Start Learning In Under 10 Seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-card border border-border space-y-3 relative">
              <span className="text-4xl font-black text-primary/30 font-mono">01</span>
              <h3 className="text-base font-bold text-foreground">Paste Any YouTube Link</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste any playlist or video URL. Foclyra automatically extracts lessons, durations, and titles.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-card border border-border space-y-3 relative">
              <span className="text-4xl font-black text-primary/30 font-mono">02</span>
              <h3 className="text-base font-bold text-foreground">Enter The Focus Stage</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Watch in distraction-free dark mode, take timestamped code notes, and run built-in Pomodoro deep work sprints.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-card border border-border space-y-3 relative">
              <span className="text-4xl font-black text-primary/30 font-mono">03</span>
              <h3 className="text-base font-bold text-foreground">Own Your Knowledge</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export all your study notes into an executive Word (.docx) syllabus and maintain your daily learning streak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. Interactive FAQ Accordion
         ========================================================================= */}
      <section id="faq" className="py-20 border-t border-border/60 bg-muted/15">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Got Questions?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={faq.q} 
                  className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 flex items-center justify-between text-left font-bold text-sm text-foreground hover:text-primary transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. Final Conversion Banner (Vidyst Style + Odoo Annotation)
         ========================================================================= */}
      <section className="py-24 border-t border-border/60 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight">
            Ready to take your focus back?
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Experience the difference between passive video browsing and high-retention active mastery.
          </p>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => handleLaunchApp('footer_banner')}
              className="px-10 py-4 rounded-full bg-foreground text-background font-bold text-sm sm:text-base hover:scale-105 active:scale-95 transition-all shadow-2xl inline-flex items-center gap-3 cursor-pointer group"
            >
              <Play size={16} className="fill-current" />
              <span>Launch Foclyra Studio Now</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. Clean Footer
         ========================================================================= */}
      <footer className="border-t border-border/60 py-8 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Foclyra" className="w-5 h-5" />
            <span className="font-bold text-foreground">Foclyra Studio</span>
            <span>• Built by Sameed Siddiqui</span>
          </div>

          <div className="flex items-center gap-5">
            <a 
              href="https://github.com/ssiddiquiii/foclyra" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink size={12} />
            </a>
            <button 
              type="button" 
              onClick={() => handleLaunchApp('footer_link')}
              className="hover:text-foreground transition cursor-pointer"
            >
              Launch Studio
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
