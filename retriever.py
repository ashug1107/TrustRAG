import numpy as np
import faiss
from ingestion import embed_model

def get_hybrid_candidates(
    query: str, faiss_index, bm25_index, chunks: list[str], metadata: list[dict], top_k: int = 4
) -> list[dict]:
    if not chunks:
        return []

    search_k = max(top_k * 3, 15)

    # 1. DENSE SEMANTIC RETRIEVAL (Embeddings)
    # Catches meaning and cross-lingual intent
    query_embedding = list(embed_model.embed([query]))[0]
    query_matrix = np.array([query_embedding], dtype="float32")
    faiss.normalize_L2(query_matrix)
    _, dense_indices = faiss_index.search(query_matrix, search_k)

    # 2. SPARSE LEXICAL RETRIEVAL (BM25)
    # Catches exact keyword matches, names, and numbers
    tokenized_query = [t for t in query.lower().split() if len(t) > 1]
    bm25_scores = bm25_index.get_scores(tokenized_query) if tokenized_query else np.zeros(len(chunks))
    sparse_indices = np.argsort(bm25_scores)[::-1][:search_k]

    # 3. HYBRID FUSION (Weighted Reciprocal Rank Fusion)
    k_penalty = 60
    hybrid_scores = {}
    
    # Weight BM25 slightly higher to enforce exact keyword matches
    for rank, idx in enumerate(sparse_indices):
        if bm25_scores[idx] > 0.0:  # Ignore zero-overlap noise
            hybrid_scores[idx] = hybrid_scores.get(idx, 0.0) + (1.5 / (k_penalty + rank + 1))
            
    # Add Dense Semantic matches
    for rank, idx in enumerate(dense_indices[0]):
        if idx != -1:
            hybrid_scores[idx] = hybrid_scores.get(idx, 0.0) + (1.0 / (k_penalty + rank + 1))

    # Sort by the combined Hybrid Score
    sorted_docs = sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)
    
    results = []
    for idx, score in sorted_docs[:top_k]:
        results.append({
            "text": chunks[idx],
            "meta": metadata[idx],
            "hybrid_score": score
        })
        
    return results