import React from 'react';
import {
  Star,
  Gamepad2,
  Phone,
  BatteryMedium,
  ShieldCheck,
  Truck,
  Shield,
  Check,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  rank: number;
  onPurchase: (product: Product) => void;
  isCheckingPolicy: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  rank,
  onPurchase,
  isCheckingPolicy,
}) => {
  const isTopPick = rank === 1;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-zinc-900/60 backdrop-blur-sm p-5 sm:p-6 ${
        isTopPick
          ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/20'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div>
        {/* Header: Rank / Match Score & Rating */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isTopPick
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
              }`}
            >
              #{rank} {isTopPick ? 'Top Choice' : 'Recommendation'}
            </span>
            {product.match_score !== undefined && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800/80 text-emerald-400">
                {product.match_score}% Match
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Product Name & Brand */}
        <div className="mb-4">
          <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">
            {product.brand} &middot; {product.category}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-zinc-100 line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Price & Merchant */}
        <div className="flex items-baseline justify-between pb-4 mb-4 border-b border-zinc-800/80">
          <div>
            <span className="text-2xl font-extrabold text-zinc-100 tracking-tight">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 block">Sold by</span>
            <span className="text-xs font-medium text-zinc-200">
              {product.merchant}
            </span>
          </div>
        </div>

        {/* Scores & Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Gamepad2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Gaming</span>
            </div>
            <span className="font-semibold text-zinc-200">
              {product.gaming_score}/10
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              <span>Calls</span>
            </div>
            <span className="font-semibold text-zinc-200">
              {product.call_quality_score}/10
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <BatteryMedium className="w-3.5 h-3.5 text-zinc-400" />
              <span>Battery</span>
            </div>
            <span className="font-semibold text-zinc-200">
              {product.battery_score}/10
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trust</span>
            </div>
            <span className="font-semibold text-zinc-200">
              {product.merchant_trust_score}/10
            </span>
          </div>
        </div>

        {/* Delivery & Warranty Meta */}
        <div className="flex items-center justify-between text-xs text-zinc-400 py-2 px-3 rounded-lg bg-zinc-950/40 border border-zinc-800/40 mb-4">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {product.delivery_days === 1
                ? '1 Day Delivery'
                : `${product.delivery_days} Days Delivery`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            <span>{product.warranty_months} Mos Warranty</span>
          </div>
        </div>

        {/* Features List (2–3 items) */}
        <div className="space-y-1.5 mb-5">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Key Features
          </span>
          {product.features.slice(0, 3).map((feature, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase CTA */}
      <button
        type="button"
        disabled={isCheckingPolicy}
        onClick={() => onPurchase(product)}
        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          isTopPick
            ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
        }`}
      >
        {isCheckingPolicy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Checking purchase policy...</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            <span>Purchase</span>
          </>
        )}
      </button>
    </div>
  );
};
