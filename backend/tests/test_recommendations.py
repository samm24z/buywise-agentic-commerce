import os
import sys
import unittest

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ai import extract_intent, fallback_parse_intent
from app.recommender import get_recommendations
from app.main import recommend, RecommendRequest


class TestBuyWiseRecommendations(unittest.TestCase):
    """
    Automated test suite for BuyWise category handling and recommendations:
    - Supported headphones query returns recommendations
    - Supported smartwatch query returns recommendations
    - Supported keyboard query returns recommendations
    - Unsupported "monitor" query returns zero recommendations
    - Unsupported "books" query returns zero recommendations
    - Unsupported "laptop" query returns zero recommendations
    - Unsupported "phone" query returns zero recommendations
    - Strict budget filtering is preserved
    """

    def test_supported_headphones_query_returns_recommendations(self):
        """Supported headphones query returns non-empty recommendations."""
        intent = extract_intent("wireless gaming headphones under 5000")
        self.assertEqual(intent.get("category"), "Wireless / Gaming Headphones")
        self.assertEqual(intent.get("budget"), 5000)

        result = get_recommendations(intent, limit=3)
        recs = result.get("recommendations", [])
        self.assertGreater(len(recs), 0)
        self.assertTrue(all(p.get("category") == "Wireless / Gaming Headphones" for p in recs))
        self.assertTrue(all(p.get("price") <= 5000 for p in recs))

    def test_supported_smartwatch_query_returns_recommendations(self):
        """Supported smartwatch query returns non-empty recommendations."""
        intent = extract_intent("best smartwatch for fitness tracking")
        self.assertEqual(intent.get("category"), "Smartwatches")

        result = get_recommendations(intent, limit=3)
        recs = result.get("recommendations", [])
        self.assertGreater(len(recs), 0)
        self.assertTrue(all(p.get("category") == "Smartwatches" for p in recs))

    def test_supported_keyboard_query_returns_recommendations(self):
        """Supported keyboard query returns non-empty recommendations."""
        intent = extract_intent("mechanical keyboards with RGB")
        self.assertEqual(intent.get("category"), "Keyboards")

        result = get_recommendations(intent, limit=3)
        recs = result.get("recommendations", [])
        self.assertGreater(len(recs), 0)
        self.assertTrue(all(p.get("category") == "Keyboards" for p in recs))

    def test_unsupported_monitor_query_returns_zero_recommendations(self):
        """Unsupported 'monitor' query returns 0 recommendations with clear explanation."""
        req = RecommendRequest(query="best 4k gaming monitor under 15000")
        resp = recommend(req)

        self.assertEqual(len(resp.get("recommendations", [])), 0)
        explanation = resp.get("explanation", "")
        self.assertIn("BuyWise currently supports Wireless / Gaming Headphones, Smartwatches, and Keyboards", explanation)
        self.assertIn("No matching products are available for your requested category", explanation)

    def test_unsupported_books_query_returns_zero_recommendations(self):
        """Unsupported 'books' query returns 0 recommendations with clear explanation."""
        req = RecommendRequest(query="fiction books and novels under 500")
        resp = recommend(req)

        self.assertEqual(len(resp.get("recommendations", [])), 0)
        explanation = resp.get("explanation", "")
        self.assertIn("BuyWise currently supports Wireless / Gaming Headphones, Smartwatches, and Keyboards", explanation)
        self.assertIn("No matching products are available for your requested category", explanation)

    def test_unsupported_laptop_query_returns_zero_recommendations(self):
        """Unsupported 'laptop' query returns 0 recommendations with clear explanation."""
        req = RecommendRequest(query="lightweight laptop for coding and office")
        resp = recommend(req)

        self.assertEqual(len(resp.get("recommendations", [])), 0)
        explanation = resp.get("explanation", "")
        self.assertIn("BuyWise currently supports Wireless / Gaming Headphones, Smartwatches, and Keyboards", explanation)
        self.assertIn("No matching products are available for your requested category", explanation)

    def test_unsupported_phones_query_returns_zero_recommendations(self):
        """Unsupported 'phones' query returns 0 recommendations with clear explanation."""
        req = RecommendRequest(query="android smartphones under 20000")
        resp = recommend(req)

        self.assertEqual(len(resp.get("recommendations", [])), 0)
        explanation = resp.get("explanation", "")
        self.assertIn("BuyWise currently supports Wireless / Gaming Headphones, Smartwatches, and Keyboards", explanation)
        self.assertIn("No matching products are available for your requested category", explanation)

    def test_unspecified_category_with_budget(self):
        """Query with no category specified still evaluates all categories within budget."""
        intent = fallback_parse_intent("best products under 2000")
        self.assertIsNone(intent.get("category"))
        self.assertEqual(intent.get("budget"), 2000)

        result = get_recommendations(intent, limit=3)
        recs = result.get("recommendations", [])
        self.assertGreater(len(recs), 0)
        self.assertTrue(all(p.get("price") <= 2000 for p in recs))


if __name__ == "__main__":
    unittest.main()
