import { useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/FoclyraDB';
import { useAuth } from './useAuth';
import { getGuestImportHistory, normalizePlaylistId } from '../services/quotaService';
import {
  selectContinueLearningPath,
  selectCourseProgressMap,
  selectDashboardStats,
  selectSortedCourses
} from '../utils/selectors';

const EMPTY_LIST = Object.freeze([]);

export function useDashboardData() {
  const { user } = useAuth();
  const coursesResult = useLiveQuery(() => db.courses.toArray());
  const lessonsResult = useLiveQuery(() => db.lessons.toArray());
  const progressResult = useLiveQuery(() => db.progress.toArray());
  const practiceProgressResult = useLiveQuery(() => db.practiceProgress.toArray());
  const totalNotesResult = useLiveQuery(() => db.notes.count());

  // 🛡️ Data Isolation Guard: In guest mode (!user), registered user courses must NEVER appear.
  // Guests can only see their explicit guest trial course.
  const guestHistory = useMemo(() => (!user ? getGuestImportHistory().map(normalizePlaylistId) : []), [user]);

  // Clean up any lingering registered user courses if unauthenticated and no guest trial exists
  useEffect(() => {
    if (!user && guestHistory.length === 0 && coursesResult && coursesResult.length > 0) {
      db.resetDatabase().catch(() => {});
    }
  }, [user, guestHistory, coursesResult]);

  const courses = useMemo(() => {
    if (!coursesResult) return EMPTY_LIST;
    if (user) return coursesResult; // Authenticated user sees their own courses
    if (guestHistory.length === 0) return EMPTY_LIST; // Logged-out / guest user with no trial sees 0 courses
    // Guest sees only their specific guest trial course
    return coursesResult.filter(c => guestHistory.includes(normalizePlaylistId(c.id)));
  }, [coursesResult, user, guestHistory]);

  const activeCourseIds = useMemo(() => new Set(courses.map(c => c.id)), [courses]);

  const lessons = useMemo(() => {
    if (!lessonsResult) return EMPTY_LIST;
    if (user) return lessonsResult;
    return lessonsResult.filter(l => activeCourseIds.has(l.courseId));
  }, [lessonsResult, user, activeCourseIds]);

  const progressList = useMemo(() => {
    if (!progressResult) return EMPTY_LIST;
    if (user) return progressResult;
    return progressResult.filter(p => activeCourseIds.has(p.courseId));
  }, [progressResult, user, activeCourseIds]);

  const practiceProgressList = useMemo(() => {
    if (!practiceProgressResult) return EMPTY_LIST;
    if (user) return practiceProgressResult;
    return practiceProgressResult.filter(p => activeCourseIds.has(p.courseId));
  }, [practiceProgressResult, user, activeCourseIds]);

  const totalNotes = user ? (totalNotesResult ?? 0) : 0;
  const isLoading = [
    coursesResult,
    lessonsResult,
    progressResult,
    practiceProgressResult,
    totalNotesResult
  ].some(result => result === undefined);

  const courseProgressMap = useMemo(
    () => selectCourseProgressMap(courses, lessons, progressList),
    [courses, lessons, progressList]
  );
  const continuePath = useMemo(
    () => selectContinueLearningPath(courses, lessons, progressList),
    [courses, lessons, progressList]
  );
  const sortedCourses = useMemo(
    () => selectSortedCourses(courses, progressList),
    [courses, progressList]
  );
  const stats = useMemo(
    () => selectDashboardStats(progressList, totalNotes),
    [progressList, totalNotes]
  );

  return {
    isLoading,
    progressList,
    practiceProgressList,
    courseProgressMap,
    continuePath,
    sortedCourses,
    stats
  };
}
