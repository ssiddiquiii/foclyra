import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Send, 
  Clock, 
  Check, 
  Copy, 
  BookmarkPlus, 
  RotateCcw, 
  Bot, 
  User, 
  Lightbulb, 
  Code2, 
  HelpCircle, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { createNote } from '../../services/dataCommands';
import { toast } from '../../components/ui/toast';
import { trackEvent } from '../../services/analytics';

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

const QUICK_PROMPTS = [
  {
    icon: Lightbulb,
    title: 'Explain Simply',
    prompt: 'Explain what the instructor just explained in clear, simple language with an analogy.'
  },
  {
    icon: Code2,
    title: 'Code Example',
    prompt: 'Provide a concise, practical real-world code snippet demonstrating this lecture concept.'
  },
  {
    icon: FileText,
    title: 'Key Takeaways',
    prompt: 'Summarize the top 3 critical takeaways from this topic in bullet points.'
  },
  {
    icon: HelpCircle,
    title: 'Quick Quiz',
    prompt: 'Quiz me with 2 short questions to test my understanding of what was just covered.'
  }
];

export function AITutorPanel({
  courseId,
  lessonId,
  courseTitle = 'Course',
  lessonTitle = 'Lecture',
  description = '',
  getCurrentTime,
  onSeek
}) {
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

  // Auto-scroll on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
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

      const data = await res.json();

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
    <div className="flex flex-col h-full bg-transparent">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80 dark:border-zinc-800/80 text-[11px]">
        <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Lecture Grounding:</span>
          <span className="font-mono bg-zinc-200/80 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-950 dark:text-zinc-50 font-semibold">
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
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {messages.length === 0 ? (
          <div className="py-6 px-2 text-center space-y-4">
            <div className="size-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-2xs">
              <Sparkles size={18} />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-950 dark:text-white text-sm">
                Foclyra AI Lecture Tutor
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11.5px] leading-relaxed max-w-[260px] mx-auto">
                Ask doubts, generate quick code snippets, or get instant summaries grounded in this exact lecture.
              </p>
            </div>

            {/* Quick Starter Prompts */}
            <div className="grid grid-cols-1 gap-1.5 pt-2 text-left">
              {QUICK_PROMPTS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(p.prompt)}
                    className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition flex items-center gap-2.5 group cursor-pointer text-left shadow-2xs"
                  >
                    <div className="size-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:scale-105 transition-transform shrink-0">
                      <Icon size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 block text-[11px] leading-tight">
                        {p.title}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-[10px] truncate block">
                        {p.prompt}
                      </span>
                    </div>
                  </button>
                );
              })}
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
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 px-1 font-mono">
                  {isUser ? (
                    <>
                      <span>You</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={10} className="text-amber-500" />
                      <span className="font-sans font-semibold text-zinc-700 dark:text-zinc-300">AI Tutor</span>
                      {m.timestamp && (
                        <button
                          type="button"
                          onClick={() => onSeek && onSeek(m.rawSeconds || 0)}
                          className="hover:underline flex items-center gap-0.5 cursor-pointer ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                          title="Jump to this second in video"
                        >
                          <Clock size={9} />
                          <span>{m.timestamp}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[92%] leading-relaxed ${
                    isUser
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-tr-xs shadow-xs font-medium text-xs'
                      : 'bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 rounded-tl-xs shadow-2xs text-xs whitespace-pre-wrap'
                  }`}
                >
                  {m.content}
                </div>

                {/* AI Action Toolbar */}
                {!isUser && (
                  <div className="flex items-center gap-1 pt-0.5 px-1">
                    <button
                      type="button"
                      onClick={() => handleAddToNotes(m.content, m.rawSeconds, idx)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition cursor-pointer ${
                        addedNoteIndex === idx
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-zinc-700/70 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      title="Save this answer as a timestamped note"
                    >
                      {addedNoteIndex === idx ? <Check size={10} /> : <BookmarkPlus size={10} />}
                      <span>{addedNoteIndex === idx ? 'Saved!' : 'Add to Notes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(m.content, idx)}
                      className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 pt-2">
            <div className="size-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Sparkles size={12} className="animate-spin" />
            </div>
            <div className="p-3 rounded-2xl rounded-tl-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-2">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px]">Analyzing lecture context...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 mt-2 border-t border-zinc-200/80 dark:border-zinc-800/80"
      >
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={`Ask about lecture at ${currentFormatted}...`}
            className="w-full h-9.5 pl-3.5 pr-10 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 text-zinc-950 dark:text-zinc-50 text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white shadow-2xs transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 text-white flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs active:scale-95"
            aria-label="Send message to AI Tutor"
          >
            <Send size={11} />
          </button>
        </div>
      </form>
    </div>
  );
}
