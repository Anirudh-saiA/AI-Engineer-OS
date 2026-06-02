import os
import json
import urllib.request
import urllib.error
import datetime
import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.api.deps import get_db, verify_token
from app.models import profile as models
from app.core import error_analysis

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

    class Config:
        from_attributes = True

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def parse_ai_response(response_text: str) -> Dict[str, Any]:
    """
    Parses mentor-style structured markdown into individual components.
    Expects sections starting with '## Root Cause', '## Fix', '## Best Practice', '## Learning Note'.
    """
    sections = {
        "root_cause": "",
        "explanation": "",
        "suggested_fixes": [],
        "best_practices": [],
        "learning_notes": ""
    }

    current_section = None
    lines = response_text.split("\n")

    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue

        lower_line = line_stripped.lower()
        if "## root cause" in lower_line or "## explanation" in lower_line:
            current_section = "root_cause"
        elif "## fix" in lower_line or "## suggested fixes" in lower_line or "## fixes" in lower_line:
            current_section = "suggested_fixes"
        elif "## best practice" in lower_line or "## best practices" in lower_line:
            current_section = "best_practices"
        elif "## learning note" in lower_line or "## learning notes" in lower_line:
            current_section = "learning_notes"
        elif line_stripped.startswith("##"):
            current_section = None
        else:
            if current_section == "root_cause":
                sections["root_cause"] += line + "\n"
                sections["explanation"] += line + "\n"
            elif current_section == "suggested_fixes":
                if line_stripped.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.")):
                    clean_fix = re.sub(r'^[-\*\d\.\s]+', '', line_stripped).strip()
                    if clean_fix:
                        sections["suggested_fixes"].append(clean_fix)
                else:
                    if sections["suggested_fixes"]:
                        sections["suggested_fixes"][-1] += "\n" + line_stripped
                    else:
                        sections["suggested_fixes"].append(line_stripped)
            elif current_section == "best_practices":
                if line_stripped.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.")):
                    clean_bp = re.sub(r'^[-\*\d\.\s]+', '', line_stripped).strip()
                    if clean_bp:
                        sections["best_practices"].append(clean_bp)
                else:
                    if sections["best_practices"]:
                        sections["best_practices"][-1] += "\n" + line_stripped
                    else:
                        sections["best_practices"].append(line_stripped)
            elif current_section == "learning_notes":
                sections["learning_notes"] += line + "\n"

    # Clean whitespace and fallback if empty
    sections["root_cause"] = sections["root_cause"].strip()
    sections["explanation"] = sections["explanation"].strip()
    sections["learning_notes"] = sections["learning_notes"].strip()

    # Clean list arrays
    sections["suggested_fixes"] = [x.strip() for x in sections["suggested_fixes"] if x.strip()]
    sections["best_practices"] = [x.strip() for x in sections["best_practices"] if x.strip()]

    return sections

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
    Accepts raw error text, runs parsing + classification + AI analysis,
    stores result in DB, awards +10 XP to profile, and returns structured analysis.
    """
    error_text = submission.error_text
    uid = token_data["uid"]
    
    # 1. Run local pure-Python rule-based analysis (always instant and robust)
    local_analysis = error_analysis.analyze_error(error_text)
    
    api_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    ai_enhanced = False
    ai_response = ""

    # System instruction for mentoring
    system_prompt = (
        "You are an expert debugging mentor inside AI Engineer OS.\n"
        f"The developer submitted an error of type '{local_analysis['error_type']}'.\n"
        f"The local parser classified the categories as: {', '.join(local_analysis['categories'])}.\n\n"
        "Your task is to explain the root cause simply (beginner-friendly), suggest concrete step-by-step fixes, "
        "and teach ONE solid debugging best practice they can apply in the future.\n\n"
        "You MUST respond in clean, structured Markdown using EXACTLY these section headers:\n"
        "## Root Cause\n"
        "[Beginner-friendly explanation of why this error happens and what triggered it in this context]\n\n"
        "## Fix\n"
        "- [Step-by-step fix 1]\n"
        "- [Step-by-step fix 2]\n\n"
        "## Best Practice\n"
        "- [Pro debugging tip/practice to prevent or quickly isolate this error next time]\n\n"
        "## Learning Note\n"
        "[A brief deep-dive explanation of the underlying Python/JavaScript/network concept to level up their skills]"
    )

    # 2. Try Gemini API
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
                        "parts": [{"text": "Understood. I will act as your debugging mentor and explain the root cause, fixes, best practice, and learning note using the exact Markdown headers."}]
                    },
                    {
                        "role": "user",
                        "parts": [{"text": f"Analyze this error:\n\n{error_text}"}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048
                }
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            
            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                ai_response = res_data["candidates"][0]["content"]["parts"][0]["text"]
                ai_enhanced = True
        except Exception as e:
            print(f"Gemini Debugger Completion failed: {e}")

    # 3. Try OpenAI API as fallback
    if not ai_enhanced and api_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze this error:\n\n{error_text}"}
                ],
                "temperature": 0.7
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
            )
            
            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                ai_response = res_data["choices"][0]["message"]["content"]
                ai_enhanced = True
        except Exception as e:
            print(f"OpenAI Debugger Completion failed: {e}")

    # 4. Integrate AI response if enhanced
    if ai_enhanced and ai_response:
        parsed_ai = parse_ai_response(ai_response)
        if parsed_ai["root_cause"]:
            local_analysis["root_cause"] = parsed_ai["root_cause"]
        if parsed_ai["explanation"]:
            local_analysis["explanation"] = parsed_ai["explanation"]
        if parsed_ai["suggested_fixes"]:
            local_analysis["suggested_fixes"] = parsed_ai["suggested_fixes"]
        if parsed_ai["best_practices"]:
            local_analysis["best_practices"] = parsed_ai["best_practices"]
        if parsed_ai["learning_notes"]:
            local_analysis["learning_notes"] = parsed_ai["learning_notes"]

    # 5. Save the analysis record in PostgreSQL
    db_analysis = models.ErrorAnalysis(
        user_id=uid,
        error_text=error_text[:4000],  # Keep database safe from extreme payloads
        error_type=local_analysis["error_type"],
        categories=",".join(local_analysis["categories"]),
        file_name=local_analysis["file"],
        line_number=local_analysis["line"],
        severity=local_analysis["severity"],
        explanation=local_analysis["explanation"],
        root_cause=local_analysis["root_cause"],
        suggested_fixes=json.dumps(local_analysis["suggested_fixes"]),
        ai_enhanced=ai_enhanced
    )
    
    try:
        db.add(db_analysis)
        
        # 6. Award +10 XP to profile
        profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
        if profile:
            profile.xp_points += 10
            
        db.commit()
        db.refresh(db_analysis)
    except Exception as db_err:
        db.rollback()
        print(f"Database error saving analysis: {db_err}")
        # Return local analysis directly without database ID if save fails
        return ErrorAnalysisResponse(
            id=None,
            error_type=local_analysis["error_type"],
            file=local_analysis["file"],
            line=local_analysis["line"],
            message=local_analysis["message"],
            categories=local_analysis["categories"],
            explanation=local_analysis["explanation"],
            root_cause=local_analysis["root_cause"],
            suggested_fixes=local_analysis["suggested_fixes"],
            best_practices=local_analysis["best_practices"],
            learning_notes=local_analysis["learning_notes"],
            severity=local_analysis["severity"],
            ai_enhanced=ai_enhanced,
            created_at=datetime.datetime.utcnow()
        )

    return ErrorAnalysisResponse(
        id=db_analysis.id,
        error_type=db_analysis.error_type,
        file=db_analysis.file_name,
        line=db_analysis.line_number,
        message=local_analysis["message"],
        categories=local_analysis["categories"],
        explanation=db_analysis.explanation,
        root_cause=db_analysis.root_cause,
        suggested_fixes=json.loads(db_analysis.suggested_fixes),
        best_practices=local_analysis["best_practices"],
        learning_notes=local_analysis["learning_notes"],
        severity=db_analysis.severity,
        ai_enhanced=db_analysis.ai_enhanced,
        created_at=db_analysis.created_at
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

@router.get("/history", response_model=List[ErrorAnalysisResponse])
def get_history_endpoint(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Returns the user's last 50 debugging analysis sessions.
    """
    uid = token_data["uid"]
    analyses = db.query(models.ErrorAnalysis).filter(
        models.ErrorAnalysis.user_id == uid
    ).order_by(models.ErrorAnalysis.created_at.desc()).limit(50).all()
    
    response_list = []
    for a in analyses:
        # Load local knowledge base practices to enrich history if missing
        local_ref = error_analysis.analyze_error(a.error_text)
        
        try:
            fixes = json.loads(a.suggested_fixes) if a.suggested_fixes else []
        except Exception:
            fixes = []
            
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
            created_at=a.created_at
        ))
        
    return response_list

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
        db.delete(record)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete record: {e}"
        )
        
    return {"status": "success", "message": "Record successfully deleted"}
