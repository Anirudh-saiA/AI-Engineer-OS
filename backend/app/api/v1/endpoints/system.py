import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.schemas.system import HealthCheck, SystemStatus
from app.api.deps import get_db, verify_token

router = APIRouter()

start_time = time.time()

@router.get("/health", response_model=HealthCheck, summary="Health Check")
def get_health() -> HealthCheck:
    """
    Perform a simple health check to ensure the service is running.
    (Kept public for infrastructure load balancer checks).
    """
    return HealthCheck(status="ok")

@router.get("/status", response_model=SystemStatus, summary="System Status")
def get_status(current_user: dict = Depends(verify_token)) -> SystemStatus:
    """
    Get detailed system status, including uptime and environment state.
    (Protected: Requires valid Bearer Token).
    """
    uptime = time.time() - start_time
    return SystemStatus(
        status="ok",
        environment=settings.ENVIRONMENT,
        version="0.1.0",
        uptime_seconds=round(uptime, 2),
        details={
            "api_version": "v1",
            "framework": "FastAPI",
            "project": settings.PROJECT_NAME
        }
    )

@router.get("/db-check", summary="Database Connection Check")
def check_db_connection(db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """
    Perform a live transaction check against PostgreSQL to ensure reachability.
    (Protected: Requires valid Bearer Token).
    """
    try:
        # Execute raw SQL query SELECT 1
        db.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "database": "PostgreSQL",
            "message": "Database is fully online and responding."
        }
    except Exception as e:
        return {
            "status": "failed",
            "database": "PostgreSQL",
            "error": str(e)
        }
