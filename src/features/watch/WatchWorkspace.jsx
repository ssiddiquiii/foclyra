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
    return <p className="text-xs text-muted-foreground p-4 text-center">No lectures found.</p>;
  }

  return (
    <div className="flex flex-col h-full space-y-2.5">
      {/* Search Filter if course has more than 8 lectures */}
      {lessons.length > 8 && (
        <div className="relative pb-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter lectures..."
            className="w-full bg-muted/50 border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
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
              className={`w-full text-left p-2.5 sm:p-3 rounded-xl flex items-center justify-between border transition group cursor-pointer ${
                isActive
                  ? 'bg-primary/15 border-primary/50 text-foreground font-semibold shadow-xs ring-1 ring-primary/30'
                  : 'bg-card/70 border-border/80 hover:bg-muted text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isCompleted ? (
                  <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} fill="currentColor" />
                ) : (
                  <Circle className="text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0" size={16} />
                )}
                <div className="min-w-0">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block leading-tight">
                    {item.index ? `Lecture ${item.index}` : 'Video'}
                  </span>
                  <span className="text-xs font-semibold truncate block leading-snug">
                    {item.title}
                  </span>
                </div>
              </div>
              {item.duration && item.duration !== '0:00' ? (
                <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0 flex items-center gap-1 ml-2 font-mono">
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
    <aside data-testid="watch-side-workspace" className="hidden h-full w-80 xl:w-96 flex-shrink-0 flex-col overflow-hidden border-l border-border bg-card xl:flex">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border bg-card/90 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-2 text-left group cursor-pointer hover:opacity-85 transition"
            title="Click to collapse playlist & expand screen (Theater Mode)"
            aria-label="Collapse course playlist"
          >
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition flex items-center justify-center">
              <ListVideo size={16} className="text-primary group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition">
              {lessons?.length === 1 ? 'Single Video Crash Course' : `Course Playlist (${lessons?.length || 0})`}
            </h2>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {completedCount}/{lessons?.length || 0} Done ({percent}%)
            </span>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Collapse playlist to expand screen"
              aria-label="Collapse playlist"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
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
 * Reading tab is completely removed.
 */
export function MobileWatchWorkspace(props) {
  const { activeTab, onTabChange, notesProps, lessons, courseId, lessonId, progressList, onNavigate, isDesktop } = props;

  return (
    <section data-testid="watch-inline-workspace" className="block border-b border-border/50 bg-background px-3 py-4 sm:px-6 xl:hidden">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Mobile Tabs: Only Notes and Lectures */}
        <div className="flex border-b border-border text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            aria-pressed={activeTab === 'notes'}
            onClick={() => onTabChange('notes')}
            className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 border-b-2 px-2 py-3 transition ${
              activeTab === 'notes'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText size={14} className={activeTab === 'notes' ? 'text-primary' : ''} />
            <span>Notes ({notesProps?.notes?.length || 0})</span>
          </button>

          {lessons && lessons.length > 1 && (
            <button
              type="button"
              aria-pressed={activeTab === 'lectures'}
              onClick={() => onTabChange('lectures')}
              className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 border-b-2 px-2 py-3 transition ${
                activeTab === 'lectures'
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListVideo size={14} className={activeTab === 'lectures' ? 'text-primary' : ''} />
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
