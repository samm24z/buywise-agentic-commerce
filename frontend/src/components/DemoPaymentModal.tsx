import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { PaymentOrderResponse, PaymentVerifyResponse, Product } from '../types';

interface DemoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PaymentOrderResponse | null;
  product: Product | null;
  onPaymentSuccess?: (verification: PaymentVerifyResponse) => void;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export const DemoPaymentModal: React.FC<DemoPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  product,
  onPaymentSuccess,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PaymentVerifyResponse | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setSimError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'demo',
          order_id: order.order_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Simulation verification failed (HTTP ${response.status})`);
      }

      const result: PaymentVerifyResponse = await response.json();
      setVerificationResult(result);
      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
    } catch (err: unknown) {
      setSimError(
        err instanceof Error ? err.message : 'Simulation failed. Please try again.'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClose = () => {
    setVerificationResult(null);
    setSimError(null);
    onClose();
  };

  const productName = product?.name || order.product_name || 'Selected Item';
  const displayAmount = order.amount ?? product?.price ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden text-zinc-100 ring-1 ring-amber-500/20">
        {/* Glow ambient decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>DEMO PAYMENT MODE</span>
          </span>
        </div>

        {/* Simulation Success State */}
        {verificationResult ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Success Banner */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-emerald-300">
                  Demo Payment Completed
                </h3>
                <p className="text-xs text-emerald-400/90 leading-relaxed">
                  The simulated checkout flow concluded successfully.
                </p>
              </div>
            </div>

            {/* Prominent Demo Notice */}
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>DEMO / NOT A REAL TRANSACTION</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                No actual payment gateway was contacted and no real currency was transferred.
              </p>
            </div>

            {/* Order Details Receipt */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Demo Order ID</span>
                <span className="font-mono text-zinc-300 text-[11px]">{order.order_id}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Product</span>
                <span className="font-semibold text-zinc-200 max-w-[200px] truncate text-right">
                  {productName}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Amount</span>
                <span className="font-extrabold text-zinc-100 text-sm">
                  ₹{displayAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Status</span>
                <span className="font-semibold text-amber-400 uppercase tracking-wide">
                  {verificationResult.status}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Done &amp; Return to Shop
            </button>
          </div>
        ) : (
          /* Demo Payment Form State */
          <div className="space-y-5">
            {/* Informational Callout */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200/90 text-xs space-y-1">
              <p className="font-semibold text-amber-300">
                No Razorpay credentials are configured.
              </p>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                No real money will be charged. This sandbox simulator allows full evaluation of BuyWise agentic workflows.
              </p>
            </div>

            {/* Product & Price Summary */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 text-xs">
              <div className="flex justify-between items-start gap-3">
                <span className="text-zinc-400">Product:</span>
                <span className="font-semibold text-zinc-100 text-right leading-snug">
                  {productName}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800/60">
                <span className="text-zinc-400">Amount:</span>
                <span className="text-xl font-extrabold text-emerald-400 tracking-tight">
                  ₹{displayAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-zinc-500">
                <span>Payment Gate:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Policy Approved
                </span>
              </div>
            </div>

            {/* Error banner if simulation failed */}
            {simError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
                {simError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={isSimulating}
                onClick={handleSimulatePayment}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-zinc-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-lg shadow-amber-950/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Simulating Payment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-zinc-950" />
                    <span>Simulate Successful Payment</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSimulating}
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
