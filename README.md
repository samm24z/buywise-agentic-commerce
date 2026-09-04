# BuyWise — AI-Powered Purchase Decision & Policy Agent

> **AI recommends what to buy; deterministic policies decide whether you're allowed to buy it.**

BuyWise is an AI-powered agentic commerce platform that helps users make smarter purchasing decisions while adding a deterministic safety layer before payment.

It understands natural-language shopping requests, identifies user intent and priorities, ranks suitable products, and validates every purchase against predefined business and safety policies before payment can be initiated.

---

## 🚀 Overview

Traditional online shopping requires users to manually compare products based on price, ratings, features, delivery time, warranty, and merchant reliability.

With AI-powered commerce, another challenge appears: an AI agent should not have unrestricted authority to initiate financial transactions.

BuyWise addresses both problems by separating **AI-assisted product discovery** from **deterministic purchase authorization**.

The core principle is:

> **AI recommendation does not equal payment authorization.**

---

## 🎯 Problem

Modern e-commerce becomes difficult when users have multiple requirements at the same time, such as:

- A strict spending limit
- Specific product requirements
- Performance preferences
- Fast delivery
- Reliable merchants
- Warranty requirements

At the same time, allowing an AI system to directly authorize purchases introduces financial safety risks.

An AI model can recommend a product, but it should not be able to bypass predefined transaction rules.

---

## 💡 Solution

BuyWise introduces a controlled agentic-commerce workflow:

```text
User Query
    ↓
AI Intent Extraction
    ↓
Recommendation Engine
    ↓
Purchase Policy Engine
    ↓
APPROVED / BLOCKED
    ↓
Payment or No Payment

The AI handles understanding and recommendation.

The deterministic policy engine controls whether the purchase is actually allowed.

✨ Key Features
Natural-language shopping queries
AI-assisted intent extraction
Personalized product recommendations
Deterministic product scoring
Strict budget enforcement
Merchant trust evaluation
Delivery and warranty comparison
Deterministic purchase policy
Approved and blocked purchase flows
Demo Payment Mode without credentials
Optional Razorpay Test Mode integration
Server-side payment validation
AI fallback logic when Gemini is unavailable
Unsupported-category handling
🧠 How BuyWise Works
1. User Intent

The user describes what they want in natural language.

Example:

I need gaming headphones under ₹5,000 with good battery life and call quality.

BuyWise extracts information such as:

Product category
Budget
User priorities
Required features
2. Product Recommendation

The recommendation engine evaluates available products using factors such as:

Price
Rating
Gaming performance
Call quality
Battery performance
Merchant trust
Delivery time
Warranty

Products exceeding a specified budget are excluded.

3. Purchase Policy

Before payment, the selected product passes through a deterministic policy engine.

Default policy:

Policy	Rule
Maximum purchase amount	₹5,000
Minimum merchant trust	7.5 / 10
Allowed categories	Headphones, Smartwatches, Keyboards

The purchase is approved only when all required conditions pass.

4. Payment

If the purchase is approved:

BuyWise can create a payment/demo order.
Demo Payment Mode works without credentials.
Razorpay Test Mode can optionally be enabled with sandbox credentials.

If the purchase is blocked:

Policy Check
     ↓
BLOCKED
     ↓
Payment is NOT initiated
🔐 Payment Safety

BuyWise deliberately separates AI recommendations from payment authorization.

The AI model cannot directly override purchase policies.

The backend performs validation before payment order creation, including:

Purchase amount
Product price
Product category
Merchant trust
Policy conditions

The product price is controlled by the server rather than trusted directly from the client.

When Razorpay Test Mode credentials are configured, payment signatures can also be verified server-side.

Demo Payment Mode

BuyWise works without Razorpay credentials.

Demo Payment Mode is provided for evaluation and does not process real money.

🤖 AI Architecture

BuyWise uses Gemini for AI-assisted intent extraction when an API key is available.

The system also includes deterministic fallback parsing so that the core application remains functional when the AI service is unavailable.

Natural Language Query
        ↓
Gemini Intent Extraction
        ↓
Structured Intent
        ↓
Recommendation Engine

Fallback:

AI Unavailable
      ↓
Deterministic Intent Parser
      ↓
Structured Intent
🛠️ Tech Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
Lucide React
Backend
Python
FastAPI
AI
Gemini API
Deterministic fallback parser
Payments
Razorpay Test Mode
Demo Payment Mode
Testing
Pytest
ESLint
Vite production build
📁 Project Structure
buywise-agentic-commerce/
│
├── backend/
│   ├── app/
│   │   ├── ai.py
│   │   ├── main.py
│   │   ├── payment.py
│   │   ├── policy.py
│   │   └── recommender.py
│   │
│   ├── tests/
│   │   ├── test_payment.py
│   │   └── test_recommendations.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── data/
│   └── products.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DemoPaymentModal.tsx
│   │   │   ├── ExampleQueries.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── PolicyModal.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ResultsSection.tsx
│   │   │   └── SearchSection.tsx
│   │   │
│   │   ├── App.tsx
│   │   └── types.ts
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
▶️ Run Locally
Prerequisites
Python 3.x
Node.js
npm
Backend

Open a terminal:

cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

Backend:

http://127.0.0.1:8000
Frontend

Open a second terminal:

cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173

Frontend:

http://127.0.0.1:5173
⚙️ Environment Variables

Create:

backend/.env

Optional configuration:

GEMINI_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

The project can run without these credentials using deterministic fallback logic and Demo Payment Mode.

Never commit .env or secret credentials to GitHub.

🔌 API Endpoints
Method	Endpoint	Purpose
GET	/health	Backend health check
POST	/api/recommend	Generate product recommendations
POST	/api/policy/check	Validate purchase policy
POST	/api/payment/create-order	Create payment/demo order
POST	/api/payment/verify	Verify payment/demo result

FastAPI documentation:

http://127.0.0.1:8000/docs
🧪 Testing

The project includes automated tests for:

Product recommendations
Budget enforcement
Purchase policy validation
Approved purchases
Blocked purchases
Demo payment flow
Missing payment credentials
Server-side price authority
Razorpay signature verification

The frontend is also validated using linting and production builds.

🎬 Demo Scenarios
✅ Approved Purchase

Example:

TitanSound Endurance Max
Price: ₹3,499
Merchant Trust: 8.4 / 10

The purchase passes the configured policy:

Budget        ✓
Merchant      ✓
Category      ✓

PURCHASE APPROVED
❌ Blocked Purchase

Example:

AeroPulse Stealth 7 Pro
Price: ₹7,999

The configured maximum purchase amount is ₹5,000.

Therefore:

Budget Limit  ✗

PURCHASE BLOCKED
Payment Not Initiated

A blocked purchase never proceeds to payment.

🧩 Build Challenges
AI Reliability

External AI services may be unavailable.

Solution: deterministic fallback intent parsing.

Strict Budget Enforcement

Recommendations must never violate an explicit budget.

Solution: hard budget filtering before product ranking.

Financial Safety

AI recommendations should not directly authorize transactions.

Solution: deterministic policy validation before payment order creation.

Secure Payment Flow

Critical payment information should not rely on untrusted client input.

Solution: server-side product price authority and payment verification.

Frontend-Backend Integration

The application required reliable communication between React and FastAPI.

Solution: structured API contracts, error handling, loading states, and CORS configuration.

🌟 Why BuyWise?

Most AI shopping assistants focus primarily on recommending products.

BuyWise focuses on safe agentic commerce.

The system allows AI to:

Understand
Compare
Recommend

But deterministic business rules control whether a purchase can actually proceed.

AI Decision Support
        ↓
Deterministic Policy
        ↓
Financial Transaction

AI recommendation does not equal payment authorization.

🔮 Future Scope
Real-time product and price data
Real-time merchant verification
More product categories
User-defined spending policies
Fraud and anomaly detection
Personalized purchasing rules
Multi-agent commerce workflows
Inventory-aware recommendations
Production payment integration
📌 Current Limitations
Demo catalog contains a limited set of product categories.
Merchant trust scores are currently catalog-based.
Demo Payment Mode does not process real money.
Razorpay Test Mode requires sandbox credentials.
Real-time inventory and pricing are not currently connected.
📊 Project Status

Buildathon-ready prototype

BuyWise demonstrates an end-to-end AI-assisted commerce workflow with a deterministic safety layer between product recommendation and payment authorization.

🔗 Repository

https://github.com/samm24z/buywise-agentic-commerce

👨‍💻 Author

Shaik Samad

Built for the Razorpay AI Buildathon.


**Do this now:** copy the entire block → open `README.md` → `Ctrl+A` → paste → `Ctrl+S`.

Then tell me **“saved”** and I'll give you the **2 commands to push it to GitHub**.