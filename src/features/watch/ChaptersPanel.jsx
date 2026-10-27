import React from 'react';
import { Clock, Play } from 'lucide-react';

export function ChaptersPanel({ chapters, onSelect }) {
  globalThis.__foclyraRenderProbe?.('ChaptersPanel');
  
  // If there are no chapters, do not render anything to avoid empty boxes and massive whitespace gaps
  if (!chapters || chapters.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="chapters-title" className="mx-auto w-full max-w-7xl space-y-3 px-3 py-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-primary" />
        <h3 id="chapters-title" className="min-w-0 text-sm font-bold uppercase tracking-wider text-foreground">
          Chapters ({chapters.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
        {chapters.map((chapter, index) => (
          <button
            type="button"
            key={`${chapter.timestamp}-${index}`}
            onClick={() => onSelect(chapter.timestamp)}
            aria-label={`Play chapter ${chapter.title} at ${chapter.formattedTime}`}
            className="group min-h-11 min-w-0 cursor-pointer space-y-1 rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">{chapter.formattedTime}</span>
              <Play size={11} className="text-muted-foreground transition group-hover:text-primary" fill="currentColor" />
            </span>
            <span className="block break-words text-xs font-semibold leading-snug text-foreground transition group-hover:text-primary">{chapter.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
