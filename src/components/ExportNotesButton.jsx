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
      className={`inline-flex h-8 sm:h-9 md:h-10 items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-[#111111] dark:bg-white px-3.5 sm:px-4 md:px-5 text-[12px] sm:text-[13px] font-medium text-white dark:text-[#111111] hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-2xs ${className}`}
    >
      <Download className="size-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
