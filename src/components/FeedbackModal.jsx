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
    
    // Max 4MB size check
    if (file.size > 4 * 1024 * 1024) {
      setSubmitStatus({ type: 'error', text: 'Image file is too large (max 4MB).' });
      return;
    }

    setFileName(file.name || 'clipboard-screenshot.png');
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshot(e.target.result);
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
          text: 'Thank you! Your feedback has been successfully submitted.',
          mailtoUrl: data.mailtoUrl
        });
        // Reset form after short delay
        setTimeout(() => {
          if (!data.mailtoUrl) {
            setMessage('');
            handleRemoveImage();
            onClose();
            setSubmitStatus(null);
          }
        }, 3500);
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
      className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-0 shadow-2xl"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4 sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h2 id="feedback-dialog-title" className="text-base font-bold text-foreground">
            Feedback & Bug Report
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Help improve Foclyra. Spotted an error or have an idea? Let us know!
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close feedback modal"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Category Pill Selector */}
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
            Feedback Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCategory('bug')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                category === 'bug'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Bug size={14} />
              <span>Bug / Error</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory('feature')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                category === 'feature'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Lightbulb size={14} />
              <span>Feature Idea</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory('general')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                category === 'general'
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <MessageSquare size={14} />
              <span>General</span>
            </button>
          </div>
        </div>

        {/* Name & Email Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Your Name <span className="text-muted-foreground font-normal text-[11px]">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sameed"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-xs focus:outline-none focus:border-primary placeholder:text-muted-foreground/70 transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Your Email <span className="text-muted-foreground font-normal text-[11px]">(for replies)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-xs focus:outline-none focus:border-primary placeholder:text-muted-foreground/70 transition"
            />
          </div>
        </div>

        {/* Message Field */}
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-xs focus:outline-none focus:border-primary placeholder:text-muted-foreground/70 transition leading-relaxed resize-none"
          />
        </div>

        {/* Screenshot / Image Upload & Drag-and-Drop Zone */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-foreground">
              Attach Screenshot <span className="text-muted-foreground font-normal text-[11px]">(optional)</span>
            </label>
            <span className="text-[10px] text-muted-foreground">Tip: Paste screenshot with Ctrl+V</span>
          </div>

          {!screenshot ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload size={20} className="text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">
                Click to browse or drag & drop an image
              </p>
              <p className="text-[10px] text-muted-foreground">
                PNG, JPG, WEBP up to 4MB
              </p>
            </div>
          ) : (
            <div className="relative rounded-xl border border-border p-2 bg-muted/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={screenshot}
                  alt="Attachment Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-border flex-shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground block truncate">{fileName}</span>
                  <span className="text-[10px] text-muted-foreground block">{fileSize}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Remove attached image"
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer flex-shrink-0"
                title="Remove image"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Diagnostic Telemetry Notice */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-[11px] text-muted-foreground">
          <Laptop size={14} className="flex-shrink-0 text-primary" />
          <span className="truncate">
            Auto-attaching browser environment & URL to assist diagnosis.
          </span>
        </div>

        {/* Status Message */}
        {submitStatus && (
          <div
            className={`p-3.5 rounded-xl text-xs flex flex-col gap-1.5 leading-relaxed ${
              submitStatus.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {submitStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{submitStatus.text}</span>
            </div>
            {submitStatus.mailtoUrl && (
              <div className="mt-1">
                <a
                  href={submitStatus.mailtoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline font-semibold text-primary hover:text-primary/80"
                >
                  <span>Open in your email app to send</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-1 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-muted transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
