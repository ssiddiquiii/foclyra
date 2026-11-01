import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Play, 
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
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../services/analytics';

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
    trackEvent('landing_faq_toggle', { faq_index: index });
  };

  const handleLaunchApp = (source = 'hero') => {
    trackEvent('landing_launch_studio_click', { source });
    navigate('/');
  };

  const FAQS = [
    {
      q: "Is Foclyra completely free to use?",
      a: "Yes, Foclyra is 100% free and open-source. There are no subscriptions, paywalls, or hidden tier limits."
    },
    {
      q: "Do I need to create an account to start studying?",
      a: "Not at all! Foclyra is built with a local-first architecture using IndexedDB (Dexie.js). You can paste a playlist, watch videos, and take notes immediately with zero sign-up. Creating an account is only needed if you want cloud backup across devices."
    },
    {
      q: "How does Foclyra eliminate YouTube distractions?",
      a: "When you paste a YouTube playlist or video, Foclyra extracts only the raw video stream. The algorithmic home feed, recommended videos sidebar, comments, and banner ads are completely stripped out."
    },
    {
      q: "Where are my notes and study data stored?",
      a: "Your notes live directly in your browser's private indexed database. Your notes are private to you and are never read or monetized. If you log in with Google, they securely sync to your personal Supabase account."
    },
    {
      q: "Can I export my notes for offline exams or revision?",
      a: "Yes! With a single click, Foclyra compiles all your timestamped lecture notes into a professionally structured Microsoft Word (.docx) syllabus document complete with timestamps, headings, and code snippets."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* =========================================================================
          Top Navigation Bar
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="Foclyra" className="w-8 h-8 transition-transform group-hover:scale-105" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-foreground text-lg tracking-tight">Foclyra</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">
                Studio
              </span>
            </div>
          </Link>

          {/* Quick Nav Anchor Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#bento" className="hover:text-foreground transition-colors">Why Foclyra</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs & Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="w-9 h-9 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => handleLaunchApp('nav_user')}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span>Go to Studio</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleLaunchApp('nav_guest')}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span>Launch Studio</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          Hero Section
         ========================================================================= */}
      <section className="relative pt-16 sm:pt-24 pb-16 overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold shadow-xs animate-in fade-in zoom-in duration-500">
            <Sparkles size={14} />
            <span>Distraction-Free Video Learning Platform</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.15]">
            Master Any Skill From YouTube. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-sky-400">
              Without The Algorithm Rabbit Hole.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            Stop losing hours to recommended feeds, clickbait comments, and autoplay traps. Foclyra extracts YouTube playlists into a focused studio with timestamped notes, Pomodoro deep work sprints, and 1-click Word export.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => handleLaunchApp('hero_primary')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Play size={16} className="fill-primary-foreground" />
              <span>Start Learning Free</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>

            <a
              href="#bento"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-border bg-card/60 hover:bg-muted text-foreground font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Value Props Row */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>No Sign-up Barrier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>100% Offline-First (Dexie)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Zero Ads & Feeds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Instant Word (.docx) Export</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            Interactive Product Preview Mockup (Stageshow-Style Studio Still)
           ========================================================================= */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12">
          <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden transition-all duration-300 hover:border-primary/40">
            {/* macOS Browser Header Bar */}
            <div className="h-10 px-4 bg-muted/60 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="px-4 py-1 rounded-md bg-background/80 border border-border/80 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <Lock size={11} className="text-emerald-500" />
                <span>foclyra-studio.vercel.app/lessons/cs50-lecture-01</span>
              </div>
              <div className="w-12" />
            </div>

            {/* Mock Studio Workspace (Player + Notes + Pomodoro) */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-background/50">
              {/* Left Side: Clean Player Window (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="relative aspect-video rounded-xl bg-slate-950 border border-border/80 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
                  {/* Mock Video Watermark / Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
                      FOCUS MODE ACTIVE
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[10px]">
                      14:32 / 48:10
                    </span>
                  </div>

                  {/* Play Center Indicator */}
                  <div className="self-center flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer">
                      <Play size={22} className="fill-primary-foreground ml-0.5" />
                    </div>
                    <span className="text-white font-semibold text-xs drop-shadow-md">
                      CS50: Memory & Pointers Explained
                    </span>
                  </div>

                  {/* Mock Progress Bar */}
                  <div className="w-full space-y-1">
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="w-[32%] h-full bg-primary rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Sub-bar: Lesson title & quick action */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Lecture 04: Pointers & Dynamic Memory</h4>
                    <span className="text-[11px] text-muted-foreground">Harvard CS50 • Computer Science</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold">
                    Lesson 4 of 24
                  </span>
                </div>
              </div>

              {/* Right Side: Timestamped Notes & Pomodoro (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                {/* Floating Pomodoro Tracker */}
                <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                      <Flame size={15} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Deep Work Sprint</span>
                      <span className="text-sm font-mono font-bold text-foreground">21:45 Remaining</span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Mock Synchronized Notes List */}
                <div className="flex-1 p-3.5 rounded-xl bg-card border border-border space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText size={13} className="text-primary" />
                      <span>Synchronized Notes (3)</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">Auto-saved 0.5s ago</span>
                  </div>

                  {/* Note Item 1 */}
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono font-bold">
                      <Clock size={11} />
                      <span>04:12</span>
                      <span className="text-muted-foreground">• Pointer variable declaration</span>
                    </div>
                    <p className="text-[11px] text-foreground font-mono bg-background/80 p-1.5 rounded border border-border/60">
                      int *p = &x; // stores address
                    </p>
                  </div>

                  {/* Note Item 2 */}
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono font-bold">
                      <Clock size={11} />
                      <span>09:45</span>
                      <span className="text-muted-foreground">• Heap vs Stack Allocation</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      malloc() allocates directly on heap memory. Always free() to prevent memory leaks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          Bento Grid Showcase (4 Core Pillars)
         ========================================================================= */}
      <section id="bento" className="py-20 border-t border-border/60 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Engineered For Focus</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Why Serious Learners Switch To Foclyra
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Everything you need to complete courses and master complex topics without getting trapped in the algorithm.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Bento Card 1: Distraction Elimination (7 cols) */}
            <div className="md:col-span-7 p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-xl font-bold text-foreground">The Anti-Distraction Shield</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  YouTube was built to maximize watch time, not your learning retention. Foclyra eliminates the home feed, sidebar recommendations, and comment rabbit holes, keeping you in deep study mode.
                </p>
              </div>

              {/* Before vs After comparison pill */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-left">
                  <span className="text-[10px] font-bold uppercase text-rose-500 block">YouTube Algorithm</span>
                  <span className="text-xs text-muted-foreground">Clickbait feeds, 15s ads, comment fights</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-left">
                  <span className="text-[10px] font-bold uppercase text-emerald-500 block">Foclyra Studio</span>
                  <span className="text-xs text-muted-foreground">Pure video, dark stage, zero ads</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Timestamped Note-Taking (5 cols) */}
            <div className="md:col-span-5 p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <h3 className="text-xl font-bold text-foreground">1-Click Timecode Notes</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Capture thoughts linked directly to the video's exact second. Clicking any timestamp jumps the video instantly back to that concept.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/50 border border-border/70 text-xs font-mono text-muted-foreground space-y-1">
                <div className="text-foreground font-semibold flex items-center gap-1.5">
                  <span className="text-primary">[12:40]</span>
                  <span>Database indexing trade-offs</span>
                </div>
                <p className="text-[11px] text-muted-foreground">B-Tree lookups O(log n) vs Hash indexes O(1)</p>
              </div>
            </div>

            {/* Bento Card 3: 1-Click Word Export (5 cols) */}
            <div className="md:col-span-5 p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Download size={20} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Word (.docx) Syllabus Export</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Never leave your notes trapped in a website. Export your entire course notes into a beautifully formatted Microsoft Word document ready for print, PDF conversion, or university study guides.
                </p>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <FileText size={15} />
                <span>CS50_Syllabus_Notes.docx (Generated)</span>
              </div>
            </div>

            {/* Bento Card 4: Local-First IndexedDB Engine (7 cols) */}
            <div className="md:col-span-7 p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Zero-Latency Local-First Sync</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Powered by Dexie.js and IndexedDB. Your notes and course progress save locally in under 1 millisecond. Even if your internet cuts out mid-lecture, your thoughts are never lost.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                <span className="flex items-center gap-1.5">
                  <Database size={13} className="text-emerald-500" />
                  <span>Offline IndexedDB Storage</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock size={13} className="text-primary" />
                  <span>Supabase Cloud Sync Optional</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          How It Works Workflow
         ========================================================================= */}
      <section id="workflow" className="py-20 border-t border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Simple 3-Step Flow</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Start Learning In Under 10 Seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 relative">
              <span className="text-3xl font-black text-primary/40 font-mono">01</span>
              <h3 className="text-base font-bold text-foreground">Paste Any YouTube Link</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste any playlist or standalone tutorial URL. Foclyra automatically extracts the lecture list, durations, and metadata.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 relative">
              <span className="text-3xl font-black text-primary/40 font-mono">02</span>
              <h3 className="text-base font-bold text-foreground">Enter The Focus Stage</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Watch in distraction-free dark mode, capture timestamped code notes, and run built-in Pomodoro deep work sprints.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 relative">
              <span className="text-3xl font-black text-primary/40 font-mono">03</span>
              <h3 className="text-base font-bold text-foreground">Own Your Knowledge</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export all your study notes into an executive Word (.docx) syllabus, track your daily learning streak, and retain what you learn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ Accordion Section
         ========================================================================= */}
      <section id="faq" className="py-20 border-t border-border/60 bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Got Questions?</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={faq.q} 
                  className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm text-foreground hover:text-primary transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
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
          Final Bottom CTA Banner
         ========================================================================= */}
      <section className="py-20 border-t border-border/60 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Flame size={14} />
            <span>Reclaim Your Study Hours</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Ready To Study Without Distraction?
          </h2>

          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Experience the difference between passive video watching and active, retained mastery. 100% free forever.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleLaunchApp('footer_banner')}
              className="px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all inline-flex items-center gap-2.5 cursor-pointer group"
            >
              <Play size={16} className="fill-primary-foreground" />
              <span>Launch Foclyra Studio Now</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          Footer
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
