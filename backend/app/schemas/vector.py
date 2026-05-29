from pydantic import BaseModel
from typing import List, Optional

class VectorSearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 3

class VectorSearchMatch(BaseModel):
    score: float
    doc: str
    category: str

class VectorIngestPayload(BaseModel):
    filename: str
    content: str
