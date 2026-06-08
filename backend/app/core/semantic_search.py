"""
AI-Engineer-OS Semantic Search Engine
======================================
Dual-mode semantic search over the Error Knowledge Base.

Mode 1 (with OPENAI_API_KEY): OpenAI text-embedding-3-small → cosine similarity
Mode 2 (fallback):            TF-IDF vectorization → cosine similarity

Both modes produce ranked results with similarity scores.
"""

import os
import re
import math
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field

from app.core.knowledge_base import ALL_KB_ENTRIES, KnowledgeEntry


@dataclass
class SearchResult:
    """Single semantic search result."""
    error_name: str
    error_category: str
    similarity: float  # 0.0 – 1.0
    root_cause: str
    beginner_explanation: str
    fix_recommendations: List[str]
    entry: Dict[str, Any] = field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════════
# TF-IDF FALLBACK (no external API required)
# ═══════════════════════════════════════════════════════════════════

class _TfIdfIndex:
    """Lightweight in-memory TF-IDF vector store."""

    def __init__(self):
        self.documents: List[str] = []
        self.entries: List[KnowledgeEntry] = []
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.tfidf_matrix: List[Dict[int, float]] = []
        self._ready = False

    # ── tokeniser ────────────────────────────────────────────────
    @staticmethod
    def _tokenize(text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        tokens = text.split()
        # Simple stop-word removal
        stops = {"the", "a", "an", "is", "are", "was", "were", "to", "of",
                 "in", "for", "on", "and", "or", "it", "this", "that", "with"}
        return [t for t in tokens if t not in stops and len(t) > 1]

    # ── build index ──────────────────────────────────────────────
    def build(self, entries: List[KnowledgeEntry]):
        self.entries = entries
        self.documents = []

        for entry in entries:
            doc = " ".join([
                entry.get("error_name", ""),
                entry.get("error_category", ""),
                entry.get("root_cause", ""),
                entry.get("beginner_explanation", ""),
                entry.get("advanced_explanation", ""),
                " ".join(entry.get("fix_recommendations", [])),
                " ".join(entry.get("prevention_strategies", [])),
                " ".join(entry.get("related_errors", [])),
                " ".join(entry.get("frameworks", [])),
            ])
            self.documents.append(doc)

        # Build vocabulary
        all_tokens_sets = [set(self._tokenize(d)) for d in self.documents]
        vocab_set: set = set()
        for ts in all_tokens_sets:
            vocab_set |= ts
        self.vocab = {t: i for i, t in enumerate(sorted(vocab_set))}

        # IDF = log(N / df)  where df = number of docs containing the term
        n = len(self.documents)
        df: Dict[str, int] = {}
        for ts in all_tokens_sets:
            for t in ts:
                df[t] = df.get(t, 0) + 1
        self.idf = {t: math.log((n + 1) / (df.get(t, 0) + 1)) + 1.0 for t in self.vocab}

        # TF-IDF sparse vectors
        self.tfidf_matrix = []
        for doc in self.documents:
            tokens = self._tokenize(doc)
            tf: Dict[str, int] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            total = len(tokens) or 1
            vec: Dict[int, float] = {}
            for t, count in tf.items():
                if t in self.vocab:
                    vec[self.vocab[t]] = (count / total) * self.idf.get(t, 1.0)
            self.tfidf_matrix.append(vec)

        self._ready = True

    # ── query ────────────────────────────────────────────────────
    def query(self, text: str, top_k: int = 5) -> List[Tuple[int, float]]:
        """Returns list of (index, similarity) sorted by descending similarity."""
        if not self._ready:
            return []

        tokens = self._tokenize(text)
        tf: Dict[str, int] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        total = len(tokens) or 1

        query_vec: Dict[int, float] = {}
        for t, count in tf.items():
            if t in self.vocab:
                query_vec[self.vocab[t]] = (count / total) * self.idf.get(t, 1.0)

        if not query_vec:
            return []

        results: List[Tuple[int, float]] = []
        for idx, doc_vec in enumerate(self.tfidf_matrix):
            sim = self._sparse_cosine(query_vec, doc_vec)
            results.append((idx, sim))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    @staticmethod
    def _sparse_cosine(a: Dict[int, float], b: Dict[int, float]) -> float:
        keys = set(a.keys()) & set(b.keys())
        if not keys:
            return 0.0
        dot = sum(a[k] * b[k] for k in keys)
        mag_a = math.sqrt(sum(v * v for v in a.values()))
        mag_b = math.sqrt(sum(v * v for v in b.values()))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)


# ═══════════════════════════════════════════════════════════════════
# OPENAI EMBEDDING MODE
# ═══════════════════════════════════════════════════════════════════

class _EmbeddingIndex:
    """In-memory vector store backed by OpenAI embeddings."""

    def __init__(self):
        self.entries: List[KnowledgeEntry] = []
        self.embeddings: List[List[float]] = []
        self._ready = False

    def build(self, entries: List[KnowledgeEntry]):
        self.entries = entries
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            return

        texts = []
        for entry in entries:
            text = " ".join([
                entry.get("error_name", ""),
                entry.get("error_category", ""),
                entry.get("root_cause", ""),
                entry.get("beginner_explanation", ""),
                " ".join(entry.get("fix_recommendations", [])),
                " ".join(entry.get("related_errors", [])),
            ])
            texts.append(text[:8000])  # trim to API limits

        # Batch embed via OpenAI
        try:
            self.embeddings = self._batch_embed(texts, api_key)
            if len(self.embeddings) == len(entries):
                self._ready = True
                print(f"[SemanticSearch] OpenAI embeddings index built: {len(self.embeddings)} entries")
        except Exception as e:
            print(f"[SemanticSearch] OpenAI embedding build failed: {e}")

    def query(self, text: str, top_k: int = 5) -> List[Tuple[int, float]]:
        if not self._ready:
            return []

        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            return []

        try:
            query_emb = self._embed_single(text, api_key)
        except Exception:
            return []

        results: List[Tuple[int, float]] = []
        for idx, doc_emb in enumerate(self.embeddings):
            sim = self._cosine(query_emb, doc_emb)
            results.append((idx, sim))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    @staticmethod
    def _embed_single(text: str, api_key: str) -> List[float]:
        url = "https://api.openai.com/v1/embeddings"
        payload = {"model": "text-embedding-3-small", "input": text[:8000]}
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data["data"][0]["embedding"]

    @staticmethod
    def _batch_embed(texts: List[str], api_key: str) -> List[List[float]]:
        all_embeddings: List[List[float]] = []
        batch_size = 20
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            url = "https://api.openai.com/v1/embeddings"
            payload = {"model": "text-embedding-3-small", "input": batch}
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
                batch_embs = sorted(data["data"], key=lambda x: x["index"])
                all_embeddings.extend([item["embedding"] for item in batch_embs])
        return all_embeddings

    @staticmethod
    def _cosine(a: List[float], b: List[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x * x for x in a))
        mag_b = math.sqrt(sum(x * x for x in b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)


# ═══════════════════════════════════════════════════════════════════
# PUBLIC INTERFACE (singleton)
# ═══════════════════════════════════════════════════════════════════

_tfidf_index = _TfIdfIndex()
_embedding_index = _EmbeddingIndex()
_initialized = False


def initialize_search_index():
    """Pre-computes search indexes on startup.  Safe to call multiple times."""
    global _initialized
    if _initialized:
        return

    # Always build TF-IDF (zero-cost fallback)
    _tfidf_index.build(ALL_KB_ENTRIES)
    print(f"[SemanticSearch] TF-IDF index built: {len(ALL_KB_ENTRIES)} entries")

    # Attempt OpenAI embeddings (optional upgrade)
    if os.environ.get("OPENAI_API_KEY"):
        try:
            _embedding_index.build(ALL_KB_ENTRIES)
        except Exception as e:
            print(f"[SemanticSearch] OpenAI embeddings unavailable, using TF-IDF: {e}")

    _initialized = True


def semantic_search(query: str, top_k: int = 5) -> List[SearchResult]:
    """
    Returns top-k knowledge base entries ranked by semantic similarity.
    Uses OpenAI embeddings if available, otherwise TF-IDF.
    """
    if not _initialized:
        initialize_search_index()

    # Prefer OpenAI embeddings when available
    if _embedding_index._ready:
        raw_results = _embedding_index.query(query, top_k)
        source_entries = _embedding_index.entries
    else:
        raw_results = _tfidf_index.query(query, top_k)
        source_entries = _tfidf_index.entries

    results: List[SearchResult] = []
    for idx, similarity in raw_results:
        if similarity < 0.05:  # skip near-zero matches
            continue
        entry = source_entries[idx]
        results.append(SearchResult(
            error_name=entry["error_name"],
            error_category=entry["error_category"],
            similarity=round(similarity, 4),
            root_cause=entry["root_cause"],
            beginner_explanation=entry["beginner_explanation"],
            fix_recommendations=entry["fix_recommendations"],
            entry=entry,
        ))

    return results


def get_search_mode() -> str:
    """Returns which search backend is active."""
    if _embedding_index._ready:
        return "openai_embeddings"
    if _tfidf_index._ready:
        return "tfidf_fallback"
    return "not_initialized"
