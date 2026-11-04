import React from 'react';
import { Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';

export default function MaintenanceScreen() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-[#07080a] text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 max-w-md w-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl shadow-black/80">
        
        {/* Pulsing Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Scheduled Platform Maintenance</span>
        </div>

        {/* Foclyra Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/15 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Sparkles className="w-8 h-8 text-amber-300" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-3">
          Changes in Progress
        </h1>

        {/* Message */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          Foclyra is currently undergoing planned system upgrades and security enhancements. Access is temporarily paused while we finish testing.
        </p>

        {/* Trust Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All your saved courses, notes & progress are safely preserved.</span>
        </div>

        {/* Refresh Action */}
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white text-zinc-950 font-medium text-sm hover:bg-zinc-200 active:scale-[0.98] transition-all cursor-pointer shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Check if Online</span>
        </button>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-zinc-600 tracking-wide">
        Foclyra Studio &middot; We'll be back shortly
      </p>
    </div>
  );
}
