import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Cloud, ChevronDown, Layers, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useClerk } from '@clerk/clerk-react';
import { useUIStore } from '../hooks/useUIStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/FoclyraDB';
import { REGISTERED_MAX_PLAYLISTS, GUEST_MAX_PLAYLISTS, getGuestImportHistory, isReturningRegisteredUser } from '../services/quotaService';
import { ENABLE_AI_FEATURES } from '../config/features';

export default function UserMenu({ onOpenAuth }) {
  const navigate = useNavigate();
  const { openAuthModal } = useUIStore();
  const handleOpenAuth = () => {
    if (onOpenAuth) onOpenAuth();
    else openAuthModal('default');
  };
  const { user, profile, signOut } = useAuth();
  const clerk = useClerk();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    const isReturning = isReturningRegisteredUser();
    const guestHistory = getGuestImportHistory();
    const isGuestExhausted = !isReturning && guestHistory.length >= GUEST_MAX_PLAYLISTS;

    return (
      <div className="flex items-center gap-2">
        {isReturning ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[#111111] dark:text-zinc-200 text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-[#63d94e]" />
            <span>Welcome Back</span>
          </span>
        ) : isGuestExhausted ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[#111111] dark:text-zinc-200 text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-[#F5C542]" />
            <span>Trial Used</span>
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleOpenAuth}
          className="h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[12px] sm:text-[13px] font-medium hover:opacity-90 transition cursor-pointer whitespace-nowrap shadow-2xs"
          title="Sign in with Google or Email to unlock 5 courses & cloud backup"
        >
          <span>Sign In</span>
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
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="h-8 sm:h-9 flex items-center gap-2 px-2.5 sm:px-3 rounded-full border border-[#e5e5e5] dark:border-zinc-800 bg-[#f4f4f4] dark:bg-zinc-900 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 text-[#111111] dark:text-white text-[12px] sm:text-[12.5px] font-medium transition cursor-pointer"
        aria-expanded={dropdownOpen}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="size-5 sm:size-6 rounded-full object-cover border border-[#e5e5e5] dark:border-zinc-700" />
        ) : (
          <div className="size-5 sm:size-6 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center font-semibold text-[11px]">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden md:inline max-w-[110px] truncate">{displayName}</span>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-200 text-[10px] font-mono font-medium border border-[#e5e5e5] dark:border-zinc-700">
          {activeCount}/{maxLimit}
        </span>
        <ChevronDown className="size-3.5 text-[#666666] dark:text-zinc-400 hidden sm:inline" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-[20px] border border-[#e5e5e5] dark:border-zinc-800 bg-white dark:bg-[#141417] p-3 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16)] z-50 text-[#111111] dark:text-white animate-in fade-in zoom-in-95 duration-150">
          {/* User Info Header */}
          <div className="px-2.5 py-2 border-b border-[#efefef] dark:border-zinc-800 mb-2">
            <p className="font-semibold text-[13px] text-[#111111] dark:text-white truncate">{displayName}</p>
            <p className="text-[11px] text-[#6f6f6f] dark:text-zinc-400 truncate">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#16a34a] dark:text-[#63d94e] font-medium">
              <Cloud className="size-3" />
              <span>Cloud Sync Active</span>
            </div>
          </div>

          {/* Quota Progress Bar */}
          <div className="p-3 bg-[#f4f4f4] dark:bg-zinc-900 rounded-[14px] mb-2">
            <div className="flex items-center justify-between text-[11.5px] mb-1.5">
              <span className="text-[#666666] dark:text-zinc-400 font-medium inline-flex items-center gap-1.5">
                <Layers className="size-3.5 text-[#111111] dark:text-white" />
                <span>Study Courses</span>
              </span>
              <span className="font-mono font-semibold text-[#111111] dark:text-white">{activeCount} / {maxLimit}</span>
            </div>
            <div className="w-full bg-white dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#16a34a] dark:bg-[#34d399] h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (activeCount / maxLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Manage Account & Active Devices */}
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              if (clerk?.openUserProfile) {
                clerk.openUserProfile();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-full text-[12px] text-[#111111] dark:text-zinc-200 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 font-medium transition cursor-pointer mb-1"
          >
            <ShieldCheck className="size-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Account & Security</span>
          </button>

          {/* API Keys */}
          {ENABLE_AI_FEATURES && (
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                navigate('/api-keys');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-full text-[12px] text-[#111111] dark:text-zinc-200 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 font-medium transition cursor-pointer mb-1"
            >
              <Key className="size-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>API Keys</span>
            </button>
          )}

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={async () => {
              setDropdownOpen(false);
              await signOut();
              navigate('/', { replace: true });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-full text-[12px] text-[#e11d48] dark:text-rose-400 hover:bg-rose-500/10 font-medium transition cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
