from typing import TypedDict, Dict, Any, List
from langgraph.graph import StateGraph, END

from app.core.agents.nodes import (
    planner_node,
    research_node,
    coding_node,
    reviewer_node,
    documentation_node
)
from app.core.agents.orchestrator import orchestrator_node

class AgentState(TypedDict):
    """
    Unified LangGraph state passing context between planner,
    researcher, coder, reviewer, and technical writer agents.
    """
    user_request: str
    current_agent: str
    task_type: str              # "documentation", "code", "architecture", "review", "full"
    routing_decision: List[str] # ["planner", "coder"] — dynamic agent list
    skipped_agents: List[str]   # agents bypassed by routing
    plan: str
    research_notes: str
    generated_code: str
    review_feedback: str
    documentation: str
    workflow_id: str
    retry_count: int
    shared_memory: Dict[str, Any]         # centralized memory store
    execution_timeline: List[Dict[str, Any]] # [{agent, start, end, status}]


def route_next(state: AgentState) -> str:
    """
    Decides the next node to execute based on the current state and routing_decision list.
    """
    current = state.get("current_agent", "orchestrator")
    routing_decision = state.get("routing_decision", [])
    
    # Standard flow order
    flow_order = ["planner", "research", "coder", "reviewer", "documentation"]
    
    if current == "orchestrator":
        for agent in flow_order:
            if agent in routing_decision:
                return agent
        return END
        
    if current == "planner":
        for agent in flow_order[1:]:
            if agent in routing_decision:
                return agent
        return END
        
    if current == "research":
        for agent in flow_order[2:]:
            if agent in routing_decision:
                return agent
        return END
        
    if current == "coder":
        for agent in flow_order[3:]:
            if agent in routing_decision:
                return agent
        return END
        
    if current == "reviewer":
        # Check review approval
        review_feedback = state.get("review_feedback", "")
        retry_count = state.get("retry_count", 0)
        approved = "APPROVED: True" in review_feedback
        
        # Loop back to coder if not approved, retry limit not reached, and coder is in active routing
        if not approved and retry_count < 2 and "coder" in routing_decision:
            return "coder"
            
        # Otherwise find the next active node in order
        for agent in flow_order[4:]:
            if agent in routing_decision:
                return agent
        return END
        
    if current == "documentation":
        return END
        
    return END


# Initialize the state machine graph
workflow = StateGraph(AgentState)

# Add node references mapping to node functions
workflow.add_node("orchestrator", orchestrator_node)
workflow.add_node("planner", planner_node)
workflow.add_node("research", research_node)
workflow.add_node("coder", coding_node)
workflow.add_node("reviewer", reviewer_node)
workflow.add_node("documentation", documentation_node)

# Set entry point to the orchestrator
workflow.set_entry_point("orchestrator")

# Declare conditional routing edges from each node
workflow.add_conditional_edges(
    "orchestrator",
    route_next,
    {
        "planner": "planner",
        "research": "research",
        "coder": "coder",
        "reviewer": "reviewer",
        "documentation": "documentation",
        END: END
    }
)

workflow.add_conditional_edges(
    "planner",
    route_next,
    {
        "research": "research",
        "coder": "coder",
        "reviewer": "reviewer",
        "documentation": "documentation",
        END: END
    }
)

workflow.add_conditional_edges(
    "research",
    route_next,
    {
        "coder": "coder",
        "reviewer": "reviewer",
        "documentation": "documentation",
        END: END
    }
)

workflow.add_conditional_edges(
    "coder",
    route_next,
    {
        "reviewer": "reviewer",
        "documentation": "documentation",
        END: END
    }
)

workflow.add_conditional_edges(
    "reviewer",
    route_next,
    {
        "coder": "coder",
        "documentation": "documentation",
        END: END
    }
)

workflow.add_conditional_edges(
    "documentation",
    route_next,
    {
        END: END
    }
)

# Compile graph into executable FastAPI agent app
agent_app = workflow.compile()

