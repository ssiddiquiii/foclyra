import React from 'react';
import { BookOpen, CheckCircle2, Circle, Clock } from 'lucide-react';

export function CourseSyllabus({ courseId, lessonId, lessons, progressList, onNavigate }) {
  globalThis.__foclyraRenderProbe?.('CourseSyllabus');
  const completedCount = lessons.filter(item => progressList.some(progress => progress.id === `${courseId}_${item.id}` && progress.completed)).length;
  return (
    <div className="px-6 py-6 max-w-7xl w-full mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><BookOpen size={18} className="text-primary" /><h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Course Syllabus</h3></div>
        <span className="text-xs font-semibold text-muted-foreground">{completedCount} / {lessons.length} Completed</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
        {lessons.map(item => {
          const progress = progressList.find(candidate => candidate.id === `${courseId}_${item.id}`);
          const isCompleted = progress ? progress.completed : false;
          const isActive = item.id === lessonId;
          return (
            <button key={item.id} onClick={() => { if (!isActive) onNavigate(item.id); }} className={`w-full text-left p-3.5 rounded-xl flex items-center justify-between border transition group cursor-pointer ${isActive ? 'bg-primary/15 border-primary/50 text-foreground font-semibold shadow-sm ring-1 ring-primary/30' : 'bg-card border-border hover:bg-muted text-foreground'}`}>
              <div className="flex items-center gap-3 min-w-0">
                {isCompleted ? <CheckCircle2 className="text-accent flex-shrink-0" size={18} fill="currentColor" /> : <Circle className="text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0" size={18} />}
                <div className="min-w-0"><span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold block mb-0.5">Lecture {item.index}</span><span className="text-xs font-semibold truncate block">{item.title}</span></div>
              </div>
              {item.duration && item.duration !== '0:00' ? (
                <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0 flex items-center gap-1 ml-2 font-mono"><Clock size={10} /><span>{item.duration}</span></span>
              ) : (
                <span className="text-[9px] text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-muted/60 flex-shrink-0 ml-2">Lecture</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
