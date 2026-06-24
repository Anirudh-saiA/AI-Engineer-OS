from fastapi import APIRouter
from app.api.v1.endpoints import system, profile, agent, agents, vector, rag, debugger, analytics

api_router = APIRouter()
api_router.include_router(system.router, prefix="/system", tags=["System"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(agent.router, prefix="/agent", tags=["Agent"])
api_router.include_router(agents.router, prefix="/agents", tags=["Multi-Agent"])
api_router.include_router(vector.router, prefix="/vector", tags=["Vector"])
api_router.include_router(rag.router, prefix="/rag", tags=["RAG"])
api_router.include_router(debugger.router, prefix="/debugger", tags=["Debugger"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

# Expose POST /upload-pdf directly under /api/v1/upload-pdf
api_router.post("/upload-pdf", tags=["RAG"])(rag.upload_pdf)


