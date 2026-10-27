import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUIStore } from '../hooks/useUIStore';
import { 
  Play, 
  Clock, 
  Trash2, 
  FileText, 
  Sparkles, 
  Flame, 
  Download, 
  RefreshCw, 
  Loader2, 
  Search, 
  CheckCircle2 
} from 'lucide-react';
import StreakModal from '../components/StreakModal';
import { exportNotesToMarkdown } from '../utils/exportUtils';
import { calculateStreak, getActiveDateSet } from '../utils/streakUtils';
import { fetchYouTubePlaylistData } from '../services/youtubeApi';
import { deleteCourse, exportNotes, importCourse } from '../services/dataCommands';
import { DeleteCourseDialog } from '../features/dashboard/DashboardSections';

const STARTER_COURSES = [
  {
    tag: 'JS',
    tagColor: 'text-amber-500 bg-amber-500/10 border-amber-500/25',
    title: 'JavaScript Masterclass',
    channel: 'Chai aur Code',
    url: 'https://www.youtube.com/playlist?list=PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37'
  },
  {
    tag: 'WEB',
    tagColor: 'text-blue-500 bg-blue-500/10 border-blue-500/25',
    title: 'Modern Web Dev',
    channel: 'Net Ninja',
    url: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9gksOX3Kd9KPo-O68ncT05o'
  },
  {
    tag: 'PY',
    tagColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25',
    title: 'Python Crash Course',
    channel: 'freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=rfscVS0vtbw'
  }
];

/**
 * Option 1 "Obsidian Studio" Minimalist Dashboard Component with Solution 1 Interactive Hero.
 * - Single high-converting, distraction-free Hero when 0 courses enrolled.
 * - Direct in-card YouTube importer with 1-click test-drive starter masterclasses.
 * - Dynamic active session resume and catalog view when courses are enrolled.
 * - Full Light Mode & Dark Mode seamless synchronization.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { openCommandPalette } = useUIStore();
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
  const [actionMsg, setActionMsg] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Direct Importer States
  const [directUrl, setDirectUrl] = useState('');
  const [isDirectImporting, setIsDirectImporting] = useState(false);
  const [newlyImportedCourse, setNewlyImportedCourse] = useState(null);

  // Dynamic Real-Time Streak Calculation
  const streakCount = useMemo(() => {
    return calculateStreak(progressList, practiceProgressList);
  }, [progressList, practiceProgressList]);

  const activeDates = useMemo(
    () => getActiveDateSet(progressList, practiceProgressList),
    [progressList, practiceProgressList]
  );

  const continueCourse = useMemo(() => {
    if (!continuePath?.courseId) return null;
    return sortedCourses.find(c => c.id === continuePath.courseId) || null;
  }, [sortedCourses, continuePath]);

  const handleContinueLearning = () => {
    if (continuePath) {
      navigate(`/courses/${continuePath.courseId}/lessons/${continuePath.lessonId}`);
    }
  };

  const handleExportNotes = async () => {
    const notes = await exportNotes();
    exportNotesToMarkdown(notes, 'Foclyra_Mastery_Notes');
  };

  const handleDirectImport = async (e, overrideUrl) => {
    if (e) e.preventDefault();
    const urlToUse = (overrideUrl || directUrl).trim();
    if (!urlToUse) return;

    setIsDirectImporting(true);
    setActionMsg({ text: 'Connecting to YouTube and importing course...', type: 'info' });

    try {
      const { course, lessons } = await fetchYouTubePlaylistData(urlToUse);
      await importCourse(course, lessons);
      setDirectUrl('');
      setNewlyImportedCourse({ course, firstLessonId: lessons[0]?.id });
      setActionMsg({ 
        text: `Successfully imported "${course.title}" with ${lessons.length} lectures!`, 
        type: 'success' 
      });
      setTimeout(() => setActionMsg(null), 5000);
    } catch (err) {
      console.error(err);
      setActionMsg({ text: `Import failed: ${err.message}`, type: 'error' });
      setTimeout(() => setActionMsg(null), 5000);
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
      setActionMsg({ text: `Course "${courseToDelete.title}" deleted successfully.`, type: 'info' });
      setTimeout(() => setActionMsg(null), 3500);
      setCourseToDelete(null);
    } catch (err) {
      console.error(err);
      setActionMsg({ text: `Failed to delete course: ${err.message}`, type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSyncCourse = async (course) => {
    if (course.type !== 'youtube') {
      setActionMsg({ text: 'Udemy courses are manually tracked.', type: 'info' });
      setTimeout(() => setActionMsg(null), 3000);
      return;
    }

    setSyncingCourseId(course.id);
    setActionMsg({ text: `Syncing playlist "${course.title}" with YouTube...`, type: 'info' });

    try {
      const { course: updatedCourse, lessons: updatedLessons } = await fetchYouTubePlaylistData(course.id);
      await importCourse(updatedCourse, updatedLessons);
      setActionMsg({ text: `Successfully synced "${course.title}"! (${updatedLessons.length} lectures updated)`, type: 'success' });
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err) {
      console.error(err);
      setActionMsg({ text: `Sync failed: ${err.message}`, type: 'error' });
    } finally {
      setSyncingCourseId(null);
    }
  };

  return (
    <div aria-busy={isLoading} className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto animate-page-entry flex-1 flex flex-col">
      {/* Status Action Banner */}
      {actionMsg && (
        <div className={`p-3.5 mb-5 rounded-xl text-xs font-semibold border flex items-center justify-between shadow-xs ${
          actionMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
          actionMsg.type === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
          'bg-muted text-muted-foreground border-border'
        }`}>
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-muted-foreground hover:text-foreground ml-4 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Newly Imported Course Quick Launch Banner */}
      {newlyImportedCourse && (
        <div className="p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
              Ready to study: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{newlyImportedCourse.course.title}</span>
            </span>
          </div>
          <button
            onClick={() => navigate(`/courses/${newlyImportedCourse.course.id}/lessons/${newlyImportedCourse.firstLessonId}`)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer flex-shrink-0 shadow-xs"
          >
            Start Lesson 1 →
          </button>
        </div>
      )}

      {/* CONDITIONAL RENDERING: ZERO COURSES vs ENROLLED CATALOG */}
      {sortedCourses.length === 0 ? (
        /* SLEEK, LEFT-ALIGNED STUDIO HERO (NO CENTER OVER-TEXTING, NO NESTED BOXES) */
        <div className="my-auto py-6 sm:py-12 max-w-2xl w-full mx-auto space-y-8 animate-page-entry text-left">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-primary/10 border border-primary/25 text-primary text-[11px] font-semibold">
              <Sparkles size={12} />
              <span>Distraction-Free YouTube Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Study without distractions
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Paste any YouTube playlist or tutorial link to take timestamped notes with zero ads, algorithm feeds, or comment rabbit holes.
            </p>
          </div>

          {/* Spotlight Importer Input Bar */}
          <form onSubmit={(e) => handleDirectImport(e)} className="w-full">
            <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-card border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 rounded-2xl transition shadow-xs">
              <div className="flex items-center gap-2.5 px-3 flex-1 min-w-0">
                <Play size={15} className="text-primary fill-primary flex-shrink-0" />
                <input
                  type="text"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="Paste YouTube playlist or video link..."
                  disabled={isDirectImporting}
                  className="w-full bg-transparent text-foreground text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none py-2"
                />
              </div>
              <button
                type="submit"
                disabled={isDirectImporting || !directUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                {isDirectImporting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <span>Import Playlist →</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Test Starter Courses (Clean Flat Cards) */}
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Or try a popular starter playlist:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {STARTER_COURSES.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  disabled={isDirectImporting}
                  onClick={() => handleQuickStart(item.url)}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/40 transition text-left cursor-pointer group shadow-xs disabled:opacity-50"
                  title={`Import ${item.title} by ${item.channel}`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition block truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {item.channel}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border ${item.tagColor} flex-shrink-0 ml-2`}>
                    {item.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3 Clean Features */}
          <div className="flex flex-wrap items-center gap-5 pt-4 text-xs text-muted-foreground border-t border-border/50">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Zero ads & feeds</span>
            </span>
            <span className="flex items-center gap-1.5">
              <FileText size={13} className="text-primary" />
              <span>Timestamped code notes</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-blue-500" />
              <span>100% offline IndexedDB</span>
            </span>
          </div>
        </div>
      ) : (
        /* REGULAR WORKSPACE: CLEAN SINGLE-COLUMN RESPONSIVE LAYOUT */
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Learning Studio
                </h1>
                <button
                  onClick={() => setIsStreakModalOpen(true)}
                  className="px-2.5 py-1 rounded bg-primary/10 border border-primary/25 hover:border-primary/50 text-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  title="View 30-Day Activity Heatmap"
                >
                  <Flame size={13} className="fill-primary animate-pulse" />
                  <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'} Streak</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {sortedCourses.length} {sortedCourses.length === 1 ? 'course' : 'courses'} enrolled • {stats.totalHours} hrs watched • {stats.completedLessons} lectures done
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCommandPalette}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-muted-foreground text-xs hover:text-foreground hover:bg-muted transition cursor-pointer shadow-xs"
              >
                <Search size={14} />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">Ctrl K</kbd>
              </button>
              <button
                onClick={handleExportNotes}
                className="px-3.5 py-2 rounded-xl bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Export Notes (.md)"
              >
                <Download size={14} className="text-muted-foreground" />
                <span className="hidden sm:inline">Export Notes</span>
              </button>
            </div>
          </div>

          {/* Action Row: Importer + Resume Session */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Importer */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-foreground tracking-normal">
                  Import YouTube Playlist
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Paste any public or unlisted tutorial link
                </p>
              </div>
              <form onSubmit={(e) => handleDirectImport(e)} className="flex gap-2">
                <input
                  type="text"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="Paste YouTube playlist or video link..."
                  disabled={isDirectImporting}
                  className="flex-1 min-w-0 bg-muted/50 border border-border rounded-xl px-3.5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-normal transition"
                />
                <button
                  type="submit"
                  disabled={isDirectImporting || !directUrl.trim()}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex-shrink-0 shadow-xs"
                >
                  {isDirectImporting ? <Loader2 size={13} className="animate-spin" /> : 'Import'}
                </button>
              </form>
            </div>

            {/* Resume Last Session */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card flex flex-col justify-between gap-3 shadow-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Active Learning
                </span>
                <h2 className="text-xs sm:text-sm font-semibold text-foreground truncate mt-0.5">
                  {continueCourse ? continueCourse.title : 'Ready to dive in?'}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {continueCourse ? 'Pick up right where you left off' : 'Import a course to start learning'}
                </p>
              </div>
              <button
                onClick={handleContinueLearning}
                disabled={!continuePath}
                className="w-full px-4 py-2 rounded-xl font-semibold text-xs bg-primary hover:bg-primary/90 text-primary-foreground transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <Play size={12} fill="currentColor" />
                <span>{continuePath ? 'Resume Next Lesson' : 'Awaiting First Course'}</span>
              </button>
            </div>
          </div>

          {/* Catalog Section: PURE SINGLE-COLUMN ON MOBILE (NO HORIZONTAL SNAP SCROLL!) */}
          <div className="space-y-4 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Catalog ({sortedCourses.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {sortedCourses.map((course) => {
                const progress = courseProgressMap[course.id] || 0;

                return (
                  <div 
                    key={course.id}
                    className="rounded-2xl overflow-hidden flex flex-col hover:border-primary/40 hover:shadow-md transition duration-200 group bg-card border border-border w-full shadow-xs"
                  >
                    {/* Course Header Thumbnail */}
                    <div className="aspect-video w-full relative bg-muted overflow-hidden">
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      
                      {/* Top-Right Action Buttons */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                        {course.type === 'youtube' && (
                          <button
                            onClick={(e) => { e.preventDefault(); handleSyncCourse(course); }}
                            disabled={syncingCourseId === course.id}
                            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 border border-white/20 backdrop-blur transition cursor-pointer disabled:opacity-50"
                            title="Sync Playlist with YouTube"
                          >
                            {syncingCourseId === course.id ? (
                              <Loader2 size={13} className="animate-spin text-primary" />
                            ) : (
                              <RefreshCw size={13} />
                            )}
                          </button>
                        )}

                        <button
                          onClick={(e) => { e.preventDefault(); setCourseToDelete(course); }}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-red-600/90 text-white/90 hover:text-white border border-white/20 backdrop-blur transition cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded bg-black/70 text-white/90 border border-white/20">
                        {course.type === 'youtube' ? 'YouTube' : 'Udemy'}
                      </span>
                    </div>

                    {/* Course Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-normal group-hover:text-primary transition line-clamp-1">
                          {course.title}
                        </h3>
                        <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                          {course.channelName}
                        </span>
                      </div>

                      {/* Progress bar gauge */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="pt-2 border-t border-border/50">
                        <Link
                          to={`/courses/${course.id}`}
                          className="w-full py-2 text-center text-xs font-semibold rounded-xl bg-muted/40 hover:bg-primary hover:text-primary-foreground border border-border transition block shadow-2xs"
                        >
                          Open Syllabus →
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

      {/* Streak Activity Heatmap Calendar Modal */}
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
