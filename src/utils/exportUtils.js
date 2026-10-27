/**
 * FocusFlow Note Export Utility
 * Converts user's Dexie database notes into clean Markdown (.md) documents
 * for offline revision, Notion, or Obsidian imports.
 */

export function exportNotesToMarkdown(notesList = [], courseTitle = 'Foclyra Course Notes') {
  if (!notesList || notesList.length === 0) {
    alert('No notes available to export yet. Write some notes during lectures first!');
    return;
  }

  let markdown = `# 📝 ${courseTitle}\n\n`;
  markdown += `*Exported from Foclyra Studio on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

  notesList.forEach((note, index) => {
    const timeStr = note.timestamp ? formatTime(note.timestamp) : 'General Note';
    markdown += `### Note #${index + 1} (⏱️ ${timeStr})\n\n`;
    markdown += `${note.text || note.content || ''}\n\n`;
    markdown += `---\n\n`;
  });

  // Create downloadable blob
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${courseTitle.toLowerCase().replace(/\s+/g, '_')}_notes.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
