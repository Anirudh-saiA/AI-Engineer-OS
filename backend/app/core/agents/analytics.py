from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.agents import DBAgentTask, DBWorkflow, DBWorkflowHistory

def get_agent_metrics(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """
    Computes per-agent performance statistics for a specific user:
    - total tasks executed
    - success rate
    - average execution duration
    """
    tasks = db.query(DBAgentTask).join(DBWorkflow).filter(DBWorkflow.user_id == user_id).all()
    
    agent_stats = {}
    for task in tasks:
        agent_id = task.agent_id
        if agent_id not in agent_stats:
            agent_stats[agent_id] = {
                "agent_id": agent_id,
                "total_tasks": 0,
                "completed_tasks": 0,
                "failed_tasks": 0,
                "durations": []
            }
        
        stats = agent_stats[agent_id]
        stats["total_tasks"] += 1
        if task.status == "completed":
            stats["completed_tasks"] += 1
            if task.completed_at and task.created_at:
                dur = (task.completed_at - task.created_at).total_seconds()
                stats["durations"].append(max(dur, 0))
        elif task.status == "failed":
            stats["failed_tasks"] += 1
            
    result = []
    # Seed default values for all known agents if not in db
    all_agents = ["planner", "research", "coder", "reviewer", "documentation"]
    for agent_id in all_agents:
        if agent_id not in agent_stats:
            result.append({
                "agent_id": agent_id,
                "total_tasks": 0,
                "success_rate": 0.0,
                "avg_execution_time": 0.0
            })
        else:
            stats = agent_stats[agent_id]
            durations = stats.pop("durations")
            avg_time = sum(durations) / len(durations) if durations else 0.0
            success_rate = (stats["completed_tasks"] / stats["total_tasks"]) * 100 if stats["total_tasks"] > 0 else 0.0
            result.append({
                "agent_id": agent_id,
                "total_tasks": stats["total_tasks"],
                "success_rate": round(success_rate, 1),
                "avg_execution_time": round(avg_time, 2)
            })
    return result

def get_workflow_metrics(db: Session, user_id: str) -> Dict[str, Any]:
    """
    Computes workflow completion rates, durations, and task type distributions.
    """
    workflows = db.query(DBWorkflow).filter(DBWorkflow.user_id == user_id).all()
    
    total = len(workflows)
    completed = sum(1 for w in workflows if w.status == "completed")
    failed = sum(1 for w in workflows if w.status == "failed")
    running = sum(1 for w in workflows if w.status == "running")
    
    completion_rate = (completed / total) * 100 if total > 0 else 0.0
    
    # Calculate avg duration from DBWorkflowHistory
    history = db.query(DBWorkflowHistory).join(DBWorkflow).filter(DBWorkflow.user_id == user_id).all()
    durations = [h.duration_seconds for h in history if h.duration_seconds is not None]
    avg_duration = sum(durations) / len(durations) if durations else 0.0
    
    # Task type distribution
    task_types = {
        "documentation": 0,
        "review": 0,
        "code": 0,
        "architecture": 0,
        "full": 0
    }
    for w in workflows:
        name_lower = w.name.lower()
        t_type = "full"
        if "doc" in name_lower or "readme" in name_lower:
            t_type = "documentation"
        elif "review" in name_lower or "audit" in name_lower:
            t_type = "review"
        elif "code" in name_lower or "implement" in name_lower:
            t_type = "code"
        elif "design" in name_lower or "architecture" in name_lower:
            t_type = "architecture"
        task_types[t_type] += 1
        
    return {
        "total_workflows": total,
        "completed_workflows": completed,
        "failed_workflows": failed,
        "running_workflows": running,
        "completion_rate": round(completion_rate, 1),
        "avg_duration_seconds": round(avg_duration, 2),
        "task_type_distribution": task_types
    }

def get_performance_trends(db: Session, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
    """
    Computes daily stats for active workflows over the past N days.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    workflows = db.query(DBWorkflow).filter(
        DBWorkflow.user_id == user_id,
        DBWorkflow.created_at >= start_date
    ).all()
    
    trends = {}
    # Initialize all dates in range
    for i in range(days):
        d_str = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        trends[d_str] = {
            "date": d_str,
            "total": 0,
            "completed": 0,
            "failed": 0
        }
        
    for w in workflows:
        d_str = w.created_at.strftime("%Y-%m-%d")
        if d_str in trends:
            trends[d_str]["total"] += 1
            if w.status == "completed":
                trends[d_str]["completed"] += 1
            elif w.status == "failed":
                trends[d_str]["failed"] += 1
                
    sorted_trends = sorted(trends.values(), key=lambda x: x["date"])
    return sorted_trends

def get_agent_utilization(db: Session, user_id: str) -> Dict[str, int]:
    """
    Returns how many times each agent is used.
    """
    tasks = db.query(DBAgentTask).join(DBWorkflow).filter(DBWorkflow.user_id == user_id).all()
    
    counts = {
        "planner": 0,
        "research": 0,
        "coder": 0,
        "reviewer": 0,
        "documentation": 0
    }
    for t in tasks:
        if t.agent_id in counts:
            counts[t.agent_id] += 1
            
    return counts
