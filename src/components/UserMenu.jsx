import React, { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, Cloud, ChevronDown, Layers } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../hooks/useUIStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/FocusFlowDB';
import { REGISTERED_MAX_PLAYLISTS, GUEST_MAX_PLAYLISTS, getGuestImportHistory } from '../services/quotaService';

export default function UserMenu({ onOpenAuth }) {
  const { openAuthModal } = useUIStore();
  const handleOpenAuth = () => {
    if (onOpenAuth) onOpenAuth();
    else openAuthModal('default');
  };
  const { user, profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Live query for active courses in IndexedDB
  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const activeCount = courses.length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    const guestHistory = getGuestImportHistory();
    const isGuestExhausted = guestHistory.length >= GUEST_MAX_PLAYLISTS;

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpenAuth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold shadow-sm transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          title="Sign in with Google to sync notes and get 5 courses"
        >
          <LogIn size={14} />
          <span className="hidden sm:inline">Sign In</span>
          {isGuestExhausted && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold">
              Trial Used
            </span>
          )}
        </button>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Learner';
  const avatarUrl = profile?.avatar_url || '';
  const maxLimit = REGISTERED_MAX_PLAYLISTS;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer"
        aria-expanded={dropdownOpen}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-6 h-6 rounded-full object-cover border border-primary/30" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden md:inline max-w-[110px] truncate">{displayName}</span>
        <ChevronDown size={13} className="text-muted-foreground hidden sm:inline" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl z-50 text-foreground animate-in fade-in zoom-in-95 duration-150">
          {/* User Info Header */}
          <div className="px-2 py-2 border-b border-border/70 mb-2">
            <p className="font-semibold text-xs text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
              <Cloud size={12} />
              <span>Cloud Sync Active</span>
            </div>
          </div>

          {/* Quota Progress Bar */}
          <div className="px-2 py-2 bg-muted/40 rounded-xl border border-border/60 mb-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Layers size={12} className="text-primary" />
                Study Courses
              </span>
              <span className="font-bold text-foreground">{activeCount} / {maxLimit}</span>
            </div>
            <div className="w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (activeCount / maxLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => {
              setDropdownOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-red-500 hover:bg-red-500/10 font-medium transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
