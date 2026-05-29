import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_token
from app.models.document import Document
from app.schemas import document as schemas
from app.rag import ingestion, chunking, vectorstore, generation

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

@router.post("/upload-document", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    topic: str = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Accepts document uploads (TXT, MD, PDF), extracts raw text content,
    and stores document metadata and raw text inside PostgreSQL.
    """
    filename = file.filename
    content_type = file.content_type
    
    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read upload file stream: {str(e)}"
        )

    # Clean and parse text based on extension / content type
    file_lower = filename.lower()
    try:
        if file_lower.endswith(".pdf") or content_type == "application/pdf":
            raw_text = ingestion.extract_text_from_pdf(file_bytes)
            source_type = "pdf"
        elif file_lower.endswith((".txt", ".md")) or "text" in content_type:
            raw_text = ingestion.extract_text_from_txt_or_md(file_bytes)
            source_type = "txt" if file_lower.endswith(".txt") else "md"
        else:
            # General fallback to string decoding
            raw_text = ingestion.extract_text_from_txt_or_md(file_bytes)
            source_type = "txt"
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse document content: {str(e)}"
        )

    cleaned_text = ingestion.clean_extracted_text(raw_text)
    if not cleaned_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parsed document content is empty or unreadable."
        )

    # Save metadata and content in PostgreSQL
    db_doc = Document(
        user_id=current_user["uid"],
        name=filename,
        source_type=source_type,
        topic=topic or "general",
        content=cleaned_text
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    return db_doc

@router.post("/generate-embeddings")
def generate_embeddings(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Triggers recursive chunking, embeddings generation, and vector upsert inside Qdrant
    for a specific document.
    """
    document_id = payload.get("document_id")
    if not document_id:
        raise HTTPException(status_code=400, detail="Missing required field: 'document_id'")

    db_doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user["uid"]
    ).first()

    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")

    # 1. Perform sliding window text chunking
    chunks = chunking.chunk_document_text(db_doc.content, chunk_size=1000, chunk_overlap=200)
    if not chunks:
        raise HTTPException(status_code=400, detail="Document has no readable text chunks.")

    # 2. Computes vectors and uploads to Qdrant
    try:
        vectorstore.upsert_document_chunks(
            document_id=db_doc.id,
            document_name=db_doc.name,
            source_type=db_doc.source_type,
            topic=db_doc.topic,
            chunks=chunks
        )
        status_msg = "success"
        message = f"Document '{db_doc.name}' chunked successfully into {len(chunks)} chunks, and embeddings upserted to Qdrant."
    except Exception as e:
        status_msg = "partial_success"
        message = f"Document '{db_doc.name}' chunked successfully into {len(chunks)} chunks locally, but Qdrant upsert failed: {str(e)}"

    return {
        "status": status_msg,
        "message": message,
        "chunks_count": len(chunks)
    }

@router.post("/search", response_model=List[schemas.RAGSearchMatch])
def search_rag(
    query_data: schemas.RAGSearchQuery,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Performs hybrid dense-semantic and sparse-keyword search.
    Queries Qdrant for semantic matches and merges them with PostgreSQL keyword matches
    using reciprocal rank fused scoring, filtering out low similarity noise (score < 0.40).
    """
    limit = query_data.limit or 5
    query = query_data.query

    # 1. Fetch dense semantic results from Qdrant
    semantic_results = []
    try:
        semantic_results = vectorstore.search_rag_collection(query, limit=limit * 2)
    except Exception as e:
        logger.warning(f"Qdrant RAG semantic search bypassed or offline: {e}")

    # 2. Fetch sparse keyword results from PostgreSQL
    keyword_results = []
    try:
        STOP_WORDS = {
            "the", "is", "on", "and", "in", "a", "to", "of", "for", "with", "what", 
            "where", "how", "who", "why", "are", "there", "an", "it", "its", "at", 
            "by", "from", "as", "be", "this", "that", "these", "those", "or", "but",
            "me", "my", "you", "your", "we", "our", "us", "about"
        }
        user_docs = db.query(Document).filter(Document.user_id == current_user["uid"]).all()
        raw_query_words = set(w.strip("?,.!:;()[]{}'\"") for w in query.lower().split())
        query_words = {w for w in raw_query_words if w not in STOP_WORDS and len(w) > 1}
        
        if query_words:
            for doc in user_docs:
                chunks = chunking.chunk_document_text(doc.content, chunk_size=1000, chunk_overlap=200)
                for chunk in chunks:
                    raw_chunk_words = set(w.strip("?,.!:;()[]{}'\"") for w in chunk.lower().replace("/", " ").replace("-", " ").replace("_", " ").split())
                    chunk_words = {w for w in raw_chunk_words if w not in STOP_WORDS and len(w) > 1}
                    overlap = query_words.intersection(chunk_words)
                    
                    if overlap:
                        # Coverage score: percentage of meaningful query terms that are matched in the chunk
                        coverage = len(overlap) / float(len(query_words))
                        # Base scaling to 0.5 - 1.0 range
                        score_norm = 0.5 + (coverage * 0.5)
                        keyword_results.append({
                            "score": round(score_norm, 3),
                            "chunk_text": chunk,
                            "document_name": doc.name,
                            "source_type": doc.source_type,
                            "topic": doc.topic
                        })
    except Exception as e:
        logger.error(f"Postgres keyword RAG search failed: {e}")

    # 3. Hybrid Fusion & Weighting
    fused_matches = {}
    
    # Process semantic hits (keep the maximum score if the same key appears multiple times)
    for res in semantic_results:
        key = (res["document_name"], res["chunk_text"])
        if key in fused_matches:
            fused_matches[key]["semantic_score"] = max(fused_matches[key]["semantic_score"], res["score"])
        else:
            fused_matches[key] = {
                "semantic_score": res["score"],
                "keyword_score": 0.0,
                "source_type": res["source_type"],
                "topic": res["topic"]
            }
        
    # Process keyword hits (keep the maximum score if the same key appears multiple times)
    for res in keyword_results:
        key = (res["document_name"], res["chunk_text"])
        if key in fused_matches:
            fused_matches[key]["keyword_score"] = max(fused_matches[key]["keyword_score"], res["score"])
        else:
            fused_matches[key] = {
                "semantic_score": 0.0,
                "keyword_score": res["score"],
                "source_type": res["source_type"],
                "topic": res["topic"]
            }

    # Reciprocal Weight Fusion
    fused_list = []
    for (doc_name, chunk_text), scores in fused_matches.items():
        sem = scores["semantic_score"]
        keyw = scores["keyword_score"]
        
        if sem > 0.0 and keyw > 0.0:
            fused_score = 0.7 * sem + 0.3 * keyw
        elif sem > 0.0:
            # Baseline keyword score overlap factor
            fused_score = 0.7 * sem + 0.3 * 0.35
        else:
            # Pure keyword overlap match
            fused_score = 0.7 * 0.35 + 0.3 * keyw
            
        fused_list.append({
            "score": round(fused_score, 3),
            "chunk_text": chunk_text,
            "document_name": doc_name,
            "source_type": scores["source_type"],
            "topic": scores["topic"]
        })

    # 4. Sort and apply similarity score threshold filter (score >= 0.40)
    sorted_matches = sorted(fused_list, key=lambda x: x["score"], reverse=True)
    filtered_matches = [
        schemas.RAGSearchMatch(
            score=hit["score"],
            chunk_text=hit["chunk_text"],
            document_name=hit["document_name"],
            source_type=hit["source_type"],
            topic=hit["topic"]
        )
        for hit in sorted_matches if hit["score"] >= 0.40
    ]

    return filtered_matches[:limit]

@router.post("/ask", response_model=schemas.RAGAskResponse)
def ask_rag(
    query_data: schemas.RAGAskQuery,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Performs hybrid similarity search, extracts Top K context chunks,
    and passes them to context-augmented generative prompt completions (OpenAI or Gemini).
    """
    limit = query_data.limit or 5
    query = query_data.query

    # 1. Retrieve most relevant context chunks using the optimized hybrid search
    search_results = search_rag(
        schemas.RAGSearchQuery(query=query, limit=limit),
        db=db,
        current_user=current_user
    )
    
    retrieved_chunks = [
        {
            "score": hit.score,
            "chunk_text": hit.chunk_text,
            "document_name": hit.document_name,
            "source_type": hit.source_type,
            "topic": hit.topic
        }
        for hit in search_results
    ]

    # 2. Invoke generative completion prompt
    rag_response = generation.generate_contextual_answer(query, retrieved_chunks)

    # 3. Format response
    formatted_chunks = [
        schemas.RAGSearchMatch(
            score=chunk["score"],
            chunk_text=chunk["chunk_text"],
            document_name=chunk["document_name"],
            source_type=chunk["source_type"],
            topic=chunk["topic"]
        )
        for chunk in retrieved_chunks
    ]

    return schemas.RAGAskResponse(
        answer=rag_response.get("answer", "Error formulating generative completion."),
        beginner_explanation=rag_response.get("beginner_explanation", "Error generating simplified details."),
        citations=rag_response.get("citations", []),
        retrieved_chunks=formatted_chunks
    )

@router.get("/documents", response_model=List[schemas.DocumentResponse])
def get_documents(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Lists all uploaded documents owned by the active user.
    """
    docs = db.query(Document).filter(Document.user_id == current_user["uid"]).all()
    return docs

@router.get("/document/{id}", response_model=schemas.DocumentDetailResponse)
def get_document_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Retrieves full details and extracted text contents for a specific document.
    """
    doc = db.query(Document).filter(
        Document.id == id,
        Document.user_id == current_user["uid"]
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )
    return doc
