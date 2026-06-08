import os
import json
import urllib.request
import urllib.error
import datetime
import re
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

from app.api.deps import get_db, verify_token
from app.models import profile as models
from app.core import error_analysis
from app.core.debugger_prompts import (
    CODE_REVIEW_SYSTEM_PROMPT,
    build_code_review_prompt,
    parse_code_review_response,
)
from app.core.knowledge_base import (
    get_kb_entry, search_kb_by_category, get_all_categories,
    get_kb_stats, ALL_KB_ENTRIES, get_safer_coding_pattern,
)
from app.core.semantic_search import semantic_search, get_search_mode
from app.core.confidence_engine import get_confidence_label
from app.core.recurring_tracker import (
    get_recurring_patterns, get_all_patterns,
    generate_weak_area_report,
)
from app.core.teaching_engine import generate_teaching_card
from app.services.debugger_service import DebuggerService

router = APIRouter()

# =============================================================================
# SCHEMAS
# =============================================================================

class ErrorSubmission(BaseModel):
    error_text: str = Field(..., description="The raw error text, stack trace, or log to analyze")

class DependencySubmission(BaseModel):
    dependency_text: str = Field(..., description="The dependency conflict log or error message")

class ApiErrorSubmission(BaseModel):
    status_code: str = Field(..., description="HTTP status code or status phrase (e.g. 404 or '404 Not Found')")
    error_details: Optional[str] = Field(None, description="Optional response body or details")

class CodeReviewSubmission(BaseModel):
    code_snippet: str = Field(..., description="The code snippet to review for improvements")
    language: str = Field(default="python", description="Programming language (python, javascript, typescript)")

class CodeSuggestionItem(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    before: str = ""
    after: str = ""
    reason: str = ""

class LearningModeResponse(BaseModel):
    concept: str = ""
    common_mistakes: List[str] = []
    prevention_tips: List[str] = []
    real_world_examples: List[str] = []

class CommunityReferenceItem(BaseModel):
    title: str
    url: str
    state: Optional[str] = None
    comments_count: Optional[int] = None
    score: Optional[int] = None
    view_count: Optional[int] = None
    answer_count: Optional[int] = None
    is_answered: Optional[bool] = None

class SaferPatternResponse(BaseModel):
    error_type: str = ""
    before: str = ""
    after: str = ""
    reason: str = ""

class ErrorAnalysisResponse(BaseModel):
    id: Optional[int] = None
    error_type: str
    file: Optional[str] = None
    line: Optional[int] = None
    message: str
    categories: List[str]
    explanation: str
    root_cause: str
    suggested_fixes: List[str]
    best_practices: List[str]
    learning_notes: str
    severity: str
    ai_enhanced: bool
    created_at: Optional[str] = None
    # Enhanced mentor fields
    beginner_explanation: str = ""
    chain_of_events: List[str] = []
    code_suggestions: List[CodeSuggestionItem] = []
    recommended_fix: str = ""
    learning_mode: LearningModeResponse = LearningModeResponse()
    # Week 16: Community References & Safer Patterns
    github_references: List[CommunityReferenceItem] = []
    stackoverflow_references: List[CommunityReferenceItem] = []
    safer_pattern: SaferPatternResponse = SaferPatternResponse()

    class Config:
        from_attributes = True

class CodeReviewSuggestion(BaseModel):
    title: str = ""
    before: str = ""
    after: str = ""
    reason: str = ""

class CodeReviewResponse(BaseModel):
    suggestions: List[CodeReviewSuggestion] = []
    ai_enhanced: bool = False
    language: str = "python"

class DebuggerStatsResponse(BaseModel):
    total_sessions: int = 0
    ai_enhanced_count: int = 0
    rule_based_count: int = 0
    most_common_error: Optional[str] = None
    severity_distribution: Dict[str, int] = {}
    category_distribution: Dict[str, int] = {}
    recent_errors: List[Dict[str, Any]] = []

class SemanticSearchRequest(BaseModel):
    query: str = Field(..., description="Natural language query to search errors")
    top_k: int = Field(default=5, le=20, description="Number of results to return")

class SemanticSearchResultItem(BaseModel):
    error_name: str
    error_category: str
    similarity: float
    root_cause: str
    beginner_explanation: str
    fix_recommendations: List[str] = []

class ConfidenceScoresResponse(BaseModel):
    root_cause_confidence: int = 0
    fix_confidence: int = 0
    explanation_confidence: int = 0
    overall_confidence: int = 0
    root_cause_label: str = ""
    fix_label: str = ""
    explanation_label: str = ""

class LearningNoteResponse(BaseModel):
    id: int
    concept_name: str
    concept_explanation: Optional[str] = None
    common_mistakes: List[str] = []
    prevention_tips: List[str] = []
    real_world_examples: List[str] = []
    error_type: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _safe_json_loads(value: Optional[str], default=None):
    if not value:
        return default if default is not None else []
    try:
        return json.loads(value)
    except Exception:
        return default if default is not None else []

# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/analyze-error", response_model=ErrorAnalysisResponse)
def analyze_error_endpoint(
    submission: ErrorSubmission,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Full AI Mentor analysis pipeline. Delegated to DebuggerService.
    Parses, classifies, generates AI-enhanced analysis with root cause chain,
    retrieves community threads, scores confidence, and saves the history session.
    """
    error_text = submission.error_text
    uid = token_data["uid"]
    
    # Delegate completely to service layer
    result_dict = DebuggerService.analyze_error(db, uid, error_text)
    
    # Add best practices safer pattern mapping dynamically
    safer_pat_raw = get_safer_coding_pattern(result_dict.get("error_type", ""))
    result_dict["safer_pattern"] = {
        "error_type": safer_pat_raw.get("error_type", ""),
        "before": safer_pat_raw.get("before", ""),
        "after": safer_pat_raw.get("after", ""),
        "reason": safer_pat_raw.get("reason", "")
    }
    
    return result_dict


@router.post("/classify-error")
def classify_error_endpoint(
    submission: ErrorSubmission,
    token_data: dict = Depends(verify_token)
):
    """
    Lightweight parsing and classification endpoint. Does not write to DB or make external AI calls.
    """
    parsed = error_analysis.parse_stack_trace(submission.error_text)
    categories = error_analysis.classify_error(submission.error_text, parsed)
    severity = error_analysis.assess_severity(parsed, categories)

    return {
        "error_type": parsed["error_type"],
        "file": parsed["file"],
        "line": parsed["line"],
        "message": parsed["message"],
        "categories": categories,
        "severity": severity,
        "frames": parsed["frames"]
    }

@router.post("/dependency-check")
def dependency_check_endpoint(
    submission: DependencySubmission,
    token_data: dict = Depends(verify_token)
):
    """
    Specialized endpoint to analyze dependency conflicts.
    """
    text = submission.dependency_text
    parsed = error_analysis.parse_stack_trace(text)
    categories = error_analysis.classify_error(text, parsed)

    if "Dependency Error" not in categories:
        if categories == ["Unknown"]:
            categories = ["Dependency Error"]
        else:
            categories.append("Dependency Error")

    severity = error_analysis.assess_severity(parsed, categories)
    dep_analysis = error_analysis.analyze_dependency_conflict(text)

    return {
        "error_type": "DependencyConflict",
        "categories": categories,
        "severity": severity,
        "explanation": dep_analysis["explanation"],
        "root_cause": dep_analysis["root_cause"],
        "suggested_fixes": dep_analysis["fixes"],
        "best_practices": dep_analysis["best_practices"],
        "conflicts": dep_analysis["conflicts"]
    }

@router.post("/api-error-analysis")
def api_error_analysis_endpoint(
    submission: ApiErrorSubmission,
    token_data: dict = Depends(verify_token)
):
    """
    Specialized HTTP status code error analyzer.
    """
    status_code = submission.status_code.strip()
    code_match = re.search(r'\b(\d{3})\b', status_code)
    code = code_match.group(1) if code_match else "500"

    mock_error = f"HTTP {code} Error"
    if submission.error_details:
        mock_error += f"\nDetails: {submission.error_details}"

    analysis = error_analysis.analyze_error(mock_error)

    return {
        "status_code": code,
        "error_type": analysis["error_type"],
        "categories": ["API Error"] + [cat for cat in analysis["categories"] if cat != "API Error" and cat != "Unknown"],
        "explanation": analysis["explanation"],
        "root_cause": analysis["root_cause"],
        "suggested_fixes": analysis["suggested_fixes"],
        "best_practices": analysis["best_practices"],
        "learning_notes": analysis["learning_notes"],
        "severity": analysis["severity"]
    }


@router.post("/code-review", response_model=CodeReviewResponse)
def code_review_endpoint(
    submission: CodeReviewSubmission,
    token_data: dict = Depends(verify_token)
):
    """
    Standalone code improvement suggestions.
    """
    code = submission.code_snippet
    lang = submission.language

    # Try AI-powered review
    user_prompt = build_code_review_prompt(code, lang)
    ai_enhanced, ai_response = DebuggerService._call_ai_api(CODE_REVIEW_SYSTEM_PROMPT, user_prompt)

    suggestions = []

    if ai_enhanced and ai_response:
        parsed_suggestions = parse_code_review_response(ai_response)
        for s in parsed_suggestions:
            suggestions.append(CodeReviewSuggestion(
                title=s.get("title", ""),
                before=s.get("before", ""),
                after=s.get("after", ""),
                reason=s.get("reason", ""),
            ))

    if not suggestions:
        local_suggestions = error_analysis.generate_code_suggestions(code, "")
        for s in local_suggestions:
            suggestions.append(CodeReviewSuggestion(
                title=s.get("name", "Code improvement"),
                before=s.get("before", ""),
                after=s.get("after", ""),
                reason=s.get("reason", ""),
            ))

    return CodeReviewResponse(
        suggestions=suggestions,
        ai_enhanced=ai_enhanced,
        language=lang,
    )


@router.get("/history", response_model=List[ErrorAnalysisResponse])
def get_history_endpoint(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
    search: Optional[str] = Query(None, description="Search across all analysis fields"),
    category: Optional[str] = Query(None, description="Filter by error category"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    limit: int = Query(50, le=200, description="Max records to return"),
):
    """
    Returns the user's debugging analysis sessions. Delegated to DebuggerService.
    """
    uid = token_data["uid"]
    history_dicts = DebuggerService.get_history(db, uid, search, category, severity, limit)
    
    # Add safer coding pattern mapping
    for h in history_dicts:
        safer_pat_raw = get_safer_coding_pattern(h.get("error_type", ""))
        h["safer_pattern"] = {
            "error_type": safer_pat_raw.get("error_type", ""),
            "before": safer_pat_raw.get("before", ""),
            "after": safer_pat_raw.get("after", ""),
            "reason": safer_pat_raw.get("reason", "")
        }
        
    return history_dicts


@router.get("/stats", response_model=DebuggerStatsResponse)
def get_stats_endpoint(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Returns aggregate debugging statistics for the user.
    """
    uid = token_data["uid"]

    total = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid
    ).scalar() or 0

    ai_count = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.ai_enhanced == True
    ).scalar() or 0

    rule_count = total - ai_count

    most_common = db.query(
        models.ErrorAnalysis.error_type,
        func.count(models.ErrorAnalysis.error_type).label("cnt")
    ).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.error_type.isnot(None)
    ).group_by(models.ErrorAnalysis.error_type).order_by(
        func.count(models.ErrorAnalysis.error_type).desc()
    ).first()

    severity_rows = db.query(
        models.ErrorAnalysis.severity,
        func.count(models.ErrorAnalysis.id)
    ).filter(
        models.ErrorAnalysis.user_id == uid
    ).group_by(models.ErrorAnalysis.severity).all()

    severity_dist = {row[0] or "unknown": row[1] for row in severity_rows}

    all_analyses = db.query(models.ErrorAnalysis.categories).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.categories.isnot(None)
    ).all()

    category_dist: Dict[str, int] = {}
    for (cats_str,) in all_analyses:
        if cats_str:
            for cat in cats_str.split(","):
                cat = cat.strip()
                if cat:
                    category_dist[cat] = category_dist.get(cat, 0) + 1

    recent = db.query(models.ErrorAnalysis).filter(
        models.ErrorAnalysis.user_id == uid
    ).order_by(models.ErrorAnalysis.created_at.desc()).limit(5).all()

    recent_errors = []
    for r in recent:
        recent_errors.append({
            "id": r.id,
            "error_type": r.error_type,
            "severity": r.severity,
            "ai_enhanced": r.ai_enhanced,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return DebuggerStatsResponse(
        total_sessions=total,
        ai_enhanced_count=ai_count,
        rule_based_count=rule_count,
        most_common_error=most_common[0] if most_common else None,
        severity_distribution=severity_dist,
        category_distribution=category_dist,
        recent_errors=recent_errors,
    )


@router.get("/learning-notes", response_model=List[LearningNoteResponse])
def get_learning_notes_endpoint(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
    limit: int = Query(50, le=200),
):
    """
    Returns all saved learning notes for the user from debugging sessions.
    """
    uid = token_data["uid"]
    notes = db.query(models.LearningNote).filter(
        models.LearningNote.user_id == uid
    ).order_by(models.LearningNote.created_at.desc()).limit(limit).all()

    result = []
    for note in notes:
        error_type = None
        if note.error_analysis_id:
            analysis = db.query(models.ErrorAnalysis.error_type).filter(
                models.ErrorAnalysis.id == note.error_analysis_id
            ).first()
            if analysis:
                error_type = analysis[0]

        result.append(LearningNoteResponse(
            id=note.id,
            concept_name=note.concept_name,
            concept_explanation=note.concept_explanation,
            common_mistakes=_safe_json_loads(note.common_mistakes, []),
            prevention_tips=_safe_json_loads(note.prevention_tips, []),
            real_world_examples=_safe_json_loads(note.real_world_examples, []),
            error_type=error_type,
            created_at=note.created_at,
        ))

    return result


@router.get("/common-mistakes")
def get_common_mistakes_endpoint(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Returns the user's most frequently occurring error patterns.
    """
    uid = token_data["uid"]

    patterns = db.query(
        models.ErrorAnalysis.error_type,
        func.count(models.ErrorAnalysis.id).label("count"),
        func.max(models.ErrorAnalysis.created_at).label("last_seen"),
    ).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.error_type.isnot(None)
    ).group_by(
        models.ErrorAnalysis.error_type
    ).order_by(
        func.count(models.ErrorAnalysis.id).desc()
    ).limit(10).all()

    result = []
    for error_type, count, last_seen in patterns:
        latest = db.query(models.ErrorAnalysis).filter(
            models.ErrorAnalysis.user_id == uid,
            models.ErrorAnalysis.error_type == error_type
        ).order_by(models.ErrorAnalysis.created_at.desc()).first()

        result.append({
            "error_type": error_type,
            "occurrence_count": count,
            "last_seen": last_seen.isoformat() if last_seen else None,
            "severity": latest.severity if latest else "medium",
            "is_recurring": count >= 3,
            "recommendation": f"You've encountered {error_type} {count} times. Consider reviewing the prevention techniques to avoid this error pattern."
            if count >= 3 else f"Seen {count} time(s). Keep practicing good patterns!",
        })

    return {"common_mistakes": result, "total_patterns": len(result)}


@router.delete("/history/{id}")
def delete_history_endpoint(
    id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Deletes a specific error analysis history record.
    """
    uid = token_data["uid"]
    success = DebuggerService.delete_history(db, uid, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error analysis record not found"
        )
    return {"status": "success", "message": "Record successfully deleted"}


# =============================================================================
# WEEK 15: SEMANTIC SEARCH ENDPOINT
# =============================================================================

@router.post("/error-search")
def error_search_endpoint(
    request: SemanticSearchRequest,
    token_data: dict = Depends(verify_token)
):
    """
    Semantic search across the error knowledge base.
    """
    results = semantic_search(request.query, top_k=request.top_k)
    return {
        "query": request.query,
        "search_mode": get_search_mode(),
        "result_count": len(results),
        "results": [
            {
                "error_name": r.error_name,
                "error_category": r.error_category,
                "similarity": r.similarity,
                "similarity_pct": round(r.similarity * 100, 1),
                "root_cause": r.root_cause,
                "beginner_explanation": r.beginner_explanation,
                "fix_recommendations": r.fix_recommendations,
                "prevention_strategies": r.entry.get("prevention_strategies", []),
                "best_practices": r.entry.get("best_practices", []),
                "related_errors": r.entry.get("related_errors", []),
                "frameworks": r.entry.get("frameworks", []),
            }
            for r in results
        ],
    }


# =============================================================================
# WEEK 15: DEBUGGING ANALYTICS DASHBOARD
# =============================================================================

@router.get("/debugging-analytics")
def debugging_analytics_endpoint(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Comprehensive debugging analytics dashboard data.
    """
    uid = token_data["uid"]

    total = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid
    ).scalar() or 0

    ai_count = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.ai_enhanced == True
    ).scalar() or 0

    all_analyses = db.query(models.ErrorAnalysis.categories).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.categories.isnot(None)
    ).all()

    category_counts: Dict[str, int] = {}
    for (cats_str,) in all_analyses:
        if cats_str:
            for cat in cats_str.split(","):
                cat = cat.strip()
                if cat:
                    category_counts[cat] = category_counts.get(cat, 0) + 1

    sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)

    severity_rows = db.query(
        models.ErrorAnalysis.severity,
        func.count(models.ErrorAnalysis.id)
    ).filter(
        models.ErrorAnalysis.user_id == uid
    ).group_by(models.ErrorAnalysis.severity).all()
    severity_dist = {row[0] or "unknown": row[1] for row in severity_rows}

    type_rows = db.query(
        models.ErrorAnalysis.error_type,
        func.count(models.ErrorAnalysis.id).label("cnt")
    ).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.error_type.isnot(None)
    ).group_by(models.ErrorAnalysis.error_type).order_by(
        func.count(models.ErrorAnalysis.id).desc()
    ).limit(10).all()
    error_type_dist = {row[0]: row[1] for row in type_rows}

    helpful_count = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.was_fix_helpful == True
    ).scalar() or 0
    feedback_total = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.was_fix_helpful.isnot(None)
    ).scalar() or 0
    fix_success_rate = round((helpful_count / feedback_total) * 100) if feedback_total > 0 else None

    avg_confidence = db.query(
        func.avg(models.ErrorAnalysis.confidence_root_cause),
        func.avg(models.ErrorAnalysis.confidence_fix),
        func.avg(models.ErrorAnalysis.confidence_explanation),
    ).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.confidence_root_cause.isnot(None)
    ).first()

    import datetime as dt
    seven_days_ago = dt.datetime.utcnow() - dt.timedelta(days=7)
    daily_counts = db.query(
        func.date(models.ErrorAnalysis.created_at).label("day"),
        func.count(models.ErrorAnalysis.id).label("count")
    ).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.created_at >= seven_days_ago
    ).group_by(func.date(models.ErrorAnalysis.created_at)).all()
    daily_frequency = {str(row[0]): row[1] for row in daily_counts}

    learning_note_count = db.query(func.count(models.LearningNote.id)).filter(
        models.LearningNote.user_id == uid
    ).scalar() or 0

    recurring_count = 0
    try:
        recurring_count = len(get_recurring_patterns(db, uid))
    except Exception:
        pass

    recent = db.query(models.ErrorAnalysis).filter(
        models.ErrorAnalysis.user_id == uid
    ).order_by(models.ErrorAnalysis.created_at.desc()).limit(5).all()
    recent_errors = [
        {
            "id": r.id,
            "error_type": r.error_type,
            "severity": r.severity,
            "ai_enhanced": r.ai_enhanced,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "confidence": getattr(r, 'confidence_root_cause', None),
        }
        for r in recent
    ]

    return {
        "total_errors_analyzed": total,
        "ai_enhanced_count": ai_count,
        "rule_based_count": total - ai_count,
        "category_distribution": sorted_categories,
        "severity_distribution": severity_dist,
        "error_type_distribution": error_type_dist,
        "fix_success_rate": fix_success_rate,
        "avg_confidence": {
            "root_cause": round(avg_confidence[0]) if avg_confidence and avg_confidence[0] else None,
            "fix": round(avg_confidence[1]) if avg_confidence and avg_confidence[1] else None,
            "explanation": round(avg_confidence[2]) if avg_confidence and avg_confidence[2] else None,
        },
        "daily_frequency": daily_frequency,
        "learning_notes_count": learning_note_count,
        "recurring_pattern_count": recurring_count,
        "recent_errors": recent_errors,
    }


# =============================================================================
# WEEK 15: RECURRING ERROR PATTERNS
# =============================================================================

@router.get("/recurring-errors")
def recurring_errors_endpoint(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Returns the user's recurring error patterns.
    """
    uid = token_data["uid"]

    recurring = get_recurring_patterns(db, uid)
    all_patterns = get_all_patterns(db, uid)
    weak_report = generate_weak_area_report(db, uid)

    return {
        "recurring_errors": recurring,
        "all_patterns": all_patterns,
        "weak_area_report": weak_report,
    }


# =============================================================================
# WEEK 15: CONFIDENCE SCORES FOR SPECIFIC ANALYSIS
# =============================================================================

@router.get("/confidence-scores/{analysis_id}")
def confidence_scores_endpoint(
    analysis_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Returns confidence scores for a specific error analysis.
    """
    uid = token_data["uid"]
    analysis = db.query(models.ErrorAnalysis).filter(
        models.ErrorAnalysis.id == analysis_id,
        models.ErrorAnalysis.user_id == uid
    ).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "analysis_id": analysis_id,
        "root_cause_confidence": getattr(analysis, 'confidence_root_cause', None) or 0,
        "fix_confidence": getattr(analysis, 'confidence_fix', None) or 0,
        "explanation_confidence": getattr(analysis, 'confidence_explanation', None) or 0,
        "root_cause_label": get_confidence_label(getattr(analysis, 'confidence_root_cause', 0) or 0),
        "fix_label": get_confidence_label(getattr(analysis, 'confidence_fix', 0) or 0),
        "explanation_label": get_confidence_label(getattr(analysis, 'confidence_explanation', 0) or 0),
        "was_fix_helpful": getattr(analysis, 'was_fix_helpful', None),
    }


# =============================================================================
# WEEK 15: USER FEEDBACK ON FIX HELPFULNESS
# =============================================================================

@router.post("/feedback/{analysis_id}")
def feedback_endpoint(
    analysis_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
    helpful: bool = Query(..., description="Was the fix helpful?"),
):
    """
    Allows users to mark whether the fix suggestion was helpful.
    """
    uid = token_data["uid"]
    analysis = db.query(models.ErrorAnalysis).filter(
        models.ErrorAnalysis.id == analysis_id,
        models.ErrorAnalysis.user_id == uid
    ).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis.was_fix_helpful = helpful
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save feedback: {e}")

    return {"status": "success", "analysis_id": analysis_id, "was_fix_helpful": helpful}


# =============================================================================
# WEEK 15: KNOWLEDGE BASE BROWSER
# =============================================================================

@router.get("/knowledge-base")
def knowledge_base_endpoint(
    token_data: dict = Depends(verify_token),
    category: Optional[str] = Query(None, description="Filter by category"),
):
    """
    Browse the error knowledge base.
    """
    if category:
        entries = search_kb_by_category(category)
    else:
        entries = ALL_KB_ENTRIES

    return {
        "stats": get_kb_stats(),
        "categories": get_all_categories(),
        "entries": [
            {
                "error_name": e["error_name"],
                "error_category": e["error_category"],
                "root_cause": e["root_cause"],
                "beginner_explanation": e["beginner_explanation"],
                "fix_recommendations": e["fix_recommendations"],
                "prevention_strategies": e["prevention_strategies"],
                "best_practices": e["best_practices"],
                "learning_resources": e.get("learning_resources", []),
                "related_errors": e.get("related_errors", []),
                "frameworks": e.get("frameworks", []),
            }
            for e in entries
        ],
        "total": len(entries),
    }


# =============================================================================
# WEEK 15: TEACHING CARD ENDPOINT
# =============================================================================

@router.get("/teaching-card/{error_type}")
def teaching_card_endpoint(
    error_type: str,
    token_data: dict = Depends(verify_token),
):
    """
    Returns a comprehensive teaching card for a specific error type.
    """
    card = generate_teaching_card(error_type)
    if not card or not card.get("concept_title"):
        raise HTTPException(status_code=404, detail=f"No teaching content found for '{error_type}'")

    return card
