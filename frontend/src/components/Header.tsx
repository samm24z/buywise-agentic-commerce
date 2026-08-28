import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand & AI Label */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-lg tracking-tight text-zinc-100">
              BuyWise
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
              AI Purchase Agent
            </span>
          </div>
        </div>

        {/* Right: Agent Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-zinc-300">Agent Ready</span>
        </div>
      </div>
    </header>
  );
};
