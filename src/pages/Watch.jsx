import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useWatchData } from '../hooks/useWatchData';
import { setLessonCompletion } from '../services/dataCommands';
import { PlayerSurface } from '../features/watch/PlayerSurface';
import { WatchDetails } from '../features/watch/WatchDetails';
import { WatchHeader } from '../features/watch/WatchHeader';
import { DesktopWatchWorkspace, MobileWatchWorkspace } from '../features/watch/WatchWorkspace';
import { WatchWorkspaceShell } from '../features/watch/WatchWorkspaceShell';
import { useDesktopWatchWorkspace } from '../features/watch/useDesktopWatchWorkspace';
import { useLessonNotes } from '../features/watch/useLessonNotes';
import { useWatchPlayerController } from '../features/watch/useWatchPlayerController';
import { NotesPanel } from '../features/watch/NotesPanel';
import { FileText, ArrowLeft } from 'lucide-react';
import { trackEvent } from '../services/analytics';

/**
 * Editorial Watch Workspace View.
 * Matches Landing Page and Studio Dashboard minimalist editorial aesthetic.
 * @returns {React.JSX.Element}
 */
export default function Watch() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { isLoading, notFound, course, lesson, courseLessons, progressList, lessonNotes } = useWatchData(courseId, lessonId);
  const [activeTab, setActiveTab] = useState('notes');
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(() => {
    try {
      return localStorage.getItem('foclyra_watch_playlist_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePlaylistCollapse = () => {
    setIsPlaylistCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('foclyra_watch_playlist_collapsed', String(next));
      } catch {}
      trackEvent('theater_mode_toggled', {
        collapsed: next,
        courseId,
        lessonId
      });
      return next;
    });
  };
  const isDesktopWorkspace = useDesktopWatchWorkspace();
  const player = useWatchPlayerController({ courseId, lessonId, lesson, progressList });
  const noteState = useLessonNotes({ courseId, lessonId, getTimestamp: player.getCurrentTime });

  if (isLoading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-950 dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-12 rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-red-500">Lecture Details Not Found</h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          The requested video could not be found in this course.
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

  // Navigation indices
  const currentIndex = courseLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

  const currentProgress = progressList.find(progress => progress.id === `${courseId}_${lessonId}`);
  const isCompleted = currentProgress ? currentProgress.completed : false;
  const handleToggleComplete = async () => {
    const nextCompleted = !isCompleted;
    await setLessonCompletion(courseId, lessonId, nextCompleted, isCompleted ? 0 : 2700);
    if (nextCompleted) {
      trackEvent('lecture_completed', {
        courseId,
        lessonId,
        lessonTitle: lesson.title,
        lessonIndex: currentIndex >= 0 ? currentIndex + 1 : 1
      });
    }
  };

  const handleNavigate = (nextId) => {
    navigate(`/courses/${courseId}/lessons/${nextId}`);
  };

  const notesProps = {
    notes: lessonNotes,
    noteState,
    onSeek: player.triggerPlayerSeek,
    timeStore: player.timeStore
  };

  const workspaceProps = {
    activeTab,
    courseId,
    lessonId,
    lessonType: lesson.type,
    description: lesson.description,
    lessons: courseLessons,
    progressList,
    onNavigate: handleNavigate,
    notesProps,
    isDesktop: isDesktopWorkspace,
    onTabChange: setActiveTab,
    onToggleCollapse: handleTogglePlaylistCollapse
  };

  const main = (
    <>
      <WatchHeader 
        courseId={courseId} 
        courseTitle={course.title} 
        lessonTitle={lesson.title} 
        isPlaylistCollapsed={isPlaylistCollapsed}
        onTogglePlaylist={handleTogglePlaylistCollapse}
        lessonsCount={courseLessons.length}
      />
      <PlayerSurface
        course={course}
        lesson={lesson}
        lessonId={lessonId}
        controller={player}
        isUdemyCompleted={isCompleted}
        onUdemyToggle={handleToggleComplete}
        prevLessonId={prevLesson?.id}
        nextLessonId={nextLesson?.id}
        onNavigate={handleNavigate}
        isPlaylistCollapsed={isPlaylistCollapsed}
        onTogglePlaylist={handleTogglePlaylistCollapse}
        lessonsCount={courseLessons.length}
      />
      <WatchDetails
        course={course}
        lesson={lesson}
        currentIndex={currentIndex >= 0 ? currentIndex : 0}
        totalLessons={courseLessons.length}
        isCompleted={isCompleted}
        onToggleComplete={handleToggleComplete}
        prevLessonId={prevLesson?.id}
        nextLessonId={nextLesson?.id}
        onNavigate={handleNavigate}
      />

      {/* Mobile Inline Switcher (Notes vs Lectures on Mobile) */}
      <MobileWatchWorkspace {...workspaceProps} />

      {/* Desktop Direct Clean Notes Section Under Video (Shown on xl screens) */}
      <div className="hidden xl:block px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto">
        <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-6 shadow-xs space-y-4 backdrop-blur-xs">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                <FileText size={13} />
              </div>
              <h2 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">
                Timestamped Notes
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono border border-zinc-300/60 dark:border-zinc-700/60">
                {lessonNotes.length}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Live time sync • <kbd className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 text-[10px] font-mono border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">Enter</kbd> to save • <kbd className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 text-[10px] font-mono border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">Shift + Enter</kbd> for newline
            </span>
          </div>

          <NotesPanel
            notes={lessonNotes}
            noteState={noteState}
            onSeek={player.triggerPlayerSeek}
            timeStore={player.timeStore}
          />
        </div>
      </div>
    </>
  );

  return <WatchWorkspaceShell main={main} sidebar={<DesktopWatchWorkspace {...workspaceProps} />} isCollapsed={isPlaylistCollapsed} />;
}
