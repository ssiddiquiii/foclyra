import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { getNotesExportBundle } from '../services/dataCommands';
import { exportNotesToWord } from '../utils/exportUtils';
import { trackEvent } from '../services/analytics';

export default function ExportNotesButton({
  courseId = null,
  courseTitle = '',
  label = 'Download Notes',
  title,
  className = ''
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const { courses, lessons, notes } = await getNotesExportBundle(courseId);
      exportNotesToWord(notes, { courses, lessons, courseTitle });
      trackEvent('notes_exported_word', {
        courseId: courseId || 'all',
        courseTitle: courseTitle || 'All Notes',
        notesCount: notes.length
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      title={title || `${label} (.docx)`}
      className={`rounded-xl font-semibold bg-primary hover:bg-primary/90 active:scale-98 transition-all text-primary-foreground shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${className}`}
    >
      <Download size={15} />
      <span>{label}</span>
    </button>
  );
}
