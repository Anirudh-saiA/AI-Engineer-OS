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
    DEBUGGER_SYSTEM_PROMPT,
    CODE_REVIEW_SYSTEM_PROMPT,
    build_analysis_prompt,
    build_code_review_prompt,
    parse_enhanced_ai_response,
    parse_code_review_response,
)
from app.core.knowledge_base import (
    get_kb_entry, search_kb_by_category, get_all_categories,
    get_kb_stats, ALL_KB_ENTRIES,
)
from app.core.semantic_search import semantic_search, get_search_mode
from app.core.confidence_engine import compute_confidence_scores, get_confidence_label
from app.core.recurring_tracker import (
    track_error_pattern, get_recurring_patterns, get_all_patterns,
    generate_weak_area_report,
)
from app.core.teaching_engine import generate_teaching_card, get_teaching_summary

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
    created_at: Optional[datetime.datetime] = None
    # Enhanced mentor fields
    beginner_explanation: str = ""
    chain_of_events: List[str] = []
    code_suggestions: List[CodeSuggestionItem] = []
    recommended_fix: str = ""
    learning_mode: LearningModeResponse = LearningModeResponse()

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

def _call_ai_api(system_prompt: str, user_prompt: str) -> tuple[bool, str]:
    """
    Calls Gemini (primary) or OpenAI (fallback) API and returns (success, response_text).
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    api_key = os.environ.get("OPENAI_API_KEY")
    ai_enhanced = False
    ai_response = ""

    # Try Gemini API first
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"SYSTEM INSTRUCTION: {system_prompt}\n\nPlease acknowledge."}]
                    },
                    {
                        "role": "model",
                        "parts": [{"text": "Understood. I will follow the system instructions precisely, using all required section headers and formatting."}]
                    },
                    {
                        "role": "user",
                        "parts": [{"text": user_prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 3000
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                ai_response = res_data["candidates"][0]["content"]["parts"][0]["text"]
                ai_enhanced = True
        except Exception as e:
            print(f"Gemini Debugger Completion failed: {e}")

    # Try OpenAI API as fallback
    if not ai_enhanced and api_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 3000
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                ai_response = res_data["choices"][0]["message"]["content"]
                ai_enhanced = True
        except Exception as e:
            print(f"OpenAI Debugger Completion failed: {e}")

    return ai_enhanced, ai_response


def _build_search_text(analysis: Dict[str, Any]) -> str:
    """Concatenates all searchable fields into a single text for full-text filtering."""
    parts = [
        analysis.get("error_type", ""),
        analysis.get("message", ""),
        analysis.get("explanation", ""),
        analysis.get("root_cause", ""),
        analysis.get("beginner_explanation", ""),
        analysis.get("recommended_fix", ""),
        analysis.get("learning_notes", ""),
        " ".join(analysis.get("categories", [])),
        " ".join(analysis.get("suggested_fixes", [])),
    ]
    return " ".join(p for p in parts if p).lower()


def _safe_json_loads(value: Optional[str], default=None):
    """Safely loads a JSON string, returning default on failure."""
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
    Full AI Mentor analysis pipeline.
    Parses, classifies, generates AI-enhanced analysis with root cause chain,
    beginner explanations, code suggestions, and learning mode.
    Stores result in DB, creates learning note, awards +10 XP.
    """
    error_text = submission.error_text
    uid = token_data["uid"]

    # 1. Run local pure-Python rule-based analysis
    local_analysis = error_analysis.analyze_error(error_text)

    # 2. Build AI prompt with local context
    user_prompt = build_analysis_prompt(
        error_text=error_text,
        error_type=local_analysis["error_type"],
        categories=local_analysis["categories"],
        severity=local_analysis["severity"],
        file_name=local_analysis["file"],
        line_number=local_analysis["line"],
        frames=local_analysis.get("frames", [])
    )

    # 3. Call AI API
    ai_enhanced, ai_response = _call_ai_api(DEBUGGER_SYSTEM_PROMPT, user_prompt)

    # 4. Merge AI response into local analysis
    if ai_enhanced and ai_response:
        parsed_ai = parse_enhanced_ai_response(ai_response)

        if parsed_ai["root_cause"]:
            local_analysis["root_cause"] = parsed_ai["root_cause"]
        if parsed_ai["explanation"]:
            local_analysis["explanation"] = parsed_ai["explanation"]
        if parsed_ai["beginner_explanation"]:
            local_analysis["beginner_explanation"] = parsed_ai["beginner_explanation"]
        if parsed_ai["suggested_fixes"]:
            local_analysis["suggested_fixes"] = parsed_ai["suggested_fixes"]
        if parsed_ai["best_practices"]:
            local_analysis["best_practices"] = parsed_ai["best_practices"]
        if parsed_ai["learning_notes"]:
            local_analysis["learning_notes"] = parsed_ai["learning_notes"]
        if parsed_ai["recommended_fix"]:
            local_analysis["recommended_fix"] = parsed_ai["recommended_fix"]
        if parsed_ai["root_cause_chain"]:
            local_analysis["chain_of_events"] = parsed_ai["root_cause_chain"]
        if parsed_ai["code_suggestions"]:
            local_analysis["code_suggestions"] = parsed_ai["code_suggestions"]

        # Merge learning mode
        if parsed_ai["learning_concept"]:
            local_analysis["learning_mode"]["concept"] = parsed_ai["learning_concept"]
        if parsed_ai["common_mistakes"]:
            local_analysis["learning_mode"]["common_mistakes"] = parsed_ai["common_mistakes"]
        if parsed_ai["prevention_tips"]:
            local_analysis["learning_mode"]["prevention_tips"] = parsed_ai["prevention_tips"]

    # 4b. Semantic search for similar errors
    top_similarity = 0.0
    similar_errors = []
    try:
        search_results = semantic_search(error_text, top_k=3)
        for sr in search_results:
            similar_errors.append({
                "error_name": sr.error_name,
                "category": sr.error_category,
                "similarity": sr.similarity,
            })
            if sr.similarity > top_similarity:
                top_similarity = sr.similarity
    except Exception as search_err:
        print(f"Semantic search warning: {search_err}")

    # 4c. Compute confidence scores
    confidence = compute_confidence_scores(
        error_type=local_analysis["error_type"],
        categories=local_analysis["categories"],
        ai_enhanced=ai_enhanced,
        ai_response_sections=local_analysis,
        semantic_similarity=top_similarity,
    )
    local_analysis["confidence_scores"] = confidence
    local_analysis["similar_errors"] = similar_errors

    # 4d. Generate teaching card
    try:
        teaching_card = generate_teaching_card(
            error_type=local_analysis["error_type"],
            root_cause=local_analysis.get("root_cause", ""),
            ai_explanation=local_analysis.get("explanation", ""),
        )
        local_analysis["teaching_card"] = teaching_card
    except Exception as teach_err:
        print(f"Teaching card warning: {teach_err}")
        local_analysis["teaching_card"] = {}

    # 5. Build search text
    search_text = _build_search_text(local_analysis)

    # 6. Save the analysis record in database
    db_analysis = models.ErrorAnalysis(
        user_id=uid,
        error_text=error_text[:4000],
        error_type=local_analysis["error_type"],
        categories=",".join(local_analysis["categories"]),
        file_name=local_analysis["file"],
        line_number=local_analysis["line"],
        severity=local_analysis["severity"],
        explanation=local_analysis["explanation"],
        root_cause=local_analysis["root_cause"],
        suggested_fixes=json.dumps(local_analysis["suggested_fixes"]),
        ai_enhanced=ai_enhanced,
        # Enhanced fields
        beginner_explanation=local_analysis.get("beginner_explanation", ""),
        chain_of_events=json.dumps(local_analysis.get("chain_of_events", [])),
        code_suggestions=json.dumps(local_analysis.get("code_suggestions", [])),
        learning_concepts=json.dumps(local_analysis.get("learning_mode", {})),
        recommended_fix=local_analysis.get("recommended_fix", ""),
        search_text=search_text,
        # Week 15: Confidence scores
        confidence_root_cause=confidence.get("root_cause_confidence"),
        confidence_fix=confidence.get("fix_confidence"),
        confidence_explanation=confidence.get("explanation_confidence"),
    )

    try:
        db.add(db_analysis)

        # 7. Award +10 XP to profile
        profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
        if profile:
            profile.xp_points += 10

        # 7b. Track recurring error pattern
        try:
            track_error_pattern(db, uid, local_analysis["error_type"], local_analysis["categories"])
        except Exception as track_err:
            print(f"Recurring tracker warning: {track_err}")

        db.commit()
        db.refresh(db_analysis)

        # 8. Create learning note automatically
        learning_mode = local_analysis.get("learning_mode", {})
        try:
            learning_note = models.LearningNote(
                user_id=uid,
                error_analysis_id=db_analysis.id,
                concept_name=local_analysis["error_type"],
                concept_explanation=learning_mode.get("concept", local_analysis.get("learning_notes", "")),
                common_mistakes=json.dumps(learning_mode.get("common_mistakes", [])),
                prevention_tips=json.dumps(learning_mode.get("prevention_tips", [])),
                real_world_examples=json.dumps(learning_mode.get("real_world_examples", [])),
            )
            db.add(learning_note)
            db.commit()
        except Exception as note_err:
            db.rollback()
            print(f"Learning note save warning: {note_err}")

    except Exception as db_err:
        db.rollback()
        print(f"Database error saving analysis: {db_err}")
        return _build_response(local_analysis, ai_enhanced=ai_enhanced)

    return _build_response(local_analysis, ai_enhanced=ai_enhanced, db_analysis=db_analysis)


def _build_response(
    analysis: Dict[str, Any],
    ai_enhanced: bool = False,
    db_analysis=None
) -> ErrorAnalysisResponse:
    """Helper to build a unified ErrorAnalysisResponse from analysis dict."""
    code_suggestions_raw = analysis.get("code_suggestions", [])
    code_suggestions = []
    for cs in code_suggestions_raw:
        if isinstance(cs, dict):
            code_suggestions.append(CodeSuggestionItem(
                name=cs.get("name", cs.get("title", "")),
                title=cs.get("title", cs.get("name", "")),
                before=cs.get("before", ""),
                after=cs.get("after", ""),
                reason=cs.get("reason", ""),
            ))

    learning_mode_raw = analysis.get("learning_mode", {})
    learning_mode = LearningModeResponse(
        concept=learning_mode_raw.get("concept", ""),
        common_mistakes=learning_mode_raw.get("common_mistakes", []),
        prevention_tips=learning_mode_raw.get("prevention_tips", []),
        real_world_examples=learning_mode_raw.get("real_world_examples", []),
    )

    return ErrorAnalysisResponse(
        id=db_analysis.id if db_analysis else None,
        error_type=analysis.get("error_type", "UnknownError"),
        file=analysis.get("file"),
        line=analysis.get("line"),
        message=analysis.get("message", ""),
        categories=analysis.get("categories", []),
        explanation=analysis.get("explanation", ""),
        root_cause=analysis.get("root_cause", ""),
        suggested_fixes=analysis.get("suggested_fixes", []),
        best_practices=analysis.get("best_practices", []),
        learning_notes=analysis.get("learning_notes", ""),
        severity=analysis.get("severity", "medium"),
        ai_enhanced=ai_enhanced,
        created_at=db_analysis.created_at if db_analysis else datetime.datetime.utcnow(),
        beginner_explanation=analysis.get("beginner_explanation", ""),
        chain_of_events=analysis.get("chain_of_events", []),
        code_suggestions=code_suggestions,
        recommended_fix=analysis.get("recommended_fix", ""),
        learning_mode=learning_mode,
    )


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

    # Force "Dependency Error" category if not auto-detected
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

    # Try to extract 3-digit code
    code_match = re.search(r'\b(\d{3})\b', status_code)
    code = code_match.group(1) if code_match else "500"

    # Mock some error text to trigger the HTTP parsing in error_analysis
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


# =============================================================================
# CODE REVIEW ENDPOINT (Feature 5)
# =============================================================================

@router.post("/code-review", response_model=CodeReviewResponse)
def code_review_endpoint(
    submission: CodeReviewSubmission,
    token_data: dict = Depends(verify_token)
):
    """
    Standalone code improvement suggestions.
    Accepts a code snippet, returns safer/cleaner alternatives using AI.
    Falls back to local pattern matching if no AI is available.
    """
    code = submission.code_snippet
    lang = submission.language

    # Try AI-powered review
    user_prompt = build_code_review_prompt(code, lang)
    ai_enhanced, ai_response = _call_ai_api(CODE_REVIEW_SYSTEM_PROMPT, user_prompt)

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

    # Fallback: use local pattern matching
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


# =============================================================================
# ENHANCED HISTORY ENDPOINT (Feature 6)
# =============================================================================

@router.get("/history", response_model=List[ErrorAnalysisResponse])
def get_history_endpoint(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
    search: Optional[str] = Query(None, description="Search across all analysis fields"),
    category: Optional[str] = Query(None, description="Filter by error category"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    date_from: Optional[str] = Query(None, description="Filter from date (ISO format)"),
    date_to: Optional[str] = Query(None, description="Filter to date (ISO format)"),
    limit: int = Query(50, le=200, description="Max records to return"),
):
    """
    Returns the user's debugging analysis sessions with full search and filtering.
    """
    uid = token_data["uid"]
    query = db.query(models.ErrorAnalysis).filter(models.ErrorAnalysis.user_id == uid)

    # Full-text search across search_text column
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            or_(
                models.ErrorAnalysis.search_text.ilike(search_lower),
                models.ErrorAnalysis.error_type.ilike(search_lower),
                models.ErrorAnalysis.error_text.ilike(search_lower),
                models.ErrorAnalysis.explanation.ilike(search_lower),
            )
        )

    # Category filter
    if category:
        query = query.filter(models.ErrorAnalysis.categories.ilike(f"%{category}%"))

    # Severity filter
    if severity:
        query = query.filter(models.ErrorAnalysis.severity == severity.lower())

    # Date range filters
    if date_from:
        try:
            dt_from = datetime.datetime.fromisoformat(date_from)
            query = query.filter(models.ErrorAnalysis.created_at >= dt_from)
        except ValueError:
            pass
    if date_to:
        try:
            dt_to = datetime.datetime.fromisoformat(date_to)
            query = query.filter(models.ErrorAnalysis.created_at <= dt_to)
        except ValueError:
            pass

    analyses = query.order_by(models.ErrorAnalysis.created_at.desc()).limit(limit).all()

    response_list = []
    for a in analyses:
        # Load local knowledge base to enrich history if missing
        local_ref = error_analysis.analyze_error(a.error_text)

        fixes = _safe_json_loads(a.suggested_fixes, [])
        chain = _safe_json_loads(getattr(a, 'chain_of_events', None), local_ref.get("chain_of_events", []))
        code_sugs_raw = _safe_json_loads(getattr(a, 'code_suggestions', None), local_ref.get("code_suggestions", []))
        learning_raw = _safe_json_loads(getattr(a, 'learning_concepts', None), local_ref.get("learning_mode", {}))

        code_suggestions = []
        for cs in code_sugs_raw:
            if isinstance(cs, dict):
                code_suggestions.append(CodeSuggestionItem(
                    name=cs.get("name", cs.get("title", "")),
                    title=cs.get("title", cs.get("name", "")),
                    before=cs.get("before", ""),
                    after=cs.get("after", ""),
                    reason=cs.get("reason", ""),
                ))

        learning_mode = LearningModeResponse(
            concept=learning_raw.get("concept", "") if isinstance(learning_raw, dict) else "",
            common_mistakes=learning_raw.get("common_mistakes", []) if isinstance(learning_raw, dict) else [],
            prevention_tips=learning_raw.get("prevention_tips", []) if isinstance(learning_raw, dict) else [],
            real_world_examples=learning_raw.get("real_world_examples", []) if isinstance(learning_raw, dict) else [],
        )

        response_list.append(ErrorAnalysisResponse(
            id=a.id,
            error_type=a.error_type or "UnknownError",
            file=a.file_name,
            line=a.line_number,
            message=local_ref["message"],
            categories=a.categories.split(",") if a.categories else ["Unknown"],
            explanation=a.explanation or "",
            root_cause=a.root_cause or "",
            suggested_fixes=fixes,
            best_practices=local_ref["best_practices"],
            learning_notes=local_ref["learning_notes"],
            severity=a.severity or "medium",
            ai_enhanced=a.ai_enhanced or False,
            created_at=a.created_at,
            beginner_explanation=getattr(a, 'beginner_explanation', None) or local_ref.get("beginner_explanation", ""),
            chain_of_events=chain,
            code_suggestions=code_suggestions,
            recommended_fix=getattr(a, 'recommended_fix', None) or local_ref.get("recommended_fix", ""),
            learning_mode=learning_mode,
        ))

    return response_list


# =============================================================================
# DEBUGGING STATISTICS ENDPOINT (Feature 6)
# =============================================================================

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

    # Most common error type
    most_common = db.query(
        models.ErrorAnalysis.error_type,
        func.count(models.ErrorAnalysis.error_type).label("cnt")
    ).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.error_type.isnot(None)
    ).group_by(models.ErrorAnalysis.error_type).order_by(
        func.count(models.ErrorAnalysis.error_type).desc()
    ).first()

    # Severity distribution
    severity_rows = db.query(
        models.ErrorAnalysis.severity,
        func.count(models.ErrorAnalysis.id)
    ).filter(
        models.ErrorAnalysis.user_id == uid
    ).group_by(models.ErrorAnalysis.severity).all()

    severity_dist = {row[0] or "unknown": row[1] for row in severity_rows}

    # Category distribution (parse comma-separated)
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

    # Recent errors (last 5)
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


# =============================================================================
# LEARNING NOTES ENDPOINT (Feature 4)
# =============================================================================

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
        # Try to get the associated error_type
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


# =============================================================================
# COMMON MISTAKES ENDPOINT (Feature 6)
# =============================================================================

@router.get("/common-mistakes")
def get_common_mistakes_endpoint(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Returns the user's most frequently occurring error patterns,
    helping them identify recurring mistakes.
    """
    uid = token_data["uid"]

    # Group by error_type with counts
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
        # Get the latest analysis for this error type
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


# =============================================================================
# DELETE HISTORY ENDPOINT
# =============================================================================

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
    record = db.query(models.ErrorAnalysis).filter(
        models.ErrorAnalysis.id == id,
        models.ErrorAnalysis.user_id == uid
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error analysis record not found"
        )

    try:
        # Also delete associated learning notes
        db.query(models.LearningNote).filter(
            models.LearningNote.error_analysis_id == id,
            models.LearningNote.user_id == uid
        ).delete()

        db.delete(record)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete record: {e}"
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
    Returns ranked results based on meaning, not just keyword matching.
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
    Returns aggregated metrics, trends, and framework-specific stats.
    """
    uid = token_data["uid"]

    # Total errors analyzed
    total = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid
    ).scalar() or 0

    ai_count = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.ai_enhanced == True
    ).scalar() or 0

    # Most common error categories
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

    # Severity distribution
    severity_rows = db.query(
        models.ErrorAnalysis.severity,
        func.count(models.ErrorAnalysis.id)
    ).filter(
        models.ErrorAnalysis.user_id == uid
    ).group_by(models.ErrorAnalysis.severity).all()
    severity_dist = {row[0] or "unknown": row[1] for row in severity_rows}

    # Error type distribution (top 10)
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

    # Fix success rate (percentage of analyses where user said fix was helpful)
    helpful_count = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.was_fix_helpful == True
    ).scalar() or 0
    feedback_total = db.query(func.count(models.ErrorAnalysis.id)).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.was_fix_helpful.isnot(None)
    ).scalar() or 0
    fix_success_rate = round((helpful_count / feedback_total) * 100) if feedback_total > 0 else None

    # Average confidence scores
    avg_confidence = db.query(
        func.avg(models.ErrorAnalysis.confidence_root_cause),
        func.avg(models.ErrorAnalysis.confidence_fix),
        func.avg(models.ErrorAnalysis.confidence_explanation),
    ).filter(
        models.ErrorAnalysis.user_id == uid,
        models.ErrorAnalysis.confidence_root_cause.isnot(None)
    ).first()

    # Debugging frequency — errors per day for last 7 days
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

    # Learning progress — number of learning notes
    learning_note_count = db.query(func.count(models.LearningNote.id)).filter(
        models.LearningNote.user_id == uid
    ).scalar() or 0

    # Recurring pattern count
    recurring_count = 0
    try:
        recurring_count = len(get_recurring_patterns(db, uid))
    except Exception:
        pass

    # Recent errors (last 5)
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
    Returns the user's recurring error patterns with weak area analysis
    and personalized learning recommendations.
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
    Browse the error knowledge base with optional category filtering.
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
