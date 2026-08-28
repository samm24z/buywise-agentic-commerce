from typing import Any, Dict, List, Optional


DEFAULT_POLICY: Dict[str, Any] = {
    "max_purchase_amount": 5000,
    "min_merchant_trust": 7.5,
    "allowed_categories": [
        "Wireless / Gaming Headphones",
        "Smartwatches",
        "Keyboards",
    ],
}


def evaluate_purchase_policy(
    product: Dict[str, Any], policy: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Deterministically evaluates a product against user/system purchase policies.
    Enforces spending limits, merchant trust thresholds, and category restrictions.
    """
    effective_policy = {**DEFAULT_POLICY, **(policy or {})}
    
    max_amount = effective_policy.get("max_purchase_amount", 5000)
    min_trust = effective_policy.get("min_merchant_trust", 7.5)
    allowed_categories = effective_policy.get(
        "allowed_categories",
        DEFAULT_POLICY["allowed_categories"],
    )

    price = float(product.get("price", 0))
    merchant_trust = float(product.get("merchant_trust_score", 0.0))
    category = product.get("category", "")

    # Perform checks
    budget_check = price <= max_amount
    merchant_trust_check = merchant_trust >= min_trust
    category_check = category in allowed_categories

    reasons: List[str] = []

    if not budget_check:
        reasons.append(
            f"Purchase price (₹{int(price):,}) exceeds your ₹{int(max_amount):,} spending limit."
        )

    if not merchant_trust_check:
        reasons.append(
            f"Merchant trust score ({merchant_trust}/10) is below your minimum required threshold ({min_trust}/10)."
        )

    if not category_check:
        reasons.append(
            f"Product category '{category}' is not in your allowed purchase categories."
        )

    allowed = budget_check and merchant_trust_check and category_check
    decision = "APPROVED" if allowed else "BLOCKED"

    if allowed:
        reasons.append("All purchase policy safety, spending, and merchant trust checks passed.")

    return {
        "allowed": allowed,
        "decision": decision,
        "reasons": reasons,
        "checks": {
            "budget": budget_check,
            "merchant_trust": merchant_trust_check,
            "category_allowed": category_check,
        },
    }
