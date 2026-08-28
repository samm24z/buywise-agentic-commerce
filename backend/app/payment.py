import base64
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.policy import evaluate_purchase_policy
from app.recommender import load_products

router = APIRouter(prefix="/api/payment", tags=["payment"])


def get_razorpay_credentials() -> tuple[Optional[str], Optional[str]]:
    """Retrieve Razorpay credentials from environment variables if present."""
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip() or None
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip() or None
    return key_id, key_secret


def is_razorpay_configured() -> bool:
    """Check if valid Razorpay credentials are fully configured."""
    key_id, key_secret = get_razorpay_credentials()
    return bool(key_id and key_secret)


class CreateOrderRequest(BaseModel):
    product_id: str = Field(..., description="ID of the product to create a payment order for")
    policy: Optional[Dict[str, Any]] = Field(None, description="Optional custom policy configuration")


class VerifyPaymentRequest(BaseModel):
    mode: str = Field("demo", description="Payment mode: 'demo' or 'razorpay'")
    order_id: Optional[str] = Field(None, description="Demo order ID or Razorpay order ID")
    razorpay_order_id: Optional[str] = Field(None, description="Razorpay order ID")
    razorpay_payment_id: Optional[str] = Field(None, description="Razorpay payment ID")
    razorpay_signature: Optional[str] = Field(None, description="Razorpay cryptographic signature")


def create_razorpay_api_order(
    key_id: str,
    key_secret: str,
    amount_in_paise: int,
    currency: str,
    receipt: str,
    notes: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Creates a real Razorpay Test/Live Mode order via Razorpay REST API
    using Python standard library (no third-party SDK dependencies required).
    """
    url = "https://api.razorpay.com/v1/orders"
    payload = {
        "amount": amount_in_paise,
        "currency": currency,
        "receipt": receipt,
        "notes": notes or {},
    }
    data = json.dumps(payload).encode("utf-8")
    
    # HTTP Basic Auth: key_id:key_secret
    auth_str = f"{key_id}:{key_secret}"
    auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("ascii")
    
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth_b64}",
        },
        method="POST",
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        error_body = err.read().decode("utf-8")
        try:
            parsed_err = json.loads(error_body)
            err_msg = parsed_err.get("error", {}).get("description", str(err))
        except Exception:
            err_msg = error_body
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Razorpay order creation failed: {err_msg}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to communicate with Razorpay API: {str(exc)}",
        )


@router.post("/create-order")
def create_payment_order(request: CreateOrderRequest):
    """
    Gated Payment Order Creation:
    1. Look up authoritative product details from server-side catalog.
    2. Enforce Purchase Policy Engine check.
    3. If BLOCKED, return 403 with policy failure reasons and NEVER create a payment order.
    4. If APPROVED, calculate amount from server product price.
    5. If Razorpay credentials exist, create a real Razorpay order.
    6. If credentials do not exist, create a deterministic DEMO order.
    """
    products = load_products()
    product = next((p for p in products if p.get("id") == request.product_id), None)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{request.product_id}' not found.",
        )

    # 2. Mandatory Purchase Policy Gate
    policy_decision = evaluate_purchase_policy(product, request.policy)
    if not policy_decision.get("allowed", False):
        return {
            "mode": "blocked",
            "allowed": False,
            "decision": "BLOCKED",
            "reasons": policy_decision.get("reasons", []),
            "checks": policy_decision.get("checks", {}),
            "product_id": product.get("id"),
            "product_name": product.get("name"),
            "message": "Payment order creation rejected: Product violates purchase policy limits.",
        }

    # 3. Compute price strictly from server-side catalog (Never trust frontend price)
    server_price = int(product.get("price", 0))
    currency = "INR"
    product_name = product.get("name", "Product")

    # 4. Check credentials
    key_id, key_secret = get_razorpay_credentials()

    if key_id and key_secret:
        # Razorpay Test / Live Mode Order Creation
        receipt_id = f"rcpt_{product['id']}_{int(time.time())}"
        amount_paise = server_price * 100
        rp_order = create_razorpay_api_order(
            key_id=key_id,
            key_secret=key_secret,
            amount_in_paise=amount_paise,
            currency=currency,
            receipt=receipt_id,
            notes={
                "product_id": product["id"],
                "product_name": product_name,
            },
        )
        return {
            "mode": "razorpay",
            "allowed": True,
            "order_id": rp_order["id"],
            "amount": server_price,
            "currency": currency,
            "key_id": key_id,
            "product_id": product["id"],
            "product_name": product_name,
        }

    # 5. Deterministic Demo Payment Order Creation
    # Format: demo_ord_<product_id>_<timestamp>
    demo_order_id = f"demo_ord_{product['id']}_{int(time.time())}"
    return {
        "mode": "demo",
        "allowed": True,
        "order_id": demo_order_id,
        "amount": server_price,
        "currency": currency,
        "product_id": product["id"],
        "product_name": product_name,
        "status": "DEMO_MODE",
        "message": "Demo payment mode active. No Razorpay credentials configured. No real money will be charged.",
    }


@router.post("/verify")
def verify_payment(request: VerifyPaymentRequest):
    """
    Payment Verification Endpoint:
    - In Razorpay mode: Verifies HMAC SHA256 signature server-side.
    - In Demo mode: Returns verified: false with status: DEMO_PAYMENT.
    """
    if request.mode == "razorpay":
        key_id, key_secret = get_razorpay_credentials()
        if not key_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Razorpay secret key is not configured on server.",
            )

        order_id = request.razorpay_order_id or request.order_id
        payment_id = request.razorpay_payment_id
        signature = request.razorpay_signature

        if not order_id or not payment_id or not signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing order_id, payment_id, or signature for Razorpay verification.",
            )

        # Server-side cryptographic signature verification
        message = f"{order_id}|{payment_id}".encode("utf-8")
        expected_signature = hmac.new(
            key_secret.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay signature verification failed. Invalid payment signature.",
            )

        return {
            "verified": True,
            "mode": "razorpay",
            "status": "PAYMENT_VERIFIED",
            "order_id": order_id,
            "payment_id": payment_id,
            "message": "Razorpay payment signature successfully verified.",
        }

    # Demo Mode Verification
    return {
        "verified": False,
        "mode": "demo",
        "status": "DEMO_PAYMENT",
        "order_id": request.order_id or request.razorpay_order_id or "demo_order",
        "message": "Demo simulated transaction recorded. No actual monetary exchange occurred.",
    }
