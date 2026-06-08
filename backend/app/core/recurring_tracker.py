"""
AI-Engineer-OS Recurring Error Tracker
========================================
Detects and tracks recurring error patterns per user.
Generates weak area analysis, personalized recommendations,
and suggested learning modules.
"""

import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func


# ─── Learning module recommendations mapped to error patterns ────

LEARNING_MODULE_MAP: Dict[str, Dict[str, str]] = {
    "KeyError": {
        "module": "Dictionary Access Patterns",
        "description": "Master safe dictionary access with .get(), defaultdict, and TypedDict.",
        "difficulty": "beginner",
    },
    "IndexError": {
        "module": "Array Bounds & Safe Indexing",
        "description": "Understand 0-based indexing, boundary checks, slicing, and enumerate().",
        "difficulty": "beginner",
    },
    "TypeError": {
        "module": "Type System Fundamentals",
        "description": "Learn Python's dynamic typing, type conversions, and type hints.",
        "difficulty": "intermediate",
    },
    "ValueError": {
        "module": "Input Validation & Sanitization",
        "description": "Build robust input validation with Pydantic, regex, and domain checks.",
        "difficulty": "intermediate",
    },
    "ImportError": {
        "module": "Dependency Management",
        "description": "Master virtual environments, requirements.txt, and import resolution.",
        "difficulty": "beginner",
    },
    "ModuleNotFoundError": {
        "module": "Dependency Management",
        "description": "Understand pip naming vs import naming and virtual environments.",
        "difficulty": "beginner",
    },
    "AttributeError": {
        "module": "Object-Oriented Programming",
        "description": "Understand attribute resolution, None checks, and the MRO.",
        "difficulty": "intermediate",
    },
    "NameError": {
        "module": "Python Scoping & LEGB Rule",
        "description": "Learn variable scoping, closures, and the LEGB lookup order.",
        "difficulty": "beginner",
    },
    "ZeroDivisionError": {
        "module": "Numerical Safety",
        "description": "Handle edge cases in mathematical operations and aggregations.",
        "difficulty": "beginner",
    },
    "SyntaxError": {
        "module": "Python Syntax Mastery",
        "description": "Understand Python grammar, indentation, and common syntax pitfalls.",
        "difficulty": "beginner",
    },
    "RecursionError": {
        "module": "Recursion & Iteration",
        "description": "Master base cases, iterative alternatives, and memoization.",
        "difficulty": "intermediate",
    },
    "FileNotFoundError": {
        "module": "Filesystem Operations",
        "description": "Use pathlib, absolute paths, and defensive file access patterns.",
        "difficulty": "beginner",
    },
    "OperationalError": {
        "module": "Database Operations",
        "description": "Master database connections, migrations, and query optimization.",
        "difficulty": "advanced",
    },
    "IntegrityError": {
        "module": "Database Constraints & Transactions",
        "description": "Understand unique constraints, foreign keys, and ACID transactions.",
        "difficulty": "advanced",
    },
    "NpmError": {
        "module": "npm & Node.js Package Management",
        "description": "Master dependency resolution, peer dependencies, and cache management.",
        "difficulty": "intermediate",
    },
    "ERESOLVE": {
        "module": "npm & Node.js Package Management",
        "description": "Resolve peer dependency conflicts and version mismatches.",
        "difficulty": "intermediate",
    },
    "ReferenceError": {
        "module": "JavaScript Scoping & Hoisting",
        "description": "Understand var/let/const, hoisting, and the temporal dead zone.",
        "difficulty": "beginner",
    },
}


def track_error_pattern(
    db: Session,
    user_id: str,
    error_type: str,
    categories: List[str],
) -> Optional[Dict[str, Any]]:
    """
    Updates the recurring error pattern tracker for a user.
    Returns pattern info if the error is now recurring (count >= 3).
    """
    from app.models.profile import RecurringErrorPattern

    if not error_type or error_type == "UnknownError":
        return None

    # Check if pattern already exists
    pattern = db.query(RecurringErrorPattern).filter(
        RecurringErrorPattern.user_id == user_id,
        RecurringErrorPattern.error_type == error_type,
    ).first()

    if pattern:
        pattern.occurrence_count += 1
        import datetime
        pattern.last_seen = datetime.datetime.utcnow()
        # Update weak area if not already set
        if not pattern.weak_area_category and categories:
            pattern.weak_area_category = categories[0] if categories[0] != "Unknown" else None
        # Update suggested module
        module_info = LEARNING_MODULE_MAP.get(error_type, {})
        if module_info and not pattern.suggested_module:
            pattern.suggested_module = module_info.get("module", "")
    else:
        import datetime
        module_info = LEARNING_MODULE_MAP.get(error_type, {})
        pattern = RecurringErrorPattern(
            user_id=user_id,
            error_type=error_type,
            occurrence_count=1,
            first_seen=datetime.datetime.utcnow(),
            last_seen=datetime.datetime.utcnow(),
            weak_area_category=categories[0] if categories and categories[0] != "Unknown" else None,
            suggested_module=module_info.get("module", ""),
            is_addressed=False,
        )
        db.add(pattern)

    try:
        db.flush()
    except Exception as e:
        print(f"[RecurringTracker] Flush error: {e}")
        db.rollback()
        return None

    # Return result if now recurring
    is_recurring = pattern.occurrence_count >= 3
    return {
        "error_type": error_type,
        "occurrence_count": pattern.occurrence_count,
        "is_recurring": is_recurring,
        "weak_area_category": pattern.weak_area_category,
        "suggested_module": pattern.suggested_module,
        "first_seen": pattern.first_seen.isoformat() if pattern.first_seen else None,
        "last_seen": pattern.last_seen.isoformat() if pattern.last_seen else None,
    }


def get_recurring_patterns(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """Returns all error patterns with count >= 3 for the user."""
    from app.models.profile import RecurringErrorPattern

    patterns = db.query(RecurringErrorPattern).filter(
        RecurringErrorPattern.user_id == user_id,
        RecurringErrorPattern.occurrence_count >= 3,
    ).order_by(RecurringErrorPattern.occurrence_count.desc()).all()

    results = []
    for p in patterns:
        module_info = LEARNING_MODULE_MAP.get(p.error_type, {})
        results.append({
            "id": p.id,
            "error_type": p.error_type,
            "occurrence_count": p.occurrence_count,
            "first_seen": p.first_seen.isoformat() if p.first_seen else None,
            "last_seen": p.last_seen.isoformat() if p.last_seen else None,
            "weak_area_category": p.weak_area_category,
            "suggested_module": p.suggested_module or module_info.get("module", "General Review"),
            "module_description": module_info.get("description", "Review this error pattern to improve your debugging skills."),
            "module_difficulty": module_info.get("difficulty", "beginner"),
            "is_addressed": p.is_addressed,
            "recommendation": _generate_recommendation(p.error_type, p.occurrence_count),
        })

    return results


def get_all_patterns(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """Returns ALL error patterns for the user (including non-recurring)."""
    from app.models.profile import RecurringErrorPattern

    patterns = db.query(RecurringErrorPattern).filter(
        RecurringErrorPattern.user_id == user_id,
    ).order_by(RecurringErrorPattern.occurrence_count.desc()).all()

    results = []
    for p in patterns:
        module_info = LEARNING_MODULE_MAP.get(p.error_type, {})
        results.append({
            "id": p.id,
            "error_type": p.error_type,
            "occurrence_count": p.occurrence_count,
            "first_seen": p.first_seen.isoformat() if p.first_seen else None,
            "last_seen": p.last_seen.isoformat() if p.last_seen else None,
            "weak_area_category": p.weak_area_category,
            "suggested_module": p.suggested_module or module_info.get("module", ""),
            "module_description": module_info.get("description", ""),
            "module_difficulty": module_info.get("difficulty", "beginner"),
            "is_addressed": p.is_addressed,
            "is_recurring": p.occurrence_count >= 3,
        })

    return results


def generate_weak_area_report(db: Session, user_id: str) -> Dict[str, Any]:
    """
    Generates a comprehensive weak area analysis for the user.
    Returns categories with counts and targeted learning suggestions.
    """
    from app.models.profile import RecurringErrorPattern

    patterns = db.query(RecurringErrorPattern).filter(
        RecurringErrorPattern.user_id == user_id,
    ).order_by(RecurringErrorPattern.occurrence_count.desc()).all()

    if not patterns:
        return {
            "weak_areas": [],
            "total_patterns": 0,
            "recurring_count": 0,
            "learning_modules": [],
            "overall_assessment": "No debugging history available yet. Start analyzing errors to build your profile!",
        }

    # Group by category
    category_counts: Dict[str, int] = {}
    for p in patterns:
        cat = p.weak_area_category or "General"
        category_counts[cat] = category_counts.get(cat, 0) + p.occurrence_count

    # Sort categories by frequency
    sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)

    weak_areas = []
    for cat, count in sorted_categories:
        severity = "critical" if count >= 10 else "high" if count >= 5 else "moderate"
        weak_areas.append({
            "category": cat,
            "total_occurrences": count,
            "severity": severity,
        })

    # Collect unique learning modules
    recurring = [p for p in patterns if p.occurrence_count >= 3]
    modules_seen = set()
    learning_modules = []
    for p in recurring:
        module_info = LEARNING_MODULE_MAP.get(p.error_type, {})
        module_name = module_info.get("module", p.suggested_module or "")
        if module_name and module_name not in modules_seen:
            modules_seen.add(module_name)
            learning_modules.append({
                "module": module_name,
                "description": module_info.get("description", ""),
                "difficulty": module_info.get("difficulty", "beginner"),
                "triggered_by": p.error_type,
                "occurrences": p.occurrence_count,
            })

    # Overall assessment
    total_patterns = len(patterns)
    recurring_count = len(recurring)

    if recurring_count == 0:
        assessment = "You're doing great! No recurring error patterns detected. Keep up the good debugging habits!"
    elif recurring_count <= 2:
        assessment = f"You have {recurring_count} recurring error pattern(s). Focus on the suggested learning modules to eliminate these patterns."
    else:
        assessment = f"You have {recurring_count} recurring patterns across {len(weak_areas)} categories. Consider dedicating focused study time to your weakest areas."

    return {
        "weak_areas": weak_areas,
        "total_patterns": total_patterns,
        "recurring_count": recurring_count,
        "learning_modules": learning_modules,
        "overall_assessment": assessment,
    }


def _generate_recommendation(error_type: str, count: int) -> str:
    """Generates a personalized recommendation based on error frequency."""
    module_info = LEARNING_MODULE_MAP.get(error_type, {})
    module = module_info.get("module", "relevant programming concepts")

    if count >= 10:
        return f"⚠️ Critical: You've encountered {error_type} {count} times. This is a fundamental gap. Dedicate a focused study session to '{module}' this week."
    elif count >= 5:
        return f"🔶 High Priority: {error_type} has appeared {count} times. Review '{module}' and practice the prevention techniques."
    elif count >= 3:
        return f"📋 Recurring: {error_type} seen {count} times. Consider reviewing '{module}' to build stronger habits."
    else:
        return f"Seen {count} time(s). Keep practicing good patterns!"
