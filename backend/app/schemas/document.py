from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DocumentResponse(BaseModel):
    id: int
    name: str
    source_type: str
    topic: Optional[str]
    upload_date: datetime

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    content: str

class RAGSearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 5

class RAGSearchMatch(BaseModel):
    score: float
    chunk_text: str
    document_name: str
    source_type: str
    topic: Optional[str]

class RAGAskQuery(BaseModel):
    query: str
    limit: Optional[int] = 5

class RAGAskResponse(BaseModel):
    answer: str
    beginner_explanation: str
    citations: List[str]
    retrieved_chunks: List[RAGSearchMatch]
