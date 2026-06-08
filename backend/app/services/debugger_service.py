import os
import json
import urllib.request
import datetime
import re
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Dict, Any, List, Optional

from app.models import profile as models
from app.core import error_analysis
from app.core.debugger_prompts import (
    DEBUGGER_SYSTEM_PROMPT,
    build_analysis_prompt,
    parse_enhanced_ai_response,
)
from app.core.semantic_search import semantic_search
from app.core.confidence_engine import compute_confidence_scores
from app.core.recurring_tracker import track_error_pattern
from app.core.teaching_engine import generate_teaching_card
from app.core.community_search import fetch_community_references

class DebuggerService:
    """
    Service layer to handle all business logic for the AI Debugging Platform.
    Decouples the database transaction logic, external API fetching, AI prompting,
    and semantic indexing from the FastAPI endpoint router.
    """

    @staticmethod
    def _call_ai_api(system_prompt: str, user_prompt: str) -> tuple[bool, str]:
        """Calls Gemini API (primary) or OpenAI API (fallback) for error analysis."""
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
                            "parts": [{"text": "Understood. I will follow the system instructions precisely."}]
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
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_body = response.read().decode("utf-8")
                    res_data = json.loads(res_body)
                    ai_response = res_data["candidates"][0]["content"]["parts"][0]["text"]
                    ai_enhanced = True
            except Exception as e:
                print(f"[DebuggerService] Gemini call failed: {e}")

        # Try OpenAI as fallback
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
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_body = response.read().decode("utf-8")
                    res_data = json.loads(res_body)
                    ai_response = res_data["choices"][0]["message"]["content"]
                    ai_enhanced = True
            except Exception as e:
                print(f"[DebuggerService] OpenAI call failed: {e}")

        return ai_enhanced, ai_response

    @staticmethod
    def _build_search_text(analysis: Dict[str, Any]) -> str:
        """Concatenates all text fields for database indexing and keyword lookup."""
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

    @staticmethod
    def _safe_json_loads(value: Optional[str], default=None):
        if not value:
            return default if default is not None else []
        try:
            return json.loads(value)
        except Exception:
            return default if default is not None else []

    @classmethod
    def analyze_error(cls, db: Session, user_id: str, error_text: str) -> Dict[str, Any]:
        """
        Runs the full intelligence analysis pipeline for a submitted error traceback.
        Integrates: Rule-based scans, LLM API generation, semantic past searches,
        community GitHub/StackOverflow lookups, XP scoring, and recurring tracking.
        """
        # 1. Run local pure-Python classification and parsing
        local_analysis = error_analysis.analyze_error(error_text)

        # 2. Build AI prompt with local constraints
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
        ai_enhanced, ai_response = cls._call_ai_api(DEBUGGER_SYSTEM_PROMPT, user_prompt)

        # 4. Merge AI response with parsing fallback structures
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

            if parsed_ai["learning_concept"]:
                local_analysis["learning_mode"]["concept"] = parsed_ai["learning_concept"]
            if parsed_ai["common_mistakes"]:
                local_analysis["learning_mode"]["common_mistakes"] = parsed_ai["common_mistakes"]
            if parsed_ai["prevention_tips"]:
                local_analysis["learning_mode"]["prevention_tips"] = parsed_ai["prevention_tips"]

        # 5. Fetch semantic similarities
        top_similarity = 0.0
        try:
            search_results = semantic_search(error_text, top_k=3)
            if search_results:
                top_similarity = max(sr.similarity for sr in search_results)
        except Exception as search_err:
            print(f"[DebuggerService] Semantic search error: {search_err}")

        # 6. Compute confidence scores
        confidence = compute_confidence_scores(
            error_type=local_analysis["error_type"],
            categories=local_analysis["categories"],
            ai_enhanced=ai_enhanced,
            ai_response_sections=local_analysis,
            semantic_similarity=top_similarity,
        )

        # 7. Query community solutions (GitHub & Stack Overflow)
        community = fetch_community_references(local_analysis["error_type"], error_text)

        # 8. Save analysis record in database
        search_text = cls._build_search_text(local_analysis)
        db_analysis = models.ErrorAnalysis(
            user_id=user_id,
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
            beginner_explanation=local_analysis.get("beginner_explanation", ""),
            chain_of_events=json.dumps(local_analysis.get("chain_of_events", [])),
            code_suggestions=json.dumps(local_analysis.get("code_suggestions", [])),
            learning_concepts=json.dumps(local_analysis.get("learning_mode", {})),
            recommended_fix=local_analysis.get("recommended_fix", ""),
            search_text=search_text,
            confidence_root_cause=confidence.get("root_cause_confidence"),
            confidence_fix=confidence.get("fix_confidence"),
            confidence_explanation=confidence.get("explanation_confidence"),
            github_references=json.dumps(community["github"]),
            stackoverflow_references=json.dumps(community["stackoverflow"])
        )

        try:
            db.add(db_analysis)
            
            # Award +10 XP
            profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == user_id).first()
            if profile:
                profile.xp_points += 10
                
            # Track recurring error patterns
            track_error_pattern(db, user_id, local_analysis["error_type"], local_analysis["categories"])
            db.commit()
            db.refresh(db_analysis)
            
            # Create a learning note
            learning_mode = local_analysis.get("learning_mode", {})
            try:
                learning_note = models.LearningNote(
                    user_id=user_id,
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
                print(f"[DebuggerService] Learning note error: {note_err}")

        except Exception as db_err:
            db.rollback()
            print(f"[DebuggerService] Database save error: {db_err}")

        # Return formatted dictionary structure
        return cls._format_response_dict(db_analysis, local_analysis, ai_enhanced)

    @classmethod
    def _format_response_dict(cls, db_analysis, local_analysis, ai_enhanced: bool) -> Dict[str, Any]:
        """Formats the SQLAlchemy model and analytical details into a unified response dictionary."""
        code_sugs_raw = local_analysis.get("code_suggestions", [])
        code_suggestions = []
        for cs in code_sugs_raw:
            if isinstance(cs, dict):
                code_suggestions.append({
                    "name": cs.get("name", cs.get("title", "")),
                    "title": cs.get("title", cs.get("name", "")),
                    "before": cs.get("before", ""),
                    "after": cs.get("after", ""),
                    "reason": cs.get("reason", ""),
                })

        learning_mode_raw = local_analysis.get("learning_mode", {})
        learning_mode = {
            "concept": learning_mode_raw.get("concept", ""),
            "common_mistakes": learning_mode_raw.get("common_mistakes", []),
            "prevention_tips": learning_mode_raw.get("prevention_tips", []),
            "real_world_examples": learning_mode_raw.get("real_world_examples", []),
        }

        github_refs = cls._safe_json_loads(getattr(db_analysis, "github_references", "[]"), [])
        stackoverflow_refs = cls._safe_json_loads(getattr(db_analysis, "stackoverflow_references", "[]"), [])

        return {
            "id": db_analysis.id if db_analysis else None,
            "error_type": local_analysis.get("error_type", "UnknownError"),
            "file": local_analysis.get("file"),
            "line": local_analysis.get("line"),
            "message": local_analysis.get("message", ""),
            "categories": local_analysis.get("categories", []),
            "explanation": local_analysis.get("explanation", ""),
            "root_cause": local_analysis.get("root_cause", ""),
            "suggested_fixes": local_analysis.get("suggested_fixes", []),
            "best_practices": local_analysis.get("best_practices", []),
            "learning_notes": local_analysis.get("learning_notes", ""),
            "severity": local_analysis.get("severity", "medium"),
            "ai_enhanced": ai_enhanced,
            "created_at": db_analysis.created_at.isoformat() if db_analysis and db_analysis.created_at else datetime.datetime.utcnow().isoformat(),
            "beginner_explanation": local_analysis.get("beginner_explanation", ""),
            "chain_of_events": local_analysis.get("chain_of_events", []),
            "code_suggestions": code_suggestions,
            "recommended_fix": local_analysis.get("recommended_fix", ""),
            "learning_mode": learning_mode,
            "github_references": github_refs,
            "stackoverflow_references": stackoverflow_refs
        }

    @classmethod
    def get_history(cls, db: Session, user_id: str, search: Optional[str] = None,
                    category: Optional[str] = None, severity: Optional[str] = None,
                    limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves and filters user error analysis history from database."""
        query = db.query(models.ErrorAnalysis).filter(models.ErrorAnalysis.user_id == user_id)

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

        if category:
            query = query.filter(models.ErrorAnalysis.categories.ilike(f"%{category}%"))

        if severity:
            query = query.filter(models.ErrorAnalysis.severity == severity.lower())

        analyses = query.order_by(models.ErrorAnalysis.created_at.desc()).limit(limit).all()
        results = []
        for a in analyses:
            local_ref = error_analysis.analyze_error(a.error_text)
            fixes = cls._safe_json_loads(a.suggested_fixes, [])
            chain = cls._safe_json_loads(getattr(a, 'chain_of_events', None), local_ref.get("chain_of_events", []))
            code_sugs_raw = cls._safe_json_loads(getattr(a, 'code_suggestions', None), local_ref.get("code_suggestions", []))
            learning_raw = cls._safe_json_loads(getattr(a, 'learning_concepts', None), local_ref.get("learning_mode", {}))
            
            code_suggestions = []
            for cs in code_sugs_raw:
                if isinstance(cs, dict):
                    code_suggestions.append({
                        "name": cs.get("name", cs.get("title", "")),
                        "title": cs.get("title", cs.get("name", "")),
                        "before": cs.get("before", ""),
                        "after": cs.get("after", ""),
                        "reason": cs.get("reason", ""),
                    })

            learning_mode = {
                "concept": learning_raw.get("concept", "") if isinstance(learning_raw, dict) else "",
                "common_mistakes": learning_raw.get("common_mistakes", []) if isinstance(learning_raw, dict) else [],
                "prevention_tips": learning_raw.get("prevention_tips", []) if isinstance(learning_raw, dict) else [],
                "real_world_examples": learning_raw.get("real_world_examples", []) if isinstance(learning_raw, dict) else [],
            }

            github_refs = cls._safe_json_loads(getattr(a, "github_references", "[]"), [])
            stackoverflow_refs = cls._safe_json_loads(getattr(a, "stackoverflow_references", "[]"), [])

            results.append({
                "id": a.id,
                "error_type": a.error_type or "UnknownError",
                "file": a.file_name,
                "line": a.line_number,
                "message": local_ref.get("message", ""),
                "categories": a.categories.split(",") if a.categories else ["Unknown"],
                "explanation": a.explanation or "",
                "root_cause": a.root_cause or "",
                "suggested_fixes": fixes,
                "best_practices": local_ref.get("best_practices", []),
                "learning_notes": local_ref.get("learning_notes", ""),
                "severity": a.severity or "medium",
                "ai_enhanced": a.ai_enhanced or False,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "beginner_explanation": getattr(a, 'beginner_explanation', None) or local_ref.get("beginner_explanation", ""),
                "chain_of_events": chain,
                "code_suggestions": code_suggestions,
                "recommended_fix": getattr(a, 'recommended_fix', None) or local_ref.get("recommended_fix", ""),
                "learning_mode": learning_mode,
                "github_references": github_refs,
                "stackoverflow_references": stackoverflow_refs
            })
        return results

    @staticmethod
    def delete_history(db: Session, user_id: str, analysis_id: int):
        """Deletes an error analysis history session and associated notes."""
        record = db.query(models.ErrorAnalysis).filter(
            models.ErrorAnalysis.id == analysis_id,
            models.ErrorAnalysis.user_id == user_id
        ).first()

        if not record:
            return False

        # Delete learning notes first due to foreign keys
        db.query(models.LearningNote).filter(
            models.LearningNote.error_analysis_id == analysis_id,
            models.LearningNote.user_id == user_id
        ).delete()

        db.delete(record)
        db.commit()
        return True
