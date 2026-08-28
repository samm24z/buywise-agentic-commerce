import React, { useState } from 'react';
import { Header } from './components/Header';
import { SearchSection } from './components/SearchSection';
import { ExampleQueries } from './components/ExampleQueries';
import { ResultsSection } from './components/ResultsSection';
import { PolicyModal } from './components/PolicyModal';
import { DemoPaymentModal } from './components/DemoPaymentModal';
import { CheckCircle, X, ShieldCheck } from 'lucide-react';
import type {
  Product,
  RecommendResponse,
  PolicyCheckResponse,
  PaymentOrderResponse,
  PaymentVerifyResponse,
} from './types';

const API_BASE_URL = 'http://127.0.0.1:8000';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  handler?: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Policy check state
  const [evaluatingProductId, setEvaluatingProductId] = useState<string | null>(null);
  const [policyResult, setPolicyResult] = useState<PolicyCheckResponse | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  // Payment state
  const [activePaymentProduct, setActivePaymentProduct] = useState<Product | null>(null);
  const [demoOrder, setDemoOrder] = useState<PaymentOrderResponse | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [razorpayVerified, setRazorpayVerified] = useState<PaymentVerifyResponse | null>(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);

  const fetchRecommendations = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!response.ok) {
        throw new Error(
          `Recommendation request failed (HTTP ${response.status}: ${response.statusText})`
        );
      }

      const result: RecommendResponse = await response.json();
      setData(result);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unable to reach the BuyWise recommendation agent.';
      setError(
        errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')
          ? 'Could not connect to the BuyWise backend service. Please check your connection and try again.'
          : errorMessage
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (product: Product) => {
    setEvaluatingProductId(product.id);
    setPolicyError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/policy/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (!response.ok) {
        throw new Error(
          `Policy verification failed (HTTP ${response.status}: ${response.statusText})`
        );
      }

      const result: PolicyCheckResponse = await response.json();
      setPolicyResult(result);
      setIsPolicyModalOpen(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Could not connect to the BuyWise policy check service.';
      setPolicyError(errorMessage);
      setPolicyResult(null);
      setIsPolicyModalOpen(true);
    } finally {
      setEvaluatingProductId(null);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProceedToPayment = async (
    product: Product,
    order: PaymentOrderResponse
  ) => {
    setActivePaymentProduct(product);

    if (order.mode === 'demo') {
      setDemoOrder(order);
      setIsDemoModalOpen(true);
      return;
    }

    if (order.mode === 'razorpay') {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        setPaymentStatusMessage('Unable to load Razorpay Checkout script.');
        return;
      }

      const options: RazorpayOptions = {
        key: order.key_id,
        amount: (order.amount || 0) * 100,
        currency: order.currency || 'INR',
        name: 'BuyWise',
        description: `Order: ${product.name}`,
        order_id: order.order_id,
        handler: async (rpResponse: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: 'razorpay',
                razorpay_order_id: rpResponse.razorpay_order_id,
                razorpay_payment_id: rpResponse.razorpay_payment_id,
                razorpay_signature: rpResponse.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              throw new Error('Payment signature verification failed.');
            }

            const verifyData: PaymentVerifyResponse = await verifyRes.json();
            if (verifyData.verified) {
              setRazorpayVerified(verifyData);
            } else {
              setPaymentStatusMessage('Payment could not be verified by server.');
            }
          } catch (err: unknown) {
            setPaymentStatusMessage(
              err instanceof Error
                ? err.message
                : 'Server-side payment verification failed.'
            );
          }
        },
        theme: {
          color: '#10b981',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    }
  };

  const handleSelectExample = (exampleQuery: string) => {
    setQuery(exampleQuery);
    fetchRecommendations(exampleQuery);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecommendations(query);
  };

  const handleRetry = () => {
    fetchRecommendations(query);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Notification / Status Message */}
          {paymentStatusMessage && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
              <span>{paymentStatusMessage}</span>
              <button
                type="button"
                onClick={() => setPaymentStatusMessage(null)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 2. Hero & Search */}
          <SearchSection
            query={query}
            onQueryChange={setQuery}
            onSubmit={handleSearch}
          />

          {/* 3. Quick Examples */}
          <ExampleQueries onSelectExample={handleSelectExample} />

          {/* 4. Results / Loading / Error / Empty Section */}
          <ResultsSection
            isLoading={isLoading}
            error={error}
            data={data}
            hasSearched={hasSearched}
            onRetry={handleRetry}
            onPurchase={handlePurchase}
            evaluatingProductId={evaluatingProductId}
          />
        </div>

        {/* Minimal Footer */}
        <footer className="text-center pt-12 border-t border-zinc-900 text-xs text-zinc-600">
          BuyWise &copy; {new Date().getFullYear()} &middot; AI-Powered Purchase Decision & Agentic Checkout
        </footer>
      </main>

      {/* 5. Policy Check Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        result={policyResult}
        error={policyError}
        onProceedToPayment={handleProceedToPayment}
      />

      {/* 6. Demo Payment Modal */}
      <DemoPaymentModal
        isOpen={isDemoModalOpen}
        onClose={() => {
          setIsDemoModalOpen(false);
          setDemoOrder(null);
        }}
        order={demoOrder}
        product={activePaymentProduct}
      />

      {/* 7. Razorpay Verified Success Modal */}
      {razorpayVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-zinc-950 border border-emerald-500/40 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden text-zinc-100">
            <button
              type="button"
              onClick={() => setRazorpayVerified(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-5">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-300">
                  Payment Verified
                </h3>
                <span className="text-xs text-emerald-400/80">
                  Razorpay cryptographic signature verified server-side
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 text-xs mb-5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Status</span>
                <span className="font-semibold text-emerald-400">PAYMENT_VERIFIED</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Order ID</span>
                <span className="font-mono text-zinc-200">{razorpayVerified.order_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Payment ID</span>
                <span className="font-mono text-zinc-200">{razorpayVerified.payment_id}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-[11px] text-zinc-500">
                <span>Security Engine</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> HMAC SHA256 Validated
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRazorpayVerified(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

