import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCircle2, Circle, Clock, FileText, ListVideo, Search, ChevronRight, Sparkle } from 'lucide-react';
import { NotesPanel } from './NotesPanel';
import { AITutorPanel } from './AITutorPanel';

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
                  <div className="w-4 h-4 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Check size={10} strokeWidth={3} />
                  </div>
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
 * Desktop Watch Workspace: Dedicated Right Sidebar with Lectures Playlist & AI Tutor Switcher
 */
export function DesktopWatchWorkspace(props) {
  const { 
    courseId, 
    lessonId, 
    lessons, 
    progressList, 
    onNavigate, 
    onToggleCollapse,
    courseTitle,
    lessonTitle,
    description,
    getCurrentTime,
    onSeek
  } = props;

  const [desktopTab, setDesktopTab] = useState('lectures'); // 'lectures' | 'ai'

  const completedCount = (lessons || []).filter(item => 
    progressList?.some(progress => progress.id === `${courseId}_${item.id}` && progress.completed)
  ).length;
  const percent = lessons && lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <aside data-testid="watch-side-workspace" className="hidden h-full w-80 xl:w-96 flex-shrink-0 flex-col overflow-hidden border-l border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 xl:flex">
      {/* Sidebar Header with Switcher */}
      <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md space-y-2.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Editorial Tab Switcher with Fluid Spring Pill */}
          <div className="relative flex items-center bg-zinc-200/70 dark:bg-zinc-800/70 p-0.5 rounded-full border border-zinc-200/80 dark:border-zinc-700/80">
            <button
              type="button"
              onClick={() => setDesktopTab('lectures')}
              className={`relative py-1 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                desktopTab === 'lectures'
                  ? 'text-white dark:text-zinc-950'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
              }`}
            >
              {desktopTab === 'lectures' && (
                <motion.div
                  layoutId="desktopWatchTabPill"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 bg-zinc-950 dark:bg-white rounded-full shadow-2xs"
                />
              )}
              <ListVideo size={12} className="relative z-10 shrink-0" />
              <span className="relative z-10">Lectures ({lessons?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setDesktopTab('ai')}
              className={`relative py-1 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                desktopTab === 'ai'
                  ? 'text-white dark:text-zinc-950'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
              }`}
            >
              {desktopTab === 'ai' && (
                <motion.div
                  layoutId="desktopWatchTabPill"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 bg-zinc-950 dark:bg-white rounded-full shadow-2xs"
                />
              )}
              <Sparkle size={11} className="relative z-10 shrink-0 text-current" />
              <span className="relative z-10">AI Tutor</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {desktopTab === 'lectures' && (
              <span className="text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
                {percent}%
              </span>
            )}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-7 h-7 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition flex items-center justify-center cursor-pointer"
              title="Collapse sidebar to expand screen"
              aria-label="Collapse sidebar"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Visual Progress Bar (Shown in Lectures tab) */}
        {desktopTab === 'lectures' && (
          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      {/* Workspace Panel Content with Smooth Crossfade */}
      <div className="flex-1 overflow-y-auto p-3.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={desktopTab}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="h-full"
          >
            {desktopTab === 'lectures' ? (
              <PlaylistSyllabusList
                courseId={courseId}
                lessonId={lessonId}
                lessons={lessons}
                progressList={progressList}
                onNavigate={onNavigate}
              />
            ) : (
              <AITutorPanel
                courseId={courseId}
                lessonId={lessonId}
                courseTitle={courseTitle}
                lessonTitle={lessonTitle}
                description={description}
                getCurrentTime={getCurrentTime}
                onSeek={onSeek}
                onClose={() => setDesktopTab('lectures')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}

/**
 * Mobile Watch Workspace: Clean 3-Tab Switcher (Notes vs AI Tutor vs Lectures) on Small Screens.
 */
export function MobileWatchWorkspace(props) {
  const { 
    activeTab, 
    onTabChange, 
    notesProps, 
    lessons, 
    courseId, 
    lessonId, 
    progressList, 
    onNavigate, 
    isDesktop,
    courseTitle,
    lessonTitle,
    description,
    getCurrentTime,
    onSeek
  } = props;

  return (
    <section data-testid="watch-inline-workspace" className="block border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-3 py-4 sm:px-6 xl:hidden">
      <div className="rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 overflow-hidden shadow-xs">
        {/* Mobile Tabs: Pill capsule switcher with fluid spring pill */}
        <div className="relative p-1.5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-1.5 bg-white/80 dark:bg-zinc-950/80">
          <button
            type="button"
            aria-pressed={activeTab === 'notes'}
            onClick={() => onTabChange('notes')}
            className={`relative flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer select-none ${
              activeTab === 'notes'
                ? 'text-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            {activeTab === 'notes' && (
              <motion.div
                layoutId="mobileWatchTabPill"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 bg-zinc-950 dark:bg-white rounded-full shadow-xs"
              />
            )}
            <FileText size={13} className="relative z-10 shrink-0" />
            <span className="relative z-10">Notes ({notesProps?.notes?.length || 0})</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'ai'}
            onClick={() => onTabChange('ai')}
            className={`relative flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer select-none ${
              activeTab === 'ai'
                ? 'text-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            {activeTab === 'ai' && (
              <motion.div
                layoutId="mobileWatchTabPill"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 bg-zinc-950 dark:bg-white rounded-full shadow-xs"
              />
            )}
            <Sparkle size={12} className="relative z-10 shrink-0 text-current" />
            <span className="relative z-10">AI Tutor</span>
          </button>

          {lessons && lessons.length > 1 && (
            <button
              type="button"
              aria-pressed={activeTab === 'lectures'}
              onClick={() => onTabChange('lectures')}
              className={`relative flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer select-none ${
                activeTab === 'lectures'
                  ? 'text-white dark:text-zinc-950'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
              }`}
            >
              {activeTab === 'lectures' && (
                <motion.div
                  layoutId="mobileWatchTabPill"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 bg-zinc-950 dark:bg-white rounded-full shadow-xs"
                />
              )}
              <ListVideo size={13} className="relative z-10 shrink-0" />
              <span className="relative z-10">Lectures ({lessons.length})</span>
            </button>
          )}
        </div>

        {/* Mobile Tab Content */}
        <div className="p-3.5 sm:p-4">
          {!isDesktop && activeTab === 'notes' && <NotesPanel {...notesProps} />}
          {!isDesktop && activeTab === 'ai' && (
            <div className="h-[480px]">
              <AITutorPanel
                courseId={courseId}
                lessonId={lessonId}
                courseTitle={courseTitle}
                lessonTitle={lessonTitle}
                description={description}
                getCurrentTime={getCurrentTime}
                onSeek={onSeek}
                onClose={() => onTabChange('lectures')}
              />
            </div>
          )}
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
