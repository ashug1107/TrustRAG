import numpy as np
import faiss
import ollama
from rank_bm25 import BM25Okapi

class PureOllamaRetriever:
    def __init__(self):
        self.corpus = []
        self.bm25 = None
        self.index = None
        self.embed_model = "nomic-embed-text"

    def get_embedding(self, text: str):
        """Fetches dense vector embeddings directly from local Ollama."""
        response = ollama.embed(model=self.embed_model, input=text)
        return response['embeddings'][0]

    def index_documents(self, documents: list):
        """Indexes text using Hybrid Retrieval (BM25 + Dense Vectors)[cite: 7]."""
        print("[System] Indexing documents via Ollama...")
        self.corpus = documents
        
        # Sparse Indexing (BM25)[cite: 7]
        tokenized_corpus = [doc['text'].lower().split() for doc in documents]
        self.bm25 = BM25Okapi(tokenized_corpus)

        # Dense Indexing (FAISS) via Ollama[cite: 7]
        embeddings = [self.get_embedding(doc['text']) for doc in documents]
        dim = len(embeddings[0])
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(np.array(embeddings, dtype=np.float32))
        print("[System] Indexing complete.")

    def retrieve(self, query: str, top_k: int = 2) -> list:
        print("[System] Executing hybrid retrieval...")
        
        # Sparse Search
        bm25_scores = self.bm25.get_scores(query.lower().split())
        sparse_ranking = np.argsort(bm25_scores)[::-1]

        # Dense Search
        q_emb = self.get_embedding(query)
        _, dense_ranking = self.index.search(np.array([q_emb], dtype=np.float32), top_k * 2)

        # Reciprocal Rank Fusion (RRF)
        k = 60
        rrf_scores = {}
        for rank, doc_id in enumerate(sparse_ranking[:top_k * 2]):
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)
        for rank, doc_id in enumerate(dense_ranking[0]):
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)

        sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        return [self.corpus[doc_id] for doc_id, _ in sorted_docs[:top_k]]

class LLMJudgeGuard:
    def compute_trust_score(self, answer: str, context_passage: str) -> float:
        """Uses LLM-as-a-Judge to evaluate factual entailment[cite: 8]."""
        print("[System] Running LLM-as-a-Judge verification...")
        claims = [s.strip() for s in answer.split('.') if len(s.strip()) > 10]
        if not claims:
            return 0.0

        entailment_count = 0
        for claim in claims:
            prompt = f"""You are a strict factual verification judge. 
            Context: {context_passage}
            Claim: {claim}
            Does the context explicitly support the claim? Answer ONLY with YES or NO."""
            
            response = ollama.chat(
                model="llama3.2:3b",
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.0, "num_ctx": 2048},
                keep_alive=0
            )
            if "YES" in response['message']['content'].strip().upper():
                entailment_count += 1

        return entailment_count / len(claims)

def main():
    # Mock Document Data[cite: 1, 4]
    documents = [
        {"text": "The alpha reactor safety protocol dictates a mandatory 45-minute cooling period.", "source": "alpha_manual.pdf", "page": 12},
        {"text": "Employees must wear radiation badges when entering Sector 7.", "source": "employee_handbook.pdf", "page": 5},
    ]

    retriever = PureOllamaRetriever()
    guard = LLMJudgeGuard()

    # Step 1: Indexing
    retriever.index_documents(documents)

    # Step 2: Retrieval
    query = "How long is the cooling period for the alpha reactor?"
    matched_chunks = retriever.retrieve(query)
    context_str = "\n".join([f"[{c['source']} | Page {c['page']}]: {c['text']}" for c in matched_chunks])

    # Step 3: Generation[cite: 7]
    print("[System] Generating answer...")
    prompt = f"Context:\n{context_str}\n\nQuestion: {query}\nAnswer strictly based on the context with citations:"
    res = ollama.chat(
        model="llama3.2:3b", 
        messages=[{"role": "user", "content": prompt}],
        options={"num_ctx": 2048},
        keep_alive=0
    )
    generated_answer = res['message']['content']

    # Step 4: Verification[cite: 1, 8]
    trust_score = guard.compute_trust_score(generated_answer, context_str)

    # Output Formatting
    print("\n" + "="*50)
    print("FINAL RESULT")
    print("="*50)
    if trust_score < 0.75:
        print(f"STATUS: Suppressed (Hallucination Guard Triggered)[cite: 8]")
        print(f"TRUST SCORE: {round(trust_score * 100, 2)}%")
        print("MESSAGE: Insufficient evidence to produce a verified answer[cite: 8].")
    else:
        print(f"STATUS: Verified")
        print(f"TRUST SCORE: {round(trust_score * 100, 2)}%[cite: 1, 8]")
        print(f"ANSWER:\n{generated_answer}")
        print("\nSOURCES:")
        for chunk in matched_chunks:
            print(f"- {chunk['source']} (Page {chunk['page']})[cite: 8]")

if __name__ == "__main__":
    main()