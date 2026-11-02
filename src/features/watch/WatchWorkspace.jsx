import React, { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Clock, FileText, ListVideo, Search, ChevronRight } from 'lucide-react';
import { NotesPanel } from './NotesPanel';

/**
 * Playlist Syllabus List: Displays lectures in playlist order with status checkmarks and durations.
 */
export function PlaylistSyllabusList({ courseId, lessonId, lessons, progressList, onNavigate }) {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredLessons = useMemo(() => {
    if (!filterQuery.trim()) return lessons || [];
    const q = filterQuery.toLowerCase();
    return (lessons || []).filter(l => 
      (l.title && l.title.toLowerCase().includes(q)) || 
      (l.index && l.index.toString().includes(q))
    );
  }, [lessons, filterQuery]);

  if (!lessons || lessons.length === 0) {
    return <p className="text-xs text-zinc-500 dark:text-zinc-400 p-4 text-center">No lectures found.</p>;
  }

  return (
    <div className="flex flex-col h-full space-y-2.5">
      {/* Search Filter if course has more than 8 lectures */}
      {lessons.length > 8 && (
        <div className="relative pb-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter lectures..."
            className="w-full h-8 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-full pl-8.5 pr-3 text-xs text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition shadow-2xs"
          />
        </div>
      )}

      {/* Lectures List */}
      <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
        {filteredLessons.map(item => {
          const progress = progressList?.find(candidate => candidate.id === `${courseId}_${item.id}`);
          const isCompleted = progress ? progress.completed : false;
          const isActive = item.id === lessonId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { if (!isActive && onNavigate) onNavigate(item.id); }}
              className={`w-full text-left p-2.5 sm:p-3 rounded-2xl flex items-center justify-between border transition group cursor-pointer ${
                isActive
                  ? 'bg-zinc-100/95 dark:bg-zinc-800/90 border-zinc-950/20 dark:border-white/20 text-zinc-950 dark:text-zinc-50 font-semibold shadow-2xs ring-1 ring-zinc-950/10 dark:ring-white/10'
                  : 'bg-white/70 dark:bg-zinc-900/40 border-zinc-200/70 dark:border-zinc-800/70 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isCompleted ? (
                  <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={15} fill="currentColor" />
                ) : (
                  <Circle className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 flex-shrink-0" size={15} />
                )}
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold block leading-tight">
                    {item.index ? `Lecture ${item.index}` : 'Video'}
                  </span>
                  <span className="text-xs font-semibold truncate block leading-snug">
                    {item.title}
                  </span>
                </div>
              </div>
              {item.duration && item.duration !== '0:00' ? (
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex-shrink-0 flex items-center gap-1 ml-2 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-700/60">
                  <Clock size={10} />
                  <span>{item.duration}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Desktop Watch Workspace: Dedicated Right Sidebar displaying the Course Playlist
 */
export function DesktopWatchWorkspace(props) {
  const { courseId, lessonId, lessons, progressList, onNavigate, onToggleCollapse } = props;
  const completedCount = (lessons || []).filter(item => 
    progressList?.some(progress => progress.id === `${courseId}_${item.id}` && progress.completed)
  ).length;
  const percent = lessons && lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <aside data-testid="watch-side-workspace" className="hidden h-full w-80 xl:w-96 flex-shrink-0 flex-col overflow-hidden border-l border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 xl:flex">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md space-y-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-2 text-left group cursor-pointer hover:opacity-85 transition"
            title="Click to collapse playlist & expand screen (Theater Mode)"
            aria-label="Collapse course playlist"
          >
            <div className="w-6 h-6 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 transition">
              <ListVideo size={13} className="group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 group-hover:opacity-80 transition">
              {lessons?.length === 1 ? 'Single Video Crash Course' : `Course Playlist (${lessons?.length || 0})`}
            </h2>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
              {completedCount}/{lessons?.length || 0} ({percent}%)
            </span>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-7 h-7 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition flex items-center justify-center cursor-pointer"
              title="Collapse playlist to expand screen"
              aria-label="Collapse playlist"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Playlist Content */}
      <div className="flex-1 overflow-y-auto p-3.5">
        <PlaylistSyllabusList
          courseId={courseId}
          lessonId={lessonId}
          lessons={lessons}
          progressList={progressList}
          onNavigate={onNavigate}
        />
      </div>
    </aside>
  );
}

/**
 * Mobile Watch Workspace: Clean 2-Tab Switcher (Notes vs Lectures) on Small Screens.
 */
export function MobileWatchWorkspace(props) {
  const { activeTab, onTabChange, notesProps, lessons, courseId, lessonId, progressList, onNavigate, isDesktop } = props;

  return (
    <section data-testid="watch-inline-workspace" className="block border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-3 py-4 sm:px-6 xl:hidden">
      <div className="rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 overflow-hidden shadow-xs">
        {/* Mobile Tabs: Pill capsule switcher */}
        <div className="p-2 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-1.5 bg-white/80 dark:bg-zinc-950/80">
          <button
            type="button"
            aria-pressed={activeTab === 'notes'}
            onClick={() => onTabChange('notes')}
            className={`flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-medium transition cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <FileText size={13} />
            <span>Notes ({notesProps?.notes?.length || 0})</span>
          </button>

          {lessons && lessons.length > 1 && (
            <button
              type="button"
              aria-pressed={activeTab === 'lectures'}
              onClick={() => onTabChange('lectures')}
              className={`flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-medium transition cursor-pointer ${
                activeTab === 'lectures'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <ListVideo size={13} />
              <span>Lectures ({lessons.length})</span>
            </button>
          )}
        </div>

        {/* Mobile Tab Content */}
        <div className="p-3.5 sm:p-4">
          {!isDesktop && activeTab === 'notes' && <NotesPanel {...notesProps} />}
          {!isDesktop && activeTab === 'lectures' && (
            <PlaylistSyllabusList
              courseId={courseId}
              lessonId={lessonId}
              lessons={lessons}
              progressList={progressList}
              onNavigate={onNavigate}
            />
          )}
        </div>
      </div>
    </section>
  );
}
