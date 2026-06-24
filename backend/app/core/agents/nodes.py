import os
import json
import urllib.request
import datetime
import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.agents import DBAgentTask, DBAgentOutput, DBWorkflowLog
from app.core.knowledge_base import ALL_KB_ENTRIES
from app.core.semantic_search import semantic_search

from app.core.agents.memory import SharedMemory
from app.models.workflow_state import DBWorkflowState, DBSharedMemory
from app.core.agents.coordination_prompts import (
    PLANNER_PROMPT,
    RESEARCH_PROMPT,
    CODER_PROMPT,
    REVIEWER_PROMPT,
    DOCUMENTATION_PROMPT
)

def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Helper function to call Gemini (primary) or OpenAI (fallback) API."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    # 1. Try Gemini API
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"SYSTEM INSTRUCTION: {system_prompt}\n\nPlease acknowledge."}]
                    },
                    {
                        "role": "model",
                        "parts": [{"text": "Understood. I will follow the system instructions precisely."}]
                    },
                    {
                        "role": "user",
                        "parts": [{"text": user_prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 2000
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                return res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"[LLM Core] Gemini call failed: {e}")

    # 2. Try OpenAI API
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 2000
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                return res_data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[LLM Core] OpenAI call failed: {e}")

    # 3. Fallback: Rule-based template responses (For offline/sandbox operations)
    print("[LLM Core] API keys not configured. Falling back to local template output generator.")
    return _generate_local_fallback(system_prompt, user_prompt)


def _generate_local_fallback(system_prompt: str, user_prompt: str) -> str:
    """Fallback generator providing realistic structured outputs when LLM API keys are missing."""
    p_lower = user_prompt.lower()
    
    if "planner" in system_prompt.lower():
        return (
            "# Execution Plan\n\n"
            "1. **Analyze Specifications**: Establish workspace context and target architectures.\n"
            "2. **Gather Knowledge**: Retrieve matching guides, documentation, and references.\n"
            "3. **Generate Code**: Implement standard code schemas, FastAPI routers, or Next.js components.\n"
            "4. **Quality Inspection**: Run reviews to detect logic bugs, memory issues, or type violations.\n"
            "5. **Finalize Documentation**: Build detailed installation instruction manuals."
        )
    elif "research" in system_prompt.lower():
        found_kbs = []
        for kb in ALL_KB_ENTRIES:
            if kb["error_name"].lower() in p_lower or any(cat.lower() in p_lower for cat in kb.get("frameworks", [])):
                found_kbs.append(kb)
        
        notes = "# Research Findings & Best Practices\n\n"
        if found_kbs:
            notes += "### Relevant References found in Knowledge Index:\n"
            for kb in found_kbs[:2]:
                notes += f"- **{kb['error_name']}** ({kb['error_category']}): {kb['root_cause']}\n"
                notes += f"  - Recommended fixes: {', '.join(kb['fix_recommendations'][:2])}\n"
        else:
            notes += "- No explicit matches found in local knowledge indexes. Defaulting to general software architecture best practices.\n"
            
        notes += "\n### Technical Guidelines:\n"
        notes += "- Prefer modular components over bulky monolithic routing files.\n"
        notes += "- Add validation boundaries (like Pydantic types) to input handlers."
        return notes
        
    elif "coder" in system_prompt.lower():
        return (
            "```python\n"
            "# Generated by Coding Agent\n"
            "from fastapi import FastAPI, HTTPException\n"
            "from pydantic import BaseModel\n\n"
            "app = FastAPI(title='Specialized AI Service')\n\n"
            "class TaskRequest(BaseModel):\n"
            "    name: str\n"
            "    description: str\n\n"
            "@app.post('/tasks')\n"
            "def create_task(task: TaskRequest):\n"
            "    if not task.name:\n"
            "        raise HTTPException(status_code=400, detail='Task name required')\n"
            "    return {'status': 'success', 'data': task}\n"
            "```"
        )
    elif "reviewer" in system_prompt.lower():
        return (
            "# Code Inspection Report\n\n"
            "### APPROVED: True\n"
            "### Issues Found:\n"
            "- None. The generated FastAPI router uses correct Pydantic validation structures.\n\n"
            "### Security & Performance Recommendations:\n"
            "- Add response status code definitions (e.g. `status_code=201` for POST handlers)."
        )
    elif "documentation" in system_prompt.lower():
        return (
            "# Documentation & Setup Manual\n\n"
            "## Project Overview\n"
            "Specialized FastAPI microservice generated by the LangGraph Multi-Agent system.\n\n"
            "## Quick Installation\n"
            "```bash\n"
            "pip install fastapi uvicorn pydantic\n"
            "uvicorn main:app --reload\n"
            "```\n\n"
            "## API Spec\n"
            "- `POST /tasks`: Submits task requirements payload."
        )
    return "Fallback generic agent response."


# =============================================================================
# INDIVIDUAL GRAPH NODE RUNNERS
# =============================================================================

def log_to_db(db: Session, workflow_id: str, agent_id: str, message: str, level: str = "info"):
    """Helper to commit execution logs into database."""
    log = DBWorkflowLog(
        workflow_id=workflow_id,
        agent_id=agent_id,
        message=message,
        log_level=level
    )
    db.add(log)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Log save failure: {e}")


def save_intermediate_state(db: Session, workflow_id: str, agent_id: str, state: dict, shared_memory_dict: dict):
    """Saves a state snapshot and commits all shared memory key/values to the DB."""
    try:
        # 1. Save state snapshot
        snapshot = DBWorkflowState(
            workflow_id=workflow_id,
            agent_id=agent_id,
            state_snapshot=state
        )
        db.add(snapshot)
        
        # 2. Save/Update shared memory entries in DB
        for category, items in shared_memory_dict.items():
            if not isinstance(items, dict):
                continue
            for key, val in items.items():
                val_str = json.dumps(val) if not isinstance(val, (str, int, float, bool)) else str(val)
                # Check if exists
                existing = db.query(DBSharedMemory).filter(
                    DBSharedMemory.workflow_id == workflow_id,
                    DBSharedMemory.category == category,
                    DBSharedMemory.memory_key == key
                ).first()
                if existing:
                    existing.memory_value = val_str
                else:
                    db_mem = DBSharedMemory(
                        workflow_id=workflow_id,
                        category=category,
                        memory_key=key,
                        memory_value=val_str
                    )
                    db.add(db_mem)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Nodes Persistence] Failed to save intermediate state: {e}")


def planner_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node representing the Project Manager agent (Planner)."""
    start_time = time.time()
    workflow_id = state["workflow_id"]
    user_request = state["user_request"]
    
    db = SessionLocal()
    try:
        log_to_db(db, workflow_id, "planner", "Planner Agent started analyzing the requirements.", "info")
        
        # Load and update Shared Memory
        memory_mgr = SharedMemory(state.get("shared_memory", {}))
        memory_mgr.write("goals", "user_request", user_request)
        memory_mgr.write("requirements", "initial_request", user_request)
        
        # Add memory context to system prompt
        memory_context = memory_mgr.get_context_for_agent("planner")
        full_system_prompt = f"{PLANNER_PROMPT}\n\n{memory_context}"
        
        plan = _call_llm(full_system_prompt, f"User Request: {user_request}\n\nFormulate the step-by-step checklist.")
        
        # Write back to Shared Memory
        memory_mgr.write("outputs", "plan", plan)
        memory_mgr.write("decisions", "selected_architecture", "Determined in step-by-step checklist.")
        
        task = db.query(DBAgentTask).filter(DBAgentTask.workflow_id == workflow_id, DBAgentTask.agent_id == "planner").first()
        if task:
            task.status = "completed"
            task.completed_at = datetime.datetime.utcnow()
            output = DBAgentOutput(task_id=task.id, output_type="plan", content=plan)
            db.add(output)
            db.commit()
            
        log_to_db(db, workflow_id, "planner", "Planner Agent successfully drafted the execution checklist.", "info")
        
        # Update timeline
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "planner",
            "start": start_time,
            "end": time.time(),
            "status": "completed"
        })
        
        # Save state snapshot and shared memory in database
        updated_memory = memory_mgr.get_all()
        updated_state = {
            **state,
            "plan": plan,
            "current_agent": "planner",
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
        
        save_intermediate_state(db, workflow_id, "planner", updated_state, updated_memory)
        
        return {
            "plan": plan,
            "current_agent": "planner",
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
    except Exception as e:
        log_to_db(db, workflow_id, "planner", f"Planner Agent failed: {e}", "error")
        # Update timeline with failure
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "planner",
            "start": start_time,
            "end": time.time(),
            "status": "failed"
        })
        raise e
    finally:
        db.close()


def research_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node representing the Researcher agent."""
    start_time = time.time()
    workflow_id = state["workflow_id"]
    user_request = state["user_request"]
    plan = state["plan"]
    
    db = SessionLocal()
    try:
        log_to_db(db, workflow_id, "research", "Research Agent searching knowledge resources...", "info")
        
        # Load Shared Memory
        memory_mgr = SharedMemory(state.get("shared_memory", {}))
        
        local_kb_insights = ""
        try:
            search_hits = semantic_search(user_request, top_k=2)
            if search_hits:
                local_kb_insights = "\n\nRelevant past troubleshooting contexts found locally:\n"
                for hit in search_hits:
                    local_kb_insights += f"- [{hit.error_name}]: {hit.root_cause}. Recommended fix: {hit.fix_recommendations[0] if hit.fix_recommendations else ''}\n"
                    # Save to memory
                    memory_mgr.write("knowledge", f"kb_{hit.error_name}", {
                        "root_cause": hit.root_cause,
                        "fix": hit.fix_recommendations
                    })
        except Exception as e:
            print(f"Research semantic search bypassed: {e}")
            
        user_prompt = f"User Request: {user_request}\n\nExecution Plan:\n{plan}{local_kb_insights}\n\nSearch and compile technical recommendations, best practices, and code templates."
        
        # Add memory context to system prompt
        memory_context = memory_mgr.get_context_for_agent("research")
        full_system_prompt = f"{RESEARCH_PROMPT}\n\n{memory_context}"
        
        research_notes = _call_llm(full_system_prompt, user_prompt)
        
        # Write back to memory
        memory_mgr.write("outputs", "research_notes", research_notes)
        
        task = db.query(DBAgentTask).filter(DBAgentTask.workflow_id == workflow_id, DBAgentTask.agent_id == "research").first()
        if task:
            task.status = "completed"
            task.completed_at = datetime.datetime.utcnow()
            output = DBAgentOutput(task_id=task.id, output_type="research_notes", content=research_notes)
            db.add(output)
            db.commit()
            
        log_to_db(db, workflow_id, "research", "Research Agent compiled insights and technical references.", "info")
        
        # Update timeline
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "research",
            "start": start_time,
            "end": time.time(),
            "status": "completed"
        })
        
        updated_memory = memory_mgr.get_all()
        updated_state = {
            **state,
            "research_notes": research_notes,
            "current_agent": "research",
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
        
        save_intermediate_state(db, workflow_id, "research", updated_state, updated_memory)
        
        return {
            "research_notes": research_notes,
            "current_agent": "research",
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
    except Exception as e:
        log_to_db(db, workflow_id, "research", f"Research Agent failed: {e}", "error")
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "research",
            "start": start_time,
            "end": time.time(),
            "status": "failed"
        })
        raise e
    finally:
        db.close()


def coding_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node representing the Software Engineer agent (Coder)."""
    start_time = time.time()
    workflow_id = state["workflow_id"]
    user_request = state["user_request"]
    plan = state["plan"]
    research_notes = state["research_notes"]
    review_feedback = state.get("review_feedback", "")
    
    db = SessionLocal()
    try:
        msg = "Coding Agent starting code generation..."
        if review_feedback:
            msg = "Coding Agent revising code based on reviewer reports..."
            
        log_to_db(db, workflow_id, "coder", msg, "info")
        
        # Load memory
        memory_mgr = SharedMemory(state.get("shared_memory", {}))
        
        user_prompt = (
            f"User Request: {user_request}\n\n"
            f"Plan:\n{plan}\n\n"
            f"Research Guidelines:\n{research_notes}\n\n"
        )
        if review_feedback:
            user_prompt += f"Reviewer Feedback:\n{review_feedback}\n\nPlease fix the identified issues."
            
        # Add memory context
        memory_context = memory_mgr.get_context_for_agent("coder")
        full_system_prompt = f"{CODER_PROMPT}\n\n{memory_context}"
        
        generated_code = _call_llm(full_system_prompt, user_prompt)
        
        # Write output to memory
        memory_mgr.write("outputs", "generated_code", generated_code)
        
        task = db.query(DBAgentTask).filter(DBAgentTask.workflow_id == workflow_id, DBAgentTask.agent_id == "coder").first()
        if task:
            task.status = "completed"
            task.completed_at = datetime.datetime.utcnow()
            output = DBAgentOutput(task_id=task.id, output_type="code", content=generated_code)
            db.add(output)
            db.commit()
            
        log_to_db(db, workflow_id, "coder", "Coding Agent successfully completed code generation.", "info")
        
        # Update timeline
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "coder",
            "start": start_time,
            "end": time.time(),
            "status": "completed"
        })
        
        updated_memory = memory_mgr.get_all()
        updated_state = {
            **state,
            "generated_code": generated_code,
            "current_agent": "coder",
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
        
        save_intermediate_state(db, workflow_id, "coder", updated_state, updated_memory)
        
        return {
            "generated_code": generated_code,
            "current_agent": "coder",
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
    except Exception as e:
        log_to_db(db, workflow_id, "coder", f"Coding Agent failed: {e}", "error")
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "coder",
            "start": start_time,
            "end": time.time(),
            "status": "failed"
        })
        raise e
    finally:
        db.close()


def reviewer_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node representing the QA Reviewer agent."""
    start_time = time.time()
    workflow_id = state["workflow_id"]
    generated_code = state["generated_code"]
    
    db = SessionLocal()
    try:
        log_to_db(db, workflow_id, "reviewer", "Reviewer Agent auditing code quality...", "info")
        
        # Load memory
        memory_mgr = SharedMemory(state.get("shared_memory", {}))
        
        user_prompt = f"Code to review:\n{generated_code}\n\nCheck for logic bugs, styling violations, and security flaws."
        
        # Add memory context
        memory_context = memory_mgr.get_context_for_agent("reviewer")
        full_system_prompt = f"{REVIEWER_PROMPT}\n\n{memory_context}"
        
        review_feedback = _call_llm(full_system_prompt, user_prompt)
        
        # Write to memory
        memory_mgr.write("outputs", "review_report", review_feedback)
        
        approved = "APPROVED: True" in review_feedback
        memory_mgr.write("decisions", "code_review_approved", approved)
        
        task = db.query(DBAgentTask).filter(DBAgentTask.workflow_id == workflow_id, DBAgentTask.agent_id == "reviewer").first()
        if task:
            task.status = "completed"
            task.completed_at = datetime.datetime.utcnow()
            output = DBAgentOutput(task_id=task.id, output_type="review_report", content=review_feedback)
            db.add(output)
            db.commit()
            
        log_msg = f"Reviewer Agent inspection complete. Approved: {approved}."
        log_to_db(db, workflow_id, "reviewer", log_msg, "info")
        
        # Increment retry count in state if not approved
        retry = state.get("retry_count", 0)
        if not approved:
            retry += 1
            
        # Update timeline
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "reviewer",
            "start": start_time,
            "end": time.time(),
            "status": "completed"
        })
        
        updated_memory = memory_mgr.get_all()
        updated_state = {
            **state,
            "review_feedback": review_feedback,
            "current_agent": "reviewer",
            "retry_count": retry,
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
        
        save_intermediate_state(db, workflow_id, "reviewer", updated_state, updated_memory)
        
        return {
            "review_feedback": review_feedback,
            "current_agent": "reviewer",
            "retry_count": retry,
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
    except Exception as e:
        log_to_db(db, workflow_id, "reviewer", f"Reviewer Agent failed: {e}", "error")
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "reviewer",
            "start": start_time,
            "end": time.time(),
            "status": "failed"
        })
        raise e
    finally:
        db.close()


def documentation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Node representing the Technical Writer agent (Documentation)."""
    start_time = time.time()
    workflow_id = state["workflow_id"]
    user_request = state["user_request"]
    generated_code = state["generated_code"]
    
    db = SessionLocal()
    try:
        log_to_db(db, workflow_id, "documentation", "Documentation Agent starting documentation generation...", "info")
        
        # Load memory
        memory_mgr = SharedMemory(state.get("shared_memory", {}))
        
        user_prompt = f"User Request: {user_request}\n\nGenerated Code:\n{generated_code}\n\nDraft a detailed README.md manual containing Overview, Installation instructions, and usage details."
        
        # Add memory context
        memory_context = memory_mgr.get_context_for_agent("documentation")
        full_system_prompt = f"{DOCUMENTATION_PROMPT}\n\n{memory_context}"
        
        documentation = _call_llm(full_system_prompt, user_prompt)
        
        # Write to memory
        memory_mgr.write("outputs", "documentation", documentation)
        
        task = db.query(DBAgentTask).filter(DBAgentTask.workflow_id == workflow_id, DBAgentTask.agent_id == "documentation").first()
        if task:
            task.status = "completed"
            task.completed_at = datetime.datetime.utcnow()
            output = DBAgentOutput(task_id=task.id, output_type="documentation", content=documentation)
            db.add(output)
            db.commit()
            
        log_to_db(db, workflow_id, "documentation", "Documentation Agent successfully generated manual files.", "info")
        
        # Update timeline
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "documentation",
            "start": start_time,
            "end": time.time(),
            "status": "completed"
        })
        
        updated_memory = memory_mgr.get_all()
        updated_state = {
            **state,
            "documentation": documentation,
            "current_agent": "documentation",
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
        
        save_intermediate_state(db, workflow_id, "documentation", updated_state, updated_memory)
        
        return {
            "documentation": documentation,
            "current_agent": "documentation",
            "shared_memory": updated_memory,
            "execution_timeline": timeline
        }
    except Exception as e:
        log_to_db(db, workflow_id, "documentation", f"Documentation Agent failed: {e}", "error")
        timeline = list(state.get("execution_timeline", []))
        timeline.append({
            "agent": "documentation",
            "start": start_time,
            "end": time.time(),
            "status": "failed"
        })
        raise e
    finally:
        db.close()

