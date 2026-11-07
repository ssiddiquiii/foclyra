import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  SquarePen, 
  X, 
  Send, 
  Loader2, 
  Check, 
  Copy, 
  BookmarkPlus, 
  AlertCircle,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { 
  createNote, 
  getLessonChat, 
  saveLessonChat, 
  clearLessonChat 
} from '../../services/dataCommands';
import { 
  getAiQuotaStatus, 
  consumeAiQuota 
} from '../../services/aiQuotaService';
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
  onSeek,
  onClose
}) {
  const navigate = useNavigate();

  // Persistent per-chapter chat messages state from Dexie
  const [messages, setMessages] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Daily Quota Tracking (30 questions, midnight reset, personal key bypass)
  const [quotaStatus, setQuotaStatus] = useState(() => getAiQuotaStatus());

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [addedNoteIndex, setAddedNoteIndex] = useState(null);

  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);
  const streamingTimerRef = useRef(null);

  // 1. Load chapter-specific conversation from Dexie IndexedDB
  useEffect(() => {
    let isCurrent = true;
    setIsInitializing(true);

    getLessonChat(courseId, lessonId)
      .then((savedMessages) => {
        if (isCurrent) {
          setMessages(savedMessages || []);
          setIsInitializing(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load chapter AI chat:', err);
        if (isCurrent) setIsInitializing(false);
      });

    return () => {
      isCurrent = false;
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }
    };
  }, [courseId, lessonId]);

  // 2. Persist chapter messages into Dexie whenever they settle (not during active streaming)
  useEffect(() => {
    if (isInitializing) return;
    const isStreamingActive = messages.some((m) => m.isStreaming);
    if (!isStreamingActive && messages.length > 0) {
      saveLessonChat(courseId, lessonId, messages);
    }
  }, [messages, isInitializing, courseId, lessonId]);

  // 3. Keep quota state updated in real-time
  useEffect(() => {
    setQuotaStatus(getAiQuotaStatus());
    const interval = setInterval(() => {
      setQuotaStatus(getAiQuotaStatus());
    }, 60000); // sync every minute for countdown
    return () => clearInterval(interval);
  }, []);

  // 4. Smooth auto-scroll to bottom
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

    // Character limit check (1,500 chars max)
    if (textToSend.length > 1500) {
      setErrorMsg('Question exceeds maximum length of 1,500 characters. Please ask a more concise question.');
      return;
    }

    // Check Quota before dispatching
    const liveQuota = getAiQuotaStatus();
    if (!liveQuota.canAsk) {
      setErrorMsg(`Daily limit reached (${liveQuota.max}/${liveQuota.max} questions). Quota resets in ${liveQuota.resetCountdown}. You can add your personal Gemini API key in Settings for unlimited access.`);
      return;
    }

    setErrorMsg(null);
    setInputPrompt('');

    // Capture exact lecture timestamp
    const rawTime = typeof getCurrentTime === 'function' ? getCurrentTime() : 0;
    const formatted = formatSeconds(rawTime);

    const userMessageId = `usr_${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      timestamp: formatted,
      rawSeconds: rawTime
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const customApiKey = localStorage.getItem('foclyra_custom_gemini_api_key') || '';

      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-foclyra-client': 'web-studio'
        },
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
        // Rollback un-answered user message on server security rejection or rate-limit
        setMessages((prev) => prev.filter((m) => m.id !== userMessageId));

        if (res.status === 429 && data.error?.toLowerCase().includes('daily')) {
          setQuotaStatus((prev) => ({ ...prev, remaining: 0, canAsk: false }));
        }

        const formattedErr = data.blockedByGuardrail 
          ? `🛡️ Guardrail Alert: ${data.error}` 
          : (data.error || 'AI Tutor was unable to generate a response.');
        throw new Error(formattedErr);
      }

      // Consume quota point successfully
      consumeAiQuota();
      setQuotaStatus(getAiQuotaStatus());

      // Progressive stream
      const fullReply = data.reply || '';
      const replyMessageId = `bot_${Date.now()}`;

      const botMessagePlaceholder = {
        id: replyMessageId,
        role: 'model',
        content: '',
        rawSeconds: rawTime,
        isStreaming: true
      };

      setMessages((prev) => [...prev, botMessagePlaceholder]);

      // Stream words smoothly in continuous flow
      const words = fullReply.split(' ');
      let wordIdx = 0;
      let revealed = '';

      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }

      streamingTimerRef.current = setInterval(() => {
        if (wordIdx < words.length) {
          const nextWord = words[wordIdx];
          revealed = revealed ? `${revealed} ${nextWord}` : nextWord;
          wordIdx += 1;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === replyMessageId ? { ...m, content: revealed } : m
            )
          );
        } else {
          clearInterval(streamingTimerRef.current);
          streamingTimerRef.current = null;

          setMessages((prev) => {
            const finalMessages = prev.map((m) =>
              m.id === replyMessageId ? { ...m, content: fullReply, isStreaming: false } : m
            );
            // Persist to Dexie
            saveLessonChat(courseId, lessonId, finalMessages);
            return finalMessages;
          });
        }
      }, 16);

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
        content: `Note:\n${content.trim()}`
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

  const handleClearHistory = async () => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    setMessages([]);
    setErrorMsg(null);
    await clearLessonChat(courseId, lessonId);
    toast.add({
      title: 'Chat Reset',
      description: 'Conversation for this chapter has been cleared.',
      type: 'info',
      timeout: 2000
    });
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* 1. Minimal Header: Questions on left, New Chat pencil & Close on right */}
      <div className="flex items-center justify-between pb-3 mb-1 border-b border-zinc-200/60 dark:border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <HelpCircle size={15} className="text-zinc-700 dark:text-zinc-300" strokeWidth={1.8} />
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">Questions</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="New conversation"
            aria-label="New conversation"
          >
            <SquarePen size={15} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Messages Canvas */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 py-3 text-xs sm:text-[13px]">
        {messages.length === 0 && !isInitializing ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
            <div className="size-8 rounded-full bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-center text-zinc-400 dark:text-zinc-500 shadow-2xs">
              <HelpCircle size={14} strokeWidth={1.8} />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-[13px] tracking-tight">
                Ask about this chapter
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed max-w-[220px]">
                Ask questions or clear doubts. Answers are saved locally to this lecture.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              <button
                type="button"
                onClick={() => handleSendMessage('Explain what is being taught in simple terms with a clear analogy.')}
                disabled={isLoading || (!quotaStatus.isUnlimited && quotaStatus.remaining === 0)}
                className="px-3 py-1 rounded-full border border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                Explain concept
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Summarize the top critical takeaways from this topic.')}
                disabled={isLoading || (!quotaStatus.isUnlimited && quotaStatus.remaining === 0)}
                className="px-3 py-1 rounded-full border border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                Key takeaways
              </button>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id || idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {isUser ? (
                  /* User Bubble: Dark rounded pill, right-aligned, 0 timestamps */
                  <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] bg-zinc-800 text-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 leading-relaxed shadow-2xs font-normal">
                    {m.content}
                  </div>
                ) : (
                  /* AI Answer: Borderless text directly on the canvas, clean markdown */
                  <div className="flex flex-col items-start w-full group py-0.5">
                    <div className="w-full text-zinc-800 dark:text-zinc-200 text-xs sm:text-[13px] leading-relaxed">
                      <MarkdownView content={m.content} />
                    </div>

                    {/* Subtle action buttons on hover */}
                    {!m.isStreaming && m.content && (
                      <div className="flex items-center gap-1.5 mt-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleAddToNotes(m.content, m.rawSeconds, idx)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                            addedNoteIndex === idx
                              ? 'bg-emerald-500 text-white'
                              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                          title="Save answer to notes"
                        >
                          {addedNoteIndex === idx ? <Check size={10} /> : <BookmarkPlus size={10} />}
                          <span>{addedNoteIndex === idx ? 'Saved' : 'Add to notes'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(m.content, idx)}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                          title="Copy response"
                        >
                          {copiedIndex === idx ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* 3. Silent Spinning Loader: ONLY loader spins when waiting, zero robotic text */}
        {isLoading && (
          <div className="flex items-center pl-1 py-1 animate-fadeIn">
            <Loader2 className="size-4 animate-spin text-zinc-400 dark:text-zinc-500" />
          </div>
        )}

        {/* Quota Exhausted Card */}
        {!quotaStatus.isUnlimited && quotaStatus.remaining === 0 && (
          <div className="p-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-center space-y-2 shadow-2xs animate-fadeIn">
            <div className="space-y-0.5">
              <h4 className="text-[11.5px] font-semibold text-zinc-900 dark:text-zinc-100">
                Daily Study Limit Reached (30/30)
              </h4>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[260px] mx-auto">
                Your 30 questions reset tonight at midnight ({quotaStatus.resetCountdown} left). Add your personal Gemini key for unlimited questions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[10.5px] font-medium hover:opacity-90 transition cursor-pointer shadow-2xs"
            >
              <span>Add Personal API Key</span>
              <ExternalLink size={9} />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] space-y-1.5 animate-fadeIn">
            <div className="flex items-start gap-1.5 font-medium">
              <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Input Box & Bottom Quota Info: Exactly like reference image */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 shrink-0 space-y-1.5"
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs focus-within:border-zinc-400 dark:focus-within:border-zinc-700 transition px-3.5 py-2.5">
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading || (!quotaStatus.isUnlimited && quotaStatus.remaining === 0)}
              placeholder={
                !quotaStatus.isUnlimited && quotaStatus.remaining === 0
                  ? `Daily limit reached (resets at midnight)...`
                  : `Ask about this chapter`
              }
              className="w-full bg-transparent text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim() || (!quotaStatus.isUnlimited && quotaStatus.remaining === 0)}
            className="size-11 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0 shadow-2xs active:scale-95"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>

        {/* Info directly underneath input */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-0.5">
          <span>
            {quotaStatus.isUnlimited ? (
              'Unlimited doubts enabled · Saved to this lecture'
            ) : (
              `${quotaStatus.remaining} of 30 doubts left today, resets at midnight · Saved to this lecture`
            )}
          </span>
          {!quotaStatus.isUnlimited && quotaStatus.remaining <= 5 && (
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="hover:underline text-zinc-600 dark:text-zinc-300 cursor-pointer"
            >
              Settings
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
