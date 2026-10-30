import re
import json
import hashlib
import concurrent.futures
from typing import List, Dict, Any, Tuple
from collections import defaultdict

import torch
import numpy as np
import requests
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer

# System infrastructure imports
from vector_store import vector_db
from config import OLLAMA_HOST, LLM_MODEL_NAME

# Global initialization for sentence similarity embedder
_similarity_embedder = SentenceTransformer("all-MiniLM-L6-v2")


# =========================================================
# SECTION 1: CITATION TRACKER & CONTEXT DEDUPLICATION
# =========================================================

class CitationTracker:
    """Tracks and formats metadata for every chunk to ensure document traceability."""
    
    @staticmethod
    def create_citation_label(metadata: Dict[str, Any]) -> str:
        """Generates a human-readable citation label."""
        source = metadata.get("source", "Unknown_Doc")
        page = metadata.get("page", "N/A")
        para = metadata.get("paragraph", metadata.get("chunk_id", "N/A"))
        return f"[Source: {source} | Page: {page} | Para: {para}]"

    @classmethod
    def attach_citations_to_context(cls, chunks: List[Dict[str, Any]]) -> str:
        """Formats unique chunks into a single string with clear citation headers for LLM prompting."""
        formatted_blocks = []
        for idx, chunk in enumerate(chunks, start=1):
            label = cls.create_citation_label(chunk["metadata"])
            block = f"--- Context Chunk {idx} {label} ---\n{chunk['text']}"
            formatted_blocks.append(block)
            
        return "\n\n".join(formatted_blocks)


class ContextDeduplicator:
    """Filters out exact and semantically redundant chunks fetched from retrieval runs."""

    @staticmethod
    def _compute_text_hash(text: str) -> str:
        """Computes MD5 hash of normalized text for exact matching."""
        normalized_text = " ".join(text.lower().split())
        return hashlib.md5(normalized_text.encode("utf-8")).hexdigest()

    @classmethod
    def remove_exact_duplicates(cls, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Removes identical text chunks across parallel retrieval runs."""
        seen_hashes = set()
        unique_chunks = []
        for chunk in chunks:
            text_hash = cls._compute_text_hash(chunk["text"])
            if text_hash not in seen_hashes:
                seen_hashes.add(text_hash)
                unique_chunks.append(chunk)
                
        return unique_chunks

    @classmethod
    def remove_semantic_duplicates(
        cls, chunks: List[Dict[str, Any]], similarity_threshold: float = 0.88
    ) -> List[Dict[str, Any]]:
        """Removes near-duplicate chunks using cosine similarity thresholding."""
        if not chunks:
            return []
            
        texts = [c["text"] for c in chunks]
        embeddings = _similarity_embedder.encode(texts, normalize_embeddings=True)
        filtered_chunks = []
        kept_embeddings = []

        for chunk, emb in zip(chunks, embeddings):
            is_duplicate = False
            for kept_emb in kept_embeddings:
                similarity = float(np.dot(emb, kept_emb))
                if similarity >= similarity_threshold:
                    is_duplicate = True
                    break
            if not is_duplicate:
                filtered_chunks.append(chunk)
                kept_embeddings.append(emb)

        return filtered_chunks


# =========================================================
# SECTION 2: PARALLEL RETRIEVAL & RRF ENGINE
# =========================================================

def generate_sub_queries(original_query: str, num_queries: int = 3) -> List[str]:
    """Uses the local LLM to break down a complex user query into targeted parallel queries."""
    prompt = f"""
    You are an AI assistant helping with document retrieval.
    Decompose the following user question into {num_queries} different, 
    specific search queries to retrieve relevant chunks across multiple documents.
    Provide ONLY the queries, one per line, without numbering.

    USER QUESTION: {original_query}
    """
    
    payload = {
        "model": LLM_MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload)
        lines = response.json().get("response", "").strip().split("\n")
        queries = [line.strip() for line in lines if line.strip()]
        
        if original_query not in queries:
            queries.append(original_query)
            
        return queries[:num_queries]
    except Exception:
        return [original_query]


def reciprocal_rank_fusion(results_per_query: List[Dict[str, Any]], k: int = 60) -> List[Dict[str, Any]]:
    """Combines ranked lists from parallel retrieval runs using RRF scoring."""
    rrf_scores = defaultdict(float)
    chunk_map = {}

    for query_result in results_per_query:
        docs = query_result.get("documents", [])
        metadatas = query_result.get("metadatas", [])
        for rank, (doc_text, meta) in enumerate(zip(docs, metadatas), start=1):
            chunk_key = f"{meta.get('source', '')}_chunk_{meta.get('chunk_id', rank)}"
            rrf_scores[chunk_key] += 1.0 / (k + rank)
            
            if chunk_key not in chunk_map:
                chunk_map[chunk_key] = {
                    "text": doc_text,
                    "metadata": meta
                }

    sorted_keys = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
    return [chunk_map[key] for key in sorted_keys]


def retrieve_parallel_context(original_query: str, top_k_per_query: int = 3) -> Dict[str, Any]:
    """Runs parallel search, RRF rank fusion, and exact/semantic deduplication."""
    sub_queries = generate_sub_queries(original_query, num_queries=3)
    retrieved_results = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(sub_queries)) as executor:
        future_to_query = {
            executor.submit(vector_db.search_similar, query, top_k_per_query): query 
            for query in sub_queries
        }
        
        for future in concurrent.futures.as_completed(future_to_query):
            try:
                retrieved_results.append(future.result())
            except Exception as e:
                print(f"Retrieval failed for thread: {e}")

    rrf_ranked_chunks = reciprocal_rank_fusion(retrieved_results)
    exact_deduped_chunks = ContextDeduplicator.remove_exact_duplicates(rrf_ranked_chunks)
    final_unique_chunks = ContextDeduplicator.remove_semantic_duplicates(
        exact_deduped_chunks, similarity_threshold=0.88
    )

    formatted_context_str = CitationTracker.attach_citations_to_context(final_unique_chunks)
    
    citations_metadata = [
        {
            "citation_label": CitationTracker.create_citation_label(c["metadata"]),
            "source": c["metadata"].get("source", "Unknown"),
            "page": c["metadata"].get("page", "N/A"),
            "paragraph": c["metadata"].get("paragraph", c["metadata"].get("chunk_id", "N/A")),
            "snippet": c["text"][:120] + "..."
        }
        for c in final_unique_chunks
    ]

    return {
        "generated_sub_queries": sub_queries,
        "fused_chunks": final_unique_chunks,
        "formatted_context_str": formatted_context_str,
        "citations_metadata": citations_metadata
    }


# =========================================================
# SECTION 3: MULTI-HOP SEARCH ENGINE
# =========================================================

def decide_next_hop_query(
    original_query: str, 
    current_hop: int, 
    max_hops: int, 
    accumulated_context: str
) -> Dict[str, Any]:
    """Uses local LLM controller to determine if more search iterations ('hops') are needed."""
    prompt = f"""
    You are an iterative search controller.
    
    ORIGINAL QUESTION: {original_query}
    CURRENT HOP: {current_hop} of {max_hops}
    
    CONTEXT RETRIEVED SO FAR:
    {accumulated_context if accumulated_context else "None"}
    
    Task:
    1. Determine if the CONTEXT RETRIEVED SO FAR is sufficient to fully answer the ORIGINAL QUESTION.
    2. If sufficient, set "is_complete" to true and "next_sub_query" to "".
    3. If insufficient, set "is_complete" to false and generate the single best follow-up query in "next_sub_query" to fetch missing facts.

    Respond ONLY in valid raw JSON with this format:
    {{
        "is_complete": true/false,
        "next_sub_query": "search query string here"
    }}
    """
    
    payload = {
        "model": LLM_MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }

    try:
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload)
        res_json = json.loads(response.json().get("response", "{}"))
        return res_json
    except Exception:
        return {"is_complete": True, "next_sub_query": ""}


def execute_multihop_retrieval(
    original_query: str, 
    max_hops: int = 3, 
    top_k_per_hop: int = 3
) -> Dict[str, Any]:
    """Executes multi-step iterative retrieval loops and aggregates cross-document context."""
    all_retrieved_chunks: List[Dict[str, Any]] = []
    hop_history: List[Dict[str, Any]] = []
    
    current_sub_query = original_query

    for hop in range(1, max_hops + 1):
        current_context_str = CitationTracker.attach_citations_to_context(
            ContextDeduplicator.remove_exact_duplicates(all_retrieved_chunks)
        )

        hop_decision = decide_next_hop_query(
            original_query=original_query,
            current_hop=hop,
            max_hops=max_hops,
            accumulated_context=current_context_str
        )

        if hop_decision.get("is_complete", False) and hop > 1:
            break

        if hop_decision.get("next_sub_query"):
            current_sub_query = hop_decision["next_sub_query"]

        hop_search_results = vector_db.search_similar(current_sub_query, top_k=top_k_per_hop)
        
        docs = hop_search_results.get("documents", [])
        metadatas = hop_search_results.get("metadatas", [])

        hop_chunks = []
        for doc_text, meta in zip(docs, metadatas):
            chunk_obj = {
                "text": doc_text,
                "metadata": meta,
                "retrieved_in_hop": hop
            }
            hop_chunks.append(chunk_obj)
            all_retrieved_chunks.append(chunk_obj)

        hop_history.append({
            "hop": hop,
            "query_used": current_sub_query,
            "chunks_found": len(hop_chunks)
        })

    step1_dedup = ContextDeduplicator.remove_exact_duplicates(all_retrieved_chunks)
    final_aggregated_chunks = ContextDeduplicator.remove_semantic_duplicates(
        step1_dedup, similarity_threshold=0.88
    )

    aggregated_context_str = CitationTracker.attach_citations_to_context(final_aggregated_chunks)

    citations_metadata = [
        {
            "citation_label": CitationTracker.create_citation_label(c["metadata"]),
            "source": c["metadata"].get("source", "Unknown"),
            "page": c["metadata"].get("page", "N/A"),
            "paragraph": c["metadata"].get("paragraph", c["metadata"].get("chunk_id", "N/A")),
            "hop_retrieved": c.get("retrieved_in_hop")
        }
        for c in final_aggregated_chunks
    ]

    return {
        "original_query": original_query,
        "total_hops_executed": len(hop_history),
        "hop_history": hop_history,
        "aggregated_chunks": final_aggregated_chunks,
        "formatted_context_str": aggregated_context_str,
        "citations_metadata": citations_metadata
    }


# =========================================================
# SECTION 4: LLM GENERATION WITH STRICT GROUNDING
# =========================================================

SYSTEM_CITATION_PROMPT = """
You are a strict, factual Question-Answering system. Your primary role is to answer questions using ONLY the provided document context.

CRITICAL INSTRUCTIONS:
1. STRICT GROUNDING: Rely ONLY on facts explicitly mentioned in the CONTEXT below. Do NOT use outside knowledge, infer unstated assumptions, or extrapolate.
2. GRANULAR CITATION TAGGING: Every single factual claim or statement you write MUST be followed immediately by its corresponding source citation tag in brackets, exactly as formatted in the context headers (e.g., [Source: report.pdf | Page: 3 | Para: 1]).
3. INSUFFICIENT EVIDENCE RULE: If the provided context does NOT contain enough factual evidence to fully answer the user's question, respond strictly with: "I cannot answer this based on the provided documents."
4. NO FABRICATION: Do not invent page numbers, document names, or facts under any circumstances.
"""

def generate_rag_response(
    query: str, 
    formatted_context_str: str, 
    temperature: float = 0.0
) -> str:
    """Generates a grounded LLM answer containing inline citation tags."""
    user_prompt = f"""
CONTEXT DOCUMENTS:
{formatted_context_str}

USER QUESTION:
{query}

ANSWER (with strict inline citations):
"""
    payload = {
        "model": LLM_MODEL_NAME,
        "system": SYSTEM_CITATION_PROMPT,
        "prompt": user_prompt,
        "stream": False,
        "options": {
            "temperature": temperature
        }
    }

    try:
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()
        return result.get("response", "").strip()
    except requests.exceptions.RequestException as e:
        print(f"Error communicating with local LLM engine: {e}")
        return "An error occurred while communicating with the local generation service."


# =========================================================
# SECTION 5: TRUST VERIFICATION (DeBERTa Cross-Encoder)
# =========================================================

class NLIVerifier:
    """Evaluates claim entailment between context and response using DeBERTa Cross-Encoder NLI."""

    def __init__(self, model_name: str = "cross-encoder/nli-deberta-v3-small"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name).to(self.device)
        self.model.eval()
        self.label_mapping = {0: "contradiction", 1: "entailment", 2: "neutral"}

    @staticmethod
    def _split_into_sentences(text: str) -> List[str]:
        cleaned_text = re.sub(r'\[Source:.*?\]', '', text)
        sentences = re.split(r'(?<=[.!?]) +', cleaned_text)
        return [s.strip() for s in sentences if len(s.strip()) > 5]

    def verify_sentence_pair(self, premise: str, hypothesis: str) -> Dict[str, float]:
        inputs = self.tokenizer(
            premise, 
            hypothesis, 
            truncation=True, 
            max_length=512, 
            return_tensors="pt"
        ).to(self.device)

        with torch.no_grad():
            logits = self.model(**inputs).logits
            probabilities = torch.softmax(logits, dim=-1).squeeze(0).tolist()

        return {
            "contradiction": probabilities[0],
            "entailment": probabilities[1],
            "neutral": probabilities[2]
        }

    def compute_trust_score(
        self, 
        retrieved_context: str, 
        generated_answer: str
    ) -> Tuple[float, List[Dict[str, Any]]]:
        sentences = self._split_into_sentences(generated_answer)
        if not sentences:
            return 0.0, []

        sentence_evaluations = []
        total_entailment_score = 0.0

        for sentence in sentences:
            probs = self.verify_sentence_pair(premise=retrieved_context, hypothesis=sentence)
            entailment_prob = probs["entailment"]
            total_entailment_score += entailment_prob

            sentence_evaluations.append({
                "sentence": sentence,
                "entailment_score": round(entailment_prob * 100, 2),
                "contradiction_score": round(probs["contradiction"] * 100, 2),
                "neutral_score": round(probs["neutral"] * 100, 2)
            })

        trust_score_pct = round((total_entailment_score / len(sentences)) * 100, 2)
        return trust_score_pct, sentence_evaluations


nli_checker = NLIVerifier()


def apply_hallucination_guard(
    generated_answer: str, 
    retrieved_context: str, 
    trust_threshold: float = 75.0
) -> Dict[str, Any]:
    """Calculates Trust Score and suppresses answers below threshold."""
    trust_score, breakdowns = nli_checker.compute_trust_score(
        retrieved_context=retrieved_context, 
        generated_answer=generated_answer
    )

    is_trusted = trust_score >= trust_threshold

    if not is_trusted:
        final_response = "Insufficient evidence in documents."
    else:
        final_response = generated_answer

    return {
        "verified_answer": final_response,
        "trust_score": f"{trust_score}%",
        "is_trusted": is_trusted,
        "threshold_used": f"{trust_threshold}%",
        "sentence_breakdown": breakdowns
    }