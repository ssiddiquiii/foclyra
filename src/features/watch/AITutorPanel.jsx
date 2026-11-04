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
  onSeek
}) {
  const navigate = useNavigate();

  // Persistent per-chapter chat messages state from Dexie
  const [messages, setMessages] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Daily Quota Tracking (30 questions, midnight reset, personal key bypass)
  const [quotaStatus, setQuotaStatus] = useState(() => getAiQuotaStatus());

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState(0);
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

  // 4. Dynamic thinking progression for human-grade feeling
  useEffect(() => {
    if (!isLoading) {
      setThinkingPhase(0);
      return undefined;
    }
    const t1 = setTimeout(() => setThinkingPhase(1), 1600);
    const t2 = setTimeout(() => setThinkingPhase(2), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLoading]);

  // 5. Smooth auto-scroll to bottom
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

    const userMessage = {
      id: `usr_${Date.now()}`,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          courseTitle,
          lessonTitle,
          description,
          currentTime: rawTime,
          formattedTime: formatted,
          history: messages.slice(-8),
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

      // Consume quota point successfully
      consumeAiQuota();
      setQuotaStatus(getAiQuotaStatus());

      // Organic, smooth progressive text reveal (ChatGPT-like human cadence)
      const fullReply = data.reply || '';
      const replyMessageId = `bot_${Date.now()}`;

      const botMessagePlaceholder = {
        id: replyMessageId,
        role: 'model',
        content: '',
        timestamp: data.timestamp || formatted,
        rawSeconds: rawTime,
        isStreaming: true
      };

      setMessages((prev) => [...prev, botMessagePlaceholder]);

      // Stream words smoothly in natural batches
      const words = fullReply.split(' ');
      let revealed = '';
      let wordIdx = 0;

      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }

      streamingTimerRef.current = setInterval(() => {
        if (wordIdx < words.length) {
          const chunk = words.slice(wordIdx, wordIdx + 3).join(' ');
          revealed = revealed ? `${revealed} ${chunk}` : chunk;
          wordIdx += 3;

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
      }, 26);

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

  const handleClearHistory = async () => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    setMessages([]);
    setErrorMsg(null);
    await clearLessonChat(courseId, lessonId);
    toast.add({
      title: 'Chat Cleared',
      description: 'Conversation for this lecture has been reset.',
      type: 'info',
      timeout: 2000
    });
  };

  const currentSeconds = typeof getCurrentTime === 'function' ? getCurrentTime() : 0;
  const currentFormatted = formatSeconds(currentSeconds);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* 1. Sleek Top Bar with Grounding Badge, Quota Capsule & Clear */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80 dark:border-zinc-800/80 text-[11px] shrink-0 gap-2">
        <div className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400 min-w-0">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="truncate">Grounded at</span>
          <span className="font-mono text-zinc-950 dark:text-zinc-50 font-semibold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
            {currentFormatted}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quota Capsule */}
          {quotaStatus.isUnlimited ? (
            <span 
              className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20" 
              title="Unlimited questions enabled via personal API key"
            >
              <Sparkles size={9} />
              <span>Unlimited</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-700/60 font-mono shadow-2xs"
              title={`Daily study quota: ${quotaStatus.remaining} of ${quotaStatus.max} doubts left. Resets in ${quotaStatus.resetCountdown}.`}
            >
              <span className={`size-1.5 rounded-full ${quotaStatus.remaining > 5 ? 'bg-emerald-500' : quotaStatus.remaining > 0 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`} />
              <span>{quotaStatus.remaining}/30 left</span>
            </span>
          )}

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 text-[10.5px] transition cursor-pointer"
              title="Clear Chapter Chat"
            >
              <RotateCcw size={10} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Pinned Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 pb-2 mb-1 shrink-0 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleSendMessage('Explain what is being taught right now in clear, simple language with an analogy.')}
          disabled={isLoading || (!quotaStatus.isUnlimited && quotaStatus.remaining === 0)}
          className="h-7 px-3 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 group disabled:opacity-50"
        >
          <Lightbulb size={11} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
          <span>Explain Concept</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('Summarize the top 3 critical takeaways and concepts from this topic so far in bullet points.')}
          disabled={isLoading || (!quotaStatus.isUnlimited && quotaStatus.remaining === 0)}
          className="h-7 px-3 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 group disabled:opacity-50"
        >
          <FileText size={11} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
          <span>Key Takeaways</span>
        </button>
      </div>

      {/* 3. Real Chat Messages Stream */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 py-2 text-xs">
        {messages.length === 0 && !isInitializing ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
            <div className="size-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-2xs">
              <Sparkles size={14} />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                In-Context Study Assistant
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed max-w-[220px]">
                Ask any question or tap a prompt chip above. Explanations are saved permanently to this lecture.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id || idx}
                className={`flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble */}
                {isUser ? (
                  <div className="flex flex-col items-end space-y-1 max-w-[85%]">
                    <div className="bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-2xl rounded-br-xs px-3.5 py-2 text-xs font-normal shadow-xs leading-relaxed">
                      {m.content}
                    </div>
                    <span className="font-mono text-[9.5px] text-zinc-400 px-1">
                      {m.timestamp}
                    </span>
                  </div>
                ) : (
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

                      {/* Action Toolbar (disabled while streaming) */}
                      {!m.isStreaming && (
                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 animate-fadeIn">
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
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading / Dynamic Contextual Thinking Wave */}
        {isLoading && (
          <div className="flex items-start gap-2 pt-1 animate-fadeIn">
            <div className="p-3 rounded-2xl rounded-tl-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-2.5 shadow-2xs">
              <div className="flex gap-1 items-center">
                <span className="size-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="size-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="size-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition-all duration-300">
                {thinkingPhase === 0 && `Grounding doubt with lecture at [${currentFormatted}]...`}
                {thinkingPhase === 1 && `Synthesizing conceptual doubt...`}
                {thinkingPhase >= 2 && `Structuring step-by-step answer...`}
              </span>
            </div>
          </div>
        )}

        {/* Quota Exhausted Card */}
        {!quotaStatus.isUnlimited && quotaStatus.remaining === 0 && (
          <div className="p-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-center space-y-2 shadow-2xs animate-fadeIn">
            <div className="size-7 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <Sparkles size={13} />
            </div>
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
            disabled={isLoading || (!quotaStatus.isUnlimited && quotaStatus.remaining === 0)}
            placeholder={
              !quotaStatus.isUnlimited && quotaStatus.remaining === 0
                ? `Daily limit reached (resets in ${quotaStatus.resetCountdown})...`
                : `Ask a question at ${currentFormatted}...`
            }
            className="flex-1 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim() || (!quotaStatus.isUnlimited && quotaStatus.remaining === 0)}
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
