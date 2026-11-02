import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, Search, X, Sun, Moon, MessageSquarePlus } from 'lucide-react';
import PomodoroTimer from './components/PomodoroTimer';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import FeedbackModal from './components/FeedbackModal';
import BetaModal from './components/BetaModal';
import UserMenu from './components/UserMenu';
import AuthModal from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { useUIStore } from './hooks/useUIStore';
import { useTheme } from './hooks/useTheme';
import { isNavigationActive, navigationItems } from './components/shell/navigation';
import { Toaster } from './components/ui/toast';
import { trackPageView } from './services/analytics';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Watch = lazy(() => import('./pages/Watch'));
const Settings = lazy(() => import('./pages/Settings'));

const preloadDashboard = () => import('./pages/Dashboard');
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function AppContent() {
  const {
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    feedbackModalOpen,
    openFeedbackModal,
    closeFeedbackModal,
    betaModalOpen,
    openBetaModal,
    closeBetaModal
  } = useUIStore();
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
  const isLandingPage = location.pathname === '/' || location.pathname === '/landing' || location.pathname === '/welcome';
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  useEffect(() => {
    closeMobileSidebar();
    trackPageView(location.pathname);
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

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (commandPaletteOpen) closeCommandPalette();
        else {
          commandPaletteReturnFocusRef.current = document.activeElement;
          openCommandPalette();
        }
        return;
      }

      if (e.altKey && !isTyping) {
        const key = e.key.toLowerCase();
        if (key === 'd') {
          e.preventDefault();
          navigate('/studio');
        } else if (key === 's') {
          e.preventDefault();
          navigate('/settings');
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [commandPaletteOpen, openCommandPalette, closeCommandPalette, navigate]);

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-[#111111] dark:text-[#f5f5f7]">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
              <div className="animate-spin size-7 border-2 border-[#111111] dark:border-white border-t-transparent rounded-full" />
            </div>
          }
        >
          <LandingPage />
        </Suspense>
        <AuthModal />
        <BetaModal />
        <Toaster />
      </div>
    );
  }

  return (
    <div
      className={`relative flex bg-white dark:bg-[#0a0a0c] text-[#111111] dark:text-[#f5f5f7] font-sans antialiased selection:bg-[#F5C542]/40 transition-colors duration-150 ${
        isWatchPage ? 'min-h-screen xl:h-dvh xl:overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Mobile Backdrop Overlay when Drawer is Open */}
      {mobileSidebarOpen && (
        <div
          data-testid="navigation-backdrop"
          aria-hidden="true"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Mobile Top Header Bar — Matches Landing Page Navbar (Hidden on Watch page) */}
      {!isWatchPage && (
        <header className="safe-area-header fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[#efefef] dark:border-zinc-800/70 bg-white/85 dark:bg-[#0a0a0c]/85 px-3.5 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-[#f2f2f2] dark:bg-zinc-800/90 text-[#111111] dark:text-zinc-200 transition hover:bg-[#e5e5e5] dark:hover:bg-zinc-700 cursor-pointer shrink-0"
            aria-label={mobileSidebarOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-navigation"
          >
            {mobileSidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <Link to="/studio" onMouseEnter={preloadDashboard} className="flex items-center gap-1.5">
            <img src="/logo.svg" alt="Foclyra" className="size-5 shrink-0" />
            <span className="font-semibold text-[#111111] dark:text-white text-[14.5px] tracking-[-0.02em]">
              Foclyra
            </span>
          </Link>

          <button
            type="button"
            onClick={openBetaModal}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[#111111] dark:text-zinc-200 text-[10px] font-medium cursor-pointer transition"
            title="Foclyra is in Public Beta. Click for details."
          >
            <span className="size-1.5 rounded-full bg-[#63d94e]" />
            <span>Beta</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-[#f2f2f2] dark:bg-zinc-800/90 text-[#111111] dark:text-zinc-200 transition hover:bg-[#e5e5e5] dark:hover:bg-zinc-700 cursor-pointer shrink-0"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="size-3.5 sm:size-4" /> : <Moon className="size-3.5 sm:size-4" />}
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.currentTarget.focus();
              commandPaletteReturnFocusRef.current = event.currentTarget;
              openCommandPalette();
            }}
            className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-[#f2f2f2] dark:bg-zinc-800/90 text-[#111111] dark:text-zinc-200 transition hover:bg-[#e5e5e5] dark:hover:bg-zinc-700 cursor-pointer shrink-0"
            aria-label="Open command palette"
          >
            <Search className="size-3.5 sm:size-4" />
          </button>
        </div>
      </header>
      )}

      {/* Desktop Floating Vertical Navigation Dock — Editorial Pill Aesthetic */}
      <aside
        data-testid="desktop-navigation"
        aria-label="Primary navigation"
        className="fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-[22px] border border-[#e5e5e5] dark:border-zinc-800 bg-[#f4f4f4]/90 dark:bg-zinc-900/90 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl lg:flex"
      >
        <Link
          to="/studio"
          onMouseEnter={preloadDashboard}
          aria-label="Foclyra Studio Home"
          className="size-10 rounded-[14px] flex items-center justify-center transition duration-200 hover:scale-105 cursor-pointer"
        >
          <img src="/logo.svg" alt="Foclyra" className="size-6 shrink-0" />
        </Link>

        <div className="w-5 h-px bg-[#e5e5e5] dark:bg-zinc-800 my-0.5" />

        {navigationItems.map((item) => {
          const isActive = isNavigationActive(location.pathname, item.path);
          const Icon = item.icon;
          const handleHover = item.path === '/studio' ? preloadDashboard : undefined;

          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={handleHover}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              title={item.name}
              className={`size-10 rounded-[14px] transition duration-200 flex items-center justify-center cursor-pointer ${
                isActive
                  ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-xs'
                  : 'text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="size-[18px]" />
            </Link>
          );
        })}
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
        className={`safe-area-drawer fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between border-r border-[#e5e5e5] dark:border-zinc-800 bg-white dark:bg-[#111113] p-4 transition-transform duration-300 lg:hidden ${
          mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6 pt-12">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Foclyra" className="size-6" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#111111] dark:text-white text-[16px] tracking-[-0.02em]">
                    Foclyra
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileSidebar();
                      openBetaModal();
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[#111111] dark:text-zinc-200 text-[10px] font-medium"
                  >
                    <span className="size-1.5 rounded-full bg-[#63d94e]" />
                    <span>Beta</span>
                  </button>
                </div>
                <span className="text-[11px] text-[#6f6f6f] dark:text-zinc-400 block">
                  Distraction-Free Study Studio
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="size-8 rounded-full bg-[#f2f2f2] dark:bg-zinc-800 text-[#111111] dark:text-zinc-200 flex items-center justify-center cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
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
                  className={`flex h-11 items-center gap-3 rounded-full px-4 text-[13.5px] font-medium transition ${
                    isActive
                      ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-xs'
                      : 'text-[#666666] dark:text-zinc-400 hover:bg-[#f4f4f4] dark:hover:bg-zinc-900 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
                      <button
              type="button"
              onClick={() => {
                closeMobileSidebar();
                openFeedbackModal();
              }}
              className="w-full flex h-11 items-center gap-3 rounded-full px-4 text-[13.5px] font-medium transition text-[#666666] dark:text-zinc-400 hover:bg-[#f4f4f4] dark:hover:bg-zinc-900 hover:text-[#111111] dark:hover:text-white cursor-pointer"
            >
              <MessageSquarePlus className="size-4" />
              <span>Feedback & Help</span>
            </button>
          </nav>
        </div>

        <div className="px-3 pb-4 text-[12px] text-[#6f6f6f] dark:text-zinc-400">
          <span>Appearance: </span>
          <span className="font-medium text-[#111111] dark:text-white">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
      </aside>

      {/* Main Content View Container */}
      <main
        className={`min-w-0 flex-1 flex flex-col ${
          isWatchPage
            ? 'p-0 min-h-screen xl:h-full xl:overflow-hidden lg:pl-20'
            : 'safe-area-main pt-14 lg:pt-0 lg:pl-20 xl:pl-22 justify-between'
        }`}
      >
        <div className={`w-full min-w-0 flex flex-col ${isWatchPage ? 'min-h-screen xl:h-full xl:overflow-hidden' : 'flex-1'}`}>
          {/* Desktop Top Header Bar — Matches Landing Page Header */}
          {!isWatchPage && (
            <header className="hidden lg:block w-full border-b border-[#efefef] dark:border-zinc-800/70 bg-white/85 dark:bg-[#0a0a0c]/85 backdrop-blur-xl sticky top-0 z-30">
              <div className="max-w-[1140px] w-full mx-auto h-15 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <Link to="/studio" className="flex items-center gap-2 group">
                    <span className="font-semibold text-[15.5px] tracking-[-0.02em] text-[#111111] dark:text-white">
                      Foclyra Studio
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={openBetaModal}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[#111111] dark:text-zinc-200 text-[11px] font-medium hover:bg-[#eaeaea] dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="Public Beta v1.0 • Stable & Offline Ready"
                  >
                    <span className="size-1.5 rounded-full bg-[#63d94e]" />
                    <span>Beta</span>
                  </button>
                </div>

                {/* Right Side Navigation: Search Pill + Theme Toggle + User Sign In */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openCommandPalette()}
                    className="h-9 flex items-center gap-2.5 px-3.5 rounded-full border border-[#e5e5e5] dark:border-zinc-800 bg-[#f4f4f4] dark:bg-zinc-900 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white text-[12.5px] font-medium transition cursor-pointer"
                  >
                    <Search className="size-3.5 text-[#6f6f6f]" />
                    <span>Quick search...</span>
                    <kbd className="px-1.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-[10px] text-[#666666] dark:text-zinc-300 font-mono border border-[#e5e5e5] dark:border-zinc-700">
                      ⌘K
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    className="size-9 flex items-center justify-center rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 text-[#111111] dark:text-zinc-200 transition cursor-pointer shrink-0"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  </button>

                  <UserMenu />
                </div>
              </div>
            </header>
          )}

          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                  <div className="animate-spin size-7 border-2 border-[#111111] dark:border-white border-t-transparent rounded-full" />
                </div>
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.1, ease: 'easeOut' }}
                  className={`min-w-0 w-full flex flex-col ${
                    isWatchPage ? 'h-full overflow-hidden' : 'flex-1 px-3.5 sm:px-6'
                  }`}
                >
                  <Routes location={location}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/landing" element={<LandingPage />} />
                    <Route path="/welcome" element={<LandingPage />} />
                    <Route path="/studio" element={<Dashboard />} />
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

        {/* Minimal Studio Footer — Centered Shaded Foclyra Watermark Only */}
        {!location.pathname.includes('/lessons/') && (
          <footer className="mt-10 mb-6 py-4 w-full flex items-center justify-center px-3.5 select-none overflow-hidden">
            <div aria-hidden="true" className="flex items-center justify-center pointer-events-none select-none">
              <span className="block text-[clamp(36px,7vw,58px)] leading-[0.85] font-semibold tracking-[-0.055em] bg-[linear-gradient(180deg,#e4e4e9_0%,#f2f2f5_62%,rgba(255,255,255,0.05)_100%)] dark:bg-[linear-gradient(180deg,#242429_0%,#16161a_62%,rgba(10,10,12,0.05)_100%)] bg-clip-text text-transparent">
                foclyra
              </span>
            </div>
          </footer>
        )}
      </main>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={closeCommandPalette}
        returnFocusRef={commandPaletteReturnFocusRef}
      />

      <PomodoroTimer />

      <FeedbackModal isOpen={feedbackModalOpen} onClose={closeFeedbackModal} />

      <BetaModal isOpen={betaModalOpen} onClose={closeBetaModal} />

      <AuthModal />

      {/* Floating Feedback Trigger Pill (Left bottom, mirroring Pomodoro on Right) */}
      {!location.pathname.includes('/lessons/') && (
        <aside aria-label="Feedback and suggestions" className="fixed bottom-3 left-3 sm:left-4 z-40 will-change-transform hidden lg:block">
          <button
            type="button"
            onClick={openFeedbackModal}
            aria-label="Send Feedback or Report Bug"
            className="inline-flex h-8 sm:h-9 items-center gap-2 px-3 sm:px-3.5 rounded-full font-medium text-[11.5px] sm:text-[12.5px] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] border border-[#e5e5e5] dark:border-zinc-800 bg-[#f4f4f4]/95 dark:bg-zinc-900/95 text-[#111111] dark:text-white hover:bg-[#eaeaea] dark:hover:bg-zinc-800 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            title="Found a bug or have a suggestion? Click to send instant feedback!"
          >
            <MessageSquarePlus className="size-3.5 text-[#111111] dark:text-white" />
            <span>Feedback</span>
          </button>
        </aside>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toaster>
          <AppContent />
        </Toaster>
      </Router>
    </ErrorBoundary>
  );
}
