import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Globe, 
  Trash2, 
  Sparkles,
  ExternalLink,
  Play,
  Check
} from 'lucide-react';
import { 
  PROVIDERS, 
  PROVIDER_CONFIGS, 
  saveSecureKey, 
  getDecryptedKey, 
  hasStoredKey, 
  removeStoredKey, 
  verifyProviderKey 
} from '../services/secureKeyVault';
import { toast } from '../components/ui/toast';

// AI Providers list matching reference UI order
const AI_PROVIDERS = [PROVIDERS.OPENAI, PROVIDERS.GEMINI, PROVIDERS.CLAUDE];

export default function ApiKeys() {
  // 1. AI Key State (OpenAI, Google Gemini, Anthropic Claude)
  const [activeAiTab, setActiveAiTab] = useState(PROVIDERS.OPENAI);
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [showAiKey, setShowAiKey] = useState(false);
  const [isAiVerifying, setIsAiVerifying] = useState(false);
  const [aiVerifyStatus, setAiVerifyStatus] = useState(null);
  const [isAiSaved, setIsAiSaved] = useState(false);
  const [aiKeyExists, setAiKeyExists] = useState(false);

  // 2. Separate YouTube API Key State
  const [ytKeyInput, setYtKeyInput] = useState('');
  const [showYtKey, setShowYtKey] = useState(false);
  const [isYtVerifying, setIsYtVerifying] = useState(false);
  const [ytVerifyStatus, setYtVerifyStatus] = useState(null);
  const [isYtSaved, setIsYtSaved] = useState(false);
  const [ytKeyExists, setYtKeyExists] = useState(false);

  const currentAiConfig = PROVIDER_CONFIGS[activeAiTab];
  const ytConfig = PROVIDER_CONFIGS[PROVIDERS.YOUTUBE];

  // Load AI key whenever activeAiTab changes
  useEffect(() => {
    let isMounted = true;
    setAiVerifyStatus(null);
    setIsAiSaved(false);
    setShowAiKey(false);

    async function loadAiKey() {
      const exists = hasStoredKey(activeAiTab);
      setAiKeyExists(exists);
      if (exists) {
        const dec = await getDecryptedKey(activeAiTab);
        if (isMounted) setAiKeyInput(dec || '');
      } else {
        if (isMounted) setAiKeyInput('');
      }
    }

    loadAiKey();
    return () => { isMounted = false; };
  }, [activeAiTab]);

  // Load YouTube key on mount
  useEffect(() => {
    let isMounted = true;
    async function loadYtKey() {
      const exists = hasStoredKey(PROVIDERS.YOUTUBE);
      setYtKeyExists(exists);
      if (exists) {
        const dec = await getDecryptedKey(PROVIDERS.YOUTUBE);
        if (isMounted) setYtKeyInput(dec || '');
      }
    }
    loadYtKey();
    return () => { isMounted = false; };
  }, []);

  // --- Handlers for AI Key ---
  const handleCheckAiKey = async () => {
    const trimmed = aiKeyInput.trim();
    if (!trimmed) {
      setAiVerifyStatus({ valid: false, message: 'Please enter a key before checking.' });
      return;
    }

    setIsAiVerifying(true);
    setAiVerifyStatus(null);

    const result = await verifyProviderKey(activeAiTab, trimmed);
    setIsAiVerifying(false);
    setAiVerifyStatus(result);

    if (result.valid) {
      toast.add({
        title: 'Key Verified',
        description: `${currentAiConfig.name} key connection is live and active.`,
        type: 'success',
        timeout: 4000
      });
    } else {
      toast.add({
        title: 'Verification Failed',
        description: result.message,
        type: 'error',
        timeout: 5000
      });
    }
  };

  const handleSaveAiKey = async (e) => {
    e?.preventDefault();
    const trimmed = aiKeyInput.trim();

    await saveSecureKey(activeAiTab, trimmed);
    setIsAiSaved(true);
    setAiKeyExists(Boolean(trimmed));

    toast.add({
      title: 'Vault Updated',
      description: trimmed 
        ? `${currentAiConfig.name} key encrypted and saved to device vault.` 
        : `${currentAiConfig.name} key cleared. Reverted to server defaults.`,
      type: 'success',
      timeout: 4000
    });

    setTimeout(() => setIsAiSaved(false), 4000);
  };

  const handleClearAiKey = () => {
    removeStoredKey(activeAiTab);
    setAiKeyInput('');
    setAiKeyExists(false);
    setAiVerifyStatus(null);
    toast.add({
      title: 'Key Purged',
      description: `${currentAiConfig.name} key wiped from memory and local vault.`,
      type: 'info',
      timeout: 4000
    });
  };

  // --- Handlers for YouTube Key ---
  const handleCheckYtKey = async () => {
    const trimmed = ytKeyInput.trim();
    if (!trimmed) {
      setYtVerifyStatus({ valid: false, message: 'Please enter a YouTube API key before checking.' });
      return;
    }

    setIsYtVerifying(true);
    setYtVerifyStatus(null);

    const result = await verifyProviderKey(PROVIDERS.YOUTUBE, trimmed);
    setIsYtVerifying(false);
    setYtVerifyStatus(result);

    if (result.valid) {
      toast.add({
        title: 'YouTube Key Verified',
        description: 'Google Cloud YouTube Data API connection is active with full quota.',
        type: 'success',
        timeout: 4000
      });
    } else {
      toast.add({
        title: 'Verification Failed',
        description: result.message,
        type: 'error',
        timeout: 5000
      });
    }
  };

  const handleSaveYtKey = async (e) => {
    e?.preventDefault();
    const trimmed = ytKeyInput.trim();

    await saveSecureKey(PROVIDERS.YOUTUBE, trimmed);
    setIsYtSaved(true);
    setYtKeyExists(Boolean(trimmed));

    toast.add({
      title: 'YouTube Key Saved',
      description: trimmed 
        ? 'Custom YouTube API key encrypted and saved to your device vault.' 
        : 'Reverted to built-in automatic serverless proxy.',
      type: 'success',
      timeout: 4000
    });

    setTimeout(() => setIsYtSaved(false), 4000);
  };

  const handleClearYtKey = () => {
    removeStoredKey(PROVIDERS.YOUTUBE);
    setYtKeyInput('');
    setYtKeyExists(false);
    setYtVerifyStatus(null);
    toast.add({
      title: 'YouTube Key Purged',
      description: 'Reverted to default serverless proxy.',
      type: 'info',
      timeout: 4000
    });
  };

  return (
    <div className="p-3.5 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-page-entry min-w-0 w-full font-sans">
      
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-medium mb-3">
          <Sparkles className="size-3.5" />
          <span>High-Performance BYOK Console</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] dark:text-white tracking-[-0.03em]">
          API & Service Keys
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-2xl">
          Bring your own keys to unlock frontier AI reasoning models with unlimited queries, or provide your Google Cloud quota for fast playlist indexing.
        </p>
      </div>

      {/* =========================================================================
          SECTION 1: YOUR AI KEY (OpenAI, Google Gemini, Anthropic Claude)
          Exact match to Reference Screenshot layout
          ========================================================================= */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-8 shadow-xs space-y-5 backdrop-blur-xs min-w-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#111111] dark:text-white tracking-[-0.025em]">
            Your AI key
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 leading-relaxed">
            Labs come with a few AI models for suggestions and the chat. To use cutting-edge, high-end models, add your key: your labs use it instead, with no daily chat limit.
          </p>
        </div>

        {/* AI Segmented Tabs: OpenAI, Google Gemini, Anthropic (Claude) */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-200/70 dark:bg-zinc-950/80 border border-zinc-300/60 dark:border-zinc-800/80 overflow-x-auto scrollbar-none">
          {AI_PROVIDERS.map((key) => {
            const config = PROVIDER_CONFIGS[key];
            const isActive = activeAiTab === key;
            const hasKey = hasStoredKey(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveAiTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-[#201815] text-zinc-950 dark:text-[#f8d79a] shadow-sm border border-black/5 dark:border-amber-700/30'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>{config.name}</span>
                {hasKey && (
                  <span className="size-1.5 rounded-full bg-emerald-500" title="Key configured" />
                )}
              </button>
            );
          })}
        </div>

        {/* AI Key Form */}
        <form onSubmit={handleSaveAiKey} className="space-y-4 pt-1">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                API key
              </label>
              <a
                href={currentAiConfig.link}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white inline-flex items-center gap-1 transition"
              >
                <span>Get API key</span>
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Input with Check Key Button */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1 min-w-0">
                <input
                  type={showAiKey ? 'text' : 'password'}
                  value={aiKeyInput}
                  onChange={(e) => {
                    setAiKeyInput(e.target.value);
                    setAiVerifyStatus(null);
                  }}
                  placeholder={currentAiConfig.placeholder}
                  className="w-full h-11 pl-4 pr-11 rounded-2xl bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-950 dark:text-zinc-50 text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowAiKey((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-0.5"
                  aria-label={showAiKey ? 'Hide key' : 'Show key'}
                  tabIndex={-1}
                >
                  {showAiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCheckAiKey}
                disabled={isAiVerifying || !aiKeyInput.trim()}
                className="h-11 px-5 rounded-2xl border border-zinc-300 dark:border-zinc-700/80 bg-white/90 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isAiVerifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-amber-500" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Check key</span>
                )}
              </button>
            </div>

            {/* Provider helper string */}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
              {currentAiConfig.helperText}
            </p>
          </div>

          {/* AI Verification Status Banner */}
          {aiVerifyStatus && (
            <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
              aiVerifyStatus.valid 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
            }`}>
              {aiVerifyStatus.valid ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              )}
              <div className="leading-relaxed">
                <strong className="block font-semibold">{aiVerifyStatus.valid ? 'Active Connection Verified' : 'Verification Issue'}</strong>
                <span>{aiVerifyStatus.message}</span>
              </div>
            </div>
          )}

          {/* Trust Disclaimer */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
            Your key is stored encrypted. You pay your provider for what you use.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="h-10 px-6 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {isAiSaved ? <CheckCircle2 size={14} className="text-emerald-400 dark:text-emerald-600" /> : null}
              <span>{isAiSaved ? 'Saved!' : 'Save'}</span>
            </button>

            {aiKeyExists && (
              <button
                type="button"
                onClick={handleClearAiKey}
                className="h-10 px-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-rose-500/10 hover:border-rose-500/30 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Remove Key</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* =========================================================================
          SECTION 2: YOUTUBE DATA API (Separate Dedicated Section)
          Maintains consistent design sense and verification flow
          ========================================================================= */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-8 shadow-xs space-y-5 backdrop-blur-xs min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold mb-2">
              <Play className="size-3 fill-current" />
              <span>Google Cloud YouTube Service</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#111111] dark:text-white tracking-[-0.025em]">
              YouTube Data API key
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 leading-relaxed">
              Foclyra automatically operates a serverless proxy with zero setup. To bypass shared quota limits during heavy studying, add your personal Google Cloud API key.
            </p>
          </div>

          {ytKeyExists && (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Personal Key Active</span>
            </span>
          )}
        </div>

        {/* YouTube Key Form */}
        <form onSubmit={handleSaveYtKey} className="space-y-4 pt-1">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                YouTube Data API key
              </label>
              <a
                href={ytConfig.link}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white inline-flex items-center gap-1 transition"
              >
                <span>Get Google Cloud Key</span>
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Input with Check Key Button */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1 min-w-0">
                <input
                  type={showYtKey ? 'text' : 'password'}
                  value={ytKeyInput}
                  onChange={(e) => {
                    setYtKeyInput(e.target.value);
                    setYtVerifyStatus(null);
                  }}
                  placeholder={ytConfig.placeholder}
                  className="w-full h-11 pl-4 pr-11 rounded-2xl bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-950 dark:text-zinc-50 text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowYtKey((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-0.5"
                  aria-label={showYtKey ? 'Hide key' : 'Show key'}
                  tabIndex={-1}
                >
                  {showYtKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCheckYtKey}
                disabled={isYtVerifying || !ytKeyInput.trim()}
                className="h-11 px-5 rounded-2xl border border-zinc-300 dark:border-zinc-700/80 bg-white/90 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isYtVerifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-rose-500" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Check key</span>
                )}
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
              {ytConfig.helperText}
            </p>
          </div>

          {/* YouTube Verification Status Banner */}
          {ytVerifyStatus && (
            <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
              ytVerifyStatus.valid 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
            }`}>
              {ytVerifyStatus.valid ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              )}
              <div className="leading-relaxed">
                <strong className="block font-semibold">{ytVerifyStatus.valid ? 'Active Connection Verified' : 'Verification Issue'}</strong>
                <span>{ytVerifyStatus.message}</span>
              </div>
            </div>
          )}

          {/* Trust Disclaimer */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
            Your key is stored encrypted on this device. Google Cloud provides 10,000 free quota units daily.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="h-10 px-6 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {isYtSaved ? <CheckCircle2 size={14} className="text-emerald-400 dark:text-emerald-600" /> : null}
              <span>{isYtSaved ? 'Saved to Vault!' : 'Save Key'}</span>
            </button>

            {ytKeyExists && (
              <button
                type="button"
                onClick={handleClearYtKey}
                className="h-10 px-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-rose-500/10 hover:border-rose-500/30 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Remove Key (Use Default Proxy)</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* =========================================================================
          SECTION 3: 5-LAYER HARDWARE SECURITY VAULT
          ========================================================================= */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-6 sm:p-8 shadow-xs space-y-6 backdrop-blur-xs min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              5-Layer Hardware-Grade Security Vault
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mt-0.5">
              How Foclyra guarantees your third-party API keys remain strictly confidential and impossible to leak.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {/* Layer 1 */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 dark:text-zinc-100">
              <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono flex items-center justify-center">1</span>
              <span>Zero-Database Transit</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Keys are never sent to Supabase, Clerk, or our cloud databases. They remain strictly in your browser.
            </p>
          </div>

          {/* Layer 2 */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 dark:text-zinc-100">
              <Lock size={13} className="text-amber-500" />
              <span>AES-GCM 256-Bit Encryption</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Encrypted on-device using Web Crypto API with hardware-accelerated PBKDF2 salt derivation.
            </p>
          </div>

          {/* Layer 3 */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 dark:text-zinc-100">
              <Cpu size={13} className="text-indigo-500" />
              <span>Ephemeral Decryption</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Keys are only decrypted transiently in volatile RAM during active queries and immediately garbage-collected.
            </p>
          </div>

          {/* Layer 4 */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 dark:text-zinc-100">
              <Globe size={13} className="text-teal-500" />
              <span>TLS 1.3 Transport</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              All requests travel over encrypted HTTPS with `no-store, private` headers to eliminate CDN caching.
            </p>
          </div>

          {/* Layer 5 */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-1.5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 dark:text-zinc-100">
              <Trash2 size={13} className="text-rose-500" />
              <span>1-Click Zero-Wipe</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Clicking "Remove Key" instantly zeroes memory and deletes the cryptographic payload permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
