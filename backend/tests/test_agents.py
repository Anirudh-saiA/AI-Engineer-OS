import unittest
from unittest.mock import patch, MagicMock
import json
import os
import sys
import datetime

# Add backend directory to sys.path to allow correct imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base_class import Base
from app.api.deps import get_db
from app.models import profile as models
from app.models.agents import (
    DBWorkflow,
    DBAgent,
    DBAgentTask,
    DBAgentOutput,
    DBWorkflowLog,
    DBWorkflowHistory
)
from app.core.agents.graph import should_continue, AgentState

# Use a test SQLite database for testing db interactions
TEST_DATABASE_URL = "sqlite:///./test_agents.db"
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

# Override SessionLocal for endpoints and nodes modules to use test database
from app.api.v1.endpoints import agents as agents_endpoint_module
from app.core.agents import nodes as agents_nodes_module
agents_endpoint_module.SessionLocal = TestingSessionLocal
agents_nodes_module.SessionLocal = TestingSessionLocal


class TestAgentsSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = TestingSessionLocal()
        
        # Seed test user
        user = cls.db.query(models.User).filter(models.User.id == "test_agent_user").first()
        if not user:
            user = models.User(
                id="test_agent_user",
                email="test_agent@example.com",
                display_name="Test Agent Developer"
            )
            cls.db.add(user)
            cls.db.commit()
            
        profile = cls.db.query(models.LearningProfile).filter(models.LearningProfile.user_id == "test_agent_user").first()
        if not profile:
            profile = models.LearningProfile(
                user_id="test_agent_user",
                full_name="Test Agent Developer",
                python_level=25,
                xp_points=120
            )
            cls.db.add(profile)
            cls.db.commit()

        # Seed agent registry
        agents_data = [
            ("planner", "Planner Agent", "Project Manager"),
            ("research", "Research Agent", "Researcher"),
            ("coder", "Coding Agent", "Software Engineer"),
            ("reviewer", "Reviewer Agent", "QA Reviewer"),
            ("documentation", "Documentation Agent", "Technical Writer")
        ]
        for aid, name, role in agents_data:
            existing = cls.db.query(DBAgent).filter(DBAgent.id == aid).first()
            if not existing:
                agent = DBAgent(
                    id=aid,
                    name=name,
                    role=role,
                    system_prompt=f"System prompt for test {aid}"
                )
                cls.db.add(agent)
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()
        # Clean up database file
        if os.path.exists("./test_agents.db"):
            try:
                os.remove("./test_agents.db")
            except PermissionError:
                pass

    def setUp(self):
        self.headers = {"Authorization": "Bearer test_agent_user"}
        # Clear database records to isolate test runs
        self.db.rollback()
        self.db.query(DBWorkflowLog).delete()
        self.db.query(DBWorkflowHistory).delete()
        self.db.query(DBAgentOutput).delete()
        self.db.query(DBAgentTask).delete()
        self.db.query(DBWorkflow).delete()
        self.db.commit()

    # =============================================================================
    # 1. TEST LANGGRAPH CONDITIONAL ROUTING LOGIC
    # =============================================================================
    def test_should_continue_logic(self):
        # Case 1: Code approved -> transition to documentation
        state_approved: AgentState = {
            "user_request": "test request",
            "current_agent": "reviewer",
            "plan": "plan text",
            "research_notes": "notes",
            "generated_code": "print('hello')",
            "review_feedback": "APPROVED: True. Looks clean.",
            "documentation": "",
            "workflow_id": "test_wf_1",
            "retry_count": 0
        }
        next_step = should_continue(state_approved)
        self.assertEqual(next_step, "documentation")

        # Case 2: Code rejected, retry count = 0 -> retry loopback to coder
        state_rejected_retry: AgentState = {
            "user_request": "test request",
            "current_agent": "reviewer",
            "plan": "plan text",
            "research_notes": "notes",
            "generated_code": "print('hello')",
            "review_feedback": "APPROVED: False. Syntax errors found.",
            "documentation": "",
            "workflow_id": "test_wf_2",
            "retry_count": 0
        }
        next_step = should_continue(state_rejected_retry)
        self.assertEqual(next_step, "coder")

        # Case 3: Code rejected, retry count = 2 -> bypass loops, proceed to documentation
        state_max_retry: AgentState = {
            "user_request": "test request",
            "current_agent": "reviewer",
            "plan": "plan text",
            "research_notes": "notes",
            "generated_code": "print('hello')",
            "review_feedback": "APPROVED: False. Still broken.",
            "documentation": "",
            "workflow_id": "test_wf_3",
            "retry_count": 2
        }
        next_step = should_continue(state_max_retry)
        self.assertEqual(next_step, "documentation")

    # =============================================================================
    # 2. TEST REST ENDPOINTS
    # =============================================================================
    def test_trigger_agent_workflow_endpoint(self):
        payload = {"user_request": "Build a secure FastAPI vector storage pipeline"}
        response = self.client.post("/api/v1/agents/workflow", json=payload, headers=self.headers)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("workflow_id", data)
        self.assertEqual(data["status"], "running")
        
        # Verify workflow record created in DB
        wf = self.db.query(DBWorkflow).filter(DBWorkflow.id == data["workflow_id"]).first()
        self.assertIsNotNone(wf)
        self.assertIn(wf.status, ["running", "completed"])
        
        # Verify 5 tasks placeholders created
        tasks_count = self.db.query(DBAgentTask).filter(DBAgentTask.workflow_id == wf.id).count()
        self.assertEqual(tasks_count, 5)

    def test_trigger_single_agent_task_endpoint(self):
        payload = {
            "agent_id": "coder",
            "task_description": "Write a python function to compute factorial"
        }
        response = self.client.post("/api/v1/agents/task", json=payload, headers=self.headers)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "completed")
        self.assertEqual(data["agent_id"], "coder")
        self.assertIn("output", data)

    def test_direct_agent_wrappers_endpoints(self):
        # 1. Research Agent
        payload = {"query": "SQLite WAL mode connection pools"}
        res = self.client.post("/api/v1/agents/research", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["agent_id"], "research")

        # 2. Coding Agent
        payload = {"prompt": "FastAPI exception handler templates"}
        res = self.client.post("/api/v1/agents/code", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["agent_id"], "coder")

        # 3. Reviewer Agent
        payload = {"code": "def parse(): return True"}
        res = self.client.post("/api/v1/agents/review", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["agent_id"], "reviewer")

        # 4. Documentation Agent
        payload = {"code": "def parse(): return True", "request": "Generate user doc manual"}
        res = self.client.post("/api/v1/agents/documentation", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["agent_id"], "documentation")

    def test_get_workflow_history_and_logs(self):
        # Create a mock completed workflow in DB manually
        wf_id = "mock_wf_id_123"
        db_wf = DBWorkflow(id=wf_id, user_id="test_agent_user", name="Mock Test Workflow", status="completed")
        self.db.add(db_wf)
        
        task = DBAgentTask(workflow_id=wf_id, agent_id="planner", task_description="Plan manual", status="completed")
        self.db.add(task)
        self.db.commit()
        
        output = DBAgentOutput(task_id=task.id, output_type="plan", content="Manual plan details")
        self.db.add(output)
        
        history = DBWorkflowHistory(workflow_id=wf_id, summary="Completed mock workflow", result_status="completed", duration_seconds=15)
        self.db.add(history)
        
        log = DBWorkflowLog(workflow_id=wf_id, agent_id="planner", message="Finished execution", log_level="info")
        self.db.add(log)
        self.db.commit()

        # Check /api/v1/agents/history
        res = self.client.get("/api/v1/agents/history", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data), 0)
        
        wf_entry = next((item for item in data if item["id"] == wf_id), None)
        self.assertIsNotNone(wf_entry)
        self.assertEqual(wf_entry["status"], "completed")
        self.assertEqual(wf_entry["duration_seconds"], 15)
        self.assertEqual(wf_entry["tasks"][0]["agent_id"], "planner")
        self.assertEqual(wf_entry["tasks"][0]["output"], "Manual plan details")

        # Check /api/v1/agents/workflow/{id}/logs
        res_logs = self.client.get(f"/api/v1/agents/workflow/{wf_id}/logs", headers=self.headers)
        self.assertEqual(res_logs.status_code, 200)
        logs_data = res_logs.json()
        self.assertEqual(len(logs_data), 1)
        self.assertEqual(logs_data[0]["message"], "Finished execution")


if __name__ == "__main__":
    unittest.main()
