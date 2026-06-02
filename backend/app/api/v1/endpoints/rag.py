import os
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_token
from app.models.document import Document
from app.schemas import document as schemas
from app.rag import ingestion, chunking, vectorstore, generation, youtube, github

logger = logging.getLogger("uvicorn.error")

# Resolve UPLOAD_DIR: backend/app/uploads
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

router = APIRouter()

@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    topic: str = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Accepts PDF uploads, validates file type and size, stores the PDF
    file on local disk storage, and logs metadata inside PostgreSQL.
    """
    filename = file.filename
    content_type = file.content_type
    
    # 1. File Type and Extension Verification
    file_lower = filename.lower()
    if not file_lower.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension must be .pdf"
        )
        
    if content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content type must be application/pdf"
        )

    # 2. Secure Directory Isolation per User
    user_upload_dir = os.path.join(UPLOAD_DIR, current_user["uid"])
    os.makedirs(user_upload_dir, exist_ok=True)
    
    # 3. Stream File and Verify Size Boundary (Max 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB
    file_size = 0
    safe_filename = os.path.basename(filename)
    out_file_path = os.path.join(user_upload_dir, safe_filename)
    
    try:
        with open(out_file_path, "wb") as f:
            while True:
                chunk = await file.read(1024 * 1024) # Read in 1MB chunks
                if not chunk:
                    break
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds the 10MB safety boundary."
                    )
                f.write(chunk)
    except HTTPException as he:
        if os.path.exists(out_file_path):
            try:
                os.remove(out_file_path)
            except Exception:
                pass
        raise he
    except Exception as e:
        if os.path.exists(out_file_path):
            try:
                os.remove(out_file_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist file: {str(e)}"
        )

    # 4. Extract PDF text and write JSON metadata
    try:
        metadata = ingestion.extract_pdf_metadata_and_text(out_file_path, safe_filename)
        cleaned_text = metadata["cleaned_text"]
        
        # Save JSON metadata file
        import json
        json_path = os.path.splitext(out_file_path)[0] + ".json"
        metadata_to_save = {
            "document_name": metadata["document_name"],
            "page_count": metadata["page_count"],
            "raw_text": metadata["raw_text"]
        }
        with open(json_path, "w", encoding="utf-8") as jf:
            json.dump(metadata_to_save, jf, indent=2, ensure_ascii=False)
    except Exception as e:
        # Cleanup uploaded PDF if parsing fails to avoid invalid files on disk
        if os.path.exists(out_file_path):
            try:
                os.remove(out_file_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse PDF document content: {str(e)}"
        )

    # 5. Save metadata and parsed content in PostgreSQL
    db_doc = Document(
        user_id=current_user["uid"],
        name=safe_filename,
        source_type="pdf",
        topic=topic or "general",
        content=cleaned_text
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    return {
        "status": "success",
        "message": f"File '{safe_filename}' uploaded and stored successfully.",
        "document": {
            "id": db_doc.id,
            "name": db_doc.name,
            "source_type": db_doc.source_type,
            "topic": db_doc.topic,
            "upload_date": db_doc.upload_date.isoformat()
        },
        "file_size_bytes": file_size
    }

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
            # For PDFs, extract metadata and store the JSON file
            user_upload_dir = os.path.join(UPLOAD_DIR, current_user["uid"])
            os.makedirs(user_upload_dir, exist_ok=True)
            safe_filename = os.path.basename(filename)
            
            metadata = ingestion.extract_pdf_metadata_and_text(file_bytes, safe_filename)
            raw_text = metadata["raw_text"]
            
            # Save the JSON metadata file
            import json
            json_path = os.path.join(user_upload_dir, os.path.splitext(safe_filename)[0] + ".json")
            metadata_to_save = {
                "document_name": metadata["document_name"],
                "page_count": metadata["page_count"],
                "raw_text": metadata["raw_text"]
            }
            with open(json_path, "w", encoding="utf-8") as jf:
                json.dump(metadata_to_save, jf, indent=2, ensure_ascii=False)
                
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

    # Fallback safety: If content is still in the pending processing state, extract it now
    if db_doc.content == "[PENDING PROCESSING]" and db_doc.source_type == "pdf":
        user_upload_dir = os.path.join(UPLOAD_DIR, current_user["uid"])
        pdf_path = os.path.join(user_upload_dir, db_doc.name)
        if os.path.exists(pdf_path):
            try:
                metadata = ingestion.extract_pdf_metadata_and_text(pdf_path, db_doc.name)
                db_doc.content = metadata["cleaned_text"]
                db.commit()
                db.refresh(db_doc)
                
                # Write the JSON metadata file if not present
                import json
                json_path = os.path.splitext(pdf_path)[0] + ".json"
                if not os.path.exists(json_path):
                    metadata_to_save = {
                        "document_name": metadata["document_name"],
                        "page_count": metadata["page_count"],
                        "raw_text": metadata["raw_text"]
                    }
                    with open(json_path, "w", encoding="utf-8") as jf:
                        json.dump(metadata_to_save, jf, indent=2, ensure_ascii=False)
            except Exception as e:
                logger.error(f"Fallback parsing failed during embedding generation: {e}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Failed to parse pending PDF document: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF source file not found on disk to process pending document."
            )

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

@router.post("/ingest-youtube", response_model=schemas.YouTubeIngestResponse)
def ingest_youtube(
    payload: schemas.YouTubeIngestRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Accepts a YouTube URL, extracts the video transcript (captions),
    cleans and chunks the text, generates embeddings, and stores
    everything in PostgreSQL + Qdrant for RAG retrieval.
    """
    url = payload.url
    topic = payload.topic or "general"

    if not url or not url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="YouTube URL is required."
        )

    # 1. Extract transcript and video metadata
    try:
        result = youtube.ingest_youtube_video(url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"YouTube ingestion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process YouTube video: {str(e)}"
        )

    transcript_text = result["transcript_text"]
    video_title = result["title"]
    video_channel = result["channel"]
    video_url = result["video_url"]
    video_id = result["video_id"]
    word_count = result["word_count"]

    # 2. Store document record in PostgreSQL
    doc_name = video_title if video_title else f"YouTube: {video_id}"
    db_doc = Document(
        user_id=current_user["uid"],
        name=doc_name,
        source_type="youtube",
        topic=topic,
        content=f"[YOUTUBE_VIDEO_ID: {video_id}]\n\n{transcript_text}"
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # 3. Chunk the transcript text
    chunks = chunking.chunk_document_text(transcript_text, chunk_size=1000, chunk_overlap=200)
    if not chunks:
        return schemas.YouTubeIngestResponse(
            status="partial_success",
            message=f"Transcript extracted from '{doc_name}' but produced no text chunks.",
            document=schemas.DocumentResponse(
                id=db_doc.id,
                name=db_doc.name,
                source_type=db_doc.source_type,
                topic=db_doc.topic,
                upload_date=db_doc.upload_date
            ),
            video_metadata=schemas.YouTubeVideoMeta(
                title=video_title,
                channel=video_channel,
                video_url=video_url
            ),
            word_count=word_count,
            chunks_count=0
        )

    # 4. Generate embeddings and upsert to Qdrant
    try:
        vectorstore.upsert_document_chunks(
            document_id=db_doc.id,
            document_name=doc_name,
            source_type="youtube",
            topic=topic,
            chunks=chunks
        )
        embed_status = "success"
        embed_message = (
            f"Transcript extracted from '{doc_name}'. "
            f"{word_count:,} words processed, {len(chunks)} chunks created. "
            f"Knowledge stored successfully."
        )
    except Exception as e:
        embed_status = "partial_success"
        embed_message = (
            f"Transcript extracted from '{doc_name}'. "
            f"{word_count:,} words processed, {len(chunks)} chunks created locally, "
            f"but Qdrant upsert failed: {str(e)}"
        )
        logger.warning(f"Qdrant upsert failed for YouTube video {video_id}: {e}")

    return schemas.YouTubeIngestResponse(
        status=embed_status,
        message=embed_message,
        document=schemas.DocumentResponse(
            id=db_doc.id,
            name=db_doc.name,
            source_type=db_doc.source_type,
            topic=db_doc.topic,
            upload_date=db_doc.upload_date
        ),
        video_metadata=schemas.YouTubeVideoMeta(
            title=video_title,
            channel=video_channel,
            video_url=video_url
        ),
        word_count=word_count,
        chunks_count=len(chunks)
    )

@router.post("/ingest-github", response_model=schemas.GitHubIngestResponse)
def ingest_github(
    payload: schemas.GitHubIngestRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Accepts a GitHub repository URL, downloads its default branch ZIP archive,
    extracts documentation and README markdown files, splits them into semantic
    chunks, registers each file in PostgreSQL, and generates vector embeddings for Qdrant.
    """
    import datetime
    url = payload.url
    topic = payload.topic or "general"
    
    if not url or not url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub repository URL is required."
        )
        
    try:
        doc_files = github.ingest_github_documentation(url, token=payload.token)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except Exception as e:
        logger.error(f"GitHub ingestion processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while parsing the GitHub repository: {str(e)}"
        )
        
    if not doc_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No markdown documentation files or README found in the repository."
        )
        
    org, repo = github.parse_github_url(url)
    
    files_indexed = 0
    chunks_created = 0
    embeddings_generated = 0
    
    for file_item in doc_files:
        file_path = file_item["path"]
        content = file_item["content"]
        
        # 1. Register file in PostgreSQL database as a unique document
        doc_name = f"{org}/{repo}: {file_path}"
        
        # Check if the document already exists for this user to avoid duplicate entries
        existing_doc = db.query(Document).filter(
            Document.user_id == current_user["uid"],
            Document.name == doc_name
        ).first()
        
        if existing_doc:
            db_doc = existing_doc
            db_doc.content = content
            db_doc.upload_date = datetime.datetime.utcnow()
        else:
            db_doc = Document(
                user_id=current_user["uid"],
                name=doc_name,
                source_type="github",
                topic=topic,
                content=content
            )
            db.add(db_doc)
            
        db.commit()
        db.refresh(db_doc)
        files_indexed += 1
        
        # 2. Chunk repository document contents
        chunks = chunking.chunk_document_text(content, chunk_size=1000, chunk_overlap=200)
        if not chunks:
            continue
            
        chunks_created += len(chunks)
        
        # 3. Compute vector embeddings and load into Qdrant
        try:
            vectorstore.upsert_document_chunks(
                document_id=db_doc.id,
                document_name=doc_name,
                source_type="github",
                topic=topic,
                chunks=chunks
            )
            embeddings_generated += len(chunks)
        except Exception as qdrant_err:
            logger.warning(f"Qdrant vector load skipped for file '{file_path}': {qdrant_err}")
            continue
            
    # Commit any changes remaining
    db.commit()
    
    message = (
        f"Repository '{org}/{repo}' parsed successfully. "
        f"{files_indexed} markdown files indexed, {chunks_created} chunks generated "
        f"and stored in Qdrant."
    )
    
    return schemas.GitHubIngestResponse(
        status="success",
        message=message,
        files_indexed=files_indexed,
        chunks_created=chunks_created,
        embeddings_generated=embeddings_generated
    )

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
    document_id = query_data.document_id

    target_doc = None
    if document_id:
        target_doc = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user["uid"]
        ).first()

    # 1. Fetch dense semantic results from Qdrant
    semantic_results = []
    try:
        semantic_results = vectorstore.search_rag_collection(
            query,
            limit=limit * 2,
            document_id=document_id
        )
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
        if target_doc:
            user_docs = [target_doc]
        else:
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
    document_id = query_data.document_id
 
    # 1. Retrieve most relevant context chunks using the optimized hybrid search
    search_results = search_rag(
        schemas.RAGSearchQuery(query=query, limit=limit, document_id=document_id),
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
