import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUIStore } from '../hooks/useUIStore';
import { 
  Play, 
  Clock, 
  Trash2, 
  Flame, 
  RefreshCw, 
  Loader2, 
  ArrowRight,
  Link2
} from 'lucide-react';
import StreakModal from '../components/StreakModal';
import ExportNotesButton from '../components/ExportNotesButton';
import { calculateStreak, getActiveDateSet } from '../utils/streakUtils';
import { fetchYouTubePlaylistData, validateYouTubeUrlOrId } from '../services/youtubeApi';
import { deleteCourse, importCourse } from '../services/dataCommands';
import { checkPlaylistImportQuota, trackCourseImport, trackCourseRemoval, isReturningRegisteredUser } from '../services/quotaService';
import { useAuth } from '../hooks/useAuth';
import { DeleteCourseDialog } from '../features/dashboard/DashboardSections';
import { toast } from '../components/ui/toast';
import { trackEvent } from '../services/analytics';

/**
 * Editorial squircle tile matching LandingPage.jsx.
 */
function BrandTile({ children, bg = 'bg-[#111111] dark:bg-white', text = 'text-white dark:text-[#111111]', rotate = '-rotate-3', size = 'sm' }) {
  const dims =
    size === 'lg'
      ? 'h-[0.8em] w-[0.8em] rounded-[24%] mx-[0.1em] sm:mx-[0.12em] -translate-y-[0.06em]'
      : 'size-8 sm:size-9 rounded-[9px] sm:rounded-[11px]';
  return (
    <span
      className={`inline-flex items-center justify-center align-middle shadow-[0_6px_16px_-4px_rgba(0,0,0,0.16)] ${dims} ${bg} ${text} ${rotate} select-none shrink-0 transition-transform duration-200 hover:rotate-0 hover:scale-105`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

const STARTER_COURSES = [
  {
    tag: 'JS',
    title: 'JavaScript Masterclass',
    channel: 'Chai aur Code',
    url: 'https://www.youtube.com/playlist?list=PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37'
  },
  {
    tag: 'WEB',
    title: 'Modern Web Dev',
    channel: 'Net Ninja',
    url: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9gksOX3Kd9KPo-O68ncT05o'
  },
  {
    tag: 'PY',
    title: 'Python Crash Course',
    channel: 'freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=rfscVS0vtbw'
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const { openAuthModal } = useUIStore();
  const navigate = useNavigate();
  const {
    isLoading,
    sortedCourses,
    progressList,
    practiceProgressList,
    stats,
    courseProgressMap,
    continuePath
  } = useDashboardData();

  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [syncingCourseId, setSyncingCourseId] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [directUrl, setDirectUrl] = useState('');
  const [isDirectImporting, setIsDirectImporting] = useState(false);

  const streakCount = useMemo(() => {
    return calculateStreak(progressList, practiceProgressList);
  }, [progressList, practiceProgressList]);

  const activeDates = useMemo(
    () => getActiveDateSet(progressList, practiceProgressList),
    [progressList, practiceProgressList]
  );

  const continueCourse = useMemo(() => {
    if (!continuePath?.courseId) return null;
    return sortedCourses.find((c) => c.id === continuePath.courseId) || null;
  }, [sortedCourses, continuePath]);

  const handleContinueLearning = () => {
    if (continuePath) {
      navigate(`/courses/${continuePath.courseId}/lessons/${continuePath.lessonId}`);
    }
  };

  const handleDirectImport = async (e, overrideUrl) => {
    if (e) e.preventDefault();
    const urlToUse = (overrideUrl || directUrl).trim();
    if (!urlToUse) {
      toast.add({
        title: 'Input required',
        description: 'Please paste a YouTube playlist or video link.',
        type: 'info',
        timeout: 4000,
      });
      return;
    }

    // STRICT SECURITY VALIDATION BEFORE ANY QUOTA CHECK OR NETWORK REQUEST
    const validation = validateYouTubeUrlOrId(urlToUse);
    if (!validation.isValid) {
      toast.add({
        title: 'Invalid YouTube link',
        description: validation.error || 'Please enter a genuine YouTube playlist or video link.',
        type: 'error',
        timeout: 5000,
      });
      return;
    }

    try {
      const quota = await checkPlaylistImportQuota({ user, playlistId: validation.id || urlToUse });
      if (!quota.allowed) {
        if (quota.reason === 'RETURNING_USER_SIGNIN_REQUIRED') {
          trackEvent('returning_user_quota_blocked');
          sessionStorage.setItem('foclyra_pending_import_url', urlToUse);
          openAuthModal('returning_user');
          toast.add({
            title: 'Sign in to continue',
            description: 'You have an active Foclyra account! Please sign in to import this course and access your library.',
            type: 'info',
            timeout: 6000,
          });
          return;
        }
        if (quota.reason === 'GUEST_LIMIT_REACHED') {
          trackEvent('guest_trial_exhausted');
          openAuthModal('guest_limit');
          toast.add({
            title: 'Guest trial complete',
            description: 'Guest trial complete (1/1 playlist). Sign in with Google to unlock 5 courses & cloud backup!',
            type: 'info',
            timeout: 6000,
          });
          return;
        }
        if (quota.reason === 'REGISTERED_LIMIT_REACHED') {
          trackEvent('registered_limit_hit');
          openAuthModal('registered_limit');
          toast.add({
            title: 'Playlist limit reached',
            description: 'You have reached your limit of 5 study playlists. Re-importing existing courses is always free!',
            type: 'error',
            timeout: 6000,
          });
          return;
        }
      }
    } catch (quotaErr) {
      console.warn('Quota check fallback:', quotaErr);
    }

    setIsDirectImporting(true);
    const loadingToastId = toast.add({
      title: 'Importing course...',
      description: 'Connecting to YouTube and importing course...',
      type: 'loading',
    });

    try {
      const { course, lessons } = await fetchYouTubePlaylistData(urlToUse);
      await importCourse(course, lessons);
      await trackCourseImport({ user, course, lessonCount: lessons.length });
      trackEvent('course_imported', {
        courseId: course.id,
        title: course.title,
        type: course.type,
        lessonCount: lessons.length
      });
      setDirectUrl('');
      toast.update(loadingToastId, {
        title: 'Course imported',
        description: `Successfully imported "${course.title}" with ${lessons.length} lectures!`,
        type: 'success',
        timeout: 5000,
      });
      if (lessons[0]?.id) {
        const readyToastId = toast.add({
          title: 'Ready to study',
          description: course.title,
          type: 'success',
          timeout: 6000,
          actionProps: {
            children: 'Start Lesson 1 →',
            onClick() {
              toast.close(readyToastId);
              navigate(`/courses/${course.id}/lessons/${lessons[0].id}`);
            },
          },
        });
      }
    } catch (err) {
      console.error(err);
      toast.update(loadingToastId, {
        title: 'Import failed',
        description: `Import failed: ${err.message}`,
        type: 'error',
        timeout: 5000,
      });
    } finally {
      setIsDirectImporting(false);
    }
  };

  const handleQuickStart = (url) => {
    setDirectUrl(url);
    handleDirectImport(null, url);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCourse(courseToDelete.id);
      await trackCourseRemoval({ user, courseId: courseToDelete.id });
      trackEvent('course_deleted', {
        courseId: courseToDelete.id,
        title: courseToDelete.title
      });
      toast.add({
        title: 'Course deleted',
        description: `Course "${courseToDelete.title}" deleted successfully.`,
        type: 'info',
        timeout: 4000,
      });
      setCourseToDelete(null);
    } catch (err) {
      console.error(err);
      toast.add({
        title: 'Delete failed',
        description: `Failed to delete course: ${err.message}`,
        type: 'error',
        timeout: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSyncCourse = async (course) => {
    if (course.type !== 'youtube') {
      toast.add({
        title: 'Manual tracking',
        description: 'Udemy courses are manually tracked.',
        type: 'info',
        timeout: 4000,
      });
      return;
    }

    setSyncingCourseId(course.id);
    const syncToastId = toast.add({
      title: 'Syncing playlist...',
      description: `Syncing playlist "${course.title}" with YouTube...`,
      type: 'loading',
    });

    try {
      const { course: updatedCourse, lessons: updatedLessons } = await fetchYouTubePlaylistData(course.id);
      await importCourse(updatedCourse, updatedLessons);
      toast.update(syncToastId, {
        title: 'Playlist synced',
        description: `Successfully synced "${course.title}"! (${updatedLessons.length} lectures updated)`,
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
      setSyncingCourseId(null);
    }
  };

  return (
    <div aria-busy={isLoading} className="py-5 sm:py-8 max-w-[1140px] w-full mx-auto animate-page-entry flex-1 flex flex-col">
      {sortedCourses.length === 0 ? (
        /* =========================================================================
           EMPTY STATE: Editorial Hero + Bento Importer (Refined Minimalist)
           ========================================================================= */
        <div className="my-auto py-8 sm:py-16 max-w-[680px] w-full mx-auto space-y-6 sm:space-y-7 text-center">
          {/* Punchy Editorial Heading & Subtitle */}
          {!user && isReturningRegisteredUser() && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 text-[#111111] dark:text-zinc-200 text-[11.5px] sm:text-[12px] font-medium mx-auto shadow-2xs">
              <span className="size-1.5 rounded-full bg-[#63d94e]" />
              <span>Welcome back! You have an existing account.</span>
              <button
                type="button"
                onClick={() => openAuthModal('returning_user')}
                className="font-semibold underline hover:no-underline cursor-pointer text-[#111111] dark:text-white ml-0.5"
              >
                Sign in to your library →
              </button>
            </div>
          )}

          <div className="space-y-2.5">
            <h1 className="text-[clamp(28px,5vw,48px)] leading-[1.1] font-semibold tracking-[-0.035em] text-[#111111] dark:text-white">
              Study any{' '}
              <BrandTile bg="bg-[#FF0033]" text="text-white" rotate="-rotate-4" size="lg">
                <Play className="size-[46%] fill-white text-white ml-[2%]" />
              </BrandTile>{' '}
              YouTube playlist.
            </h1>

            <p className="mx-auto max-w-[460px] text-[13.5px] sm:text-[15px] leading-relaxed text-[#666666] dark:text-zinc-400">
              Distraction-free lectures with timestamped notes.
            </p>
          </div>

          {/* Bento Importer Bar */}
          <form onSubmit={(e) => handleDirectImport(e)} className="w-full max-w-[620px] mx-auto">
            <div className="rounded-[20px] sm:rounded-full bg-[#f4f4f4] dark:bg-zinc-900/90 p-2 sm:p-2 border border-[#e5e5e5] dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 px-3.5 py-2 sm:py-0 flex-1 min-w-0 bg-white dark:bg-[#111113] sm:bg-transparent sm:dark:bg-transparent rounded-full border border-[#e5e5e5] dark:border-zinc-800 sm:border-0">
                <Link2 className="size-4 text-[#6f6f6f] shrink-0" />
                <input
                  type="text"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="Paste YouTube playlist or video URL..."
                  disabled={isDirectImporting}
                  className="w-full bg-transparent text-[#111111] dark:text-white text-[13px] sm:text-[14px] placeholder:text-[#8d8d8d] dark:placeholder:text-zinc-500 focus:outline-none py-1.5"
                />
              </div>

              <button
                type="submit"
                disabled={isDirectImporting || !directUrl.trim()}
                className="inline-flex h-9 sm:h-10 items-center justify-center gap-2 rounded-full bg-[#111111] dark:bg-white px-5 sm:px-6 text-[12.5px] sm:text-[13.5px] font-medium text-white dark:text-[#111111] hover:opacity-90 transition cursor-pointer disabled:opacity-40 shrink-0 whitespace-nowrap active:scale-[0.98]"
              >
                {isDirectImporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Import Playlist</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Compact Starter Quick-Pills */}
          <div className="pt-2 flex flex-col items-center gap-2.5 max-w-[620px] mx-auto">
            <div className="text-[11.5px] sm:text-[12px] font-medium text-[#888888] dark:text-zinc-500">
              Or try a starter playlist:
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {STARTER_COURSES.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  disabled={isDirectImporting}
                  onClick={() => handleQuickStart(item.url)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 border border-[#e5e5e5] dark:border-zinc-800 text-[11.5px] sm:text-[12px] font-medium text-[#111111] dark:text-zinc-200 transition cursor-pointer disabled:opacity-50 group shadow-2xs"
                  title={`Import ${item.title} by ${item.channel}`}
                >
                  <span className="font-mono text-[9px] font-bold text-[#666666] dark:text-zinc-400 px-1 py-0.5 rounded bg-white dark:bg-zinc-800 border border-[#e5e5e5] dark:border-zinc-700/80">
                    {item.tag}
                  </span>
                  <span className="truncate max-w-[130px] sm:max-w-none">{item.title}</span>
                  <ArrowRight className="size-3 text-[#888888] group-hover:text-[#111111] dark:group-hover:text-white group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
           ENROLLED WORKSPACE: Bento Action Row + Course Catalog Grid
           ========================================================================= */
        <div className="space-y-6 sm:space-y-8">
          {/* Studio Top Title & Streak/Export Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-5 border-b border-[#efefef] dark:border-zinc-800/70">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[clamp(22px,4vw,30px)] font-semibold tracking-[-0.03em] text-[#111111] dark:text-white leading-tight">
                  Learning Studio
                </h1>

                <button
                  type="button"
                  onClick={() => setIsStreakModalOpen(true)}
                  className="inline-flex h-7 sm:h-8 items-center gap-1.5 px-3 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 text-[#111111] dark:text-white text-[11.5px] sm:text-[12px] font-medium cursor-pointer transition whitespace-nowrap"
                  title="View 30-Day Activity Heatmap"
                >
                  <Flame className="size-3.5 text-[#FF6B2C] fill-[#FF6B2C] shrink-0" />
                  <span>
                    {streakCount} {streakCount === 1 ? 'Day' : 'Days'} Streak
                  </span>
                </button>
              </div>

              <p className="text-[12.5px] sm:text-[13.5px] text-[#6f6f6f] dark:text-zinc-400">
                {sortedCourses.length} {sortedCourses.length === 1 ? 'course' : 'courses'} enrolled • {stats.totalHours} hrs watched • {stats.completedLessons} lectures completed
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <ExportNotesButton
                label="Export All Notes"
                title="Export All Notes (.docx)"
              />
            </div>
          </div>

          {/* Bento Action Row: Importer Card + Active Learning Resume Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
            {/* Bento Card 1: Quick Importer (7 cols) */}
            <div className="md:col-span-7 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-4 sm:p-6 border border-[#e5e5e5] dark:border-zinc-800/80 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <BrandTile bg="bg-[#FF0033]" text="text-white" rotate="-rotate-3">
                    <Play className="size-3.5 fill-white text-white ml-0.5" />
                  </BrandTile>
                  <div>
                    <h2 className="text-[16px] sm:text-[18px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white leading-snug">
                      Import a YouTube playlist
                    </h2>
                    <p className="text-[12px] sm:text-[13px] text-[#666666] dark:text-zinc-400">
                      Paste any public or unlisted playlist or single video URL
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => handleDirectImport(e)} className="w-full">
                <div className="flex items-center bg-white dark:bg-[#111113] border border-[#e5e5e5] dark:border-zinc-800 rounded-full pl-3.5 sm:pl-4 pr-1.5 h-11 sm:h-12 focus-within:border-zinc-950 dark:focus-within:border-white focus-within:ring-1 focus-within:ring-zinc-950 dark:focus-within:ring-white transition shadow-2xs">
                  <Link2 className="size-4 text-[#8d8d8d] shrink-0 mr-2" />
                  <input
                    type="text"
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    placeholder="Paste playlist or video URL..."
                    disabled={isDirectImporting}
                    className="w-full bg-transparent text-[12.5px] sm:text-[13.5px] text-[#111111] dark:text-white placeholder:text-[#8d8d8d] dark:placeholder:text-zinc-500 focus:outline-none min-w-0 pr-2"
                  />
                  <button
                    type="submit"
                    disabled={isDirectImporting || !directUrl.trim()}
                    className="inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-full bg-[#111111] dark:bg-white px-3.5 sm:px-4 text-[12px] sm:text-[12.5px] font-medium text-white dark:text-[#111111] hover:opacity-90 transition cursor-pointer disabled:opacity-40 shrink-0 whitespace-nowrap active:scale-[0.98] shadow-xs"
                  >
                    {isDirectImporting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Import</span>
                        <ArrowRight className="size-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bento Card 2: Resume Active Session (5 cols) */}
            <div className="md:col-span-5 rounded-[20px] sm:rounded-[26px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-4 sm:p-6 border border-[#e5e5e5] dark:border-zinc-800/80 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <BrandTile bg="bg-[#F5C542]" text="text-[#111111]" rotate="rotate-3">
                    <Clock className="size-3.5" strokeWidth={2.3} />
                  </BrandTile>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-mono font-medium text-[#6f6f6f] dark:text-zinc-400 block">
                      Active Session
                    </span>
                    <h2 className="text-[15.5px] sm:text-[17px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white truncate">
                      {continueCourse ? continueCourse.title : 'Ready to study?'}
                    </h2>
                  </div>
                </div>
                <p className="text-[12px] sm:text-[13px] text-[#666666] dark:text-zinc-400">
                  {continueCourse ? 'Auto-resumes right where you left off' : 'Select any course below to begin'}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleContinueLearning}
                  disabled={!continuePath}
                  className="inline-flex sm:w-full h-9 sm:h-10 px-4 sm:px-5 rounded-full font-medium text-[12px] sm:text-[13px] bg-[#111111] dark:bg-white text-white dark:text-[#111111] hover:opacity-90 transition items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Play className="size-3 fill-current shrink-0" />
                  <span>{continuePath ? 'Resume Next Lecture' : 'Awaiting First Course'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Course Catalog Bento Grid */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] sm:text-[17px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
                Your Courses ({sortedCourses.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCourses.map((course) => {
                const progress = courseProgressMap[course.id] || 0;

                return (
                  <div
                    key={course.id}
                    className="rounded-[20px] sm:rounded-[24px] bg-[#f4f4f4] dark:bg-zinc-900/90 p-2.5 sm:p-3 border border-[#e5e5e5] dark:border-zinc-800/80 hover:border-[#111111]/20 dark:hover:border-white/20 transition duration-200 group flex flex-col justify-between w-full"
                  >
                    {/* Course Header Thumbnail Frame */}
                    <div className="aspect-video w-full relative rounded-[14px] sm:rounded-[16px] bg-[#0b1311] overflow-hidden">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

                      {/* Top-Right Frosted Action Pills */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                        {course.type === 'youtube' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSyncCourse(course);
                            }}
                            disabled={syncingCourseId === course.id}
                            className="size-7 rounded-full bg-black/55 hover:bg-black/80 text-white/95 border border-white/15 backdrop-blur-md flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                            title="Sync Playlist with YouTube"
                          >
                            {syncingCourseId === course.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="size-3.5" />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setCourseToDelete(course);
                          }}
                          className="size-7 rounded-full bg-black/55 hover:bg-[#e11d48] text-white/95 border border-white/15 backdrop-blur-md flex items-center justify-center transition cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-black/55 text-white/95 border border-white/15 backdrop-blur-md">
                        {course.type === 'youtube' ? 'YouTube Playlist' : 'Course'}
                      </span>
                    </div>

                    {/* Course Content Body */}
                    <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-3.5">
                      <div>
                        <h3 className="text-[14.5px] sm:text-[15.5px] font-semibold tracking-[-0.015em] text-[#111111] dark:text-white line-clamp-1">
                          {course.title}
                        </h3>
                        <span className="text-[12px] text-[#6f6f6f] dark:text-zinc-400 block truncate mt-0.5">
                          {course.channelName}
                        </span>
                      </div>

                      {/* Progress Bar Card */}
                      <div className="rounded-[12px] bg-white dark:bg-zinc-800/90 p-2.5 space-y-1.5 border border-[#e5e5e5]/70 dark:border-zinc-800">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="text-[#666666] dark:text-zinc-400">Course progress</span>
                          <span className="font-mono font-semibold text-[#111111] dark:text-white">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#f2f2f2] dark:bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#16a34a] dark:bg-[#34d399] rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Open Syllabus Pill Button */}
                      <div>
                        <Link
                          to={`/courses/${course.id}`}
                          className="w-full h-9 text-center text-[12.5px] font-medium rounded-full bg-white dark:bg-zinc-800 group-hover:bg-[#111111] dark:group-hover:bg-white text-[#111111] dark:text-white group-hover:text-white dark:group-hover:text-[#111111] border border-[#e5e5e5] dark:border-zinc-700 transition flex items-center justify-center gap-1.5"
                        >
                          <span>Open Syllabus</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <DeleteCourseDialog
        course={courseToDelete}
        isDeleting={isDeleting}
        onCancel={() => !isDeleting && setCourseToDelete(null)}
        onConfirm={handleDeleteCourse}
      />

      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        stats={{ ...stats, totalCourses: sortedCourses.length }}
        streakCount={streakCount}
        activeDates={activeDates}
      />
    </div>
  );
}
