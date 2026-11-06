import React, { useState } from 'react';
import { Share2, Copy, Check, X, Sparkles, ExternalLink } from 'lucide-react';
import Dialog from './ui/Dialog';
import { formatSeconds } from '../features/watch/watchConstants';
import { toast } from './ui/toast';
import { trackEvent } from '../services/analytics';

export default function ShareNotesModal({
  isOpen,
  onClose,
  courseTitle = 'Course',
  lessonTitle = '',
  notes = []
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://foclyra-studio.vercel.app';
  
  // Format clean markdown
  const formattedText = [
    `📚 **Study Notes: ${courseTitle}**${lessonTitle ? ` - *${lessonTitle}*` : ''}`,
    '',
    notes.length > 0 
      ? notes.map(n => `• **[${formatSeconds(n.timestamp || 0)}]** ${n.content}`).join('\n\n')
      : '_No notes recorded yet._',
    '',
    '---',
    `⚡ *Studied distraction-free on Foclyra: ${appUrl}*`
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      toast.add({
        title: 'Notes Copied!',
        description: 'Formatted notes with Foclyra badge copied to clipboard.',
        type: 'success',
        timeout: 3000
      });
      trackEvent('notes_shared_copy', {
        courseTitle,
        notesCount: notes.length
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
      toast.add({
        title: 'Copy Failed',
        description: 'Unable to access clipboard.',
        type: 'error',
        timeout: 3000
      });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Study Notes: ${courseTitle}`,
          text: formattedText,
          url: appUrl
        });
        trackEvent('notes_shared_native', {
          courseTitle,
          notesCount: notes.length
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="share-notes-title"
      className="w-full max-w-lg rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-6 sm:p-7 shadow-2xl space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Share2 size={16} />
          </div>
          <div>
            <h2 id="share-notes-title" className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Share Course Notes
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Formatted with timestamps & study badges
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={15} />
        </button>
      </div>

      {/* Preview Box */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 p-4 max-h-60 overflow-y-auto space-y-2 text-xs leading-relaxed font-sans text-zinc-800 dark:text-zinc-200 shadow-2xs">
        <div className="font-semibold text-zinc-950 dark:text-white flex items-center gap-1.5 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <span>📚 {courseTitle}</span>
          {lessonTitle && <span className="opacity-60 text-[11px] font-normal">({lessonTitle})</span>}
        </div>
        
        {notes.length === 0 ? (
          <p className="text-zinc-400 py-3 text-center italic">No timestamped notes written yet for this session.</p>
        ) : (
          <div className="space-y-2 pt-1">
            {notes.map((n, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                  {formatSeconds(n.timestamp || 0)}
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">{n.content}</span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            <span>Foclyra Distraction-Free Study</span>
          </span>
          <span className="font-mono text-[10px] opacity-75">{notes.length} note{notes.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleCopy}
          disabled={notes.length === 0}
          className="flex-1 h-10 px-4 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {copied ? <Check size={14} className="text-emerald-400 dark:text-emerald-600" /> : <Copy size={14} />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Notes Markdown'}</span>
        </button>

        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={notes.length === 0}
            className="h-10 px-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Share2 size={14} />
            <span>Share via Apps</span>
          </button>
        )}
      </div>
    </Dialog>
  );
}
