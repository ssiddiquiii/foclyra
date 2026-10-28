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
  Sparkles,
  Check
} from 'lucide-react';
import { fetchYouTubePlaylistData } from '../services/youtubeApi';
import { importCourse } from '../services/dataCommands';
import ExportNotesButton from '../components/ExportNotesButton';

/**
 * Modern Course Detail & Syllabus View.
 * Sleek studio aesthetic with minimal borders, subtle shadows, and crisp typography.
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
  const [syncStatus, setSyncStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [thumbError, setThumbError] = useState(false);

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
    setSyncStatus('Fetching all lectures from YouTube...');
    try {
      const { course: updatedCourse, lessons: updatedLessons } = await fetchYouTubePlaylistData(course.id);
      await importCourse(updatedCourse, updatedLessons);
      setSyncStatus(`Synced ${updatedLessons.length} lectures successfully!`);
      setTimeout(() => setSyncStatus(null), 3500);
    } catch (err) {
      console.error(err);
      setSyncStatus(`Sync failed: ${err.message}`);
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (courseNotFound) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-2xl font-bold text-destructive">Course Not Found</h2>
        <Link to="/" className="text-primary hover:underline text-sm font-semibold">Return to Dashboard</Link>
      </div>
    );
  }

  const resumeTargetLesson = resumeLesson || courseLessons[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-page-entry">
      {/* Top Navigation Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {course.type === 'youtube' && (
          <button
            onClick={handleSyncPlaylist}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-muted/60 text-xs font-medium text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-50 shadow-xs"
            title="Sync complete lecture catalog from YouTube"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin text-primary" : ""} />
            <span>{isSyncing ? "Syncing..." : "Sync Lectures"}</span>
          </button>
        )}
      </div>

      {/* Course Hero Banner */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-28 -right-28 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
          {/* 16:9 Thumbnail preview with play hover */}
          <div 
            onClick={() => resumeTargetLesson && navigate(`/courses/${courseId}/lessons/${resumeTargetLesson.id}`)}
            className="relative w-full md:w-72 lg:w-80 aspect-video rounded-xl overflow-hidden border border-border/50 bg-zinc-950 flex-shrink-0 group cursor-pointer shadow-xs"
          >
            <img 
              src={optimizedThumb} 
              alt={course.title} 
              onError={() => setThumbError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Play size={20} fill="currentColor" className="ml-0.5" />
              </div>
            </div>
            {/* Overlay badge with lecture count */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[11px] font-mono text-zinc-200 font-medium flex items-center gap-1 border border-white/10">
              <BookOpen size={11} />
              <span>{courseLessons.length} lectures</span>
            </div>
          </div>

          {/* Course Details Info */}
          <div className="flex-1 min-w-0 space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/20">
                {course.type === 'youtube' ? 'YouTube Course' : 'Udemy Manual'}
              </span>
              {totalDurationFormatted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] text-muted-foreground font-mono bg-muted/60 rounded-full border border-border/40">
                  <Clock size={11} />
                  <span>{totalDurationFormatted}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
              {course.title}
            </h1>

            {course.description && (
              <div className="space-y-1 max-w-2xl">
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  {expandedDesc 
                    ? course.description 
                    : `${course.description.slice(0, 160)}${course.description.length > 160 ? '...' : ''}`}
                </p>
                {course.description.length > 160 && (
                  <button
                    onClick={() => setExpandedDesc(!expandedDesc)}
                    className="text-primary hover:underline text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {expandedDesc ? "Show Less" : "Read More"}
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium pt-1">
              <span className="w-5 h-5 rounded-full bg-muted border border-border/60 flex items-center justify-center font-bold text-[10px] text-foreground uppercase">
                {course.channelName?.charAt(0) || 'I'}
              </span>
              <span>Instructor: <span className="text-foreground font-semibold">{course.channelName}</span></span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center gap-3">
              {resumeTargetLesson && (
                <button
                  onClick={() => navigate(`/courses/${courseId}/lessons/${resumeTargetLesson.id}`)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold bg-primary hover:bg-primary/90 active:scale-98 transition-all text-primary-foreground text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {lastWatched ? <RotateCcw size={15} /> : <Play size={15} fill="currentColor" />}
                  <span>{lastWatched ? 'Resume Last Video' : courseProgress > 0 ? 'Resume Course' : 'Start Course'}</span>
                </button>
              )}
              <ExportNotesButton
                courseId={course.id}
                courseTitle={course.title}
                label="Download Notes"
                title={`Download ${course.title} Notes (.docx)`}
                className="w-full sm:w-auto px-5 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Stats Bar */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="w-full sm:w-44 flex-shrink-0">
          <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block mb-1">
            Course Progress
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{courseProgress}%</span>
            <span className="text-muted-foreground text-xs font-medium">completed</span>
          </div>
        </div>

        {/* Minimalist Progress Track */}
        <div className="flex-1 w-full space-y-1.5">
          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span>Progress Track</span>
            <span className="font-medium font-mono">{completedCount} of {courseLessons.length} finished</span>
          </div>
          <div className="w-full bg-muted/80 h-2 rounded-full overflow-hidden border border-border/30">
            <div 
              className="h-full bg-gradient-to-r from-primary via-emerald-400 to-teal-400 transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${courseProgress}%` }}
            />
          </div>
        </div>

        <div className="w-full sm:w-auto text-left sm:text-right flex-shrink-0 border-t sm:border-t-0 sm:border-l border-border/40 pt-3 sm:pt-0 sm:pl-5">
          <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block mb-1">
            Total Lessons
          </span>
          <div className="flex items-baseline sm:justify-end gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-foreground">{courseLessons.length}</span>
            <span className="text-xs text-muted-foreground font-medium">Lectures</span>
          </div>
        </div>
      </div>

      {/* Syllabus Curriculum Section */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Syllabus Curriculum</h2>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground font-mono">
              {filteredLessons.length} {filteredLessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>

          {/* Quick search input */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border/60 bg-muted/40 focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/70 transition"
            />
          </div>
        </div>

        {syncStatus && (
          <p className="text-xs text-primary font-medium animate-in fade-in flex items-center gap-1.5">
            <Sparkles size={12} />
            <span>{syncStatus}</span>
          </p>
        )}

        {courseLessons.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
            This course does not contain any lessons yet.
          </div>
        )}

        {courseLessons.length > 0 && filteredLessons.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-xs text-muted-foreground">
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
                className={`group flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-150 ${
                  isLastWatched 
                    ? 'border-primary/40 bg-primary/[0.04] shadow-xs' 
                    : 'border-border/50 bg-card hover:bg-muted/40 hover:border-border/80'
                }`}
              >
                {/* Left: Index badge + Completion Icon + Title */}
                <div className="flex min-w-0 items-center gap-3 sm:gap-4 flex-1">
                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <Check size={14} strokeWidth={2.5} />
                      </div>
                    ) : isLastWatched ? (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                        <Play size={12} fill="currentColor" className="ml-0.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center text-[11px] font-mono font-semibold text-muted-foreground group-hover:text-foreground group-hover:border-border transition-colors">
                        {lesson.index < 10 ? `0${lesson.index}` : lesson.index}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="block truncate text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {lesson.title}
                      </span>
                    </div>

                    {/* In-progress mini watch time indicator */}
                    {isLastWatched && watchTimePercent !== null && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="w-24 sm:w-32 h-1 bg-muted rounded-full overflow-hidden border border-border/40">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${watchTimePercent}%` }} />
                        </div>
                        <span className="text-[10px] text-primary font-mono font-medium">{watchTimePercent}% watched</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Badges & Duration */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isLastWatched && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 uppercase tracking-wider">
                      In Progress
                    </span>
                  )}

                  {lesson.duration && lesson.duration !== '0:00' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/40 px-2.5 py-1 rounded-md border border-border/30 group-hover:bg-muted/70 transition-colors">
                      <Clock size={12} />
                      <span>{lesson.duration}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                      Lecture
                    </span>
                  )}

                  <div className="w-7 h-7 rounded-lg bg-transparent group-hover:bg-primary/10 group-hover:text-primary text-muted-foreground/40 flex items-center justify-center transition-all">
                    <Play size={12} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
