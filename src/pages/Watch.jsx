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
import { FileText } from 'lucide-react';

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
      return next;
    });
  };
  const isDesktopWorkspace = useDesktopWatchWorkspace();
  const player = useWatchPlayerController({ courseId, lessonId, lesson, progressList });
  const noteState = useLessonNotes({ courseId, lessonId, getTimestamp: player.getCurrentTime });

  if (isLoading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-9 h-9 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Lecture Details Not Found</h2>
        <Link to="/" className="text-primary hover:underline">Return to Dashboard</Link>
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
    await setLessonCompletion(courseId, lessonId, !isCompleted, isCompleted ? 0 : 2700);
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
      <div className="hidden xl:block px-4 sm:px-6 py-4 max-w-7xl w-full mx-auto space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-primary" />
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Notes ({lessonNotes.length})
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Current time syncs live • <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">Enter</kbd> to save • <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">Shift + Enter</kbd> for new line
          </span>
        </div>

        <NotesPanel
          notes={lessonNotes}
          noteState={noteState}
          onSeek={player.triggerPlayerSeek}
          timeStore={player.timeStore}
        />
      </div>
    </>
  );

  return <WatchWorkspaceShell main={main} sidebar={<DesktopWatchWorkspace {...workspaceProps} />} isCollapsed={isPlaylistCollapsed} />;
}
