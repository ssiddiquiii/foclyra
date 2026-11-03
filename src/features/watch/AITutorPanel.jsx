import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowUp, 
  Clock, 
  Check, 
  Copy, 
  BookmarkPlus, 
  RotateCcw, 
  FileText,
  AlertCircle,
  ExternalLink,
  Lightbulb
} from 'lucide-react';
import { createNote } from '../../services/dataCommands';
import { toast } from '../../components/ui/toast';
import { trackEvent } from '../../services/analytics';
import { MarkdownView } from '../../components/MarkdownView';

/**
 * Format raw seconds to MM:SS or HH:MM:SS
 */
function formatSeconds(secs) {
  if (isNaN(secs) || secs < 0) return '00:00';
  const total = Math.floor(secs);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function AITutorPanel({
  courseId,
  lessonId,
  courseTitle = 'Course',
  lessonTitle = 'Lecture',
  description = '',
  getCurrentTime,
  onSeek
}) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`foclyra_ai_chat_${courseId}_${lessonId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [addedNoteIndex, setAddedNoteIndex] = useState(null);
  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);

  // Sync chat to sessionStorage per lecture
  useEffect(() => {
    try {
      sessionStorage.setItem(`foclyra_ai_chat_${courseId}_${lessonId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to cache AI chat session:', e);
    }
  }, [messages, courseId, lessonId]);

  // Auto-scroll to bottom smoothly on message change or loading state
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (promptText) => {
    const textToSend = (promptText || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    setErrorMsg(null);
    setInputPrompt('');

    // Capture current playback time
    const rawTime = typeof getCurrentTime === 'function' ? getCurrentTime() : 0;
    const formatted = formatSeconds(rawTime);

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: formatted,
      rawSeconds: rawTime
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Check for user-provided Gemini key in localStorage
      const customApiKey = localStorage.getItem('foclyra_custom_gemini_api_key') || '';

      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          courseTitle,
          lessonTitle,
          description,
          currentTime: rawTime,
          formattedTime: formatted,
          history: messages.slice(-6),
          customApiKey
        })
      });

      const rawText = await res.text();
      let data = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(rawText || `Server returned status ${res.status}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI Tutor was unable to generate a response.');
      }

      const botMessage = {
        role: 'model',
        content: data.reply,
        timestamp: data.timestamp || formatted,
        rawSeconds: rawTime
      };

      setMessages((prev) => [...prev, botMessage]);
      trackEvent('ai_tutor_queried', { courseId, lessonId, timestamp: formatted });

    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to AI Tutor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputPrompt, isLoading, getCurrentTime, messages, courseId, lessonId, courseTitle, lessonTitle, description]);

  const handleCopyText = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAddToNotes = async (content, rawSeconds, idx) => {
    try {
      const ts = Math.max(0, Math.round(rawSeconds || 0));
      await createNote({
        courseId,
        lessonId,
        timestamp: ts,
        content: `🤖 AI Tutor:\n${content.trim()}`
      });

      setAddedNoteIndex(idx);
      toast.add({
        title: 'Saved to Notes',
        description: `AI explanation saved at [${formatSeconds(ts)}].`,
        type: 'success',
        timeout: 3000
      });
      setTimeout(() => setAddedNoteIndex(null), 3000);
    } catch (e) {
      toast.add({
        title: 'Error saving note',
        description: e.message || 'Could not save note to Dexie.',
        type: 'error'
      });
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    setErrorMsg(null);
    try {
      sessionStorage.removeItem(`foclyra_ai_chat_${courseId}_${lessonId}`);
    } catch {}
  };

  const currentSeconds = typeof getCurrentTime === 'function' ? getCurrentTime() : 0;
  const currentFormatted = formatSeconds(currentSeconds);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* 1. Sleek Top Bar with Grounding Badge & Clear */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80 dark:border-zinc-800/80 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Grounded at</span>
          <span className="font-mono text-zinc-950 dark:text-zinc-50 font-semibold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60">
            {currentFormatted}
          </span>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 text-[10.5px] transition cursor-pointer"
            title="Clear Chat History"
          >
            <RotateCcw size={10} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* 2. Pinned Quick Prompt Chips (Conversational Starter Pills) */}
      <div className="flex items-center gap-1.5 pb-2 mb-1 shrink-0 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleSendMessage('Explain what is being taught right now in clear, simple language with an analogy.')}
          disabled={isLoading}
          className="h-7 px-3 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 group disabled:opacity-50"
        >
          <Lightbulb size={11} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
          <span>Explain Concept</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('Summarize the top 3 critical takeaways and concepts from this topic so far in bullet points.')}
          disabled={isLoading}
          className="h-7 px-3 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 group disabled:opacity-50"
        >
          <FileText size={11} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
          <span>Key Takeaways</span>
        </button>
      </div>

      {/* 3. Real Chat Messages Stream */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 py-2 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
            <div className="size-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-2xs">
              <Sparkles size={14} />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                In-Context Study Assistant
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed max-w-[220px]">
                Ask any question or tap a prompt chip above. Explanations are anchored to the lecture timestamp.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble */}
                {isUser ? (
                  // User Message Bubble (Real chat dark pill)
                  <div className="flex flex-col items-end space-y-1 max-w-[85%]">
                    <div className="bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-2xl rounded-br-xs px-3.5 py-2 text-xs font-normal shadow-xs leading-relaxed">
                      {m.content}
                    </div>
                    <span className="font-mono text-[9.5px] text-zinc-400 px-1">
                      {m.timestamp}
                    </span>
                  </div>
                ) : (
                  // AI Tutor Message (Editorial Conversational Block with Markdown)
                  <div className="flex flex-col items-start space-y-1.5 max-w-[95%]">
                    {/* Header line */}
                    <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-zinc-500 dark:text-zinc-400 px-1">
                      <Sparkles size={11} className="text-zinc-900 dark:text-zinc-100" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">AI Tutor</span>
                      <span>•</span>
                      {m.timestamp && (
                        <button
                          type="button"
                          onClick={() => onSeek && onSeek(m.rawSeconds || 0)}
                          className="hover:underline flex items-center gap-0.5 cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-mono"
                          title="Click to jump to this video timestamp"
                        >
                          <Clock size={9} />
                          <span>{m.timestamp}</span>
                        </button>
                      )}
                    </div>

                    {/* Formatted Markdown Content */}
                    <div className="bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800/70 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs w-full">
                      <MarkdownView content={m.content} />

                      {/* Action Toolbar */}
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                        <button
                          type="button"
                          onClick={() => handleAddToNotes(m.content, m.rawSeconds, idx)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-medium transition cursor-pointer ${
                            addedNoteIndex === idx
                              ? 'bg-emerald-500 text-white shadow-2xs'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs'
                          }`}
                          title="Save this answer directly into your timestamped Notes"
                        >
                          {addedNoteIndex === idx ? <Check size={10} /> : <BookmarkPlus size={10} />}
                          <span>{addedNoteIndex === idx ? 'Saved to Notes!' : '+ Add to Notes'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(m.content, idx)}
                          className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
                          title="Copy response"
                        >
                          {copiedIndex === idx ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading / Thinking Wave */}
        {isLoading && (
          <div className="flex items-start gap-2 pt-1">
            <div className="p-3 rounded-2xl rounded-tl-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-2.5">
              <div className="flex gap-1 items-center">
                <span className="size-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="size-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="size-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Tutor is thinking at [{currentFormatted}]...
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] space-y-1.5">
            <div className="flex items-start gap-1.5 font-medium">
              <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
            {errorMsg.toLowerCase().includes('gemini') && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[10.5px] font-medium transition hover:opacity-90 cursor-pointer shadow-2xs"
                >
                  <span>Open Settings to Add Key</span>
                  <ExternalLink size={9} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Modern Real-Time Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 mt-1 border-t border-zinc-200/80 dark:border-zinc-800/80 shrink-0"
      >
        <div className="relative flex items-center h-10 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs focus-within:ring-1 focus-within:ring-zinc-950 dark:focus-within:ring-white transition pl-3.5 pr-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={`Ask a question at ${currentFormatted}...`}
            className="flex-1 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="size-7 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 text-white flex items-center justify-center transition disabled:opacity-20 disabled:pointer-events-none cursor-pointer shadow-xs active:scale-95 shrink-0"
            aria-label="Send message to AI Tutor"
          >
            <ArrowUp size={13} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
