import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCourseDetail } from '../hooks/useCourseDetail';
import {
  ArrowLeft,
  Play,
  Clock,
  RotateCcw,
  RefreshCw,
  Search,
  BookOpen,
  Check,
  Share2
} from 'lucide-react';
import { fetchYouTubePlaylistData } from '../services/youtubeApi';
import { importCourse, getNotesExportBundle } from '../services/dataCommands';
import ExportNotesButton from '../components/ExportNotesButton';
import ShareNotesModal from '../components/ShareNotesModal';
import { toast } from '../components/ui/toast';
import { trackEvent } from '../services/analytics';

/**
 * Editorial Bento Course Detail & Syllabus View.
 * Matches Landing Page and Studio Dashboard minimalist editorial aesthetic.
 * @returns {React.JSX.Element}
 */
export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const {
    isLoading,
    courseNotFound,
    course,
    courseLessons,
    progressByLessonId,
    courseProgress,
    lastWatched,
    resumeLesson
  } = useCourseDetail(courseId);

  const [expandedDesc, setExpandedDesc] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [thumbError, setThumbError] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [courseNotesToShare, setCourseNotesToShare] = useState([]);

  const handleOpenShareNotes = async () => {
    try {
      const { notes } = await getNotesExportBundle(course.id);
      if (!notes || notes.length === 0) {
        toast.add({
          title: 'No notes yet',
          description: "You haven't recorded any notes in this course yet.",
          type: 'info',
          timeout: 3000
        });
        return;
      }
      setCourseNotesToShare(notes);
      setShareModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Compute optimized thumbnail: Prefer 16:9 maxresdefault for crisp YouTube banners
  const optimizedThumb = useMemo(() => {
    if (!course?.thumbnailUrl) return '';
    if (thumbError) return course.thumbnailUrl;
    if (course.thumbnailUrl.includes('ytimg.com') && course.thumbnailUrl.includes('hqdefault.jpg')) {
      return course.thumbnailUrl.replace('hqdefault.jpg', 'maxresdefault.jpg');
    }
    return course.thumbnailUrl;
  }, [course?.thumbnailUrl, thumbError]);

  // Compute stats
  const completedCount = useMemo(() => {
    return courseLessons.filter(l => progressByLessonId.get(l.id)?.completed).length;
  }, [courseLessons, progressByLessonId]);

  const totalDurationFormatted = useMemo(() => {
    const totalSecs = courseLessons.reduce((acc, l) => acc + (l.durationSeconds || 0), 0);
    if (!totalSecs || totalSecs <= 0) return null;
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, [courseLessons]);

  // Filter lessons by search query
  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return courseLessons;
    const q = searchQuery.toLowerCase();
    return courseLessons.filter(l => 
      l.title.toLowerCase().includes(q) || 
      String(l.index).includes(q)
    );
  }, [courseLessons, searchQuery]);

  const handleSyncPlaylist = async () => {
    if (course?.type !== 'youtube' || isSyncing) return;
    setIsSyncing(true);
    const syncToastId = toast.add({
      title: 'Syncing lectures...',
      description: 'Fetching all lectures from YouTube...',
      type: 'loading',
    });
    try {
      const { course: updatedCourse, lessons: updatedLessons } = await fetchYouTubePlaylistData(course.id);
      await importCourse(updatedCourse, updatedLessons);
      toast.update(syncToastId, {
        title: 'Lectures synced',
        description: `Synced ${updatedLessons.length} lectures successfully!`,
        type: 'success',
        timeout: 4000,
      });
    } catch (err) {
      console.error(err);
      toast.update(syncToastId, {
        title: 'Sync failed',
        description: `Sync failed: ${err.message}`,
        type: 'error',
        timeout: 4000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-950 dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (courseNotFound) {
    return (
      <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-12 rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-red-500">Course Not Found</h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          The requested course could not be located in your local library.
        </p>
        <Link 
          to="/studio" 
          className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Return to Studio</span>
        </Link>
      </div>
    );
  }

  const resumeTargetLesson = resumeLesson || courseLessons[0];

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 pb-24 sm:pb-16 max-w-5xl mx-auto space-y-6 animate-page-entry min-w-0 w-full">
      {/* Top Navigation Breadcrumbs & Sync Action */}
      <div className="flex items-center justify-between gap-3">
        <Link 
          to="/studio" 
          className="inline-flex items-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 transition-colors shadow-xs group shrink-0 whitespace-nowrap"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
          <span><span className="hidden xs:inline">Back to </span>Studio</span>
        </Link>

        {course.type === 'youtube' && (
          <button
            onClick={handleSyncPlaylist}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50 shadow-xs shrink-0 whitespace-nowrap"
            title="Sync complete lecture catalog from YouTube"
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin text-emerald-500" : "text-zinc-400 dark:text-zinc-500"} />
            <span>{isSyncing ? "Syncing..." : "Sync Lectures"}</span>
          </button>
        )}
      </div>

      {/* Course Hero Bento Banner */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-7 shadow-xs relative overflow-hidden backdrop-blur-xs">
        <div className="relative flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
          {/* 16:9 Thumbnail preview with play hover */}
          <div 
            onClick={() => resumeTargetLesson && navigate(`/courses/${courseId}/lessons/${resumeTargetLesson.id}`)}
            className="relative w-full md:w-72 lg:w-80 aspect-video rounded-[20px] overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-950 flex-shrink-0 group cursor-pointer shadow-xs"
          >
            <img 
              src={optimizedThumb} 
              alt={course.title} 
              onError={() => setThumbError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Play size={18} fill="currentColor" className="ml-0.5" />
              </div>
            </div>
            {/* Overlay badge with lecture count */}
            <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[11px] font-mono text-zinc-200 font-medium flex items-center gap-1.5 border border-white/10 shadow-xs">
              <BookOpen size={11} />
              <span>{courseLessons.length} lectures</span>
            </div>
          </div>

          {/* Course Details Info */}
          <div className="flex-1 min-w-0 space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/70 dark:border-zinc-700/70">
                {course.type === 'youtube' ? 'YouTube Course' : 'Manual Course'}
              </span>
              {totalDurationFormatted && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono bg-white/80 dark:bg-zinc-900/80 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
                  <Clock size={11} />
                  <span>{totalDurationFormatted}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#111111] dark:text-white tracking-[-0.03em] leading-snug">
              {course.title}
            </h1>

            {course.description && (
              <div className="space-y-1 max-w-2xl">
                <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  {expandedDesc 
                    ? course.description 
                    : `${course.description.slice(0, 160)}${course.description.length > 160 ? '...' : ''}`}
                </p>
                {course.description.length > 160 && (
                  <button
                    onClick={() => setExpandedDesc(!expandedDesc)}
                    className="text-zinc-950 dark:text-zinc-100 font-semibold underline underline-offset-2 text-xs focus:outline-none cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {expandedDesc ? "Show Less" : "Read More"}
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium pt-1">
              <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300/60 dark:border-zinc-700/60 flex items-center justify-center font-bold text-[10px] text-zinc-900 dark:text-zinc-100 uppercase">
                {course.channelName?.charAt(0) || 'I'}
              </span>
              <span>Instructor: <span className="text-zinc-950 dark:text-zinc-100 font-semibold">{course.channelName || 'Instructor'}</span></span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center gap-3">
              {resumeTargetLesson && (
                <button
                  onClick={() => {
                    trackEvent('course_session_resumed', {
                      courseId,
                      courseTitle: course.title,
                      isResume: Boolean(lastWatched),
                      progressPercent: courseProgress
                    });
                    navigate(`/courses/${courseId}/lessons/${resumeTargetLesson.id}`);
                  }}
                  className="w-full sm:w-auto h-10 px-5 rounded-full font-medium bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-all text-white text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {lastWatched ? <RotateCcw size={14} /> : <Play size={14} fill="currentColor" />}
                  <span>{lastWatched ? 'Resume Last Video' : courseProgress > 0 ? 'Resume Course' : 'Start Course'}</span>
                </button>
              )}
              <ExportNotesButton
                courseId={course.id}
                courseTitle={course.title}
                label="Download Notes"
                title={`Download ${course.title} Notes (.docx)`}
                className="w-full sm:w-auto"
              />
              <button
                type="button"
                onClick={handleOpenShareNotes}
                className="w-full sm:w-auto h-8 sm:h-9 md:h-10 px-3.5 sm:px-4 md:px-5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[12px] sm:text-[13px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]"
                title="Share study notes with friends"
              >
                <Share2 className="size-3.5 shrink-0 text-amber-500" />
                <span>Share Notes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Stats Bento Bar — Compact on mobile */}
      <div className="rounded-[22px] sm:rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-5 backdrop-blur-xs">
        {/* Header row on mobile: Progress left, Total lessons right */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="sm:w-44 flex-shrink-0">
            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">
              Course Progress
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-3xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">{courseProgress}%</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs font-medium">completed</span>
            </div>
          </div>

          <div className="sm:hidden text-right flex-shrink-0">
            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">
              Total Lessons
            </span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">{courseLessons.length}</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Lectures</span>
            </div>
          </div>
        </div>

        {/* Minimalist Progress Track */}
        <div className="flex-1 w-full space-y-1 sm:space-y-1.5">
          <div className="flex justify-between items-center text-[10.5px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">Curriculum Track</span>
            <span className="font-medium font-mono text-zinc-700 dark:text-zinc-300">{completedCount} of {courseLessons.length} finished</span>
          </div>
          <div className="w-full bg-zinc-200/80 dark:bg-zinc-800/80 h-1.5 sm:h-2 rounded-full overflow-hidden border border-zinc-300/40 dark:border-zinc-700/40">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${courseProgress}%` }}
            />
          </div>
        </div>

        {/* Desktop Total Lessons */}
        <div className="hidden sm:block text-right flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 pl-5">
          <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
            Total Lessons
          </span>
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">{courseLessons.length}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Lectures</span>
          </div>
        </div>
      </div>

      {/* Syllabus Curriculum Section */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight whitespace-nowrap">Syllabus Curriculum</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-[10.5px] sm:text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono border border-zinc-300/60 dark:border-zinc-700/60 shrink-0 whitespace-nowrap">
              {filteredLessons.length} {filteredLessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>

          {/* Quick search input */}
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures..."
              className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition shadow-2xs"
            />
          </div>
        </div>

        {courseLessons.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            This course does not contain any lessons yet.
          </div>
        )}

        {courseLessons.length > 0 && filteredLessons.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
            No lessons matched "{searchQuery}".
          </div>
        )}

        {/* Clean Modern Lecture Rows */}
        <div className="space-y-2">
          {filteredLessons.map((lesson) => {
            const progress = progressByLessonId.get(lesson.id);
            const isCompleted = progress ? progress.completed : false;
            const isLastWatched = lastWatched && lesson.id === lastWatched.lessonId;
            const watchTimePercent = isLastWatched && lesson.durationSeconds > 0
              ? Math.round((lastWatched.watchTime / lesson.durationSeconds) * 100)
              : null;

            return (
              <Link 
                key={lesson.id}
                to={`/courses/${courseId}/lessons/${lesson.id}`}
                className={`group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 ${
                  isLastWatched 
                    ? 'border-zinc-950/25 dark:border-white/25 bg-zinc-50/90 dark:bg-zinc-900/90 shadow-2xs ring-1 ring-zinc-950/10 dark:ring-white/10' 
                    : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 hover:bg-zinc-50/90 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Left: Index badge + Completion Icon + Title */}
                <div className="flex min-w-0 items-center gap-3 sm:gap-4 flex-1">
                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-7 h-7 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
                        <Check size={13} strokeWidth={2.5} />
                      </div>
                    ) : isLastWatched ? (
                      <div className="w-7 h-7 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
                        <Play size={11} fill="currentColor" className="ml-0.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/70 flex items-center justify-center text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-zinc-100 transition-colors">
                        {lesson.index < 10 ? `0${lesson.index}` : lesson.index}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="block truncate text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {lesson.title}
                      </span>
                    </div>

                    {/* In-progress mini watch time indicator */}
                    {isLastWatched && watchTimePercent !== null && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="w-24 sm:w-32 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-300/40 dark:border-zinc-700/40">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${watchTimePercent}%` }} />
                        </div>
                        <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono font-medium">{watchTimePercent}% watched</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Badges & Duration */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
                  {isLastWatched && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-200/80 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700/70 uppercase tracking-wider">
                      In Progress
                    </span>
                  )}

                  {lesson.duration && lesson.duration !== '0:00' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono bg-zinc-100/80 dark:bg-zinc-800/70 px-2.5 py-1 rounded-full border border-zinc-200/70 dark:border-zinc-700/70 group-hover:bg-zinc-200/60 dark:group-hover:bg-zinc-700/60 transition-colors">
                      <Clock size={11} />
                      <span>{lesson.duration}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/70 dark:border-zinc-700/70">
                      Lecture
                    </span>
                  )}

                  <div className="w-7 h-7 rounded-full bg-transparent group-hover:bg-zinc-200/80 dark:group-hover:bg-zinc-800 group-hover:text-zinc-950 dark:group-hover:text-zinc-100 text-zinc-400 hidden sm:flex items-center justify-center transition-all">
                    <Play size={11} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Share Notes Modal */}
      <ShareNotesModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        courseTitle={course?.title}
        notes={courseNotesToShare}
      />
    </div>
  );
}
