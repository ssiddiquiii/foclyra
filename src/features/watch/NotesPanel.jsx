import React from 'react';
import { Check, Clock, Pencil, Trash2, X } from 'lucide-react';
import Dialog from '../../components/ui/Dialog';
import { formatSeconds } from './watchConstants';
import { usePlayerTime } from './playerTimeStore';
import { MarkdownView } from '../../components/MarkdownView';

const DEFAULT_FALLBACK_STORE = {
  subscribe: () => () => {},
  getSnapshot: () => ({ currentTime: 0, duration: 0 })
};

export function NotesPanel({ notes = [], noteState, onSeek, timeStore }) {
  globalThis.__foclyraRenderProbe?.('NotesPanel');
  const isSaving = noteState.status === 'saving';

  // Live dynamic timestamp subscription from player
  const playerTime = usePlayerTime(timeStore || DEFAULT_FALLBACK_STORE);
  const currentSeconds = playerTime?.currentTime || 0;
  const dynamicTimestamp = formatSeconds(currentSeconds);

  return (
    <div className="min-w-0 space-y-3" data-testid="notes-workspace">
      {/* Inline Note Creation: Full-width responsive textarea with touch-friendly Save Button */}
      <form onSubmit={noteState.saveNew} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-2.5">
        <label htmlFor="new-lesson-note" className="sr-only">Take a timestamped note</label>
        <div className="relative flex-1 min-w-0 w-full">
          <textarea
            id="new-lesson-note"
            rows={3}
            value={noteState.draft}
            onChange={event => noteState.setDraft(event.target.value)}
            placeholder="Take a timestamped note… (Shift + Enter for new line, Enter to save)"
            className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-3 sm:p-3.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white resize-y min-h-[80px] sm:min-h-[105px] leading-relaxed shadow-2xs"
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                noteState.saveNew(event);
              }
            }}
          />
        </div>

        {/* Compact Save Button with Dynamic Live Timestamp */}
        <button
          type="submit"
          disabled={!noteState.draft.trim() || isSaving}
          className="h-9 sm:h-10 px-4 sm:px-4.5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0 shadow-xs w-full sm:w-auto self-stretch sm:self-start active:scale-[0.98]"
          title={`Save note at current time ${dynamicTimestamp}`}
        >
          <Clock size={13} className="flex-shrink-0" />
          <span>{isSaving ? 'Saving…' : `Save (${dynamicTimestamp})`}</span>
        </button>
      </form>

      {noteState.error && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500 dark:text-red-400">
          {noteState.error} Your text has been kept so you can try again.
        </p>
      )}

      {/* Saved Notes Feed */}
      <div className="space-y-2 pt-0.5" aria-busy={isSaving}>
        {notes.length === 0 ? (
          <p className="py-3 text-xs text-zinc-500 dark:text-zinc-400">No notes written for this video yet.</p>
        ) : notes.map(note => {
          const isEditing = noteState.editingId === note.id;
          return (
            <article key={note.id} className="min-w-0 space-y-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSeek(note.timestamp)}
                  aria-label={`Seek to note at ${formatSeconds(note.timestamp)}`}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-500/20 cursor-pointer"
                  title="Click to jump to this moment in video"
                >
                  <Clock size={11} />
                  <span>{formatSeconds(note.timestamp)}</span>
                </button>
                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => noteState.beginEdit(note)}
                      aria-label={`Edit note at ${formatSeconds(note.timestamp)}`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title="Edit note"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete note"
                    onClick={() => noteState.setDeleteCandidate(note)}
                    aria-label={`Delete note at ${formatSeconds(note.timestamp)}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={noteState.saveEdit} className="space-y-2 pt-1">
                  <label htmlFor={`edit-note-${note.id}`} className="sr-only">Edit note</label>
                  <textarea
                    id={`edit-note-${note.id}`}
                    value={noteState.editDraft}
                    onChange={event => noteState.setEditDraft(event.target.value)}
                    className="min-h-16 w-full resize-y rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!noteState.editDraft.trim() || isSaving}
                      className="flex items-center justify-center gap-1 h-8 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-3.5 text-xs font-medium disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Check size={12} />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={noteState.cancelEdit}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-1 h-8 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 px-3.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <X size={12} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="min-w-0 break-words text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  <MarkdownView content={note.content} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(noteState.deleteCandidate)}
        onClose={() => { if (!isSaving) noteState.setDeleteCandidate(null); }}
        titleId="delete-note-title"
        closeOnBackdrop={!isSaving}
        closeOnEscape={!isSaving}
        className="w-full max-w-sm rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-6 shadow-2xl"
      >
        <h2 id="delete-note-title" className="text-base font-bold text-zinc-950 dark:text-zinc-50">Delete this note?</h2>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">This note will be permanently removed.</p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={() => noteState.setDeleteCandidate(null)}
            disabled={isSaving}
            className="flex-1 h-9 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={noteState.confirmDelete}
            disabled={isSaving}
            className="flex-1 h-9 rounded-full bg-red-600 hover:bg-red-700 text-xs font-medium text-white disabled:opacity-50 cursor-pointer shadow-xs transition"
          >
            {isSaving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
