from typing import Any, Dict, List, Optional
import json

class SharedMemory:
    """
    Centralized shared memory manager for multi-agent workflows.
    Manages structured data under categories: goals, context, outputs, decisions, knowledge, requirements, history.
    """
    def __init__(self, initial_memory: Optional[Dict[str, Any]] = None):
        self.memory = initial_memory if initial_memory is not None else {}
        # Ensure all standard categories exist
        categories = ["goals", "context", "outputs", "decisions", "knowledge", "requirements", "history"]
        for cat in categories:
            if cat not in self.memory:
                self.memory[cat] = {}

    def write(self, category: str, key: str, value: Any):
        """Write a value to a specific category and key."""
        if category not in self.memory:
            self.memory[category] = {}
        self.memory[category][key] = value

    def read(self, category: str, key: str, default: Any = None) -> Any:
        """Read a value from a specific category and key."""
        if category in self.memory and key in self.memory[category]:
            return self.memory[category][key]
        return default

    def update(self, category: str, key: str, update_fn_or_val: Any):
        """Update a key in a category. If it is callable, calls it with current value."""
        if category not in self.memory:
            self.memory[category] = {}
        
        current = self.memory[category].get(key)
        if callable(update_fn_or_val):
            self.memory[category][key] = update_fn_or_val(current)
        else:
            self.memory[category][key] = update_fn_or_val

    def get_all(self) -> Dict[str, Any]:
        """Returns the entire underlying memory dict."""
        return self.memory

    def get_context_for_agent(self, agent_id: str) -> str:
        """
        Compiles a structured markdown context string of relevant shared memory
        to inject into an agent's prompt.
        """
        context_parts = ["# Shared Memory Context"]
        
        # Add goals
        goals = self.memory.get("goals", {})
        if goals:
            context_parts.append("## Project Goals")
            for k, v in goals.items():
                context_parts.append(f"- **{k}**: {v}")

        # Add requirements
        reqs = self.memory.get("requirements", {})
        if reqs:
            context_parts.append("## System Requirements")
            for k, v in reqs.items():
                context_parts.append(f"- **{k}**: {v}")

        # Add past decisions
        decisions = self.memory.get("decisions", {})
        if decisions:
            context_parts.append("## Architectural Decisions")
            for k, v in decisions.items():
                context_parts.append(f"- **{k}**: {v}")

        # Add previous agent outputs that might be relevant
        outputs = self.memory.get("outputs", {})
        if outputs:
            context_parts.append("## Completed Deliverables")
            for k, v in outputs.items():
                # Provide full details for relevant inputs
                if agent_id == "coder" and k in ["plan", "research_notes", "review_report"]:
                    context_parts.append(f"### {k.replace('_', ' ').title()}\n{v}")
                elif agent_id == "reviewer" and k in ["plan", "generated_code"]:
                    context_parts.append(f"### {k.replace('_', ' ').title()}\n{v}")
                elif agent_id == "documentation" and k in ["plan", "generated_code"]:
                    context_parts.append(f"### {k.replace('_', ' ').title()}\n{v}")
                else:
                    # Generic summary
                    val_str = str(v)
                    if len(val_str) > 200:
                        val_str = val_str[:200] + "... [truncated]"
                    context_parts.append(f"- **{k}**: {val_str}")
                    
        return "\n\n".join(context_parts)
