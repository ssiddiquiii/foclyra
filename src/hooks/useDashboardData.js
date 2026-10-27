import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/FoclyraDB';
import {
  selectContinueLearningPath,
  selectCourseProgressMap,
  selectDashboardStats,
  selectSortedCourses
} from '../utils/selectors';

const EMPTY_LIST = Object.freeze([]);

export function useDashboardData() {
  const coursesResult = useLiveQuery(() => db.courses.toArray());
  const lessonsResult = useLiveQuery(() => db.lessons.toArray());
  const progressResult = useLiveQuery(() => db.progress.toArray());
  const practiceProgressResult = useLiveQuery(() => db.practiceProgress.toArray());
  const totalNotesResult = useLiveQuery(() => db.notes.count());
  const courses = coursesResult ?? EMPTY_LIST;
  const lessons = lessonsResult ?? EMPTY_LIST;
  const progressList = progressResult ?? EMPTY_LIST;
  const practiceProgressList = practiceProgressResult ?? EMPTY_LIST;
  const totalNotes = totalNotesResult ?? 0;
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
