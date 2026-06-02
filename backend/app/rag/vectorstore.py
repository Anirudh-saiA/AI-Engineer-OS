import os
import json
import urllib.request
import urllib.error
import logging
from typing import List, Optional

logger = logging.getLogger("uvicorn.error")

QDRANT_HOST = os.environ.get("QDRANT_HOST", "http://localhost:6333")
COLLECTION_NAME = "ai_engineer_kb_rag"

def setup_qdrant_rag_collection() -> bool:
    """
    Checks if Qdrant is active and ensures the collection 'ai_engineer_kb_rag' is provisioned
    for 1536-dimension vectors (standard for text-embedding-ada-002 and gemini).
    """
    check_url = f"{QDRANT_HOST}/collections/{COLLECTION_NAME}"
    try:
        req = urllib.request.Request(check_url, method="GET")
        with urllib.request.urlopen(req, timeout=2) as res:
            if res.status == 200:
                return True
    except Exception:
        pass

    # Collection doesn't exist or Qdrant server needs configuration, try provisioning
    setup_url = f"{QDRANT_HOST}/collections/{COLLECTION_NAME}"
    payload = {
        "vectors": {
            "size": 1536,
            "distance": "Cosine"
        }
    }
    try:
        req = urllib.request.Request(
            setup_url,
            data=json.dumps(payload).encode("utf-8"),
            method="PUT",
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=2) as res:
            if res.status == 200:
                return True
    except Exception as e:
        logger.warning(f"Failed to auto-provision Qdrant collection '{COLLECTION_NAME}': {e}")
        pass
    return False

def generate_rag_embedding(text: str) -> List[float]:
    """
    Calls Gemini or OpenAI APIs to generate text embeddings if keys are present,
    otherwise returns a mock 1536-dimension float array.
    """
    openai_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    if openai_key:
        try:
            url = "https://api.openai.com/v1/embeddings"
            payload = {
                "model": "text-embedding-3-small",
                "input": text
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=5) as res:
                data = json.loads(res.read().decode())
                return data["data"][0]["embedding"]
        except Exception as e:
            logger.error(f"OpenAI embedding generation failed: {e}")
            pass

    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={gemini_key}"
            payload = {
                "model": "models/text-embedding-004",
                "content": {
                    "parts": [{"text": text}]
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as res:
                data = json.loads(res.read().decode())
                return data["embedding"]["values"]
        except Exception as e:
            logger.error(f"Gemini embedding generation failed: {e}")
            pass

    # Fallback high-fidelity word hashing coordinate vector
    import hashlib
    mock_vec = [0.0] * 1536
    
    STOP_WORDS = {
        "the", "is", "on", "and", "in", "a", "to", "of", "for", "with", "what", 
        "where", "how", "who", "why", "are", "there", "an", "it", "its", "at", 
        "by", "from", "as", "be", "this", "that", "these", "those", "or", "but",
        "me", "my", "you", "your", "we", "our", "us", "about"
    }
    
    # Process text into words
    words = text.lower().split()
    for word in words:
        # Strip common punctuation
        clean_word = word.strip(".,;:!?()[]{}'\"-+=_")
        if len(clean_word) < 2 or clean_word in STOP_WORDS:
            continue
        # Generate stable md5 and sha256 hashes for word (feature hashing trick with sign)
        h1 = int(hashlib.md5(clean_word.encode("utf-8")).hexdigest(), 16)
        h2 = int(hashlib.sha256(clean_word.encode("utf-8")).hexdigest(), 16)
        idx = h1 % 1536
        sign = 1.0 if (h2 % 2 == 0) else -1.0
        mock_vec[idx] += sign

    # Apply L2 normalization so that Cosine Similarity computes true word frequency vector similarity
    squared_sum = sum(val * val for val in mock_vec)
    l2_norm = squared_sum ** 0.5
    if l2_norm > 0.0:
        mock_vec = [val / l2_norm for val in mock_vec]
    else:
        # Standard unit vector fallback for empty text input
        mock_vec = [0.0] * 1536
        mock_vec[0] = 1.0
    return mock_vec

def upsert_document_chunks(
    document_id: int,
    document_name: str,
    source_type: str,
    topic: Optional[str],
    chunks: List[str]
) -> int:
    """
    Computes semantic vector embeddings and uploads document chunks to Qdrant collection.
    """
    collection_ready = setup_qdrant_rag_collection()
    if not collection_ready:
        raise ConnectionError("Qdrant server is offline. Real-time Qdrant upsert bypassed.")

    points = []
    for idx, chunk in enumerate(chunks):
        # Chunk Metadata Enrichment
        enriched_chunk = f"Document: {document_name} | Topic: {topic or 'general'} | Content: {chunk}"
        embedding = generate_rag_embedding(enriched_chunk)
        
        # Formulate payload metadata
        points.append({
            "id": int(f"9100{document_id}{idx}"),
            "vector": embedding,
            "payload": {
                "document_id": document_id,
                "document_name": document_name,
                "text": chunk,
                "source_type": source_type,
                "topic": topic or "general"
            }
        })

    # PUT request to upsert points in Qdrant
    url = f"{QDRANT_HOST}/collections/{COLLECTION_NAME}/points"
    upsert_payload = {
        "points": points
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(upsert_payload).encode("utf-8"),
        method="PUT",
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req, timeout=5) as res:
        if res.status == 200:
            return len(chunks)
    raise IOError("Failed to upsert points to Qdrant server.")

def search_rag_collection(
    query_text: str,
    limit: int = 5,
    document_id: Optional[int] = None
) -> List[dict]:
    """
    Generates search query embedding vector and queries Qdrant for Top K results.
    """
    collection_ready = setup_qdrant_rag_collection()
    if not collection_ready:
        raise ConnectionError("Qdrant database collection is offline.")

    query_vector = generate_rag_embedding(query_text)
    url = f"{QDRANT_HOST}/collections/{COLLECTION_NAME}/points/search"
    payload = {
        "vector": query_vector,
        "limit": limit,
        "with_payload": True
    }
    
    if document_id is not None:
        payload["filter"] = {
            "must": [
                {
                    "key": "document_id",
                    "match": {
                        "value": int(document_id)
                    }
                }
            ]
        }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req, timeout=5) as res:
        response_data = json.loads(res.read().decode())
        hits = response_data.get("result", [])
        
        # Check if running in fallback mode
        is_fallback = not os.environ.get("OPENAI_API_KEY") and not os.environ.get("GEMINI_API_KEY")
        
        results = []
        for hit in hits:
            payload_data = hit.get("payload", {})
            raw_score = hit.get("score", 0.0)
            
            # Boost raw scores in local fallback mode using a noise-gate threshold to filter random collisions
            if is_fallback:
                if raw_score < 0.03:
                    score = 0.0
                else:
                    score = min(1.0, raw_score * 5.5)
            else:
                score = raw_score
                
            results.append({
                "score": round(score, 3),
                "chunk_text": payload_data.get("text", "Empty chunk"),
                "document_name": payload_data.get("document_name", "Unknown"),
                "source_type": payload_data.get("source_type", "txt"),
                "topic": payload_data.get("topic", "general")
            })
        return results
