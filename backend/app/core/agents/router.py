import re
import json
from typing import Dict, Any, List, Tuple

# ROUTING_RULES maps task types to the sequence of agents to execute
ROUTING_RULES = {
    "documentation": ["documentation"],
    "code": ["coder"],
    "review": ["reviewer"],
    "architecture": ["planner", "research", "coder"],
    "full": ["planner", "research", "coder", "reviewer", "documentation"]
}

KEYWORD_PATTERNS = {
    "documentation": [r"\bdoc\b", r"\bdocs\b", r"readme", r"document", r"writeup", r"manual", r"guide"],
    "review": [r"review", r"audit", r"inspect", r"check code", r"pr review", r"security analysis"],
    "code": [r"write code", r"implement", r"generate code", r"function to", r"class to", r"script", r"refactor"],
    "architecture": [r"design", r"architecture", r"database schema", r"data model", r"system design", r"layout"]
}

def classify_task_by_keywords(user_request: str) -> Tuple[str, float, str]:
    """
    Analyzes the user request using keyword heuristics to classify task type.
    Returns: (task_type, confidence_score, explanation)
    """
    request_lower = user_request.lower()
    matches = {category: 0 for category in KEYWORD_PATTERNS}
    
    for category, patterns in KEYWORD_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, request_lower):
                matches[category] += 1
                
    # Sort matches by count
    sorted_matches = sorted(matches.items(), key=lambda x: x[1], reverse=True)
    best_category, max_match = sorted_matches[0]
    
    if max_match > 0:
        confidence = min(0.5 + (max_match * 0.15), 0.95)
        reason = f"Keyword matching: found '{best_category}' related keywords in the request."
        return best_category, confidence, reason
        
    # Default fallback
    return "full", 0.40, "Default routing: request is complex or general, running full multi-agent pipeline."

def classify_task_with_llm(user_request: str) -> Tuple[str, float, str]:
    """
    Uses LLM to perform task classification. Falls back to keyword matching on error.
    """
    try:
        from app.core.agents.nodes import _call_llm
        system_prompt = (
            "You are an AI task classifier. Analyze the user request and categorize it into exactly one of these categories:\n"
            "- documentation (writing readmes, manuals, API specifications)\n"
            "- review (auditing existing code, finding bugs, security issues)\n"
            "- code (writing a single piece of code or script, refactoring code)\n"
            "- architecture (designing a system, databases, models, multiple files)\n"
            "- full (general multi-agent flow: planning, research, coding, reviewing, documenting)\n\n"
            "Respond in JSON format: {\"task_type\": \"...\", \"confidence\": 0.XX, \"reason\": \"...\"}"
        )
        response_text = _call_llm(system_prompt, f"User request to classify: {user_request}")
        
        # Clean response string to parse as JSON
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        data = json.loads(cleaned)
        task_type = data.get("task_type", "full")
        confidence = data.get("confidence", 0.7)
        reason = data.get("reason", "LLM classified")
        
        if task_type in ROUTING_RULES:
            return task_type, confidence, f"LLM routing: {reason}"
    except Exception as e:
        print(f"[Router] LLM classification fallback failed: {e}")
        
    return classify_task_by_keywords(user_request)

def route_task(user_request: str, pre_classified_type: str = None) -> Dict[str, Any]:
    """
    Determines the task routing decision.
    Returns:
        {
            "task_type": str,
            "routing_decision": list,
            "confidence": float,
            "reason": str
        }
    """
    if pre_classified_type and pre_classified_type in ROUTING_RULES:
        return {
            "task_type": pre_classified_type,
            "routing_decision": ROUTING_RULES[pre_classified_type],
            "confidence": 1.0,
            "reason": f"Explicitly requested task type: {pre_classified_type}"
        }
        
    # Use LLM classification for intelligent routing
    task_type, confidence, reason = classify_task_with_llm(user_request)
    
    return {
        "task_type": task_type,
        "routing_decision": ROUTING_RULES.get(task_type, ROUTING_RULES["full"]),
        "confidence": confidence,
        "reason": reason
    }
