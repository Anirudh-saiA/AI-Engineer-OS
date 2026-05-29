import os
import json
import urllib.request
import urllib.error
import logging
from typing import List

logger = logging.getLogger("uvicorn.error")

def generate_contextual_answer(query: str, retrieved_chunks: List[dict]) -> dict:
    """
    Formulates a prompt with retrieved context chunks, sends it to OpenAI or Gemini APIs,
    and returns a structured JSON answer containing contextual explanation, beginner-friendly details, and citations.
    """
    openai_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    # Format context blocks
    context_str = ""
    for idx, chunk in enumerate(retrieved_chunks):
        context_str += f"SOURCE DOCUMENT: {chunk['document_name']} (Type: {chunk['source_type']})\n"
        context_str += f"TEXT BLOCK:\n{chunk['chunk_text']}\n"
        context_str += "--------------------------------------------------\n"

    system_prompt = (
        "You are the AI-Engineer-OS Assistant. You are given a query and a set of retrieved document chunks as context.\n\n"
        "INSTRUCTIONS:\n"
        "1. Answer the user query using ONLY the provided document chunks as context. Do not make up facts or extrapolate.\n"
        "2. If the context does not contain enough information to answer the query, say: 'Based on the provided documents, I could not find enough relevant context to answer this query.'\n"
        "3. Keep the main answer professional, technical, and accurate.\n"
        "4. Provide a beginner-friendly, simplified explanation of the concept under 'beginner_explanation'.\n"
        "5. List your citations and references based strictly on the document names of the matching chunks under 'citations'.\n\n"
        "RESPONSE FORMAT (You MUST return a JSON object with this exact schema, do not include any other markdown formatting):\n"
        "{\n"
        "  \"answer\": \"Your detailed contextual answer...\",\n"
        "  \"beginner_explanation\": \"A beginner-friendly, simple explanation...\",\n"
        "  \"citations\": [\"document_name_1.txt\", \"document_name_2.pdf\"]\n"
        "}"
    )

    user_content = f"USER QUERY: {query}\n\nRETIEVED CONTEXT:\n{context_str}"

    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": "gpt-4o-mini",
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                "temperature": 0.2
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as res:
                data = json.loads(res.read().decode())
                response_text = data["choices"][0]["message"]["content"]
                return json.loads(response_text)
        except Exception as e:
            logger.error(f"OpenAI answer generation failed: {e}")
            pass

    if gemini_key:
        try:
            # We call Gemini Flash model for fast structured JSON responses
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            
            payload = {
                "contents": [{
                    "parts": [{"text": f"{system_prompt}\n\n{user_content}"}]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                method="POST",
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as res:
                data = json.loads(res.read().decode())
                response_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(response_text)
        except Exception as e:
            logger.error(f"Gemini answer generation failed: {e}")
            pass

    # High fidelity offline local simulation fallback if no API keys are configured
    logger.info("RAG Generation API keys are offline. Running local high-fidelity answer simulator.")
    
    citations = list(set(chunk["document_name"] for chunk in retrieved_chunks))
    
    # Generate simple answer based on matching chunks
    if retrieved_chunks:
        best_chunk = retrieved_chunks[0]["chunk_text"]
        short_snippet = best_chunk[:180] + "..." if len(best_chunk) > 180 else best_chunk
        answer = (
            f"[OFFLINE RAG FALLBACK]: Based on the retrieved context from {citations[0]}, "
            f"we scanned the matching paragraphs and found the following details: '{short_snippet}' "
            f"Please set your OPENAI_API_KEY or GEMINI_API_KEY environment variables to unlock real-time generative responses."
        )
        beginner_explanation = (
            f"This is a local fallback explanation. The retrieved document is '{citations[0]}' "
            f"which discusses terms like {retrieved_chunks[0].get('topic', 'general')}."
        )
    else:
        answer = "Based on the provided documents, I could not find enough relevant context to answer this query."
        beginner_explanation = "We couldn't find any documents in our vector store, so we can't explain this concept right now!"

    return {
        "answer": answer,
        "beginner_explanation": beginner_explanation,
        "citations": citations
    }
