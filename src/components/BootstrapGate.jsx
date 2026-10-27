import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { bootstrapApp, retryBootstrap } from '../db/bootstrap';

export default function BootstrapGate({ children }) {
  const [status, setStatus] = useState('initializing');

  const initialize = useCallback(async (retry = false) => {
    setStatus('initializing');
    try {
      await (retry ? retryBootstrap() : bootstrapApp());
      setStatus('ready');
    } catch (error) {
      console.error('[Foclyra bootstrap failed]:', error);
      setStatus('failed');
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setStatus('initializing');
      try {
        await bootstrapApp();
        if (active) setStatus('ready');
      } catch (error) {
        console.error('[Foclyra bootstrap failed]:', error);
        if (active) setStatus('failed');
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  if (status === 'initializing') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 space-y-4">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <span className="text-sm text-zinc-500 uppercase tracking-widest font-semibold">
          Initializing Foclyra Database...
        </span>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
          <AlertTriangle size={28} />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-xl font-extrabold text-white">Foclyra could not open local storage</h1>
          <p className="text-sm text-zinc-400">
            Your existing learning data has not been changed. Retry the local database connection to continue.
          </p>
        </div>
        <button
          type="button"
          onClick={() => initialize(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Retry Database
        </button>
      </div>
    );
  }

  return children;
}
