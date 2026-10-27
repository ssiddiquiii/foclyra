import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/FoclyraDB';

const EMPTY_LIST = Object.freeze([]);

export function useWatchData(courseId, lessonId) {
  const hasCourseId = typeof courseId === 'string' && courseId.length > 0;
  const hasLessonId = typeof lessonId === 'string' && lessonId.length > 0;

  const courseResult = useLiveQuery(
    async () => hasCourseId ? (await db.courses.get(courseId)) ?? null : null,
    [courseId, hasCourseId]
  );
  const lessonResult = useLiveQuery(
    async () => {
      if (!hasCourseId || !hasLessonId) return null;
      const lesson = await db.lessons.get(lessonId);
      return lesson?.courseId === courseId ? lesson : null;
    },
    [courseId, lessonId, hasCourseId, hasLessonId]
  );
  const courseLessons = useLiveQuery(
    () => hasCourseId
      ? db.lessons.where('courseId').equals(courseId).sortBy('index')
      : Promise.resolve([]),
    [courseId, hasCourseId]
  ) ?? EMPTY_LIST;
  const progressList = useLiveQuery(
    () => hasCourseId
      ? db.progress.where('courseId').equals(courseId).toArray()
      : Promise.resolve([]),
    [courseId, hasCourseId]
  ) ?? EMPTY_LIST;
  const lessonNotes = useLiveQuery(
    () => hasCourseId && hasLessonId
      ? db.notes.where('[courseId+lessonId]').equals([courseId, lessonId]).sortBy('timestamp')
      : Promise.resolve([]),
    [courseId, lessonId, hasCourseId, hasLessonId]
  ) ?? EMPTY_LIST;

  const isLoading =
    hasCourseId && hasLessonId &&
    (courseResult === undefined || lessonResult === undefined);

  return {
    isLoading,
    notFound: !isLoading && (!courseResult || !lessonResult),
    course: courseResult ?? null,
    lesson: lessonResult ?? null,
    courseLessons,
    progressList,
    lessonNotes
  };
}
