import { useCallback, useEffect, useRef, useState } from 'react';
import { createNote, deleteNote, updateNote } from '../../services/dataCommands';
import { trackEvent } from '../../services/analytics';

export function useLessonNotes({ courseId, lessonId, getTimestamp }) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    setDraft('');
    setEditingId(null);
    setEditDraft('');
    setDeleteCandidate(null);
    setStatus('idle');
    setError('');
    submittingRef.current = false;
  }, [courseId, lessonId]);

  const runCommand = useCallback(async command => {
    if (submittingRef.current) return false;
    submittingRef.current = true;
    setStatus('saving');
    setError('');
    try {
      await command();
      setStatus('idle');
      return true;
    } catch (commandError) {
      setStatus('error');
      setError(commandError instanceof Error ? commandError.message : 'The note could not be saved.');
      return false;
    } finally {
      submittingRef.current = false;
    }
  }, []);

  const saveNew = useCallback(async event => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content) return;
    const timestamp = Math.max(0, Math.round(getTimestamp()));
    const saved = await runCommand(() => createNote({ courseId, lessonId, timestamp, content }));
    if (saved) {
      setDraft('');
      trackEvent('note_created', {
        courseId,
        lessonId,
        hasTimestamp: timestamp > 0,
        characterLength: content.length
      });
    }
  }, [courseId, draft, getTimestamp, lessonId, runCommand]);

  const beginEdit = useCallback(note => {
    setEditingId(note.id);
    setEditDraft(note.content);
    setError('');
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft('');
    setError('');
  }, []);

  const saveEdit = useCallback(async event => {
    event?.preventDefault();
    const content = editDraft.trim();
    if (!editingId || !content) return;
    const saved = await runCommand(() => updateNote(editingId, content));
    if (saved) cancelEdit();
  }, [cancelEdit, editDraft, editingId, runCommand]);

  const confirmDelete = useCallback(async () => {
    if (!deleteCandidate) return;
    const deleted = await runCommand(() => deleteNote(deleteCandidate.id));
    if (deleted) setDeleteCandidate(null);
  }, [deleteCandidate, runCommand]);

  return {
    draft,
    setDraft,
    editingId,
    editDraft,
    setEditDraft,
    deleteCandidate,
    setDeleteCandidate,
    status,
    error,
    saveNew,
    beginEdit,
    cancelEdit,
    saveEdit,
    confirmDelete
  };
}
