import uuid
import datetime
import time
import json
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_token
from app.db.session import SessionLocal
from app.models import profile as profile_models
from app.models.agents import (
    DBWorkflow,
    DBAgent,
    DBAgentTask,
    DBAgentOutput,
    DBWorkflowLog,
    DBWorkflowHistory
)
from app.models.workflow_state import DBWorkflowState, DBSharedMemory
from app.core.agents.graph import agent_app
from app.core.agents.nodes import (
    _call_llm,
    log_to_db
)
from app.core.agents.router import route_task

router = APIRouter()

# =============================================================================
# SCHEMAS
# =============================================================================

class WorkflowSubmission(BaseModel):
    user_request: str = Field(..., description="The target requirement or engineering task to accomplish")
    task_type: Optional[str] = Field(None, description="Optional pre-classified task type: documentation, code, review, architecture, full")

class TaskSubmission(BaseModel):
    agent_id: str = Field(..., description="The agent role id: planner, research, coder, reviewer, documentation")
    task_description: str = Field(..., description="Goal directions for the single task run")

class ResearchSubmission(BaseModel):
    query: str = Field(..., description="Term or requirements description to investigate")

class CodeSubmission(BaseModel):
    prompt: str = Field(..., description="Code requirements to write")

class ReviewSubmission(BaseModel):
    code: str = Field(..., description="The source code to analyze")

class DocSubmission(BaseModel):
    code: str = Field(..., description="The source code content")
    request: str = Field(..., description="The original task context description")

# =============================================================================
# BACKGROUND RUNNER
# =============================================================================

def run_workflow_background(workflow_id: str, user_request: str, task_type: Optional[str] = None, state_to_resume: Optional[dict] = None):
    """Executes compiled LangGraph state workflow in a background worker."""
    start_time = time.time()
    db = SessionLocal()
    try:
        if state_to_resume:
            initial_state = state_to_resume
            log_to_db(db, workflow_id, "system", f"Workflow execution resumed from agent state: {initial_state.get('current_agent')}.", "info")
            # Update workflow status to running if it was failed/paused
            workflow = db.query(DBWorkflow).filter(DBWorkflow.id == workflow_id).first()
            if workflow:
                workflow.status = "running"
                db.commit()
        else:
            # Initial workflow state
            initial_state = {
                "user_request": user_request,
                "current_agent": "",
                "plan": "",
                "research_notes": "",
                "generated_code": "",
                "review_feedback": "",
                "documentation": "",
                "workflow_id": workflow_id,
                "retry_count": 0,
                "task_type": task_type,
                "routing_decision": [],
                "skipped_agents": [],
                "shared_memory": {},
                "execution_timeline": []
            }
        
        # Invoke LangGraph
        result = agent_app.invoke(initial_state)
        
        # Log finalization
        duration = int(time.time() - start_time)
        log_to_db(db, workflow_id, "system", f"Workflow execution finished successfully in {duration} seconds.", "info")
        
        # Update workflow record
        workflow = db.query(DBWorkflow).filter(DBWorkflow.id == workflow_id).first()
        if workflow:
            workflow.status = "completed"
            
            # Write History
            history = db.query(DBWorkflowHistory).filter(DBWorkflowHistory.workflow_id == workflow_id).first()
            if not history:
                history = DBWorkflowHistory(
                    workflow_id=workflow_id,
                    summary=f"Successfully completed multi-agent task: {user_request[:100]}...",
                    result_status="completed",
                    duration_seconds=duration
                )
                db.add(history)
            else:
                history.result_status = "completed"
                history.duration_seconds = (history.duration_seconds or 0) + duration
            
            # Award +20 XP for running agent workflow
            profile = db.query(profile_models.LearningProfile).filter(profile_models.LearningProfile.user_id == workflow.user_id).first()
            if profile:
                profile.xp_points += 20
                
            db.commit()
            
        # Update skipped agents to 'skipped' in DB
        skipped_agents = result.get("skipped_agents", [])
        for agent_id in skipped_agents:
            db_task = db.query(DBAgentTask).filter(
                DBAgentTask.workflow_id == workflow_id,
                DBAgentTask.agent_id == agent_id
            ).first()
            if db_task:
                db_task.status = "skipped"
        db.commit()
            
    except Exception as e:
        db.rollback()
        duration = int(time.time() - start_time)
        log_to_db(db, workflow_id, "system", f"Workflow execution failed with error: {str(e)}", "error")
        
        workflow = db.query(DBWorkflow).filter(DBWorkflow.id == workflow_id).first()
        if workflow:
            workflow.status = "failed"
            history = db.query(DBWorkflowHistory).filter(DBWorkflowHistory.workflow_id == workflow_id).first()
            if not history:
                history = DBWorkflowHistory(
                    workflow_id=workflow_id,
                    summary=f"Failed task: {user_request[:100]}. Error: {str(e)}",
                    result_status="failed",
                    duration_seconds=duration
                )
                db.add(history)
            else:
                history.result_status = "failed"
                history.duration_seconds = (history.duration_seconds or 0) + duration
            db.commit()
    finally:
        db.close()


# =============================================================================
# API ROUTES
# =============================================================================

@router.post("/workflow")
def trigger_agent_workflow(
    submission: WorkflowSubmission,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Kicks off a multi-agent workflow (Planner -> Research -> Coder -> Reviewer -> Documentation).
    Orchestrated by LangGraph.
    """
    user_id = token_data["uid"]
    workflow_id = str(uuid.uuid4())
    
    # 1. Create DB Workflow
    db_wf = DBWorkflow(
        id=workflow_id,
        user_id=user_id,
        name=submission.user_request[:100],
        status="running"
    )
    db.add(db_wf)
    db.commit()
    
    # 2. Add tasks placeholders for tracking
    agents_list = ["planner", "research", "coder", "reviewer", "documentation"]
    for agent_id in agents_list:
        db_task = DBAgentTask(
            workflow_id=workflow_id,
            agent_id=agent_id,
            task_description=f"Automated graph task for {agent_id}",
            status="pending"
        )
        db.add(db_task)
    
    db.commit()
    
    # 3. Log initial initiation
    log_to_db(db, workflow_id, "system", f"Multi-Agent System initiated. User request: '{submission.user_request}'", "info")
    
    # 4. Enqueue background runner
    background_tasks.add_task(run_workflow_background, workflow_id, submission.user_request, submission.task_type)
    
    return {
        "workflow_id": workflow_id,
        "status": "running",
        "message": "Multi-agent LangGraph workflow running in background."
    }


@router.post("/workflow/route")
def get_routing_preview(
    submission: WorkflowSubmission,
    token_data: dict = Depends(verify_token)
):
    """
    Classifies the user request and previews the agent routing path
    without initiating execution.
    """
    try:
        routing_res = route_task(submission.user_request, submission.task_type)
        return routing_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workflow/{id}/status")
def get_workflow_execution_status(
    id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Returns the dynamic execution status, active routing decision,
    and progress estimation of a running workflow.
    """
    user_id = token_data["uid"]
    wf = db.query(DBWorkflow).filter(DBWorkflow.id == id, DBWorkflow.user_id == user_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Fetch latest intermediate state snapshot to get routing
    latest_state = db.query(DBWorkflowState).filter(DBWorkflowState.workflow_id == id).order_by(DBWorkflowState.created_at.desc()).first()
    
    routing_decision = []
    skipped_agents = []
    current_agent = "orchestrator"
    
    if latest_state:
        snap = latest_state.state_snapshot
        routing_decision = snap.get("routing_decision", [])
        skipped_agents = snap.get("skipped_agents", [])
        current_agent = snap.get("current_agent", "orchestrator")
    else:
        # Default or fallback before orchestrator runs
        routing_decision = ["planner", "research", "coder", "reviewer", "documentation"]
        
    # Calculate progress percent based on tasks completed
    tasks = db.query(DBAgentTask).filter(DBAgentTask.workflow_id == id).all()
    active_tasks = [t for t in tasks if t.agent_id in routing_decision]
    
    completed_count = sum(1 for t in active_tasks if t.status == "completed")
    total_active = len(active_tasks)
    
    progress_percent = int((completed_count / total_active) * 100) if total_active > 0 else 0
    if wf.status == "completed":
        progress_percent = 100
        current_agent = "completed"

    return {
        "workflow_id": id,
        "status": wf.status,
        "current_agent": current_agent,
        "routing_decision": routing_decision,
        "skipped_agents": skipped_agents,
        "progress_percent": progress_percent,
        "created_at": wf.created_at.isoformat(),
        "updated_at": wf.updated_at.isoformat()
    }


@router.get("/workflow/{id}/state")
def get_workflow_state(
    id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Retrieves the complete state snapshot history and shared memory
    key-values for a given workflow execution.
    """
    user_id = token_data["uid"]
    wf = db.query(DBWorkflow).filter(DBWorkflow.id == id, DBWorkflow.user_id == user_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Fetch latest state snapshot
    latest_state = db.query(DBWorkflowState).filter(DBWorkflowState.workflow_id == id).order_by(DBWorkflowState.created_at.desc()).first()
    state_snap = latest_state.state_snapshot if latest_state else {}

    # Fetch shared memory database records
    mem_records = db.query(DBSharedMemory).filter(DBSharedMemory.workflow_id == id).all()
    
    shared_memory = {}
    for r in mem_records:
        if r.category not in shared_memory:
            shared_memory[r.category] = {}
        try:
            val = json.loads(r.memory_value)
        except Exception:
            val = r.memory_value
        shared_memory[r.category][r.memory_key] = val

    return {
        "workflow_id": id,
        "status": wf.status,
        "state_snapshot": state_snap,
        "shared_memory": shared_memory
    }


@router.get("/workflow/{id}/timeline")
def get_workflow_timeline(
    id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Retrieves the execution duration logs and status timing
    for each agent node in the pipeline.
    """
    user_id = token_data["uid"]
    wf = db.query(DBWorkflow).filter(DBWorkflow.id == id, DBWorkflow.user_id == user_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Retrieve timeline from the latest state snapshot
    latest_state = db.query(DBWorkflowState).filter(DBWorkflowState.workflow_id == id).order_by(DBWorkflowState.created_at.desc()).first()
    timeline = []
    if latest_state:
        timeline = latest_state.state_snapshot.get("execution_timeline", [])
        
    return {
        "workflow_id": id,
        "timeline": timeline
    }


@router.post("/workflow/{id}/resume")
def resume_workflow(
    id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Resumes an interrupted or failed workflow from the last recorded
    intermediate state checkpoint.
    """
    user_id = token_data["uid"]
    wf = db.query(DBWorkflow).filter(DBWorkflow.id == id, DBWorkflow.user_id == user_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    if wf.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot resume a completed workflow")

    # Fetch latest intermediate state checkpoint
    latest_state = db.query(DBWorkflowState).filter(DBWorkflowState.workflow_id == id).order_by(DBWorkflowState.created_at.desc()).first()
    if not latest_state:
        # Fallback: start new execution
        log_to_db(db, id, "system", "No intermediate state checkpoint found. Starting workflow from scratch.", "warning")
        background_tasks.add_task(run_workflow_background, id, wf.name)
        return {"status": "started", "message": "Workflow started from scratch (no checkpoints found)."}

    state_snap = latest_state.state_snapshot
    
    # Enqueue background execution starting from checkpoint state
    background_tasks.add_task(run_workflow_background, id, wf.name, None, state_snap)
    
    # Reset corresponding agent task statuses in the DB back to pending or running
    # if they were failed/cancelled
    failed_tasks = db.query(DBAgentTask).filter(
        DBAgentTask.workflow_id == id,
        DBAgentTask.status == "failed"
    ).all()
    for task in failed_tasks:
        task.status = "pending"
    
    wf.status = "running"
    db.commit()
    
    log_to_db(db, id, "system", f"Workflow execution resume request received.", "info")
    
    return {
        "status": "running",
        "message": "Workflow resume enqueued in background."
    }


@router.post("/task")
def trigger_agent_task(
    submission: TaskSubmission,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Runs a single targeted task for one agent directly.
    Does not run the full LangGraph pipeline.
    """
    user_id = token_data["uid"]
    
    # Fetch agent prompt
    agent_record = db.query(DBAgent).filter(DBAgent.id == submission.agent_id).first()
    system_prompt = agent_record.system_prompt if agent_record else f"You are a specialized {submission.agent_id} agent."
    
    # Run direct LLM call
    try:
        output_content = _call_llm(system_prompt, submission.task_description)
        
        # Award +5 XP
        profile = db.query(profile_models.LearningProfile).filter(profile_models.LearningProfile.user_id == user_id).first()
        if profile:
            profile.xp_points += 5
            db.commit()
            
        return {
            "status": "completed",
            "agent_id": submission.agent_id,
            "output": output_content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent failed to execute task: {e}")


@router.post("/research")
def trigger_research_agent(
    submission: ResearchSubmission,
    token_data: dict = Depends(verify_token)
):
    """Direct lookup wrapper for the Researcher Agent."""
    system_prompt = "You are a specialized Research Agent. Summarize technical guidelines, references, and best practices."
    try:
        output = _call_llm(system_prompt, f"Perform engineering research on: {submission.query}")
        return {"agent_id": "research", "output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/code")
def trigger_coding_agent(
    submission: CodeSubmission,
    token_data: dict = Depends(verify_token)
):
    """Direct code creation wrapper for the Coding Agent."""
    system_prompt = "You are a specialized Coding Agent. Generate high-quality clean source code blocks inside Markdown code cells."
    try:
        output = _call_llm(system_prompt, f"Write clean implementations for: {submission.prompt}")
        return {"agent_id": "coder", "output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/review")
def trigger_reviewer_agent(
    submission: ReviewSubmission,
    token_data: dict = Depends(verify_token)
):
    """Direct inspection wrapper for the QA Reviewer Agent."""
    system_prompt = "You are a specialized Reviewer Agent. Verify bugs, logic flaws, and optimizations. Conclude with 'APPROVED: True' or 'APPROVED: False'."
    try:
        output = _call_llm(system_prompt, f"Audit the following source code:\n{submission.code}")
        return {"agent_id": "reviewer", "output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/documentation")
def trigger_documentation_agent(
    submission: DocSubmission,
    token_data: dict = Depends(verify_token)
):
    """Direct markdown writing wrapper for the Documentation Agent."""
    system_prompt = "You are a specialized Documentation Agent. Create README.md files, guides, and api docs."
    try:
        output = _call_llm(system_prompt, f"Context Request: {submission.request}\n\nCode base:\n{submission.code}\n\nDraft README manual.")
        return {"agent_id": "documentation", "output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
def get_workflow_history(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """Retrieves all completed or failed workflows, tasks, and final outputs for this user."""
    user_id = token_data["uid"]
    
    workflows = db.query(DBWorkflow).filter(DBWorkflow.user_id == user_id).order_by(DBWorkflow.created_at.desc()).all()
    
    result = []
    for wf in workflows:
        history_record = db.query(DBWorkflowHistory).filter(DBWorkflowHistory.workflow_id == wf.id).first()
        
        # Load agent tasks and their outputs
        tasks_data = []
        for task in wf.tasks:
            output = db.query(DBAgentOutput).filter(DBAgentOutput.task_id == task.id).first()
            tasks_data.append({
                "agent_id": task.agent_id,
                "task_description": task.task_description,
                "status": task.status,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                "output": output.content if output else None
            })
            
        result.append({
            "id": wf.id,
            "name": wf.name,
            "status": wf.status,
            "created_at": wf.created_at.isoformat(),
            "updated_at": wf.updated_at.isoformat(),
            "duration_seconds": history_record.duration_seconds if history_record else None,
            "summary": history_record.summary if history_record else None,
            "tasks": tasks_data
        })
        
    return result


@router.get("/workflow/{id}/logs")
def get_workflow_logs(
    id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """Returns runtime logs for a specific workflow (used for live telemetry streaming)."""
    # Verify workflow ownership
    user_id = token_data["uid"]
    wf = db.query(DBWorkflow).filter(DBWorkflow.id == id, DBWorkflow.user_id == user_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found or access denied")
        
    logs = db.query(DBWorkflowLog).filter(DBWorkflowLog.workflow_id == id).order_by(DBWorkflowLog.timestamp.asc()).all()
    
    return [
        {
            "id": log.id,
            "agent_id": log.agent_id,
            "message": log.message,
            "log_level": log.log_level,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]

