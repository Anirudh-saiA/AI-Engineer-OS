from typing import Dict, Any
from app.core.agents.router import route_task
from app.db.session import SessionLocal
from app.core.agents.nodes import log_to_db

def orchestrator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Central orchestration node. Runs first in the graph workflow.
    Analyzes the user request, determines the routing strategy,
    initializes the execution timeline and shared memory,
    and updates the state.
    """
    workflow_id = state.get("workflow_id")
    user_request = state.get("user_request", "")
    pre_classified_type = state.get("task_type", None)
    
    db = SessionLocal()
    try:
        log_to_db(db, workflow_id, "system", "Orchestrator initiated routing analysis...", "info")
        
        # Determine routing decision
        routing_res = route_task(user_request, pre_classified_type=pre_classified_type)
        
        task_type = routing_res["task_type"]
        routing_decision = routing_res["routing_decision"]
        confidence = routing_res["confidence"]
        reason = routing_res["reason"]
        
        # Identify skipped agents
        all_possible_agents = ["planner", "research", "coder", "reviewer", "documentation"]
        skipped_agents = [agent for agent in all_possible_agents if agent not in routing_decision]
        
        log_msg = (
            f"Routing classification: '{task_type}' (Confidence: {confidence:.2f}).\n"
            f"Reason: {reason}\n"
            f"Active agents: {', '.join(routing_decision)}\n"
            f"Skipped agents: {', '.join(skipped_agents) if skipped_agents else 'None'}"
        )
        log_to_db(db, workflow_id, "system", log_msg, "info")
        
        # Initialize execution timeline
        execution_timeline = []
        
        # Initialize memory dict structures
        shared_memory = state.get("shared_memory")
        if not shared_memory:
            shared_memory = {
                "goals": {"user_request": user_request},
                "context": {
                    "task_type": task_type,
                    "routing_decision": routing_decision,
                    "confidence": confidence,
                    "reason": reason
                },
                "outputs": {},
                "decisions": {},
                "knowledge": {},
                "requirements": {},
                "history": []
            }
            
        return {
            "task_type": task_type,
            "routing_decision": routing_decision,
            "skipped_agents": skipped_agents,
            "shared_memory": shared_memory,
            "execution_timeline": execution_timeline,
            "current_agent": "orchestrator"
        }
    except Exception as e:
        log_to_db(db, workflow_id, "system", f"Orchestrator failed: {e}", "error")
        raise e
    finally:
        db.close()
