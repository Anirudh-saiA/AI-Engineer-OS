from typing import TypedDict, Dict, Any, List
from langgraph.graph import StateGraph, END

from app.core.agents.nodes import (
    planner_node,
    research_node,
    coding_node,
    reviewer_node,
    documentation_node
)

class AgentState(TypedDict):
    """
    Unified LangGraph state passing context between planner,
    researcher, coder, reviewer, and technical writer agents.
    """
    user_request: str
    current_agent: str
    plan: str
    research_notes: str
    generated_code: str
    review_feedback: str
    documentation: str
    workflow_id: str
    retry_count: int


def should_continue(state: AgentState) -> str:
    """
    Conditional edge decision mapping.
    Resolves if the review reports indicate critical issues.
    Loops back to Coding Agent up to a maximum of 2 times.
    """
    review_feedback = state.get("review_feedback", "")
    retry_count = state.get("retry_count", 0)
    
    approved = "APPROVED: True" in review_feedback
    if not approved and retry_count < 2:
        return "coder"
    return "documentation"


# Initialize the state machine graph
workflow = StateGraph(AgentState)

# Add node references mapping to node functions
workflow.add_node("planner", planner_node)
workflow.add_node("research", research_node)
workflow.add_node("coder", coding_node)
workflow.add_node("reviewer", reviewer_node)
workflow.add_node("documentation", documentation_node)

# Set graph workflow entry point
workflow.set_entry_point("planner")

# Bind normal progression flow edges
workflow.add_edge("planner", "research")
workflow.add_edge("research", "coder")
workflow.add_edge("coder", "reviewer")

# Declare conditional edge on Reviewer completion
workflow.add_conditional_edges(
    "reviewer",
    should_continue,
    {
        "coder": "coder",
        "documentation": "documentation"
    }
)

# Route final node straight to completion termination
workflow.add_edge("documentation", END)

# Compile graph into executable FastAPI agent app
agent_app = workflow.compile()
