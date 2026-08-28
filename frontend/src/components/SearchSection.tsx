import React from 'react';
import { Search, Sparkles, ArrowRight } from 'lucide-react';

interface SearchSectionProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  query,
  onQueryChange,
  onSubmit,
}) => {
  return (
    <section className="text-center pt-8 pb-4 max-w-3xl mx-auto">
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 mb-4 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>AI-Powered Purchase Decision Engine</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-100 mb-3 sm:mb-4">
        Buy smarter. <span className="text-zinc-400">Let AI decide.</span>
      </h1>

      {/* Supporting Text */}
      <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
        BuyWise compares products based on strict budget limits, your performance priorities, and verified merchant trust scores to deliver explainable recommendations.
      </p>

      {/* Search Input Box */}
      <form onSubmit={onSubmit} className="relative group max-w-2xl mx-auto">
        <div className="relative flex items-center bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2 shadow-2xl transition-all duration-200 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30">
          <div className="pl-3 pr-2 text-zinc-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="e.g. I need gaming headphones under ₹5,000 with a good microphone"
            className="w-full bg-transparent text-zinc-100 placeholder:text-zinc-500 text-sm sm:text-base px-2 py-2.5 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white text-xs sm:text-sm font-semibold transition-colors duration-150 shadow-sm cursor-pointer"
          >
            <span>Find the best options</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </section>
  );
};
