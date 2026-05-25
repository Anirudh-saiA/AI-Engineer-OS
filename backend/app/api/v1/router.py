from fastapi import APIRouter
from app.api.v1.endpoints import system, profile, agent

api_router = APIRouter()
api_router.include_router(system.router, prefix="/system", tags=["System"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(agent.router, prefix="/agent", tags=["Agent"])
