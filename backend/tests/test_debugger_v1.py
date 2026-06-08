import unittest
from unittest.mock import patch, MagicMock
import json
import os
import sys

# Add backend directory to sys.path to allow correct imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base_class import Base
from app.api.deps import get_db
from app.core.error_analysis import parse_stack_trace, classify_error, assess_severity
from app.core.confidence_engine import compute_confidence_scores, get_confidence_label
from app.core.community_search import clean_query_for_search, fetch_community_references, generate_fallback_github_issues, generate_fallback_stackoverflow_threads
from app.core.knowledge_base import get_safer_coding_pattern
from app.models import profile as models

# Use a test SQLite database for testing db interactions
TEST_DATABASE_URL = "sqlite:///./test_debugger_v1.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables in the test db
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Register dependency override
app.dependency_overrides[get_db] = override_get_db


class TestDebuggerV1(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Seed user in test database
        cls.db = TestingSessionLocal()
        user = cls.db.query(models.User).filter(models.User.id == "test_user_v1").first()
        if not user:
            user = models.User(
                id="test_user_v1",
                email="test_v1@example.com",
                display_name="Test Developer v1"
            )
            cls.db.add(user)
            cls.db.commit()
            
        profile = cls.db.query(models.LearningProfile).filter(models.LearningProfile.user_id == "test_user_v1").first()
        if not profile:
            profile = models.LearningProfile(
                user_id="test_user_v1",
                full_name="Test Developer v1",
                python_level=10,
                xp_points=100
            )
            cls.db.add(profile)
            cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()
        # Clean up database file
        if os.path.exists("./test_debugger_v1.db"):
            try:
                os.remove("./test_debugger_v1.db")
            except PermissionError:
                pass

    def setUp(self):
        # Refresh database entries before each test
        self.headers = {"Authorization": "Bearer test_user_v1"}

    # 1. Test Stack Trace Classification
    def test_stack_trace_classification(self):
        tb_keyerror = "Traceback (most recent call last):\n  File \"test.py\", line 5, in <module>\n    value = my_dict['nonexistent']\nKeyError: 'nonexistent'"
        parsed = parse_stack_trace(tb_keyerror)
        self.assertEqual(parsed["error_type"], "KeyError")
        self.assertEqual(parsed["line"], 5)
        self.assertEqual(parsed["file"], "test.py")

        categories = classify_error(tb_keyerror, parsed)
        self.assertIn("Key Error", categories)

        severity = assess_severity(parsed, categories)
        self.assertEqual(severity, "medium")

    # 2. Test Confidence Engine Calculations
    def test_confidence_calculations(self):
        # High confidence scenario
        score_high = compute_confidence_scores(
            error_type="KeyError",
            categories=["Python"],
            ai_enhanced=True,
            ai_response_sections={"root_cause": "dict key lookup failure", "explanation": "test", "suggested_fixes": ["use .get()"]},
            semantic_similarity=0.92
        )
        self.assertGreaterEqual(score_high["overall_confidence"], 80)
        self.assertEqual(get_confidence_label(score_high["overall_confidence"]), "High")

        # Low confidence scenario
        score_low = compute_confidence_scores(
            error_type="UnknownError",
            categories=["Unknown"],
            ai_enhanced=False,
            ai_response_sections={},
            semantic_similarity=0.1
        )
        self.assertLessEqual(score_low["overall_confidence"], 50)
        self.assertEqual(get_confidence_label(score_low["overall_confidence"]), "Low")

    # 3. Test Community Search Caching & Fallbacks
    def test_community_search_helpers(self):
        error_msg = "KeyError: 'missing_key'"
        cleaned = clean_query_for_search(error_msg)
        self.assertEqual(cleaned, "KeyError 'missing_key'")

        # Verify fallback response shapes
        fb_github = generate_fallback_github_issues("KeyError", "missing_key")
        self.assertEqual(len(fb_github), 2)
        self.assertEqual(fb_github[0]["state"], "closed")

        fb_so = generate_fallback_stackoverflow_threads("KeyError", "missing_key")
        self.assertEqual(len(fb_so), 2)
        self.assertTrue(fb_so[0]["is_answered"])

    # 4. Test Community Fetching with API timeout mock
    @patch("urllib.request.urlopen")
    def test_community_fetching_with_fallback(self, mock_urlopen):
        # Mock connection failure to force fallback path
        mock_urlopen.side_effect = Exception("Timeout error")
        refs = fetch_community_references("KeyError", "KeyError: 'test'")
        self.assertIn("github", refs)
        self.assertIn("stackoverflow", refs)
        self.assertEqual(len(refs["github"]), 2)
        self.assertEqual(len(refs["stackoverflow"]), 2)

    # 5. Test Endpoint Responses
    def test_analyze_error_endpoint(self):
        payload = {
            "error_text": "Traceback (most recent call last):\n  File \"app.py\", line 12, in index\n    x = 1 / 0\nZeroDivisionError: division by zero"
        }
        response = self.client.post("/api/v1/debugger/analyze-error", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["error_type"], "ZeroDivisionError")
        self.assertEqual(data["line"], 12)
        self.assertIn("github_references", data)
        self.assertIn("stackoverflow_references", data)
        self.assertIn("safer_pattern", data)
        self.assertEqual(data["safer_pattern"]["error_type"], "ZeroDivisionError")

    def test_error_search_endpoint(self):
        payload = {
            "query": "how do I fix a dictionary KeyError",
            "top_k": 3
        }
        response = self.client.post("/api/v1/debugger/error-search", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertGreater(len(data["results"]), 0)
        self.assertEqual(data["results"][0]["error_name"], "KeyError")

    def test_debugging_analytics_endpoint(self):
        response = self.client.get("/api/v1/debugger/debugging-analytics", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_errors_analyzed", data)
        self.assertIn("category_distribution", data)

    def test_history_endpoint(self):
        # Perform search and limit validation
        response = self.client.get("/api/v1/debugger/history?limit=10", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)


if __name__ == "__main__":
    unittest.main()
