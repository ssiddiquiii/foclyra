import React, { useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth, AUTH_STATUS } from '../../hooks/useAuth.js';
import { useUIStore } from '../../hooks/useUIStore.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/FoclyraDB.js';

/**
 * High-performance, zero-layout-shift splash screen.
 * Displayed exclusively while authentication state is resolving (INITIALIZING).
 * Prevents FOUC (flash of unauthenticated content) or false landing page renders.
 */
export function FoclyraSplash() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white dark:bg-[#0a0a0c] text-[#111111] dark:text-[#f5f5f7] select-none">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <img 
            src="/logo.svg" 
            alt="Foclyra" 
            className="size-10 sm:size-12 animate-pulse" 
          />
        </div>
        <div className="h-1 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full w-full bg-zinc-900 dark:bg-white rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Public Only Route Guard.
 * - Authenticated users are immediately redirected to `/studio`.
 * - Resolving sessions render FoclyraSplash to prevent Landing Page flashes.
 * - Guest & unauthenticated users render the public landing / welcome experience.
 */
export function PublicOnlyRoute({ element }) {
  const { status, isLoading } = useAuth();

  if (isLoading || status === AUTH_STATUS.INITIALIZING) {
    return <FoclyraSplash />;
  }

  if (status === AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to="/studio" replace />;
  }

  return element;
}

/**
 * Protected Route Guard (e.g. /settings).
 * - Requires explicit AUTHENTICATED status.
 * - Resolving sessions render FoclyraSplash.
 * - Unauthenticated / guest users are redirected to `/` with intended path saved in sessionStorage.
 */
export function ProtectedRoute({ element }) {
  const { status, isLoading } = useAuth();
  const location = useLocation();
  const { openAuthModal } = useUIStore();

  useEffect(() => {
    if (!isLoading && status !== AUTH_STATUS.INITIALIZING && status !== AUTH_STATUS.AUTHENTICATED) {
      sessionStorage.setItem('foclyra_intended_path', location.pathname + location.search);
      openAuthModal('signin_required');
    }
  }, [status, isLoading, location, openAuthModal]);

  if (isLoading || status === AUTH_STATUS.INITIALIZING) {
    return <FoclyraSplash />;
  }

  if (status !== AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to="/" replace />;
  }

  return element;
}

/**
 * Learning Route Guard (/courses/:courseId and /courses/:courseId/lessons/:lessonId).
 * - Resolving sessions render FoclyraSplash.
 * - Authenticated users can access their courses.
 * - Guest users can access ONLY the specific course stored in their guest local database.
 * - Unauthenticated users with no courses are redirected to `/` with auth prompt.
 */
export function LearningRoute({ element }) {
  const { courseId } = useParams();
  const { status, isLoading } = useAuth();
  const location = useLocation();
  const { openAuthModal } = useUIStore();

  // Check if course exists in local Dexie database
  const localCourse = useLiveQuery(
    () => (courseId ? db.courses.get(courseId) : Promise.resolve(null)),
    [courseId]
  );

  useEffect(() => {
    if (!isLoading && status === AUTH_STATUS.UNAUTHENTICATED) {
      sessionStorage.setItem('foclyra_intended_path', location.pathname + location.search);
      openAuthModal('signin_required');
    }
  }, [status, isLoading, location, openAuthModal]);

  if (isLoading || status === AUTH_STATUS.INITIALIZING) {
    return <FoclyraSplash />;
  }

  if (status === AUTH_STATUS.AUTHENTICATED) {
    return element;
  }

  if (status === AUTH_STATUS.GUEST) {
    // If local query is still running, hold splash
    if (localCourse === undefined) {
      return <FoclyraSplash />;
    }
    // If course belongs to this guest, allow study
    if (localCourse) {
      return element;
    }
    // Guest tried to access a private course not in their trial!
    return <Navigate to="/studio" replace />;
  }

  // Unauthenticated user
  return <Navigate to="/" replace />;
}

/**
 * Studio Route Guard (/studio).
 * - Accessible to all (Authenticated users, Guests with active course, and Visitors starting trial).
 * - Holds splash during initial auth check to eliminate Dashboard/Landing race conditions.
 */
export function StudioRoute({ element }) {
  const { status, isLoading } = useAuth();

  if (isLoading || status === AUTH_STATUS.INITIALIZING) {
    return <FoclyraSplash />;
  }

  return element;
}
