import React, { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
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
  
  const formattedText = [
    `**${courseTitle}**${lessonTitle ? ` — *${lessonTitle}*` : ''}`,
    '',
    notes.length > 0 
      ? notes.map(n => `• [${formatSeconds(n.timestamp || 0)}] ${n.content}`).join('\n\n')
      : '_No notes recorded yet._',
    '',
    '---',
    `Studied on Foclyra (${appUrl})`
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      toast.add({
        title: 'Notes copied',
        description: 'Copied to clipboard.',
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
        title: 'Copy failed',
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
          title: `Notes: ${courseTitle}`,
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
      className="w-full max-w-lg rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-6 shadow-2xl space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 id="share-notes-title" className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Share notes
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Copy formatted timestamped notes to share.
          </p>
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
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 p-4 max-h-60 overflow-y-auto space-y-2.5 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
        <div className="font-medium text-zinc-950 dark:text-white pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <span>{courseTitle}</span>
          {lessonTitle && <span className="text-zinc-500 dark:text-zinc-400 font-normal"> — {lessonTitle}</span>}
        </div>
        
        {notes.length === 0 ? (
          <p className="text-zinc-400 py-3 text-center">No notes written yet.</p>
        ) : (
          <div className="space-y-2 pt-0.5">
            {notes.map((n, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="font-mono text-[10.5px] text-zinc-500 dark:text-zinc-400 shrink-0 pt-0.5">
                  {formatSeconds(n.timestamp || 0)}
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">{n.content}</span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Studied on Foclyra</span>
          <span className="font-mono text-[10px]">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleCopy}
          disabled={notes.length === 0}
          className="h-9 px-4 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy notes'}</span>
        </button>

        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={notes.length === 0}
            className="h-9 px-4 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
        )}
      </div>
    </Dialog>
  );
}
