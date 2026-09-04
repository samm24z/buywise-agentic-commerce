# BuyWise — AI-Powered Purchase Decision & Policy Agent

> **"AI recommendation does not equal payment authorization."**

BuyWise is an AI-assisted agentic commerce platform designed to bridge the gap between natural-language product discovery and safe, controlled purchasing. It extracts structured buyer intent from conversational queries, ranks catalog items using transparent deterministic scoring, enforces hard budget constraints, evaluates merchant trustworthiness, and subjects every potential checkout to a deterministic purchase policy before financial transactions can be initiated.

BuyWise operates out of the box with a zero-credential **Demo Payment Mode**, and provides an optional **Razorpay Test Mode** integration when sandbox credentials are supplied.

---

## Problem

Modern e-commerce search struggles to balance simultaneous, multi-dimensional user requirements (e.g., specific budget ceilings, low-latency gaming audio, rapid delivery, and high merchant reliability). Users are forced to manually cross-compare specifications, filter lists, and assess merchant credibility.

At the same time, emerging autonomous AI agent frameworks present a critical risk: **allowing an unconstrained Large Language Model (LLM) to directly initiate or authorize financial transactions.** LLMs are probabilistic, prone to hallucinations, and vulnerable to prompt injections. Direct AI payment execution without a hard, deterministic security layer poses unacceptable financial and compliance risks.

Key challenges include:
- **Complex Multi-Constraint Queries**: Interpreting nuanced user intent without hallucinating product specifications.
- **Comparison Friction**: Difficulty weighing battery life, audio/mic quality, delivery speed, and merchant trust against budget limits.
- **Financial Safety & Control**: The need for a hard, auditable safety boundary between AI discovery and transaction execution.

---

## Solution

BuyWise decouples the **probabilistic discovery layer** from the **deterministic financial and governance layer**.

```
User Query
    ↓
AI Intent Extraction (Gemini API or Rule-Based Fallback)
    ↓
Deterministic Recommendation Engine (Scoring, Weights, Strict Budget Filtering)
    ↓
Purchase Policy Engine (Budget Limit, Merchant Trust, Category Check)
    ↓
[ BLOCKED ] or [ APPROVED ]
    ↓
Payment Layer (Server-Side Price Authority)
    ↓
Demo Payment Mode  /  Optional Razorpay Test Mode
```

### Stage Responsibilities:
1. **AI Intent Extraction**: Translates natural-language requests into structured parameters (`category`, `budget`, and 1–5 priority weights for `gaming`, `calls`, `battery`, `delivery`, `trust`). Does **not** select products directly.
2. **Deterministic Recommendation Engine**: Filters products strictly by category and budget (`price <= budget`), calculating an explainable, multi-factor match score (0–100) based on user weights.
3. **Purchase Policy Engine**: Evaluates the selected item against rigid spending ceilings, minimum merchant trust scores, and allowed categories.
4. **Policy Decision Gate**: Categorically blocks non-compliant purchases (`BLOCKED`) and only clears verified items (`APPROVED`).
5. **Payment Layer**: Computes order totals strictly from server-side catalog records, disallowing client tampering, and creates either a simulated demo order or a verified Razorpay order.

---

## Key Features

- **Natural-Language Product Queries**: Express complex shopping needs in plain English.
- **Gemini Intent Extraction**: Structured JSON extraction using Gemini models when configured.
- **Deterministic Fallback Intent Parser**: Built-in regex and keyword parser ensuring full functionality without external API keys.
- **Strict Budget Filtering**: Hard server-side enforcement where products exceeding budget are excluded.
- **Priority-Weighted Recommendations**: Dynamic weight adjustments matching individual user criteria (gaming latency, call clarity, battery endurance, delivery urgency, merchant trust).
- **Explainable Match Scoring**: Transparent 0–100 scoring breakdown with contextual reasoning highlights.
- **Merchant Trust Evaluation**: Integrated merchant credibility scoring (0–10 scale).
- **Delivery & Warranty Transparency**: Real-time evaluation of delivery timelines and warranty duration.
- **Unsupported-Category Handling**: Graceful, explicit feedback when queries fall outside catalog scope.
- **Deterministic Purchase Policy Engine**: Hard rule validation (spending limit, minimum merchant trust, category white-list).
- **Purchase Blocking**: Proactively halts payment initiation for policy-violating items with clear failure reasons.
- **Server-Side Price Authority**: Orders calculate amounts strictly from backend data, ignoring client-side parameters.
- **Demo Payment Mode**: Fully simulated checkout flow requiring zero API credentials.
- **Optional Razorpay Test Mode Integration**: Standard Razorpay checkout workflow when credentials are provided.
- **Server-Side Signature Verification**: Cryptographic HMAC-SHA256 verification of Razorpay payment signatures.

---

## Tech Stack

### Frontend
- **Framework**: React 19, TypeScript
- **Bundler & Tooling**: Vite 8, Tailwind CSS v4
- **Icons**: Lucide React
- **Linter**: Oxlint

### Backend
- **Framework**: Python 3.10+, FastAPI
- **Server**: Uvicorn
- **Validation & Parsing**: Pydantic v2
- **Environment**: python-dotenv

### AI & Intent Parsing
- **Primary**: Google Gemini API (gemini-2.5-flash) *(Optional)*
- **Fallback**: Built-in deterministic rule-based intent extraction

### Payments & Simulation
- **Demo Mode**: BuyWise Built-In Deterministic Simulation
- **Gateway**: Razorpay REST API & Standard Checkout *(Optional Test Mode)*

### Data Store
- **Catalog**: Local structured JSON database (`data/products.json`)

---

## System Architecture

```
+-------------------------------------------------------------------------+
|                              FRONTEND                                   |
|   React 19 + TypeScript + Tailwind CSS (Vite)                           |
|   - Search Input & Suggested Queries                                    |
|   - Recommendation Results & Match Breakdown                            |
|   - Purchase Policy Inspection Modal                                    |
|   - Demo / Razorpay Payment Modal                                       |
+------------------------------------+------------------------------------+
                                     | HTTP REST
                                     v
+-------------------------------------------------------------------------+
|                           FASTAPI BACKEND                               |
|                                                                         |
|  [ GET /health ] ----------------- Health Check                         |
|                                                                         |
|  [ POST /api/recommend ] --------> AI Intent Extraction                 |
|                                     (Gemini API / Fallback Parser)      |
|                                            |                            |
|                                            v                            |
|                                    Deterministic Recommender            |
|                                    - Strict Budget Filter               |
|                                    - Weighted Scoring Engine            |
|                                    - data/products.json Authority       |
|                                                                         |
|  [ POST /api/policy/check ] -----> Purchase Policy Engine               |
|                                    - Max Spend Check (<= ₹5,000)        |
|                                    - Min Trust Check (>= 7.5/10)        |
|                                    - Category Whitelist Check           |
|                                                                         |
|  [ POST /api/payment/create-order] Payment Order Gate                   |
|                                    - Policy Re-validation               |
|                                    - Server Price Calculation           |
|                                    - Demo Order / Razorpay API Order    |
|                                                                         |
|  [ POST /api/payment/verify ] ---> Payment Verification                 |
|                                    - Demo Verification Handler          |
|                                    - Razorpay HMAC-SHA256 Signature     |
+-------------------------------------------------------------------------+
```

---

## Project Structure

```
buywise-agentic-commerce/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── ai.py                   # Intent extraction (Gemini API + Fallback)
│   │   ├── main.py                 # FastAPI endpoints & CORS configuration
│   │   ├── payment.py              # Payment order creation & signature verification
│   │   ├── policy.py               # Deterministic Purchase Policy Engine
│   │   └── recommender.py          # Scoring engine & product catalog loading
│   ├── tests/
│   │   ├── test_payment.py         # Payment, policy gate, and security tests
│   │   └── test_recommendations.py # Category, budget, and recommendation tests
│   ├── .env.example                # Optional environment variable template
│   └── requirements.txt            # Python dependencies
├── data/
│   └── products.json               # Demo product catalog (12 products)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DemoPaymentModal.tsx    # Demo payment simulation UI
│   │   │   ├── ExampleQueries.tsx      # Quick-fill query chips
│   │   │   ├── Header.tsx              # Application header & branding
│   │   │   ├── PolicyModal.tsx         # Policy evaluation breakdown modal
│   │   │   ├── ProductCard.tsx         # Product display with rank & match score
│   │   │   ├── ResultsSection.tsx      # Search results & explanation display
│   │   │   └── SearchSection.tsx       # Query input form
│   │   ├── App.tsx                     # Main application container & state
│   │   ├── types.ts                    # TypeScript interfaces & domain types
│   │   ├── main.tsx                    # React application entrypoint
│   │   └── index.css                   # Global styles & Tailwind CSS imports
│   ├── package.json                    # Frontend dependencies & scripts
│   └── vite.config.ts                  # Vite configuration
├── README.md                           # Project documentation
└── .gitignore                          # Git ignore rules
```

---

## Demo Catalog

The demo catalog (`data/products.json`) includes **12 curated fictional products** across three active categories:

1. **Wireless / Gaming Headphones** (e.g., *TitanSound Endurance Max*, *AeroPulse Stealth 7 Pro*, *Vocalis Clarity Air*, *NovaPlay Spark X*)
2. **Smartwatches** (e.g., *PulseTracker Horizon 3*, *VigorWatch Stamina Pro*, *ChronoFit Apex Ultra*, *LiteBand Active Go*)
3. **Keyboards** (e.g., *VoltKey MechStrike TKL*, *OfficeLite SlimKey 104*, *AeroKeys SilentType Master*, *CyberStrike RapidPro 87*)

### Unsupported-Category Handling
If a query targets an unsupported product type (e.g., *laptops*, *monitors*, *books*, *smartphones*), BuyWise identifies the out-of-scope category and returns a clear explanation rather than returning irrelevant products.

---

## How to Run

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows:
python -m venv venv
venv\Scripts\activate

# macOS / Linux:
# python3 -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

In a separate terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

- **Frontend Application**: `http://127.0.0.1:5173`

---

## Environment Variables

External credentials are **completely optional**. BuyWise runs fully in offline/demo mode out of the box.

Template (`backend/.env.example`):
```env
GEMINI_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### Configuration Behaviors:
- **Without `GEMINI_API_KEY`**: The backend automatically uses the built-in rule-based fallback parser with zero degradation of core recommendation features.
- **Without Razorpay Keys**: BuyWise defaults to **Demo Payment Mode**, generating simulated orders with zero monetary exchange.
- **Security Rule**: `.env` is ignored by git; never commit secrets or live production credentials.

---

## API Endpoints

### 1. Health Check
- **`GET /health`**
- **Purpose**: Verify backend uptime and service status.
- **Response**:
  ```json
  { "status": "ok", "service": "buywise-api" }
  ```

---

### 2. Product Recommendations
- **`POST /api/recommend`**
- **Purpose**: Extract structured intent from a natural-language query and return ranked recommendations with explainability metadata.
- **Request**:
  ```json
  {
    "query": "wireless headphones with long battery under 4000"
  }
  ```
- **Response**:
  ```json
  {
    "intent": {
      "category": "Wireless / Gaming Headphones",
      "budget": 4000,
      "priorities": { "gaming": 1, "calls": 1, "battery": 5, "delivery": 1, "trust": 1 }
    },
    "recommendations": [
      {
        "id": "prod-003",
        "name": "TitanSound Endurance Max",
        "brand": "VoltAudio",
        "price": 3499,
        "rating": 4.3,
        "gaming_score": 7.0,
        "call_quality_score": 7.2,
        "battery_score": 9.8,
        "merchant": "GadgetHub Express",
        "merchant_trust_score": 8.4,
        "delivery_days": 1,
        "warranty_months": 12,
        "match_score": 84.8,
        "highlights": [
          "Within budget at ₹3,499 (saves ₹501)",
          "Exceptional battery (9.8/10)",
          "Fast 1-day delivery"
        ]
      }
    ],
    "explanation": "Selected top Wireless / Gaming Headphones for your budget under ₹4,000 and focus on battery. 'TitanSound Endurance Max' ranked #1 with a match score of 84.8/100..."
  }
  ```

---

### 3. Purchase Policy Check
- **`POST /api/policy/check`**
- **Purpose**: Run deterministic policy verification on a selected product before creating an order.
- **Request**:
  ```json
  {
    "product_id": "prod-003"
  }
  ```
- **Response**:
  ```json
  {
    "product": { "id": "prod-003", "name": "TitanSound Endurance Max", "price": 3499 },
    "policy": {
      "max_purchase_amount": 5000,
      "min_merchant_trust": 7.5,
      "allowed_categories": ["Wireless / Gaming Headphones", "Smartwatches", "Keyboards"]
    },
    "decision": {
      "allowed": true,
      "decision": "APPROVED",
      "reasons": ["All purchase policy safety, spending, and merchant trust checks passed."],
      "checks": {
        "budget": true,
        "merchant_trust": true,
        "category_allowed": true
      }
    }
  }
  ```

---

### 4. Create Payment Order
- **`POST /api/payment/create-order`**
- **Purpose**: Validate policy server-side and generate either a Razorpay order or a Demo order. Returns a `403/BLOCKED` payload if policy fails.
- **Request**:
  ```json
  {
    "product_id": "prod-003"
  }
  ```
- **Response (Demo Mode)**:
  ```json
  {
    "mode": "demo",
    "allowed": true,
    "order_id": "demo_ord_prod-003_1772752200",
    "amount": 3499,
    "currency": "INR",
    "product_id": "prod-003",
    "product_name": "TitanSound Endurance Max",
    "status": "DEMO_MODE",
    "message": "Demo payment mode active. No Razorpay credentials configured. No real money will be charged."
  }
  ```

---

### 5. Verify Payment
- **`POST /api/payment/verify`**
- **Purpose**: Record simulated transactions in Demo mode, or cryptographically verify HMAC-SHA256 signatures in Razorpay mode.
- **Request (Demo Mode)**:
  ```json
  {
    "mode": "demo",
    "order_id": "demo_ord_prod-003_1772752200"
  }
  ```
- **Response**:
  ```json
  {
    "verified": false,
    "mode": "demo",
    "status": "DEMO_PAYMENT",
    "order_id": "demo_ord_prod-003_1772752200",
    "message": "Demo simulated transaction recorded. No actual monetary exchange occurred."
  }
  ```

---

## Recommendation Engine

BuyWise uses an explainable mathematical ranking engine:
- **LLM Boundary**: The LLM (or fallback parser) is restricted strictly to intent extraction (`category`, `budget`, `weights`). The LLM does **not** pick products.
- **Strict Budget Ceiling**: Any product where `price > budget` is filtered out before scoring.
- **Multi-Factor Deterministic Formula**:
  $$\text{Score} = \frac{\sum (S_i \times W_i)}{\sum W_i} \times 10$$
  Factors evaluated:
  - Specification scores: `gaming`, `call_quality`, `battery`
  - Merchant trustworthiness: `merchant_trust_score` (0–10)
  - Delivery speed: Normalized 1-to-5 day fulfillment rating
  - Warranty coverage: Normalized 6-to-24 month warranty rating
  - Public rating: Scaled 5-star customer feedback
  - Budget headroom: Proportional bonus for savings under budget

---

## Purchase Policy Engine

The Purchase Policy Engine is a deterministic governance layer executing between recommendation and payment:

### Default Rules:
- **Maximum Purchase Ceiling**: ₹5,000
- **Minimum Merchant Trust**: 7.5 / 10.0
- **Permitted Categories**:
  - `Wireless / Gaming Headphones`
  - `Smartwatches`
  - `Keyboards`

### Policy Enforcement:
- **`APPROVED`**: Granted if and only if **all** rule conditions evaluate to `true`.
- **`BLOCKED`**: Triggered when any condition fails. A blocked decision refuses order creation and presents specific explanatory reasons to the user.

---

## Payment Architecture

```
                      +-----------------------------+
                      |   Policy Decision Gate      |
                      +--------------+--------------+
                                     |
                         [ Decision == APPROVED ]
                                     |
                                     v
                      +-----------------------------+
                      |  Server-Side Price Lookup   |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                                           |
    [ Razorpay Keys Present ]                   [ No Keys Configured ]
               |                                           |
               v                                           v
   +-----------------------+                   +-----------------------+
   |  Razorpay Test Order  |                   |   Demo Payment Mode   |
   |  - Real order ID      |                   |   - Simulated order   |
   |  - Razorpay Checkout  |                   |   - Non-real banner   |
   |  - HMAC Verification  |                   |   - Zero charges      |
   +-----------------------+                   +-----------------------+
```

### 1. Demo Payment Mode
- Fully functional without third-party API keys or accounts.
- Generates transparent simulated orders (`demo_ord_<product_id>_<timestamp>`).
- Explicitly labelled across UI and API responses as **DEMO / NOT A REAL TRANSACTION**.

### 2. Optional Razorpay Test Mode
- When evaluator credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are present:
  1. Frontend triggers order creation post-policy approval.
  2. Server uses HTTP Basic Auth to create an order directly with Razorpay REST API.
  3. Frontend opens standard Razorpay Checkout modal.
  4. Upon completion, backend verifies payment signature using server-side HMAC-SHA256.

---

## Security Design

- **Decoupled Architecture**: AI models possess zero capability to trigger orders or transfer funds.
- **Server Price Authority**: Payment order amounts are queried strictly from internal product data, defeating client-side price modification attacks.
- **Server-Side Secret Isolation**: Razorpay API secrets are never transmitted to the browser.
- **Cryptographic Verification**: Razorpay payment signatures are validated using `hmac.compare_digest` to prevent timing attacks and payload tampering.
- **Fail-Safe Policy Gate**: Payment order generation endpoints re-verify policy checks server-side before issuing any order identifier.

---

## Testing

The project includes an automated test suite verifying core business logic, recommendations, policies, and payment security.

### 1. Backend Automated Tests

Run backend tests using Python's built-in test runner:

```bash
cd backend
python -m unittest discover -s tests -p "test_*.py"
```

**Verified Test Coverage (14 automated unit tests)**:
- **Recommendation & Category Tests (`test_recommendations.py`)**:
  - Supported category discovery (Headphones, Smartwatches, Keyboards)
  - Unsupported category rejection (Monitors, Books, Laptops, Smartphones)
  - Strict budget filter enforcement (`price <= budget`)
  - Generic query handling with budget bounds
- **Payment & Security Tests (`test_payment.py`)**:
  - Case 1: Approved purchase flow in Demo mode (`TitanSound Endurance Max`)
  - Case 2: Blocked purchase policy rejection (`AeroPulse Stealth 7 Pro`)
  - Case 3: Resilient startup and operation without credentials
  - Server-side price authority enforcement
  - Non-existent product 404 handling
  - Razorpay order creation and HMAC-SHA256 signature verification
  - Rejection of forged/tampered payment signatures

### 2. Frontend Code Quality & Build Checks

```bash
cd frontend

# Run Oxlint
npm run lint

# Verify TypeScript compilation and production build
npm run build
```

---

## Demo Flow

### Walkthrough Sequence:
1. **Submit Query**: User enters a natural-language search request.
2. **Review Recommendations**: System presents ranked matches with score badges and highlight tags.
3. **Trigger Purchase**: User selects a product and clicks **Purchase**.
4. **Policy Inspection**: The Purchase Policy Engine validates budget, trust, and category.
5. **Outcome**:
   - If **Approved** $\rightarrow$ User proceeds to Demo or Razorpay checkout.
   - If **Blocked** $\rightarrow$ System displays policy rejection reasons and refuses payment creation.

### Concrete Scenarios:

| Scenario | Product | Price | Policy Limit | Merchant Trust | Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Approved Flow** | *TitanSound Endurance Max* | ₹3,499 | ₹5,000 | 8.4 / 10 | **APPROVED** $\rightarrow$ Order created |
| **Blocked Flow** | *AeroPulse Stealth 7 Pro* | ₹7,999 | ₹5,000 | 9.3 / 10 | **BLOCKED** $\rightarrow$ Exceeds ₹5,000 spending limit |

---

## Build Challenges & Technical Obstacles

1. **Strict Budget Enforcement**: Standard vector search or LLM prompt generation often allows near-budget items. BuyWise resolved this by enforcing strict deterministic server-side filtering (`price <= budget`).
2. **Handling Unsupported Categories**: LLMs frequently try to map out-of-scope requests to unrelated catalog items. BuyWise uses pattern matching to detect unsupported categories and return explicit out-of-scope notices.
3. **Zero-Credential Resilience**: Requiring API keys for local evaluation introduces setup friction. BuyWise was built with a two-tier intent parser (Gemini API with a robust rule-based fallback).
4. **Frontend/Backend CORS & Routing**: Seamless communication between Vite dev server (`:5173`) and FastAPI (`:8000`) was achieved via configured FastAPI CORS middleware.
5. **Separating Recommendations from Payment**: Ensured AI models only structure intent, while deterministic Python code manages ranking, scoring, and policy validation.
6. **Client-Side Tamper Prevention**: Resolved by enforcing server-side price authority; client requests only specify `product_id`.
7. **Signature Verification Security**: Implemented server-side HMAC-SHA256 signature checking using constant-time comparison to prevent timing attacks.
8. **Frictionless Demo Mode**: Implemented a standalone deterministic demo order flow so evaluators can test the entire purchase lifecycle without needing a payment gateway account.

---

## Why BuyWise?

> **"BuyWise does not allow an AI recommendation to directly become a financial authorization."**

Many autonomous AI commerce concepts grant language models direct tool-calling access to payment APIs. BuyWise demonstrates an enterprise-grade architectural alternative: **use AI for what it does best (understanding human context and nuance), and use deterministic code for what it must do (governance, policy enforcement, and financial control).**

---

## Current Limitations

- **Catalog Scope**: The demo dataset contains 12 fictional consumer electronic products.
- **Category Coverage**: Currently limited to Headphones, Smartwatches, and Keyboards.
- **Simulated Demo Mode**: Demo payment mode simulates order state transitions locally and does not move real funds.
- **Razorpay Sandbox**: Live gateway checkout requires evaluator-supplied Razorpay Test Mode keys in `backend/.env`.

---

## Future Scope

- Scaled product catalog integration with dynamic database backends (e.g., PostgreSQL/pgvector).
- Live merchant API inventory and real-time pricing synchronization.
- Granular organizational purchase policies (multi-user approval tiers, departmental spending caps).
- User authentication, order history, and shipment tracking.
- Automated return/refund policy agent workflows.
- Multi-gateway production checkout adapters.

---

## Project Status

**Competition / Prototype Project**

The current implementation provides a working end-to-end demonstration of:
$$\text{AI Natural Intent Extraction} \longrightarrow \text{Deterministic Scoring} \longrightarrow \text{Purchase Policy Gate} \longrightarrow \text{Controlled Checkout}$$

---

## Author

**Abdul Samad**
- **GitHub**: [@samm24z](https://github.com/samm24z)
