from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.api.deps import get_db, verify_token
from app.core.agents import analytics as analytics_core

router = APIRouter()

@router.get("/agents")
def get_agent_analytics(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Retrieves performance metrics for all cooperative agents,
    including total tasks run, success rate, and average execution time.
    """
    user_id = token_data["uid"]
    try:
        metrics = analytics_core.get_agent_metrics(db, user_id)
        utilization = analytics_core.get_agent_utilization(db, user_id)
        return {
            "metrics": metrics,
            "utilization": utilization
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent analytics: {str(e)}")


@router.get("/workflows")
def get_workflow_analytics(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Retrieves high-level workflow statistics: completion rates, counts,
    and task type distributions.
    """
    user_id = token_data["uid"]
    try:
        return analytics_core.get_workflow_metrics(db, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workflow analytics: {str(e)}")


@router.get("/trends")
def get_trend_analytics(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Retrieves daily workflow execution trends for the past N days.
    """
    user_id = token_data["uid"]
    try:
        return analytics_core.get_performance_trends(db, user_id, days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trend analytics: {str(e)}")
