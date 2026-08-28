import json
from pathlib import Path
from typing import Any, Dict, List, Optional


def get_products_file_path() -> Path:
    """Resolve data/products.json relative to repository root or current directory."""
    # Try relative to this file (backend/app/recommender.py -> root -> data/products.json)
    root_path = Path(__file__).resolve().parents[2] / "data" / "products.json"
    if root_path.exists():
        return root_path
    
    # Try relative to current working directory
    cwd_path = Path("data/products.json")
    if cwd_path.exists():
        return cwd_path
    
    # Fallback to parent data path
    parent_path = Path("../data/products.json")
    if parent_path.exists():
        return parent_path

    return root_path


def load_products() -> List[Dict[str, Any]]:
    """Load product catalog from data/products.json."""
    file_path = get_products_file_path()
    if not file_path.exists():
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_product_score(product: Dict[str, Any], intent: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate deterministic weighted score for a product based on structured user intent.
    Returns the total match score (0-100) and score breakdown.
    """
    budget = intent.get("budget")
    priorities = intent.get("priorities", {})

    # Extract user priority weights (scale 1-5, normalized with sensible base)
    w_gaming = float(priorities.get("gaming", 1))
    w_calls = float(priorities.get("calls", 1))
    w_battery = float(priorities.get("battery", 1))
    w_delivery = float(priorities.get("delivery", 1))
    w_trust = float(priorities.get("trust", 1))
    
    # Baseline weights for standard quality metrics
    w_rating = 1.5
    w_budget = 3.0 if budget else 1.0
    w_warranty = 1.0

    # Normalized component scores (0 - 10 scale)
    s_gaming = float(product.get("gaming_score", 5.0))
    s_calls = float(product.get("call_quality_score", 5.0))
    s_battery = float(product.get("battery_score", 5.0))
    s_rating = float(product.get("rating", 3.0)) * 2.0  # 5.0 scale -> 10.0 scale
    s_trust = float(product.get("merchant_trust_score", 7.0))
    
    # Delivery score: 1 day = 10.0, 2 days = 8.0, 3 days = 6.0, 5 days = 2.0
    delivery_days = int(product.get("delivery_days", 3))
    s_delivery = max(0.0, 10.0 - (delivery_days - 1) * 2.0)
    
    # Warranty score: 24m = 10.0, 12m = 6.0, 6m = 3.0
    warranty_months = int(product.get("warranty_months", 12))
    s_warranty = min(10.0, (warranty_months / 24.0) * 10.0)

    # Budget / Price-Value score
    price = float(product.get("price", 0))
    if budget and budget > 0:
        if price <= budget:
            # Reward staying comfortably within budget
            savings_ratio = (budget - price) / budget
            s_budget = 8.0 + (savings_ratio * 2.0)  # 8.0 to 10.0
        else:
            # Over budget penalty proportional to overage
            overage_ratio = (price - budget) / budget
            s_budget = max(0.0, 7.0 - (overage_ratio * 15.0))
    else:
        s_budget = 7.0

    # Weighted sum
    total_weighted_points = (
        (s_gaming * w_gaming)
        + (s_calls * w_calls)
        + (s_battery * w_battery)
        + (s_delivery * w_delivery)
        + (s_trust * w_trust)
        + (s_rating * w_rating)
        + (s_budget * w_budget)
        + (s_warranty * w_warranty)
    )
    
    total_weights = (
        w_gaming + w_calls + w_battery + w_delivery + w_trust + w_rating + w_budget + w_warranty
    )

    final_score = round((total_weighted_points / total_weights) * 10.0, 1)  # Scale 0 - 100

    # Generate key highlights / reasons
    highlights = []
    if budget and price <= budget:
        highlights.append(f"Within budget at ₹{int(price):,} (saves ₹{int(budget - price):,})")
    elif budget and price > budget:
        highlights.append(f"Slightly above budget (₹{int(price):,})")

    if w_gaming >= 3 and s_gaming >= 7.0:
        highlights.append(f"Strong gaming score ({s_gaming}/10)")
    if w_calls >= 3 and s_calls >= 7.0:
        highlights.append(f"High call clarity ({s_calls}/10)")
    if s_battery >= 8.5:
        highlights.append(f"Exceptional battery ({s_battery}/10)")
    if delivery_days <= 2:
        highlights.append(f"Fast {delivery_days}-day delivery")
    if s_trust >= 9.0:
        highlights.append(f"Highly trusted merchant ({s_trust}/10)")

    return {
        "match_score": final_score,
        "highlights": highlights[:3],
    }


def generate_business_explanation(
    top_products: List[Dict[str, Any]], intent: Dict[str, Any]
) -> str:
    """Generate a clear, concise business explanation based on deterministic scores."""
    budget = intent.get("budget")
    if not top_products:
        if budget:
            return f"No products in this category match your ₹{int(budget):,} budget. You can increase your budget to see additional options."
        return "No products in this category match your request. You can modify your criteria to see additional options."

    category = intent.get("category", "products")
    priorities = intent.get("priorities", {})

    high_priority_names = [
        k for k, v in priorities.items() if isinstance(v, (int, float)) and v >= 3
    ]

    best_match = top_products[0]
    best_name = best_match.get("name")
    best_price = best_match.get("price")
    best_score = best_match.get("match_score", 0)

    criteria_desc = []
    if budget:
        criteria_desc.append(f"budget under ₹{int(budget):,}")
    if high_priority_names:
        criteria_desc.append(f"focus on {', '.join(high_priority_names)}")

    criteria_str = f" for your {' and '.join(criteria_desc)}" if criteria_desc else ""

    count_str = f"top {len(top_products)}" if len(top_products) > 1 else "top"
    explanation = (
        f"Selected {count_str} {category}{criteria_str}. "
        f"'{best_name}' ranked #1 with a match score of {best_score}/100 "
        f"offering the optimal balance of price (₹{int(best_price):,}), specs, and merchant reliability."
    )

    if len(top_products) > 1:
        alt_names = [p.get("name") for p in top_products[1:]]
        explanation += f" Alternative options include {', and '.join(alt_names)}."

    return explanation


def get_recommendations(intent: Dict[str, Any], limit: int = 3) -> Dict[str, Any]:
    """
    Filter and score products deterministically based on intent.
    Strictly enforces category and budget limits (price <= budget).
    Returns only eligible products (up to limit).
    """
    products = load_products()
    category = intent.get("category")
    budget = intent.get("budget")

    # 1. Filter by category if specified
    if category:
        category_lower = category.lower()
        filtered = [
            p for p in products if p.get("category", "").lower() == category_lower
        ]
        # If strict match empty, try partial match
        if not filtered:
            filtered = [
                p for p in products if category_lower in p.get("category", "").lower() or p.get("category", "").lower() in category_lower
            ]

        # If category was explicitly requested but no products match (unsupported category)
        if not filtered:
            return {
                "recommendations": [],
                "explanation": (
                    "BuyWise currently supports Wireless / Gaming Headphones, Smartwatches, "
                    "and Keyboards in this demo catalog. No matching products are available for your requested category."
                ),
            }
    else:
        filtered = products

    # 2. Strictly filter by budget (price <= budget)
    if budget is not None and isinstance(budget, (int, float)) and budget > 0:
        filtered = [p for p in filtered if p.get("price", float("inf")) <= budget]

    # If zero products fit the budget/criteria
    if not filtered:
        return {
            "recommendations": [],
            "explanation": generate_business_explanation([], intent),
        }

    # 3. Score eligible products deterministically
    scored_products = []
    for p in filtered:
        p_copy = dict(p)
        score_info = calculate_product_score(p_copy, intent)
        p_copy["match_score"] = score_info["match_score"]
        p_copy["highlights"] = score_info["highlights"]
        scored_products.append(p_copy)

    # Sort by match_score descending, and price ascending for ties
    scored_products.sort(key=lambda x: (-x["match_score"], x.get("price", 0)))

    # Select top recommendations (up to limit, only eligible products)
    top_recommendations = scored_products[:limit]
    explanation = generate_business_explanation(top_recommendations, intent)

    return {
        "recommendations": top_recommendations,
        "explanation": explanation,
    }

