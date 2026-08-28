export interface PriorityWeights {
  gaming: number;
  calls: number;
  battery: number;
  delivery: number;
  trust: number;
}

export interface UserIntent {
  category: string | null;
  budget: number | null;
  priorities: PriorityWeights;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  gaming_score: number;
  call_quality_score: number;
  battery_score: number;
  merchant: string;
  merchant_trust_score: number;
  delivery_days: number;
  warranty_months: number;
  features: string[];
  match_score?: number;
  highlights?: string[];
}

export interface RecommendResponse {
  intent: UserIntent;
  recommendations: Product[];
  explanation: string;
}

export interface PolicyChecks {
  budget: boolean;
  merchant_trust: boolean;
  category_allowed: boolean;
}

export interface PolicyDecision {
  allowed: boolean;
  decision: 'APPROVED' | 'BLOCKED';
  reasons: string[];
  checks: PolicyChecks;
}

export interface PolicyRule {
  max_purchase_amount: number;
  min_merchant_trust: number;
  allowed_categories: string[];
}

export interface PolicyCheckResponse {
  product: Product;
  policy: PolicyRule;
  decision: PolicyDecision;
}

export interface PaymentOrderResponse {
  mode: 'demo' | 'razorpay' | 'blocked';
  allowed: boolean;
  order_id?: string;
  amount?: number;
  currency?: string;
  key_id?: string;
  product_id?: string;
  product_name?: string;
  status?: string;
  message?: string;
  decision?: 'APPROVED' | 'BLOCKED';
  reasons?: string[];
}

export interface PaymentVerifyRequest {
  mode: 'demo' | 'razorpay';
  order_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export interface PaymentVerifyResponse {
  verified: boolean;
  mode: 'demo' | 'razorpay';
  status: string;
  order_id?: string;
  payment_id?: string;
  message?: string;
}

