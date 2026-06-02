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
    document_id: Optional[int] = None

class RAGSearchMatch(BaseModel):
    score: float
    chunk_text: str
    document_name: str
    source_type: str
    topic: Optional[str]

class RAGAskQuery(BaseModel):
    query: str
    limit: Optional[int] = 5
    document_id: Optional[int] = None

class RAGAskResponse(BaseModel):
    answer: str
    beginner_explanation: str
    citations: List[str]
    retrieved_chunks: List[RAGSearchMatch]

class YouTubeIngestRequest(BaseModel):
    url: str
    topic: Optional[str] = None

class YouTubeVideoMeta(BaseModel):
    title: str
    channel: str
    video_url: str

class YouTubeIngestResponse(BaseModel):
    status: str
    message: str
    document: Optional[DocumentResponse] = None
    video_metadata: Optional[YouTubeVideoMeta] = None
    word_count: int = 0
    chunks_count: int = 0

class GitHubIngestRequest(BaseModel):
    url: str
    topic: Optional[str] = None
    token: Optional[str] = None

class GitHubIngestResponse(BaseModel):
    status: str
    message: str
    files_indexed: int
    chunks_created: int
    embeddings_generated: int

