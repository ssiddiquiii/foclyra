import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, LayoutDashboard, Search } from 'lucide-react';
import { useUIStore } from '../hooks/useUIStore';

/**
 * Editorial 404 Not Found Component.
 * Fits seamlessly inside Foclyra's studio layout or standalone view.
 */
export default function NotFound() {
  const navigate = useNavigate();
  const { openCommandPalette } = useUIStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 relative min-h-[65vh]">
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 sm:size-96 bg-zinc-200/40 dark:bg-zinc-800/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-200 text-xs font-mono font-medium shadow-2xs">
          <Compass size={13} className="text-zinc-500 animate-spin" style={{ animationDuration: '10s' }} />
          <span>404 · Page Not Found</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Lost in Focus?
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            The page or study playlist you are looking for doesn't exist, has been removed, or was moved to another URL.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to="/studio"
            className="w-full sm:w-auto h-10 px-5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <LayoutDashboard size={14} />
            <span>Go to Studio</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto h-10 px-4.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Go Back</span>
          </button>
        </div>

        {/* Quick Search Shortcut */}
        <div className="pt-4">
          <button
            type="button"
            onClick={openCommandPalette}
            className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition cursor-pointer"
          >
            <Search size={11} />
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">Ctrl+K</kbd> to search courses</span>
          </button>
        </div>
      </div>
    </div>
  );
}
