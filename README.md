# Trust Aware Multi-Document Multi-Lingual Question Answering.

TrustRAG is a 100% local, hallucination-resistant knowledge retrieval system built specifically for financial institutions. It processes proprietary compliance policies, risk models, and audit trails entirely on local hardware, neutralizing the privacy risks associated with public cloud LLM APIs.

Built for the Razorpay AI Buildathon (AI Risk Manager Track), TrustRAG democratizes AI infrastructure by executing advanced multi-modal AI orchestration on standard 8GB RAM workstations using heavily optimized sequential model loading.

# 🚀 Key Innovations & Differentiators
NLI (Natural Language Inference) Trust Verification: Discards unverified LLM hallucinations by mathematically scoring the drafted answer against retrieved local context before presenting it to the user.

Sequential VRAM Eviction: Specifically engineered to bypass 8GB RAM limitations. The system dynamically loads and unloads the Moondream vision model and Llama 3.2 1B logic model at exact execution moments (keep_alive: 0), preventing Out-of-Memory (OOM) crashes.

Multi-Hop Evidence Fusion: Breaks down complex financial queries into sub-queries, executes concurrent dense (FAISS) and sparse (BM25) searches, and deduplicates evidence to build highly accurate context windows.

Multi-Modal Native: Seamlessly unifies text-based manuals (PDF/DOCX) and visual financial data (charts, identity scans, flow diagrams) into a single semantic database.

# 🛠️ Technology Stack
Backend Framework: FastAPI, Uvicorn, Python

Frontend Framework: React, Vite, TypeScript

Local AI Engine: Ollama

LLMs: Llama 3.2 1B (Logic/Text), Moondream (Vision)

Hybrid Retrieval: FAISS (Dense Conceptual Vector Search) + BM25 (Sparse Exact Keyword Search)

Document Parsing: PyMuPDF (Text), Deep-Translator, SpeechRecognition

# ⚠️ System Limitations (8GB RAM Constraints)
Processing Speed: Executing vision and text models sequentially prevents crashes but results in slower inference times compared to cloud-hosted GPU clusters.

Model Size: Utilizes heavily quantized 1-billion parameter edge models; reasoning capabilities are optimized for extraction rather than broad creative generation.

Volatile Storage: Currently utilizes in-memory storage for the FAISS database and session states; index data resets upon server restart.

Single-User Architecture: Designed as a localized desktop tool without concurrent request handling or multi-tenant data separation.

# ⚙️ Installation & Setup
1. Prerequisites
Install Python 3.10+

Install Node.js 18+

Install Ollama

Download the required AI Models via Ollama terminal:

Bash
ollama pull llama3.2:1b
ollama pull moondream
2. Backend Setup
Open a terminal in the root directory:

Bash
# Install required Python dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
uvicorn main:app --reload
3. Frontend Setup
Open a second terminal window and navigate to the frontend folder:

Bash
cd frontend

# Install UI dependencies
npm install

# Start the Vite development server
npm run dev
Navigate to http://localhost:3000 in your web browser to launch the TrustRAG interface.
