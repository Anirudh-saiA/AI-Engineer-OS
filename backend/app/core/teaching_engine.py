"""
AI-Engineer-OS Teaching Engine
===============================
Transforms every error into a comprehensive teaching moment.
Generates structured teaching cards with underlying concepts,
prevention strategies, real-world examples, and difficulty levels.
"""

from typing import Dict, Any, List, Optional
from app.core.knowledge_base import get_kb_entry, ALL_KB_ENTRIES


# ─── Concept mapping: error type → underlying CS concepts ────────

CONCEPT_MAP: Dict[str, Dict[str, Any]] = {
    "NameError": {
        "concept_title": "Variable Scoping & Name Resolution",
        "underlying_concepts": ["LEGB rule", "Variable lifetime", "Closures", "Module imports"],
        "difficulty_level": "beginner",
        "related_topics": ["Enclosing scope", "Global vs local", "Built-in names"],
    },
    "TypeError": {
        "concept_title": "Type Systems & Type Safety",
        "underlying_concepts": ["Dynamic typing", "Strong typing", "Type coercion", "Duck typing"],
        "difficulty_level": "intermediate",
        "related_topics": ["Type hints", "isinstance()", "Protocol classes"],
    },
    "ValueError": {
        "concept_title": "Input Validation & Domain Constraints",
        "underlying_concepts": ["Preconditions", "Domain modeling", "Defensive programming"],
        "difficulty_level": "intermediate",
        "related_topics": ["Pydantic validation", "Contract programming", "Assertions"],
    },
    "KeyError": {
        "concept_title": "Dictionary Access & Hash Tables",
        "underlying_concepts": ["Hash table internals", "Key hashing", "Default values", "Missing data handling"],
        "difficulty_level": "beginner",
        "related_topics": ["defaultdict", "TypedDict", "JSON parsing patterns"],
    },
    "IndexError": {
        "concept_title": "Array Indexing & Boundary Conditions",
        "underlying_concepts": ["0-based indexing", "Off-by-one errors", "Boundary checking", "Negative indexing"],
        "difficulty_level": "beginner",
        "related_topics": ["Slicing", "enumerate()", "Iterator pattern"],
    },
    "ImportError": {
        "concept_title": "Module System & Dependency Management",
        "underlying_concepts": ["Import machinery", "sys.path resolution", "Virtual environments", "Circular imports"],
        "difficulty_level": "beginner",
        "related_topics": ["Package structure", "__init__.py", "Import hooks"],
    },
    "ModuleNotFoundError": {
        "concept_title": "Package Installation & Path Resolution",
        "underlying_concepts": ["pip vs import naming", "sys.path", "Virtual environments", "PYTHONPATH"],
        "difficulty_level": "beginner",
        "related_topics": ["pip freeze", "requirements.txt", "pyproject.toml"],
    },
    "AttributeError": {
        "concept_title": "Object Attributes & Method Resolution",
        "underlying_concepts": ["Attribute lookup chain", "MRO (Method Resolution Order)", "Descriptors", "None safety"],
        "difficulty_level": "intermediate",
        "related_topics": ["hasattr()", "getattr()", "__getattr__", "Null Object pattern"],
    },
    "ZeroDivisionError": {
        "concept_title": "Numerical Safety & Edge Cases",
        "underlying_concepts": ["Division by zero", "IEEE 754 floating point", "Guard clauses", "Numerical stability"],
        "difficulty_level": "beginner",
        "related_topics": ["float('inf')", "math.isnan()", "Decimal arithmetic"],
    },
    "RecursionError": {
        "concept_title": "Recursion, Call Stacks & Iteration",
        "underlying_concepts": ["Call stack frames", "Base cases", "Tail recursion", "Stack overflow"],
        "difficulty_level": "intermediate",
        "related_topics": ["Dynamic programming", "Memoization", "Iterative conversion"],
    },
    "SyntaxError": {
        "concept_title": "Language Grammar & Parser Mechanics",
        "underlying_concepts": ["Tokenization", "Abstract Syntax Trees", "Grammar productions", "Indentation"],
        "difficulty_level": "beginner",
        "related_topics": ["PEP 8", "Auto-formatters", "Linters"],
    },
    "FileNotFoundError": {
        "concept_title": "Filesystem Operations & Path Handling",
        "underlying_concepts": ["Absolute vs relative paths", "Working directory", "Cross-platform paths"],
        "difficulty_level": "beginner",
        "related_topics": ["pathlib.Path", "os.path", "Context managers"],
    },
    "OperationalError": {
        "concept_title": "Database Connectivity & Operations",
        "underlying_concepts": ["Connection pooling", "SQL execution", "Schema migrations", "Transaction management"],
        "difficulty_level": "advanced",
        "related_topics": ["SQLAlchemy sessions", "Alembic migrations", "Connection strings"],
    },
    "IntegrityError": {
        "concept_title": "Database Constraints & Data Integrity",
        "underlying_concepts": ["UNIQUE constraints", "Foreign keys", "NOT NULL", "ACID transactions"],
        "difficulty_level": "advanced",
        "related_topics": ["UPSERT patterns", "Cascading deletes", "Constraint naming"],
    },
    "ReferenceError": {
        "concept_title": "JavaScript Scoping & Hoisting",
        "underlying_concepts": ["Temporal Dead Zone", "var/let/const", "Hoisting", "Block scope"],
        "difficulty_level": "beginner",
        "related_topics": ["Closures", "Module scope", "strict mode"],
    },
    "Invalid Hook Call": {
        "concept_title": "React Hooks Architecture",
        "underlying_concepts": ["Rules of Hooks", "Fiber linked list", "Hook ordering", "Component lifecycle"],
        "difficulty_level": "intermediate",
        "related_topics": ["Custom hooks", "useEffect cleanup", "Hook dependencies"],
    },
    "Hydration Mismatch": {
        "concept_title": "Server-Side Rendering & Hydration",
        "underlying_concepts": ["SSR lifecycle", "DOM reconciliation", "Isomorphic rendering", "Client-only code"],
        "difficulty_level": "advanced",
        "related_topics": ["use client directive", "next/dynamic", "Streaming SSR"],
    },
    "ERESOLVE": {
        "concept_title": "Dependency Resolution & Semantic Versioning",
        "underlying_concepts": ["Semver ranges", "Peer dependencies", "Dependency trees", "Lock files"],
        "difficulty_level": "intermediate",
        "related_topics": ["npm overrides", "peerDependenciesMeta", "Monorepos"],
    },
    "CORS Error": {
        "concept_title": "Browser Security & Same-Origin Policy",
        "underlying_concepts": ["Same-origin policy", "Preflight requests", "Access-Control headers", "Credentials mode"],
        "difficulty_level": "intermediate",
        "related_topics": ["Proxy servers", "CSP headers", "Cookie SameSite"],
    },
}


def generate_teaching_card(
    error_type: str,
    root_cause: str = "",
    ai_explanation: str = "",
) -> Dict[str, Any]:
    """
    Generates a comprehensive teaching card for an error type.

    Returns a structured dictionary with:
        concept_title, why_it_happened, underlying_concepts,
        prevention_strategies, best_practices, real_world_examples,
        difficulty_level, related_topics
    """
    # Look up in concept map
    concept_info = CONCEPT_MAP.get(error_type, {})

    # Look up in knowledge base for richer content
    kb_entry = get_kb_entry(error_type)

    # Build the card
    card: Dict[str, Any] = {
        "concept_title": concept_info.get("concept_title", f"Understanding {error_type}"),
        "error_type": error_type,
        "difficulty_level": concept_info.get("difficulty_level", "beginner"),
        "underlying_concepts": concept_info.get("underlying_concepts", []),
        "related_topics": concept_info.get("related_topics", []),
        "why_it_happened": "",
        "prevention_strategies": [],
        "best_practices": [],
        "real_world_examples": [],
        "beginner_explanation": "",
        "advanced_explanation": "",
    }

    # Populate from KB if available
    if kb_entry:
        card["why_it_happened"] = kb_entry.get("root_cause", root_cause)
        card["prevention_strategies"] = kb_entry.get("prevention_strategies", [])
        card["best_practices"] = kb_entry.get("best_practices", [])
        card["beginner_explanation"] = kb_entry.get("beginner_explanation", "")
        card["advanced_explanation"] = kb_entry.get("advanced_explanation", "")
        card["real_world_examples"] = _generate_real_world_examples(error_type)

        # Merge learning resources as related topics
        resources = kb_entry.get("learning_resources", [])
        existing_topics = set(card["related_topics"])
        for r in resources:
            if r not in existing_topics:
                card["related_topics"].append(r)
    else:
        # Fallback: use provided root cause or AI explanation
        card["why_it_happened"] = root_cause or ai_explanation or f"{error_type} occurred during code execution."
        card["real_world_examples"] = _generate_real_world_examples(error_type)

    return card


def _generate_real_world_examples(error_type: str) -> List[str]:
    """Provides real-world scenario examples for common error types."""
    examples_map: Dict[str, List[str]] = {
        "NameError": [
            "A developer typos 'pritn' instead of 'print' in a quick script",
            "A team member forgets to import a utility function after a file refactor",
            "A variable is defined inside an if-block but used outside it",
        ],
        "TypeError": [
            "An API returns a string '42' but the code does '42' + 10 without conversion",
            "A function expected a list but receives None from a failed database query",
            "A developer passes 3 arguments to a function that expects 2",
        ],
        "KeyError": [
            "A weather API response has 'temp' instead of 'temperature' and the code accesses data['temperature']",
            "A config file is missing an expected key after a deployment update",
            "JSON from a third-party service changes its schema without warning",
        ],
        "IndexError": [
            "A loop iterates based on old data length but the data was filtered first",
            "An empty results list from a database query is accessed with results[0]",
            "A CSV parser assumes at least 5 columns but some rows have fewer",
        ],
        "ImportError": [
            "A new team member clones the repo but forgets to install dependencies",
            "A package works locally but fails in CI because it's not in requirements.txt",
            "Two modules import from each other creating a circular dependency",
        ],
        "ZeroDivisionError": [
            "Calculating average score when no students have submitted yet (0/0)",
            "Computing percentage change when the original value is 0",
            "A dashboard divides total hours by completed projects, but projects count is 0",
        ],
        "AttributeError": [
            "A function returns None instead of the expected object, then .method() is called on it",
            "A library update renamed a method from .parse() to .read()",
            "A developer names their file 'json.py' which shadows the standard library json module",
        ],
        "CORS Error": [
            "A frontend at localhost:3000 tries to call an API at localhost:8000 without CORS config",
            "A production API whitelist doesn't include the new staging domain",
            "A browser extension injects headers that interfere with CORS preflight",
        ],
        "Hydration Mismatch": [
            "A component renders the current date on the server but the client renders a slightly different timestamp",
            "A browser extension modifies the DOM before React hydration runs",
            "Code checks window.innerWidth during render, but window doesn't exist on the server",
        ],
    }
    return examples_map.get(error_type, [
        f"A developer encounters {error_type} while building a production feature",
        f"An automated test fails with {error_type} after a dependency update",
    ])


def get_teaching_summary(error_type: str) -> Dict[str, str]:
    """Returns a brief teaching summary suitable for inline display."""
    concept_info = CONCEPT_MAP.get(error_type, {})
    kb_entry = get_kb_entry(error_type)

    return {
        "concept": concept_info.get("concept_title", f"Understanding {error_type}"),
        "difficulty": concept_info.get("difficulty_level", "beginner"),
        "quick_tip": kb_entry.get("prevention_strategies", ["Practice defensive coding"])[0] if kb_entry else "Review the error documentation",
    }
