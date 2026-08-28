import hashlib
import hmac
import os
import sys
import unittest
from unittest.mock import patch

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import HTTPException
from app.payment import (
    CreateOrderRequest,
    VerifyPaymentRequest,
    create_payment_order,
    verify_payment,
    get_razorpay_credentials,
    is_razorpay_configured,
)
from app.main import health_check, check_policy, PolicyCheckRequest


class TestBuyWisePaymentLayer(unittest.TestCase):
    """
    Automated test suite verifying the BuyWise Payment Layer:
    - Case 1: Approved product -> Demo order created -> Demo verification
    - Case 2: Blocked product -> Policy blocked -> No payment order created
    - Case 3: Missing Razorpay credentials -> Startup & functionality intact
    - Security: Server-side price authority, Signature verification & tamper resistance
    """

    def setUp(self):
        # Ensure clean environment without credentials for baseline tests
        self.env_patcher = patch.dict(os.environ, {}, clear=True)
        self.env_patcher.start()

    def tearDown(self):
        self.env_patcher.stop()

    def test_case_1_approved_product_demo_mode(self):
        """
        CASE 1:
        prod-003 / TitanSound Endurance Max (Price: ₹3,499)
        - Policy: APPROVED (Price <= ₹5,000, Trust >= 7.5, Category allowed)
        - create-order: returns mode=demo, allowed=True, order_id=demo_ord_...
        - verify: returns verified=False, mode=demo, status=DEMO_PAYMENT
        """
        # 1. Create order
        req = CreateOrderRequest(product_id="prod-003")
        data = create_payment_order(req)

        self.assertEqual(data.get("mode"), "demo")
        self.assertTrue(data.get("allowed"))
        self.assertTrue(data.get("order_id", "").startswith("demo_ord_prod-003_"))
        self.assertEqual(data.get("amount"), 3499)
        self.assertEqual(data.get("currency"), "INR")
        self.assertEqual(data.get("product_id"), "prod-003")
        self.assertIn("TitanSound Endurance Max", data.get("product_name", ""))

        order_id = data.get("order_id")

        # 2. Verify demo payment
        verify_req = VerifyPaymentRequest(mode="demo", order_id=order_id)
        verify_data = verify_payment(verify_req)

        # Must NOT pretend real payment occurred
        self.assertFalse(verify_data.get("verified"))
        self.assertEqual(verify_data.get("mode"), "demo")
        self.assertEqual(verify_data.get("status"), "DEMO_PAYMENT")
        self.assertEqual(verify_data.get("order_id"), order_id)

    def test_case_2_blocked_product_no_order_created(self):
        """
        CASE 2:
        prod-001 / AeroPulse Stealth 7 Pro (Price: ₹7,999)
        - Policy: BLOCKED because price exceeds ₹5,000 limit
        - create-order: returns allowed=False, decision=BLOCKED
        - NEVER creates a payment order (no order_id)
        """
        req = CreateOrderRequest(product_id="prod-001")
        data = create_payment_order(req)

        self.assertFalse(data.get("allowed"))
        self.assertEqual(data.get("mode"), "blocked")
        self.assertEqual(data.get("decision"), "BLOCKED")
        self.assertNotIn("order_id", data)
        self.assertFalse(data.get("checks", {}).get("budget"))

        # Confirm policy violation reason is provided
        reasons = data.get("reasons", [])
        self.assertTrue(any("exceeds your ₹5,000 spending limit" in r for r in reasons))

    def test_case_3_missing_credentials_startup_and_fallback(self):
        """
        CASE 3:
        Missing Razorpay credentials
        - is_razorpay_configured() returns False
        - Backend starts and health check returns ok
        - Policy check and recommendations function normally
        - Payment endpoint operates in demo mode without raising errors
        """
        self.assertFalse(is_razorpay_configured())
        key_id, key_secret = get_razorpay_credentials()
        self.assertIsNone(key_id)
        self.assertIsNone(key_secret)

        # Health check
        health = health_check()
        self.assertEqual(health.get("status"), "ok")

        # Policy endpoint
        policy_res = check_policy(PolicyCheckRequest(product_id="prod-003"))
        self.assertEqual(policy_res["decision"]["decision"], "APPROVED")

        # Create order in demo mode
        data = create_payment_order(CreateOrderRequest(product_id="prod-003"))
        self.assertEqual(data.get("mode"), "demo")
        self.assertTrue(data.get("allowed"))

    def test_nonexistent_product_raises_404(self):
        """Requesting an order for an invalid product raises HTTP 404."""
        with self.assertRaises(HTTPException) as ctx:
            create_payment_order(CreateOrderRequest(product_id="prod-non-existent-999"))
        self.assertEqual(ctx.exception.status_code, 404)

    def test_server_side_price_authority(self):
        """
        Ensure price is strictly loaded from the backend catalog
        and cannot be tampered with by client.
        """
        req = CreateOrderRequest(product_id="prod-003")
        data = create_payment_order(req)
        self.assertEqual(data.get("amount"), 3499)  # True catalog price of prod-003

    def test_razorpay_mode_order_and_signature_verification(self):
        """
        Verify Razorpay mode behavior when credentials are provided:
        - Creates real order or invokes API helper
        - Server verifies HMAC SHA256 signature correctly
        - Rejects tampered signatures
        """
        test_key = "rzp_test_mockKeyId123"
        test_secret = "mockSecretKey456"

        with patch.dict(os.environ, {"RAZORPAY_KEY_ID": test_key, "RAZORPAY_KEY_SECRET": test_secret}):
            self.assertTrue(is_razorpay_configured())

            with patch("app.payment.create_razorpay_api_order") as mock_rp_api:
                mock_rp_api.return_value = {
                    "id": "order_mock_rzp_999",
                    "amount": 349900,
                    "currency": "INR",
                    "status": "created",
                }

                # Create order in razorpay mode
                create_data = create_payment_order(CreateOrderRequest(product_id="prod-003"))

                self.assertEqual(create_data.get("mode"), "razorpay")
                self.assertEqual(create_data.get("order_id"), "order_mock_rzp_999")
                self.assertEqual(create_data.get("key_id"), test_key)
                self.assertEqual(create_data.get("amount"), 3499)

            # Test valid signature verification
            order_id = "order_mock_rzp_999"
            payment_id = "pay_mock_payment_888"
            msg = f"{order_id}|{payment_id}".encode("utf-8")
            valid_sig = hmac.new(test_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

            verify_data = verify_payment(
                VerifyPaymentRequest(
                    mode="razorpay",
                    razorpay_order_id=order_id,
                    razorpay_payment_id=payment_id,
                    razorpay_signature=valid_sig,
                )
            )
            self.assertTrue(verify_data.get("verified"))
            self.assertEqual(verify_data.get("status"), "PAYMENT_VERIFIED")

            # Test invalid/tampered signature rejection
            with self.assertRaises(HTTPException) as ctx:
                verify_payment(
                    VerifyPaymentRequest(
                        mode="razorpay",
                        razorpay_order_id=order_id,
                        razorpay_payment_id=payment_id,
                        razorpay_signature="tampered_fake_signature_hex",
                    )
                )
            self.assertEqual(ctx.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
