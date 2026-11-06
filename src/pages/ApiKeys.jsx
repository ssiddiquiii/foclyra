import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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

const AI_PROVIDERS = [PROVIDERS.OPENAI, PROVIDERS.GEMINI, PROVIDERS.CLAUDE];

export default function ApiKeys() {
  // AI Key State
  const [activeAiTab, setActiveAiTab] = useState(PROVIDERS.OPENAI);
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [showAiKey, setShowAiKey] = useState(false);
  const [isAiVerifying, setIsAiVerifying] = useState(false);
  const [aiVerifyStatus, setAiVerifyStatus] = useState(null);
  const [isAiSaved, setIsAiSaved] = useState(false);
  const [aiKeyExists, setAiKeyExists] = useState(false);

  // YouTube Key State
  const [ytKeyInput, setYtKeyInput] = useState('');
  const [showYtKey, setShowYtKey] = useState(false);
  const [isYtVerifying, setIsYtVerifying] = useState(false);
  const [ytVerifyStatus, setYtVerifyStatus] = useState(null);
  const [isYtSaved, setIsYtSaved] = useState(false);
  const [ytKeyExists, setYtKeyExists] = useState(false);

  const currentAiConfig = PROVIDER_CONFIGS[activeAiTab];
  const ytConfig = PROVIDER_CONFIGS[PROVIDERS.YOUTUBE];

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

  const handleCheckAiKey = async () => {
    const trimmed = aiKeyInput.trim();
    if (!trimmed) {
      setAiVerifyStatus({ valid: false, message: 'Enter a key first.' });
      return;
    }

    setIsAiVerifying(true);
    setAiVerifyStatus(null);

    const result = await verifyProviderKey(activeAiTab, trimmed);
    setIsAiVerifying(false);
    setAiVerifyStatus(result);

    toast.add({
      title: result.valid ? 'Key verified' : 'Invalid key',
      description: result.message,
      type: result.valid ? 'success' : 'error',
      timeout: 4000
    });
  };

  const handleSaveAiKey = async (e) => {
    e?.preventDefault();
    const trimmed = aiKeyInput.trim();

    await saveSecureKey(activeAiTab, trimmed);
    setIsAiSaved(true);
    setAiKeyExists(Boolean(trimmed));

    toast.add({
      title: trimmed ? 'Key saved' : 'Key removed',
      description: trimmed 
        ? `${currentAiConfig.name} key stored encrypted on this device.` 
        : `${currentAiConfig.name} key cleared.`,
      type: 'success',
      timeout: 3500
    });

    setTimeout(() => setIsAiSaved(false), 3000);
  };

  const handleClearAiKey = () => {
    removeStoredKey(activeAiTab);
    setAiKeyInput('');
    setAiKeyExists(false);
    setAiVerifyStatus(null);
    toast.add({
      title: 'Key removed',
      description: `${currentAiConfig.name} key removed from this device.`,
      type: 'info',
      timeout: 3500
    });
  };

  const handleCheckYtKey = async () => {
    const trimmed = ytKeyInput.trim();
    if (!trimmed) {
      setYtVerifyStatus({ valid: false, message: 'Enter a key first.' });
      return;
    }

    setIsYtVerifying(true);
    setYtVerifyStatus(null);

    const result = await verifyProviderKey(PROVIDERS.YOUTUBE, trimmed);
    setIsYtVerifying(false);
    setYtVerifyStatus(result);

    toast.add({
      title: result.valid ? 'Key verified' : 'Invalid key',
      description: result.message,
      type: result.valid ? 'success' : 'error',
      timeout: 4000
    });
  };

  const handleSaveYtKey = async (e) => {
    e?.preventDefault();
    const trimmed = ytKeyInput.trim();

    await saveSecureKey(PROVIDERS.YOUTUBE, trimmed);
    setIsYtSaved(true);
    setYtKeyExists(Boolean(trimmed));

    toast.add({
      title: trimmed ? 'Key saved' : 'Key removed',
      description: trimmed 
        ? 'YouTube Data API key stored encrypted on this device.' 
        : 'Reverted to default proxy.',
      type: 'success',
      timeout: 3500
    });

    setTimeout(() => setIsYtSaved(false), 3000);
  };

  const handleClearYtKey = () => {
    removeStoredKey(PROVIDERS.YOUTUBE);
    setYtKeyInput('');
    setYtKeyExists(false);
    setYtVerifyStatus(null);
    toast.add({
      title: 'Key removed',
      description: 'Reverted to default YouTube proxy.',
      type: 'info',
      timeout: 3500
    });
  };

  return (
    <div className="py-6 sm:py-10 px-2 sm:px-6 max-w-3xl mx-auto space-y-12 animate-page-entry min-w-0 w-full font-sans">
      
      {/* =========================================================================
          SECTION 1: YOUR AI KEY
          ========================================================================= */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#111111] dark:text-white tracking-[-0.03em]">
            Your AI key
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-[13.5px] sm:text-[14.5px] leading-relaxed max-w-2xl">
            Foclyra comes with a few AI models for suggestions and the chat. To use cutting-edge, high-end models, add your key: your workspace uses it instead, with no daily chat limit.
          </p>
        </div>

        {/* Provider Segmented Track */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-[#111113] border border-zinc-200/80 dark:border-zinc-800/90 overflow-x-auto scrollbar-none">
          {AI_PROVIDERS.map((key) => {
            const config = PROVIDER_CONFIGS[key];
            const isActive = activeAiTab === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveAiTab(key)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-[13.5px] transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-[#2b1912] text-zinc-950 dark:text-[#f5d0b5] font-medium shadow-2xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {config.name}
              </button>
            );
          })}
        </div>

        {/* AI Key Input Form */}
        <form onSubmit={handleSaveAiKey} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="ai-key-input" className="block text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              API key
            </label>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 min-w-0">
                <input
                  id="ai-key-input"
                  type={showAiKey ? 'text' : 'password'}
                  value={aiKeyInput}
                  onChange={(e) => {
                    setAiKeyInput(e.target.value);
                    setAiVerifyStatus(null);
                  }}
                  placeholder="Paste your key"
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 text-[13.5px] focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition"
                />
                {aiKeyInput && (
                  <button
                    type="button"
                    onClick={() => setShowAiKey((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-0.5"
                    aria-label={showAiKey ? 'Hide key' : 'Show key'}
                    tabIndex={-1}
                  >
                    {showAiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheckAiKey}
                disabled={isAiVerifying || !aiKeyInput.trim()}
                className="text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 inline-flex items-center gap-1.5"
              >
                {isAiVerifying && <Loader2 size={13} className="animate-spin" />}
                <span>{isAiVerifying ? 'Checking...' : 'Check key'}</span>
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
              {currentAiConfig.helperText}{' '}
              <a
                href={currentAiConfig.link}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              >
                Get key
              </a>
            </p>
          </div>

          {aiVerifyStatus && (
            <p className={`text-xs ${
              aiVerifyStatus.valid 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {aiVerifyStatus.message}
            </p>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            Your key is stored encrypted. You pay your provider for what you use.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="h-9 px-5 rounded-lg bg-zinc-900 dark:bg-[#8e8e93] text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-300 text-[13px] font-medium transition cursor-pointer active:scale-[0.98]"
            >
              {isAiSaved ? 'Saved' : 'Save'}
            </button>

            {aiKeyExists && (
              <button
                type="button"
                onClick={handleClearAiKey}
                className="text-xs text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition cursor-pointer"
              >
                Remove key
              </button>
            )}
          </div>
        </form>
      </section>

      <hr className="border-zinc-200/80 dark:border-zinc-800/80" />

      {/* =========================================================================
          SECTION 2: YOUTUBE DATA API
          ========================================================================= */}
      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-white tracking-[-0.03em]">
            YouTube Data API
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-[13.5px] sm:text-[14.5px] leading-relaxed max-w-2xl">
            Foclyra includes a built-in proxy for importing playlists and lectures. Add your personal Google Cloud key if you want dedicated quota without rate limits.
          </p>
        </div>

        <form onSubmit={handleSaveYtKey} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="yt-key-input" className="block text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              API key
            </label>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 min-w-0">
                <input
                  id="yt-key-input"
                  type={showYtKey ? 'text' : 'password'}
                  value={ytKeyInput}
                  onChange={(e) => {
                    setYtKeyInput(e.target.value);
                    setYtVerifyStatus(null);
                  }}
                  placeholder="Paste your key"
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 text-[13.5px] focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition"
                />
                {ytKeyInput && (
                  <button
                    type="button"
                    onClick={() => setShowYtKey((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-0.5"
                    aria-label={showYtKey ? 'Hide key' : 'Show key'}
                    tabIndex={-1}
                  >
                    {showYtKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheckYtKey}
                disabled={isYtVerifying || !ytKeyInput.trim()}
                className="text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 inline-flex items-center gap-1.5"
              >
                {isYtVerifying && <Loader2 size={13} className="animate-spin" />}
                <span>{isYtVerifying ? 'Checking...' : 'Check key'}</span>
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
              {ytConfig.helperText}{' '}
              <a
                href={ytConfig.link}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              >
                Google Cloud Console
              </a>
            </p>
          </div>

          {ytVerifyStatus && (
            <p className={`text-xs ${
              ytVerifyStatus.valid 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {ytVerifyStatus.message}
            </p>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            Your key is stored encrypted. Leave empty to use the built-in proxy.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="h-9 px-5 rounded-lg bg-zinc-900 dark:bg-[#8e8e93] text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-300 text-[13px] font-medium transition cursor-pointer active:scale-[0.98]"
            >
              {isYtSaved ? 'Saved' : 'Save'}
            </button>

            {ytKeyExists && (
              <button
                type="button"
                onClick={handleClearYtKey}
                className="text-xs text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition cursor-pointer"
              >
                Remove key
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
