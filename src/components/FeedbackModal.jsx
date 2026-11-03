import React, { useState, useEffect, useRef } from 'react';
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  Upload, 
  Trash2, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ExternalLink,
  Laptop
} from 'lucide-react';
import Dialog from './ui/Dialog';

/**
 * Editorial Feedback & Bug Report Modal.
 * Matches Landing Page and Studio Dashboard minimalist editorial aesthetic.
 */
export default function FeedbackModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('bug'); // 'bug' | 'feature' | 'general'
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null); // base64 data url
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: 'success' | 'error', text: string, mailtoUrl?: string }
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-detect system info
  const telemetry = {
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
    timestamp: new Date().toLocaleString()
  };

  // Clipboard Paste Support (Ctrl+V / Cmd+V to paste screenshot)
  useEffect(() => {
    if (!isOpen) return;

    function handlePaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    // Max 5MB check
    if (file.size > 5 * 1024 * 1024) {
      setSubmitStatus({ type: 'error', text: 'Image file is too large (max 5MB).' });
      return;
    }

    setFileName(file.name || 'clipboard-screenshot.png');

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        setScreenshot(compressed);
        setFileSize(`${(compressed.length * 0.75 / 1024).toFixed(1)} KB`);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveImage = () => {
    setScreenshot(null);
    setFileName('');
    setFileSize('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setSubmitStatus({ type: 'error', text: 'Please enter a description of the issue or feedback.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous User',
          email: email.trim(),
          category,
          message: message.trim(),
          screenshot,
          telemetry
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitStatus({
          type: 'success',
          text: data.message || 'Thank you! Your feedback and diagnostics have been successfully submitted.'
        });

        // Reset form and auto-close modal with comfortable reading pause
        setTimeout(() => {
          setMessage('');
          handleRemoveImage();
          onClose();
          setSubmitStatus(null);
        }, 3200);
      } else {
        throw new Error(data.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      setSubmitStatus({
        type: 'error',
        text: err.message || 'Network error submitting feedback. Please try again or email directly.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="feedback-dialog-title"
      placement="center"
      className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-0 shadow-2xl"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 px-5 py-4 sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h2 id="feedback-dialog-title" className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Feedback & Bug Report
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Help improve Foclyra. Spotted an error or have an idea? Let us know!
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close feedback modal"
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {/* Category Pill Selector */}
        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            Feedback Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCategory('bug')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border text-xs font-medium transition cursor-pointer ${
                category === 'bug'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-2xs font-semibold'
                  : 'bg-zinc-100/70 dark:bg-zinc-900/60 border-zinc-200/70 dark:border-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50'
              }`}
            >
              <Bug size={13} />
              <span>Bug / Error</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory('feature')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border text-xs font-medium transition cursor-pointer ${
                category === 'feature'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                  : 'bg-zinc-100/70 dark:bg-zinc-900/60 border-zinc-200/70 dark:border-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50'
              }`}
            >
              <Lightbulb size={13} />
              <span>Feature Idea</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory('general')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border text-xs font-medium transition cursor-pointer ${
                category === 'general'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs font-semibold'
                  : 'bg-zinc-100/70 dark:bg-zinc-900/60 border-zinc-200/70 dark:border-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50'
              }`}
            >
              <MessageSquare size={13} />
              <span>General</span>
            </button>
          </div>
        </div>

        {/* Name & Email Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Your Name <span className="text-zinc-400 font-normal text-[11px]">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-9 px-3.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition shadow-2xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Your Email <span className="text-zinc-400 font-normal text-[11px]">(for replies)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-9 px-3.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition shadow-2xs"
            />
          </div>
        </div>

        {/* Message Field */}
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              category === 'bug'
                ? "Describe what happened... Which lecture or button triggered the issue? What error message did you see?"
                : "Tell us what you'd love to see in Foclyra..."
            }
            className="w-full p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-950 dark:text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition leading-relaxed resize-none shadow-2xs"
          />
        </div>

        {/* Screenshot Upload Zone */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Attach Screenshot <span className="text-zinc-400 font-normal text-[11px]">(optional)</span>
            </label>
            <span className="text-[10px] text-zinc-400">Tip: Paste screenshot with Ctrl+V</span>
          </div>

          {!screenshot ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                isDragging 
                  ? 'border-zinc-950 dark:border-white bg-zinc-100 dark:bg-zinc-900' 
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload size={18} className="text-zinc-400" />
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Click to browse or drag & drop an image
              </p>
              <p className="text-[10px] text-zinc-400">
                PNG, JPG, WEBP up to 4MB
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-2.5 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={screenshot}
                  alt="Attachment Preview"
                  className="w-12 h-12 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 block truncate">{fileName}</span>
                  <span className="text-[10px] text-zinc-400 block font-mono">{fileSize}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Remove attached image"
                className="p-2 rounded-full text-rose-500 hover:bg-rose-500/10 transition cursor-pointer flex-shrink-0"
                title="Remove image"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Diagnostic Telemetry Notice */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-500 dark:text-zinc-400">
          <Laptop size={13} className="flex-shrink-0 text-zinc-400" />
          <span className="truncate">
            Auto-attaching browser environment & URL to assist diagnosis.
          </span>
        </div>

        {/* Status Message */}
        {submitStatus && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 leading-relaxed ${
              submitStatus.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300'
            }`}
          >
            {submitStatus.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-medium">{submitStatus.text}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 px-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || submitStatus?.type === 'success'}
            className="h-9 px-5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white text-xs font-medium transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : submitStatus?.type === 'success' ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" />
                <span>Submitted!</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
