import React, { useMemo } from 'react';
import { marked } from 'marked';

// Configure marked with GFM and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Clean, lightweight, editorial Markdown renderer for AI chat messages.
 */
export function MarkdownView({ content, className = '' }) {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(String(content));
    } catch {
      return String(content);
    }
  }, [content]);

  return (
    <div 
      className={`prose-chat text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
