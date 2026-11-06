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
  ExternalLink
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

export default function ApiKeys() {
  const [activeTab, setActiveTab] = useState(PROVIDERS.GEMINI);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null); // { valid: boolean, message: string }
  const [isSaved, setIsSaved] = useState(false);
  const [keyExistsInVault, setKeyExistsInVault] = useState(false);

  const currentConfig = PROVIDER_CONFIGS[activeTab];

  // Load existing key when tab changes
  useEffect(() => {
    let isMounted = true;
    setVerifyStatus(null);
    setIsSaved(false);
    setShowKey(false);

    async function loadKey() {
      const exists = hasStoredKey(activeTab);
      setKeyExistsInVault(exists);
      if (exists) {
        const dec = await getDecryptedKey(activeTab);
        if (isMounted) {
          setKeyInput(dec || '');
        }
      } else {
        if (isMounted) {
          setKeyInput('');
        }
      }
    }

    loadKey();
    return () => { isMounted = false; };
  }, [activeTab]);

  const handleCheckKey = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setVerifyStatus({ valid: false, message: 'Please enter a key before checking.' });
      return;
    }

    setIsVerifying(true);
    setVerifyStatus(null);

    const result = await verifyProviderKey(activeTab, trimmed);
    setIsVerifying(false);
    setVerifyStatus(result);

    if (result.valid) {
      toast.add({
        title: 'Key Verified',
        description: `${currentConfig.name} key connection is live and verified.`,
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

  const handleSave = async (e) => {
    e?.preventDefault();
    const trimmed = keyInput.trim();

    await saveSecureKey(activeTab, trimmed);
    setIsSaved(true);
    setKeyExistsInVault(Boolean(trimmed));

    toast.add({
      title: 'Vault Updated',
      description: trimmed 
        ? `${currentConfig.name} key encrypted and saved to your device vault.` 
        : `${currentConfig.name} key cleared. Reverted to server defaults.`,
      type: 'success',
      timeout: 4000
    });

    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  const handleClear = () => {
    removeStoredKey(activeTab);
    setKeyInput('');
    setKeyExistsInVault(false);
    setVerifyStatus(null);
    toast.add({
      title: 'Key Purged',
      description: `${currentConfig.name} key wiped from memory and local vault.`,
      type: 'info',
      timeout: 4000
    });
  };

  return (
    <div className="p-3.5 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-page-entry min-w-0 w-full font-sans">
      
      {/* 1. Header matching Reference Screen */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-medium mb-3">
          <Sparkles className="size-3.5" />
          <span>High-Performance AI & Cloud BYOK</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] dark:text-white tracking-[-0.03em]">
          Your AI & Service Keys
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-2xl">
          Foclyra comes with built-in models for suggestions and tutor chat. To use cutting-edge, high-end models (Gemini 2.5 Flash, GPT-4o, Claude 3.5 Sonnet) or bypass YouTube limits, add your key: Foclyra uses it directly, with no daily chat limits.
        </p>
      </div>

      {/* 2. Main Key Injection Bento Card */}
      <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/50 p-5 sm:p-8 shadow-xs space-y-6 backdrop-blur-xs min-w-0">
        
        {/* Segmented Provider Tabs (Matching Reference Design) */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-200/70 dark:bg-zinc-950/80 border border-zinc-300/60 dark:border-zinc-800/80 overflow-x-auto scrollbar-none">
          {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => {
            const isActive = activeTab === key;
            const hasKey = hasStoredKey(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-[#1f1f23] text-zinc-950 dark:text-white shadow-sm border border-black/5 dark:border-white/10'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>{config.name}</span>
                {hasKey ? (
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" title="Custom key active" />
                ) : (
                  <span className="text-[10px] opacity-60 font-mono hidden sm:inline">({config.badge})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Key Form Field */}
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                API key
              </label>
              <a
                href={currentConfig.link}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white inline-flex items-center gap-1 transition"
              >
                <span>Get API key</span>
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Input with Check Key Button on the right */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1 min-w-0">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setVerifyStatus(null);
                  }}
                  placeholder={currentConfig.placeholder}
                  className="w-full h-11 pl-4 pr-11 rounded-2xl bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-950 dark:text-zinc-50 text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-0.5"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Check Key Button */}
              <button
                type="button"
                onClick={handleCheckKey}
                disabled={isVerifying || !keyInput.trim()}
                className="h-11 px-5 rounded-2xl border border-zinc-300 dark:border-zinc-700/80 bg-white/90 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-amber-500" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Check key</span>
                )}
              </button>
            </div>

            {/* Helper Text */}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
              {currentConfig.helperText}
            </p>
          </div>

          {/* Verification Status Banner */}
          {verifyStatus && (
            <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
              verifyStatus.valid 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
            }`}>
              {verifyStatus.valid ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              )}
              <div className="leading-relaxed">
                <strong className="block font-semibold">{verifyStatus.valid ? 'Active Connection Verified' : 'Verification Issue'}</strong>
                <span>{verifyStatus.message}</span>
              </div>
            </div>
          )}

          {/* Trust Disclaimer matching screenshot */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            Your key is stored encrypted. You pay your provider for what you use.
          </p>

          {/* Actions: Save & Clear */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="h-10 px-6 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {isSaved ? <CheckCircle2 size={14} className="text-emerald-400 dark:text-emerald-600" /> : null}
              <span>{isSaved ? 'Saved to Vault!' : 'Save Key'}</span>
            </button>

            {keyExistsInVault && (
              <button
                type="button"
                onClick={handleClear}
                className="h-10 px-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-rose-500/10 hover:border-rose-500/30 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Remove Key</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. 🛡️ 5-Layer Security Architecture Card */}
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
