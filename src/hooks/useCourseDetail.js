import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/FoclyraDB';
import { selectCourseDetailModel } from '../utils/selectors';

const EMPTY_LIST = Object.freeze([]);

export function useCourseDetail(courseId) {
  const isValidId = typeof courseId === 'string' && courseId.length > 0;

  const courseResult = useLiveQuery(
    async () => {
      if (!isValidId) return null;
      return (await db.courses.get(courseId)) ?? null;
    },
    [courseId, isValidId]
  );
  const courseLessons = useLiveQuery(
    () => isValidId
      ? db.lessons.where('courseId').equals(courseId).sortBy('index')
      : Promise.resolve([]),
    [courseId, isValidId]
  ) ?? EMPTY_LIST;
  const courseProgressList = useLiveQuery(
    () => isValidId
      ? db.progress.where('courseId').equals(courseId).toArray()
      : Promise.resolve([]),
    [courseId, isValidId]
  ) ?? EMPTY_LIST;

  const model = useMemo(
    () => selectCourseDetailModel(courseId, courseLessons, courseProgressList),
    [courseId, courseLessons, courseProgressList]
  );
  const isLoading = isValidId && courseResult === undefined;
  const course = courseResult ?? null;

  return {
    isLoading,
    courseNotFound: !isLoading && course === null,
    course,
    courseLessons,
    courseProgressList,
    ...model
  };
}
