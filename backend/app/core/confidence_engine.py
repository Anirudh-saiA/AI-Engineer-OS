"""
AI-Engineer-OS Confidence Scoring Engine
==========================================
Computes confidence scores for AI-generated debugging analyses.
Scores are based on multiple factors: KB match quality, AI response
completeness, error type recognition, and semantic search hits.
"""

from typing import Dict, Any, List, Optional
from app.core.knowledge_base import get_kb_entry, FULL_KNOWLEDGE_BASE


def compute_confidence_scores(
    error_type: str,
    categories: List[str],
    ai_enhanced: bool,
    ai_response_sections: Dict[str, Any],
    semantic_similarity: float = 0.0,
) -> Dict[str, int]:
    """
    Computes confidence scores for root cause, fix, and explanation.

    Returns dict with keys:
        root_cause_confidence: int (0-99)
        fix_confidence: int (0-99)
        explanation_confidence: int (0-99)
        overall_confidence: int (0-99)
    """

    root_cause_score = _compute_root_cause_confidence(
        error_type, categories, ai_enhanced, ai_response_sections, semantic_similarity
    )
    fix_score = _compute_fix_confidence(
        error_type, ai_enhanced, ai_response_sections, semantic_similarity
    )
    explanation_score = _compute_explanation_confidence(
        error_type, ai_enhanced, ai_response_sections
    )

    overall = int((root_cause_score * 0.4) + (fix_score * 0.35) + (explanation_score * 0.25))

    return {
        "root_cause_confidence": min(root_cause_score, 99),
        "fix_confidence": min(fix_score, 99),
        "explanation_confidence": min(explanation_score, 99),
        "overall_confidence": min(overall, 99),
    }


def _compute_root_cause_confidence(
    error_type: str,
    categories: List[str],
    ai_enhanced: bool,
    sections: Dict[str, Any],
    semantic_similarity: float,
) -> int:
    """Score for how confident we are in the identified root cause."""
    score = 40  # baseline

    # AI enhancement bonus
    if ai_enhanced:
        score += 25

    # Knowledge base match
    kb_entry = get_kb_entry(error_type)
    if kb_entry:
        score += 15
    elif error_type.lower() != "unknownerror":
        score += 5  # at least we identified a type

    # Semantic search similarity boost
    if semantic_similarity > 0.8:
        score += 10
    elif semantic_similarity > 0.5:
        score += 5

    # Root cause chain present
    chain = sections.get("root_cause_chain") or sections.get("chain_of_events") or []
    if isinstance(chain, list) and len(chain) >= 2:
        score += 5
    if isinstance(chain, list) and len(chain) >= 3:
        score += 3

    # Root cause text quality
    root_cause = sections.get("root_cause", "")
    if isinstance(root_cause, str) and len(root_cause) > 50:
        score += 3

    # Category specificity bonus
    non_unknown = [c for c in categories if c.lower() != "unknown"]
    if len(non_unknown) >= 1:
        score += 3

    return min(score, 99)


def _compute_fix_confidence(
    error_type: str,
    ai_enhanced: bool,
    sections: Dict[str, Any],
    semantic_similarity: float,
) -> int:
    """Score for how confident we are in the fix recommendations."""
    score = 35  # baseline

    if ai_enhanced:
        score += 25

    # Knowledge base has known fixes
    kb_entry = get_kb_entry(error_type)
    if kb_entry and kb_entry.get("fix_recommendations"):
        score += 15

    # Number of fixes provided
    fixes = sections.get("suggested_fixes") or []
    if isinstance(fixes, list):
        if len(fixes) >= 3:
            score += 8
        elif len(fixes) >= 1:
            score += 4

    # Recommended fix present
    rec_fix = sections.get("recommended_fix", "")
    if isinstance(rec_fix, str) and len(rec_fix) > 20:
        score += 5

    # Code suggestions present
    code_sugs = sections.get("code_suggestions") or []
    if isinstance(code_sugs, list) and len(code_sugs) > 0:
        score += 5

    # Semantic similarity from KB
    if semantic_similarity > 0.7:
        score += 5

    return min(score, 99)


def _compute_explanation_confidence(
    error_type: str,
    ai_enhanced: bool,
    sections: Dict[str, Any],
) -> int:
    """Score for how confident we are in the explanation quality."""
    score = 40  # baseline

    if ai_enhanced:
        score += 20

    # Knowledge base has explanation
    kb_entry = get_kb_entry(error_type)
    if kb_entry:
        score += 12
        if kb_entry.get("beginner_explanation"):
            score += 5

    # Beginner explanation present in response
    beginner = sections.get("beginner_explanation", "")
    if isinstance(beginner, str) and len(beginner) > 30:
        score += 8

    # Learning concept present
    concept = sections.get("learning_concept") or sections.get("learning_notes", "")
    if isinstance(concept, str) and len(concept) > 30:
        score += 5

    # Best practices present
    bp = sections.get("best_practices") or []
    if isinstance(bp, list) and len(bp) >= 2:
        score += 5

    # Common mistakes documented
    cm = sections.get("common_mistakes") or []
    if isinstance(cm, list) and len(cm) >= 1:
        score += 3

    return min(score, 99)


def get_confidence_label(score: int) -> str:
    """Returns a human-readable confidence label."""
    if score >= 90:
        return "Very High"
    if score >= 75:
        return "High"
    if score >= 55:
        return "Moderate"
    if score >= 35:
        return "Low"
    return "Very Low"


def get_confidence_color(score: int) -> str:
    """Returns a suggested display color for the score."""
    if score >= 90:
        return "#22c55e"  # emerald
    if score >= 75:
        return "#3b82f6"  # blue
    if score >= 55:
        return "#eab308"  # yellow
    if score >= 35:
        return "#f97316"  # orange
    return "#ef4444"  # red
