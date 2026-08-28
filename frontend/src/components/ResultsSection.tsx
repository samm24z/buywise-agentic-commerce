import React from 'react';
import {
  SlidersHorizontal,
  Scale,
  Zap,
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product, RecommendResponse } from '../types';

interface ResultsSectionProps {
  isLoading: boolean;
  error: string | null;
  data: RecommendResponse | null;
  hasSearched: boolean;
  onRetry: () => void;
  onPurchase: (product: Product) => void;
  evaluatingProductId: string | null;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  isLoading,
  error,
  data,
  hasSearched,
  onRetry,
  onPurchase,
  evaluatingProductId,
}) => {
  // 1. Loading State
  if (isLoading) {
    return (
      <section className="max-w-4xl mx-auto mt-12 mb-16 px-4">
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-12 text-center backdrop-blur-sm shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 mx-auto mb-4 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-200 mb-2">
            BuyWise is evaluating your options...
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Analyzing product specs, strict budget ceilings, and verified merchant reliability.
          </p>
        </div>
      </section>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <section className="max-w-3xl mx-auto mt-10 mb-16 px-4">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-8 text-center backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center justify-center text-red-400 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-200 mb-2">
            Evaluation Failed
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-medium border border-zinc-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </section>
    );
  }

  // 3. Results State (Has Searched & Data Received)
  if (hasSearched && data) {
    const { recommendations, explanation, intent } = data;

    // Zero matching products state
    if (recommendations.length === 0) {
      return (
        <section className="max-w-3xl mx-auto mt-10 mb-16 px-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 sm:p-10 text-center backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <Info className="w-6 h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-200 mb-3">
              No Direct Matches Within Budget
            </h2>
            <p className="text-sm text-zinc-300 max-w-lg mx-auto mb-4 leading-relaxed">
              {explanation}
            </p>
            {intent.budget && (
              <span className="inline-block text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                Current Budget Ceiling: ₹{intent.budget.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </section>
      );
    }

    // Success State with 1+ Recommendations
    return (
      <section className="max-w-6xl mx-auto mt-8 mb-16 px-4">
        {/* Business Explanation Box */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                AI Agent Evaluation Summary
              </h2>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((product, idx) => (
            <ProductCard
              key={product.id || idx}
              product={product}
              rank={idx + 1}
              onPurchase={onPurchase}
              isCheckingPolicy={evaluatingProductId === product.id}
            />
          ))}
        </div>
      </section>
    );
  }

  // 4. Initial Empty State (Before any search)
  return (
    <section className="max-w-4xl mx-auto mt-12 mb-16 px-4">
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-8 sm:p-12 text-center backdrop-blur-sm shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-400 mx-auto mb-4">
          <SlidersHorizontal className="w-6 h-6 text-emerald-400" />
        </div>

        <h2 className="text-lg sm:text-xl font-semibold text-zinc-200 mb-2">
          Evaluation Workspace
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8">
          Tell BuyWise what you're looking for and it will evaluate the available options.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-zinc-800/80">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 mb-2 text-zinc-200 text-sm font-medium">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Strict Budget Filter</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero over-budget recommendations. Only options that match your exact price ceiling are evaluated.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 mb-2 text-zinc-200 text-sm font-medium">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Priority Weighting</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Calculates deterministic match scores tailored to your gaming, call quality, or battery demands.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 mb-2 text-zinc-200 text-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Trust & SLA</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Evaluates merchant trust rating, delivery turnaround days, and warranty protection.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
