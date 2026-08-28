from typing import Any, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from app.ai import extract_intent
from app.recommender import get_recommendations, load_products
from app.policy import evaluate_purchase_policy, DEFAULT_POLICY
from app.payment import router as payment_router

load_dotenv()

app = FastAPI(title="BuyWise API")
app.include_router(payment_router)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendRequest(BaseModel):
    query: str


class PolicyCheckRequest(BaseModel):
    product_id: str
    policy: Optional[Dict[str, Any]] = None


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "buywise-api"}


@app.post("/api/recommend")
def recommend(request: RecommendRequest):
    intent = extract_intent(request.query)
    results = get_recommendations(intent, limit=3)
    return {
        "intent": intent,
        "recommendations": results["recommendations"],
        "explanation": results["explanation"],
    }


@app.post("/api/policy/check")
def check_policy(request: PolicyCheckRequest):
    products = load_products()
    product = next((p for p in products if p.get("id") == request.product_id), None)
    
    if not product:
        raise HTTPException(
            status_code=404,
            detail=f"Product with ID '{request.product_id}' not found.",
        )

    decision = evaluate_purchase_policy(product, request.policy)
    effective_policy = {**DEFAULT_POLICY, **(request.policy or {})}

    return {
        "product": product,
        "policy": effective_policy,
        "decision": decision,
    }

