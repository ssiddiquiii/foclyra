import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, Search, X, Sun, Moon } from 'lucide-react';
import PomodoroTimer from './components/PomodoroTimer';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import FeedbackModal from './components/FeedbackModal';
import BetaModal from './components/BetaModal';
import UserMenu from './components/UserMenu';
import AuthModal from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { MessageSquarePlus } from 'lucide-react';
import { useUIStore } from './hooks/useUIStore';
import { useTheme } from './hooks/useTheme';
import { isNavigationActive, navigationItems } from './components/shell/navigation';

// Lazy-loaded page components with instant hover preloading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Watch = lazy(() => import('./pages/Watch'));
const Settings = lazy(() => import('./pages/Settings'));
// Preload functions for 0ms route switching
const preloadDashboard = () => import('./pages/Dashboard');
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Inner shell wrapper to access React Router location hooks.
 */
function AppContent() {
  const { commandPaletteOpen, openCommandPalette, closeCommandPalette, feedbackModalOpen, openFeedbackModal, closeFeedbackModal, betaModalOpen, openBetaModal, closeBetaModal } = useUIStore();
  const { isDark, toggleTheme } = useTheme();
  const { initAuth } = useAuth();
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const commandPaletteReturnFocusRef = useRef(null);
  const drawerRef = useRef(null);
  const location = useLocation();
  const isWatchPage = location.pathname.includes('/lessons/');
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector(FOCUSABLE_SELECTOR)?.focus();

    function trapDrawerFocus(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileSidebar();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...(drawerRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [])];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first) {
        event.preventDefault();
        drawerRef.current?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', trapDrawerFocus);
    return () => {
      document.removeEventListener('keydown', trapDrawerFocus);
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [mobileSidebarOpen, closeMobileSidebar]);

  useEffect(() => {
    function handleGlobalKeyDown(e) {
      const targetTag = e.target?.tagName?.toUpperCase();
      const isTyping = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target?.isContentEditable;

      // Ctrl+K / Cmd+K Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (commandPaletteOpen) closeCommandPalette();
        else {
          commandPaletteReturnFocusRef.current = document.activeElement;
          openCommandPalette();
        }
        return;
      }

      // Alt key shortcuts (only when not typing in an input element)
      if (e.altKey && !isTyping) {
        const key = e.key.toLowerCase();
        if (key === 'd') {
          e.preventDefault();
          navigate('/');
        } else if (key === 's') {
          e.preventDefault();
          navigate('/settings');
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [commandPaletteOpen, openCommandPalette, closeCommandPalette, navigate]);

  return (
    <div className={`relative flex bg-background text-foreground transition-colors duration-150 ${isWatchPage ? 'h-screen xl:h-dvh overflow-hidden' : 'min-h-screen'}`}>
      {/* Mobile Backdrop Overlay when Drawer is Open */}
      {mobileSidebarOpen && (
        <div
          data-testid="navigation-backdrop"
          aria-hidden="true"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Mobile Glass Header Bar */}
      <header className="safe-area-header fixed inset-x-0 top-0 z-40 flex min-h-14 items-center justify-between border-b border-border bg-background/90 px-3.5 shadow-sm backdrop-blur-xl lg:hidden">
        <button
          ref={menuButtonRef}
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted cursor-pointer"
          aria-label={mobileSidebarOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileSidebarOpen}
          aria-controls="mobile-navigation"
        >
          {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="flex items-center gap-2">
          <Link to="/" onMouseEnter={preloadDashboard} className="flex items-center gap-2">
            <img src="/logo.svg" alt="Foclyra" className="w-6 h-6 flex-shrink-0" />
            <span className="font-bold text-foreground text-xs tracking-normal">Foclyra Studio</span>
          </Link>
          <button
            type="button"
            onClick={openBetaModal}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition"
            title="Foclyra is in Public Beta. Click for details."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Beta</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground hover:bg-muted cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-zinc-700" />}
          </button>

          <button
            onClick={(event) => {
              event.currentTarget.focus();
              commandPaletteReturnFocusRef.current = event.currentTarget;
              openCommandPalette();
            }}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground hover:bg-muted cursor-pointer"
            aria-label="Open command palette"
          >
            <Search size={16} />
          </button>
        </div>
      </header>

      {/* Desktop Floating Vertical Glass Navigation Dock */}
      <aside data-testid="desktop-navigation" aria-label="Primary navigation" className="fixed left-3.5 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center space-y-3 rounded-2xl border border-white/10 bg-card/85 p-2.5 shadow-2xl backdrop-blur-2xl lg:flex">
        {/* Brand Logo Icon */}
        <Link 
          to="/" 
          onMouseEnter={preloadDashboard}
          className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-sm hover:scale-105 transition cursor-pointer group relative"
          title="Foclyra Home Dashboard"
        >
          <img src="/logo.svg" alt="Foclyra" className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition" />
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-popover border border-border text-popover-foreground text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg z-50">
            Foclyra Home
          </span>
        </Link>

        {/* Beta Version Badge */}
        <button
          type="button"
          onClick={openBetaModal}
          className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[8px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 group relative"
          title="Foclyra is in Public Beta. Click for details."
        >
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span>Beta</span>
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-popover border border-border text-popover-foreground text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg z-50">
            Public Beta v1.0 • Stable & Offline Ready
          </span>
        </button>

        {/* Subtle Divider */}
        <div className="w-5 h-[1px] bg-border my-0.5" />

        {/* Navigation Dock Items */}
        {navigationItems.map((item) => {
          const isActive = isNavigationActive(location.pathname, item.path);
          const Icon = item.icon;

          let handleHover;
          if (item.path === '/') handleHover = preloadDashboard;
          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={handleHover}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-10 h-10 rounded-xl transition duration-200 flex items-center justify-center cursor-pointer group ${
                isActive 
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon size={19} className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} />
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-popover border border-border text-popover-foreground text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg z-50">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Subtle Divider */}
        <div className="w-5 h-[1px] bg-border my-0.5" />

        {/* Desktop Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="relative w-10 h-10 rounded-xl transition duration-200 flex items-center justify-center cursor-pointer group text-muted-foreground hover:text-foreground hover:bg-muted"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun size={18} className="text-amber-400 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={18} className="text-zinc-700 group-hover:-rotate-12 transition-transform" />
          )}
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-popover border border-border text-popover-foreground text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg z-50">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </aside>

      {/* Mobile Drawer Navigation (Slide-out) */}
      <aside
        id="mobile-navigation"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Primary navigation"
        aria-hidden={!mobileSidebarOpen}
        inert={!mobileSidebarOpen}
        tabIndex={-1}
        className={`safe-area-drawer fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between border-r border-border bg-card p-4 backdrop-blur-2xl transition-transform duration-300 lg:hidden ${
          mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6 pt-12">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Foclyra" className="w-7 h-7" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground text-base">Foclyra</span>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileSidebar();
                      openBetaModal();
                    }}
                    className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[9px] font-bold uppercase tracking-wider"
                  >
                    Beta
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground block">Stable • Local-First OS</span>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-zinc-700" />}
            </button>
          </div>

          <nav className="space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = isNavigationActive(location.pathname, item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3.5 rounded-xl px-4 py-3 text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-primary/15 text-primary border border-primary/25' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-2 pb-4 text-[11px] text-muted-foreground">
          <span>Theme: </span>
          <span className="font-semibold text-foreground capitalize">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
      </aside>

      {/* Main Content View Container */}
      <main className={`min-w-0 flex-1 flex flex-col ${
        isWatchPage 
          ? 'lg:pl-20 xl:pl-22 p-0 h-full overflow-hidden'
          : 'safe-area-main pt-16 lg:pt-5 lg:pl-20 xl:pl-22 px-3.5 sm:px-6 justify-between'
      }`}>
        <div className={`w-full min-w-0 flex flex-col ${isWatchPage ? 'h-full overflow-hidden' : 'flex-1'}`}>
        {/* Desktop Top Header Bar (Search & Sign In / Profile) */}
        {!isWatchPage && (
          <header className="hidden lg:flex items-center justify-between py-3 mb-2 max-w-5xl w-full mx-auto border-b border-border/40 px-2">
            <div className="flex items-center gap-3">
              <span className="font-bold text-foreground text-sm tracking-tight">Foclyra Studio</span>
              <button
                type="button"
                onClick={openBetaModal}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                title="Public Beta v1.0 • Stable & Offline Ready"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Beta</span>
              </button>
            </div>

            {/* Right Side Navigation: Search + Theme Toggle + User Sign In */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openCommandPalette()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-card/70 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs font-medium transition cursor-pointer shadow-xs backdrop-blur-md"
              >
                <Search size={14} />
                <span>Quick search...</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono border border-border/60">⌘K</kbd>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-2 rounded-xl border border-border/80 bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
              </button>

              {/* User Menu / Sign In */}
              <UserMenu />
            </div>
          </header>
        )}

        
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
              </div>
            }>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div 
                  key={location.pathname} 
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.1, ease: 'easeOut' }}
                  className={`min-w-0 w-full flex flex-col ${isWatchPage ? 'h-full overflow-hidden' : 'flex-1'}`}
                >
                  <Routes location={location}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/courses/:courseId/lessons/:lessonId" element={<Watch />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Minimal Studio Footer */}
        {!location.pathname.includes('/lessons/') && (
          <footer className="mt-6 py-4 border-t border-border/40 text-[11px] text-muted-foreground w-full text-center">
            <button
              type="button"
              onClick={openBetaModal}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition cursor-pointer font-medium"
              title="Click to view Public Beta details"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Foclyra v1.0 <span className="text-emerald-600 dark:text-emerald-400 font-semibold">(Public Beta)</span></span>
            </button>
            <span className="mx-2 text-muted-foreground/40">•</span>
            <span>Stable & Local-First</span>
            <span className="mx-2 text-muted-foreground/40">•</span>
            <span>Built by <span className="font-semibold text-foreground">Sameed Siddiqui</span></span>
            <span className="mx-2 text-muted-foreground/40">•</span>
            <button 
              type="button" 
              onClick={openFeedbackModal} 
              className="hover:text-primary transition underline cursor-pointer"
            >
              Feedback & Support
            </button>
          </footer>
        )}
      </main>

      {/* Global Command Palette (Ctrl + K / Search) */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={closeCommandPalette} 
        returnFocusRef={commandPaletteReturnFocusRef}
      />

      <PomodoroTimer />

      {/* Global Feedback & Bug Report Modal */}
      <FeedbackModal 
        isOpen={feedbackModalOpen} 
        onClose={closeFeedbackModal} 
      />

      {/* Global Beta Status Modal */}
      <BetaModal
        isOpen={betaModalOpen}
        onClose={closeBetaModal}
      />

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Floating Feedback Trigger Button (Mobile & Desktop) */}
      {!location.pathname.includes('/lessons/') && (
        <button
          type="button"
          onClick={openFeedbackModal}
          aria-label="Send Feedback or Report Bug"
          className="fixed bottom-3.5 right-36 sm:right-40 z-40 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/80 bg-card/85 text-muted-foreground hover:text-primary hover:border-primary/50 text-xs font-medium shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Found a bug or have an idea? Click to send feedback!"
        >
          <MessageSquarePlus size={15} className="text-primary" />
          <span>Feedback</span>
        </button>
      )}
    </div>
  );
}

/**
 * Main Application Layout Router.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}
