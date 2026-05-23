import time
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.system import HealthCheck, SystemStatus

router = APIRouter()

start_time = time.time()

@router.get("/health", response_model=HealthCheck, summary="Health Check")
def get_health() -> HealthCheck:
    """
    Perform a simple health check to ensure the service is running.
    """
    return HealthCheck(status="ok")

@router.get("/status", response_model=SystemStatus, summary="System Status")
def get_status() -> SystemStatus:
    """
    Get detailed system status, including uptime and environment state.
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
