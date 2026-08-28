import json
import os
import re
import urllib.request
import urllib.error
from typing import Any, Dict, Optional


VALID_CATEGORIES = [
    "Wireless / Gaming Headphones",
    "Smartwatches",
    "Keyboards",
]


UNSUPPORTED_CATEGORY_PATTERNS = [
    (r"\b(monitor|monitors|display|displays|screen|screens|tv|tvs|television|televisions)\b", "Monitors / Displays"),
    (r"\b(book|books|novel|novels|textbook|textbooks|ebook|ebooks|comic|comics|magazine|magazines)\b", "Books"),
    (r"\b(laptop|laptops|notebook|notebooks|macbook|macbooks|chromebook|chromebooks|pc|desktop|desktops|computer|computers)\b", "Laptops / Computers"),
    (r"\b(phone|phones|smartphone|smartphones|mobile|mobiles|iphone|iphones|android|cellphone|cellphones)\b", "Smartphones"),
    (r"\b(tablet|tablets|ipad|ipads)\b", "Tablets"),
    (r"\b(camera|cameras|dslr|camcorder|camcorders|lens|lenses|gopro)\b", "Cameras"),
    (r"\b(speaker|speakers|soundbar|soundbars|home theater|subwoofer|subwoofers)\b", "Speakers"),
    (r"\b(mouse|mice|trackpad|trackpads)\b", "Mice & Pointers"),
    (r"\b(shoe|shoes|sneaker|sneakers|boot|boots|footwear|cloth|clothes|clothing|shirt|shirts|tshirt|tshirts|t-shirt|t-shirts|pants|trousers|jeans|jacket|jackets|dress|dresses|apparel|hoodie|hoodies)\b", "Apparel & Footwear"),
    (r"\b(chair|chairs|desk|desks|table|tables|furniture|sofa|bed|mattress|fridge|refrigerator|microwave|ac|air conditioner|vacuum|washing machine)\b", "Furniture & Appliances"),
    (r"\b(printer|printers|scanner|scanners)\b", "Printers & Scanners"),
    (r"\b(drone|drones)\b", "Drones"),
    (r"\b(ps5|ps4|playstation|xbox|nintendo|switch|console|consoles|controller|controllers|gamepad|gamepads|joystick|joysticks)\b", "Gaming Consoles & Controllers"),
    (r"\b(charger|chargers|powerbank|power bank|powerbanks|cable|cables|adapter|adapters)\b", "Accessories"),
    (r"\b(guitar|guitars|piano|pianos|violin|violins|drum|drums|instrument|instruments)\b", "Musical Instruments"),
    (r"\b(bicycle|bicycles|bike|bikes|treadmill|treadmills|dumbbell|dumbbells|cycle|cycles)\b", "Sports & Fitness"),
    (r"\b(perfume|perfumes|cologne|makeup|cosmetics|skincare|fragrance)\b", "Beauty & Personal Care"),
    (r"\b(toy|toys|lego|board game|board games|action figure|action figures)\b", "Toys & Games"),
    (r"\b(bag|bags|backpack|backpacks|luggage|suitcase|suitcases|wallet|wallets)\b", "Bags & Luggage"),
    (r"\b(food|grocery|groceries|snack|snacks|coffee|tea|chocolate)\b", "Food & Groceries"),
]


def fallback_parse_intent(query: str) -> Dict[str, Any]:
    """
    Deterministic rule-based fallback parser for extracting intent from user shopping query
    when GEMINI_API_KEY is not configured or an API call fails.
    """
    query_lower = query.lower()

    # 1. Category extraction
    category: Optional[str] = None
    if re.search(r"\b(headphone|headphones|earphone|earphones|headset|headsets|earbud|earbuds|audio|sound|airpod|airpods|tws)\b", query_lower):
        category = "Wireless / Gaming Headphones"
    elif re.search(r"\b(watch|watches|smartwatch|smartwatches|band|bands|fitness tracker|wearable|wearables)\b", query_lower):
        category = "Smartwatches"
    elif re.search(r"\b(keyboard|keyboards|keypad|keypads|keys|mechanical keyboard|switches)\b", query_lower):
        category = "Keyboards"
    else:
        # Check for explicitly unsupported product categories
        for pattern, cat_name in UNSUPPORTED_CATEGORY_PATTERNS:
            if re.search(pattern, query_lower):
                category = cat_name
                break

    # 2. Budget extraction
    budget: Optional[int] = None
    # Match patterns like: under 5000, under 5k, below 10,000, budget 4000, 5000 inr, etc.
    budget_match = re.search(
        r"(?:under|below|less than|within|max|budget|upto|up to|around|sub)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|k\b|thousand)?",
        query_lower,
    )
    if not budget_match:
        # Check for direct '5k' or '₹5000' or '5000 rs'
        budget_match = re.search(r"(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k)?", query_lower)
    if not budget_match:
        budget_match = re.search(r"\b(\d+)\s*k\b", query_lower)
    if not budget_match:
        # Match standalone number if preceded/followed by price context
        budget_match = re.search(r"\b(\d{3,6})\b", query_lower)

    if budget_match:
        raw_num = budget_match.group(1).replace(",", "")
        try:
            val = float(raw_num)
            # If followed by 'k' or 'thousand'
            multiplier_group = budget_match.group(2) if len(budget_match.groups()) >= 2 else None
            if multiplier_group and "k" in multiplier_group.lower():
                val *= 1000
            elif val < 100 and "k" in query_lower:
                val *= 1000
            budget = int(val)
        except (ValueError, TypeError):
            budget = None

    # 3. Priorities extraction (Scale 1 to 5)
    priorities = {
        "gaming": 5 if re.search(r"\b(game|gaming|gamer|gamers|esports|fps|low latency|rgb)\b", query_lower) else 1,
        "calls": 5 if re.search(r"\b(call|calls|calling|mic|microphone|voice|meeting|meetings|zoom|teams|speak|clarity)\b", query_lower) else 1,
        "battery": 5 if re.search(r"\b(battery|playtime|backup|long lasting|endurance|charging|charge)\b", query_lower) else 1,
        "delivery": 5 if re.search(r"\b(fast delivery|quick|urgent|urgently|1 day|2 day|express|fast shipping|fastest)\b", query_lower) else 1,
        "trust": 5 if re.search(r"\b(trust|trusted|warranty|reliable|genuine|authentic|verified|official|brand)\b", query_lower) else 1,
    }

    return {
        "category": category,
        "budget": budget,
        "priorities": priorities,
    }


def parse_intent_with_gemini(query: str, api_key: str) -> Optional[Dict[str, Any]]:
    """
    Call Gemini API to convert natural language query into structured intent.
    Does NOT select products, only extracts structured parameters.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    system_instruction = (
        "You are an intent extraction engine for an e-commerce assistant called BuyWise.\n"
        "Convert the user's natural language shopping query into structured JSON ONLY with this exact schema:\n"
        "{\n"
        '  "category": string (strictly one of: "Wireless / Gaming Headphones", "Smartwatches", "Keyboards" or null),\n'
        '  "budget": integer (max budget in INR, e.g. 5000 for "under 5000" or "5k", or null if unspecified),\n'
        '  "priorities": {\n'
        '    "gaming": integer (1 to 5, priority level for gaming/latency/RGB),\n'
        '    "calls": integer (1 to 5, priority level for microphone/calls/voice),\n'
        '    "battery": integer (1 to 5, priority level for battery/playtime),\n'
        '    "delivery": integer (1 to 5, priority level for fast delivery/urgency),\n'
        '    "trust": integer (1 to 5, priority level for merchant trust/warranty)\n'
        "  }\n"
        "}\n"
        "Do NOT select or recommend products. Output only the JSON object."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"User query: {query}"}
                ]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1,
        },
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                resp_data = json.loads(response.read().decode("utf-8"))
                candidates = resp_data.get("candidates", [])
                if candidates:
                    text = candidates[0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text.strip())
                    
                    # Validate and normalize category
                    cat = parsed.get("category")
                    if cat not in VALID_CATEGORIES:
                        # Fallback matching
                        for valid_cat in VALID_CATEGORIES:
                            if cat and valid_cat.lower() in cat.lower():
                                parsed["category"] = valid_cat
                                break

                    # Ensure priorities format
                    priorities = parsed.get("priorities", {})
                    for key in ["gaming", "calls", "battery", "delivery", "trust"]:
                        if key not in priorities or not isinstance(priorities[key], (int, float)):
                            priorities[key] = 1
                        else:
                            priorities[key] = max(1, min(5, int(priorities[key])))
                    parsed["priorities"] = priorities

                    return parsed
    except Exception as e:
        # If Gemini call fails, allow fallback
        pass

    return None


def extract_intent(query: str) -> Dict[str, Any]:
    """
    Extract structured intent from query using Gemini if API key is available,
    or using deterministic fallback parser.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if api_key:
        gemini_result = parse_intent_with_gemini(query, api_key)
        if gemini_result is not None:
            return gemini_result

    # Sensible fallback parser
    return fallback_parse_intent(query)
