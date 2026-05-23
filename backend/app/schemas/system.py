from pydantic import BaseModel
from typing import Dict

class HealthCheck(BaseModel):
    status: str = "ok"

class SystemStatus(BaseModel):
    status: str
    environment: str
    version: str
    uptime_seconds: float
    details: Dict[str, str]
