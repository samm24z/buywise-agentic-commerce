import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  X,
  CreditCard,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { PolicyCheckResponse, Product, PaymentOrderResponse } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PolicyCheckResponse | null;
  error: string | null;
  onProceedToPayment?: (product: Product, order: PaymentOrderResponse) => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  result,
  error,
  onProceedToPayment,
}) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isApproved = result?.decision.decision === 'APPROVED';
  const isBlocked = result?.decision.decision === 'BLOCKED';

  const handleContinuePayment = async () => {
    if (!result?.product) return;

    setIsCreatingOrder(true);
    setOrderError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: result.product.id,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Payment order creation failed (HTTP ${response.status}: ${response.statusText})`
        );
      }

      const orderData: PaymentOrderResponse = await response.json();

      if (!orderData.allowed || orderData.mode === 'blocked') {
        setOrderError(
          orderData.message || 'Payment order blocked: Policy constraints not satisfied.'
        );
        return;
      }

      // Successfully created order (demo or razorpay mode)
      onClose();
      if (onProceedToPayment) {
        onProceedToPayment(result.product, orderData);
      }
    } catch (err: unknown) {
      setOrderError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to BuyWise payment service.'
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleClose = () => {
    setOrderError(null);
    setIsCreatingOrder(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
          aria-label="Close policy check"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
          <span>BuyWise Policy Check</span>
        </div>

        {/* Network / General Error State */}
        {error && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* APPROVED State */}
        {isApproved && result && (
          <div className="space-y-5">
            {/* Status Banner */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-300">
                  Purchase Approved
                </h3>
                <span className="text-xs text-emerald-400/80">
                  All safety and spending limits verified
                </span>
              </div>
            </div>

            {/* Checklist of Policy Rules */}
            <div className="space-y-2 py-2 border-y border-zinc-900">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Budget check (≤ ₹{result.policy.max_purchase_amount.toLocaleString('en-IN')})</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Merchant trust check (≥ {result.policy.min_merchant_trust}/10)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Category check ({result.product.category})</span>
              </div>
            </div>

            {/* Product & Evaluation Breakdown */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Product</span>
                <span className="font-semibold text-zinc-200 max-w-[200px] truncate text-right">
                  {result.product.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Price</span>
                <span className="font-bold text-zinc-100">
                  ₹{result.product.price.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Max Purchase Limit</span>
                <span className="font-medium text-zinc-300">
                  ₹{result.policy.max_purchase_amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Merchant Trust Score</span>
                <span className="font-medium text-emerald-400">
                  {result.product.merchant_trust_score}/10
                </span>
              </div>
            </div>

            {/* Error Message if order creation fails */}
            {orderError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              disabled={isCreatingOrder}
              onClick={handleContinuePayment}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Preparing Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Continue to Payment</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 text-center text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Back to recommendations
            </button>
          </div>
        )}

        {/* BLOCKED State */}
        {isBlocked && result && (
          <div className="space-y-5">
            {/* Status Banner */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400">
              <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/40">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-300 uppercase tracking-wide">
                  Purchase Blocked
                </h3>
                <span className="text-xs text-red-400/80">
                  Policy violation detected
                </span>
              </div>
            </div>

            {/* Failed Checks Breakdown */}
            <div className="space-y-2 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Failed Policy Checks
              </span>
              
              {!result.decision.checks.budget && (
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-red-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Budget Limit Exceeded</span>
                  </div>
                  <p className="text-xs text-zinc-300 pl-5">
                    Price ₹{result.product.price.toLocaleString('en-IN')} exceeds your ₹{result.policy.max_purchase_amount.toLocaleString('en-IN')} spending limit.
                  </p>
                </div>
              )}

              {!result.decision.checks.merchant_trust && (
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-red-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Merchant Trust Insufficient</span>
                  </div>
                  <p className="text-xs text-zinc-300 pl-5">
                    Merchant trust score ({result.product.merchant_trust_score}/10) is below minimum {result.policy.min_merchant_trust}/10.
                  </p>
                </div>
              )}

              {!result.decision.checks.category_allowed && (
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-red-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Category Disallowed</span>
                  </div>
                  <p className="text-xs text-zinc-300 pl-5">
                    Category &apos;{result.product.category}&apos; is not allowed by policy.
                  </p>
                </div>
              )}
            </div>

            {/* Notice */}
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
              <span className="text-xs font-medium text-zinc-400">
                Payment was not initiated.
              </span>
            </div>

            {/* Back Button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs sm:text-sm font-semibold border border-zinc-800 transition-colors cursor-pointer"
            >
              Back to recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
