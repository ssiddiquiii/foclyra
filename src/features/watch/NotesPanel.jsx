import React from 'react';
import { Check, Clock, Pencil, Trash2, X } from 'lucide-react';
import Dialog from '../../components/ui/Dialog';
import { formatSeconds } from './watchConstants';
import { usePlayerTime } from './playerTimeStore';

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
      {/* Inline Note Creation: Spacious Textarea with compact dynamic timestamp button side-by-side */}
      <form onSubmit={noteState.saveNew} className="flex items-start gap-2 sm:gap-2.5">
        <label htmlFor="new-lesson-note" className="sr-only">Take a timestamped note</label>
        <div className="relative flex-1 min-w-0">
          <textarea
            id="new-lesson-note"
            rows={3}
            value={noteState.draft}
            onChange={event => noteState.setDraft(event.target.value)}
            placeholder="Take a timestamped note… (Shift + Enter for new line, Enter to save)"
            className="w-full rounded border border-border bg-muted/40 p-3 sm:p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:border-primary resize-y min-h-[90px] sm:min-h-[105px] leading-relaxed"
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                noteState.saveNew(event);
              }
            }}
          />
        </div>

        {/* Compact Inline Save Button with Dynamic Live Timestamp */}
        <button
          type="submit"
          disabled={!noteState.draft.trim() || isSaving}
          className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0 shadow-xs self-start"
          title={`Save note at current time ${dynamicTimestamp}`}
        >
          <Clock size={13} className="flex-shrink-0" />
          <span>{isSaving ? 'Saving…' : `Save (${dynamicTimestamp})`}</span>
        </button>
      </form>

      {noteState.error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
          {noteState.error} Your text has been kept so you can try again.
        </p>
      )}

      {/* Saved Notes Feed */}
      <div className="space-y-2 pt-0.5" aria-busy={isSaving}>
        {notes.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">No notes written for this video yet.</p>
        ) : notes.map(note => {
          const isEditing = noteState.editingId === note.id;
          return (
            <article key={note.id} className="min-w-0 space-y-1.5 rounded-xl border border-border bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSeek(note.timestamp)}
                  aria-label={`Seek to note at ${formatSeconds(note.timestamp)}`}
                  className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-bold text-primary transition hover:bg-primary/20 cursor-pointer"
                  title="Click to jump to this moment in video"
                >
                  <Clock size={10} />
                  <span>{formatSeconds(note.timestamp)}</span>
                </button>
                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => noteState.beginEdit(note)}
                      aria-label={`Edit note at ${formatSeconds(note.timestamp)}`}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                      title="Edit note"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete note"
                    onClick={() => noteState.setDeleteCandidate(note)}
                    aria-label={`Delete note at ${formatSeconds(note.timestamp)}`}
                    className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    <Trash2 size={13} />
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
                    className="min-h-16 w-full resize-y rounded-lg border border-border bg-card p-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!noteState.editDraft.trim() || isSaving}
                      className="flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
                    >
                      <Check size={13} />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={noteState.cancelEdit}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                    >
                      <X size={13} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <p className="min-w-0 whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/90">
                  {note.content}
                </p>
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
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl"
      >
        <h2 id="delete-note-title" className="text-base font-bold text-foreground">Delete this note?</h2>
        <p className="mt-2 text-xs text-muted-foreground">This note will be permanently removed.</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => noteState.setDeleteCandidate(null)}
            disabled={isSaving}
            className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={noteState.confirmDelete}
            disabled={isSaving}
            className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
