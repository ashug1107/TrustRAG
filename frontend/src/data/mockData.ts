import { DocumentItem, ChatMessage, HistoryItem, SourceCitation } from '../types';

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'Project_Proposal.docx',
    type: 'docx',
    size: 1153433,
    sizeFormatted: '1.1 MB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    uploadedTimeFormatted: 'Today',
    status: 'indexed',
    chunksCount: 156,
    processingProgress: 100,
    processingSteps: [
      { name: 'Uploaded', status: 'done' },
      { name: 'Text extracted', status: 'done' },
      { name: 'Chunks created', status: 'done' },
      { name: 'Indexed', status: 'done' },
    ],
  },
  {
    id: 'doc-2',
    name: 'Research_Paper.pdf',
    type: 'pdf',
    size: 2516582,
    sizeFormatted: '2.4 MB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    uploadedTimeFormatted: 'Today',
    status: 'indexed',
    chunksCount: 342,
    processingProgress: 100,
    processingSteps: [
      { name: 'Uploaded', status: 'done' },
      { name: 'Text extracted', status: 'done' },
      { name: 'Chunks created', status: 'done' },
      { name: 'Indexed', status: 'done' },
    ],
  },
  {
    id: 'doc-3',
    name: 'Notes.txt',
    type: 'txt',
    size: 46080,
    sizeFormatted: '45 KB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    uploadedTimeFormatted: 'Today',
    status: 'indexed',
    chunksCount: 24,
    processingProgress: 100,
    processingSteps: [
      { name: 'Uploaded', status: 'done' },
      { name: 'Text extracted', status: 'done' },
      { name: 'Chunks created', status: 'done' },
      { name: 'Indexed', status: 'done' },
    ],
  },
  {
    id: 'doc-4',
    name: 'Evaluation_Benchmark_Results.pdf',
    type: 'pdf',
    size: 3984588,
    sizeFormatted: '3.8 MB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    uploadedTimeFormatted: 'Yesterday',
    status: 'indexed',
    chunksCount: 512,
    processingProgress: 100,
    processingSteps: [
      { name: 'Uploaded', status: 'done' },
      { name: 'Text extracted', status: 'done' },
      { name: 'Chunks created', status: 'done' },
      { name: 'Indexed', status: 'done' },
    ],
  },
  {
    id: 'doc-5',
    name: 'Literature_Review_RAG.pdf',
    type: 'pdf',
    size: 1992294,
    sizeFormatted: '1.9 MB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    uploadedTimeFormatted: '2 days ago',
    status: 'indexed',
    chunksCount: 214,
    processingProgress: 100,
    processingSteps: [
      { name: 'Uploaded', status: 'done' },
      { name: 'Text extracted', status: 'done' },
      { name: 'Chunks created', status: 'done' },
      { name: 'Indexed', status: 'done' },
    ],
  },
];

export const INITIAL_CITATIONS: SourceCitation[] = [
  {
    id: 'cite-1',
    documentId: 'doc-1',
    documentName: 'Project_Proposal.docx',
    type: 'docx',
    page: 4,
    section: 'Project Objectives',
    relevanceScore: 0.94,
    extractedText:
      'The overarching goal of the KnowAI research initiative is to formulate, implement, and benchmark an AI-driven knowledge retrieval architecture capable of synthesizing factual responses from heterogeneous multi-format documents (PDF, DOCX, TXT) while systematically preventing hallucinations through verified source grounding and semantic confidence scoring.',
    highlightPhrase: 'building an AI-powered knowledge retrieval system that can retrieve relevant information from multiple documents and provide grounded responses with supporting evidence.',
  },
  {
    id: 'cite-2',
    documentId: 'doc-2',
    documentName: 'Research_Paper.pdf',
    type: 'pdf',
    page: 8,
    section: 'Objectives',
    relevanceScore: 0.88,
    extractedText:
      'In Section 3.2, we detail the primary objective: designing an end-to-end multi-modal query resolution pipeline supporting text and voice queries. The framework pairs dense semantic vector search with lexical BM25 sparse retrieval, producing verified citations and transparent trust metrics for academic verification and real-world deployment.',
    highlightPhrase: 'retrieve relevant information from multiple documents and provide grounded responses with supporting evidence',
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'What are the main objectives of the project?',
    timestamp: '11:42 AM',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content:
      'Based on the uploaded documents, the project focuses on building an AI-powered knowledge retrieval system that can retrieve relevant information from multiple documents and provide grounded responses with supporting evidence.\n\nKey identified objectives include:\n1. Multi-Format Knowledge Extraction: Ingesting and vectorizing unstructured documents across PDF, DOCX, and TXT files.\n2. Dual-Mode Query Ingestion: Enabling both typed textual queries and hands-free voice transcription.\n3. Grounded Retrieval: Eliminating hallucination through citation verification, attributing exact document pages and sections to answers.\n4. Trust & Confidence Quantification: Providing transparent confidence scores based on semantic agreement between the generated answer and retrieved source chunks.',
    timestamp: '11:42 AM',
    confidence: 82,
    sources: INITIAL_CITATIONS,
    retrievalDetails: {
      retrievedDocumentsCount: 4,
      retrievedChunksCount: 8,
      retrievalMethod: 'Hybrid Search',
      denseSearch: 'Sentence Embeddings',
      sparseSearch: 'BM25',
      rerankerScore: '0.92 (Cross-Encoder)',
      latencyMs: 342,
    },
  },
];

export const SUGGESTED_QUESTIONS = [
  'What are the main objectives of the project?',
  'Summarize the uploaded research papers.',
  'What methodology is used in these documents?',
  'Compare the approaches discussed in the documents.',
];

export const MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    question: 'What are the project objectives?',
    timestamp: '11:42 AM',
    relativeTime: '2 minutes ago',
    sourcesCount: 4,
    confidence: 82,
    documentScope: 'All Documents',
    answerSummary: 'Focuses on building an AI-powered knowledge retrieval system that can retrieve relevant information from multiple documents...',
  },
  {
    id: 'hist-2',
    question: 'Summarize the methodology.',
    timestamp: '11:29 AM',
    relativeTime: '15 minutes ago',
    sourcesCount: 3,
    confidence: 89,
    documentScope: 'Research_Paper.pdf',
    answerSummary: 'Methodology involves a 3-stage pipeline: document parsing into semantic chunks, dual dense-sparse vector indexing, and cross-encoder reranking...',
  },
  {
    id: 'hist-3',
    question: 'Compare the two research papers.',
    timestamp: '10:44 AM',
    relativeTime: '1 hour ago',
    sourcesCount: 5,
    confidence: 76,
    documentScope: '2 Documents',
    answerSummary: 'Paper 1 advocates dense vector retrieval with fine-tuned embeddings, whereas Paper 2 highlights the hybrid synergy of combining BM25 keyword matching with dense encoders...',
  },
  {
    id: 'hist-4',
    question: 'What chunking strategy provides optimal retrieval precision?',
    timestamp: 'Yesterday, 4:15 PM',
    relativeTime: 'Yesterday',
    sourcesCount: 3,
    confidence: 91,
    documentScope: 'All Documents',
    answerSummary: 'Fixed sliding-window chunking of 512 tokens with 64-token overlap demonstrated the best tradeoff between context retention and vector search latency...',
  },
  {
    id: 'hist-5',
    question: 'How is audio speech transcribed before semantic query execution?',
    timestamp: 'Yesterday, 2:30 PM',
    relativeTime: 'Yesterday',
    sourcesCount: 2,
    confidence: 85,
    documentScope: 'Notes.txt, Project_Proposal.docx',
    answerSummary: 'Speech audio is captured via client-side MediaRecorder, encoded to 16kHz audio blob, and processed by the transcription endpoint before passing into the retrieval engine...',
  },
];

export const MOCK_PREVIEW_TEXTS: Record<string, { title: string; page: number; section: string; fullContent: string; highlight: string }> = {
  'doc-1': {
    title: 'Project_Proposal.docx',
    page: 4,
    section: 'Project Objectives & Scope',
    highlight: 'building an AI-powered knowledge retrieval system that can retrieve relevant information from multiple documents and provide grounded responses with supporting evidence.',
    fullContent: `CHAPTER 3: ARCHITECTURAL SPECIFICATION AND OBJECTIVES

3.1 Executive Vision
In contemporary data-intensive research environments, practitioners grapple with fragmented documentation scattered across multi-page whitepapers, project charters, and research notes. The primary mission of KnowAI is building an AI-powered knowledge retrieval system that can retrieve relevant information from multiple documents and provide grounded responses with supporting evidence.

3.2 Detailed Functional Goals
1. Document Aggregation: Support non-destructive ingestion of PDF, Microsoft Word DOCX, and plain text UTF-8 corpora.
2. Real-time Hybrid Indexing: Chunking of arbitrary length text blocks into 512-token segments with overlap, creating both high-dimensional embeddings and inverted index tokens.
3. Natural Voice Interactivity: Offering users the convenience of hands-free vocal inquiries translated synchronously into semantic searches.
4. Hallucination Mitigation: Every claim produced in synthesis must point directly to document metadata including file name, page offset, and textual paragraph match.`,
  },
  'doc-2': {
    title: 'Research_Paper.pdf',
    page: 8,
    section: 'Section 4.1: Evaluation of Retrieval Precision',
    highlight: 'retrieve relevant information from multiple documents and provide grounded responses with supporting evidence',
    fullContent: `IEEE TRANSACTIONS ON COMPUTATIONAL KNOWLEDGE SYSTEMS, VOL. 14, NO. 3

4. SYSTEM METHODOLOGY AND EXPERIMENTAL OBJECTIVES

4.1 Evaluation of Grounded QA
Recent developments in Retrieval-Augmented Generation (RAG) indicate that standalone generative models suffer from significant hallucination rates when asked domain-specific queries. Our dual-channel architecture aims to retrieve relevant information from multiple documents and provide grounded responses with supporting evidence.

As documented in Table 4, combining BM25 keyword frequency with bi-encoder cosine similarity yields a Mean Reciprocal Rank (MRR@10) of 0.884, representing a 21.6% improvement over purely sparse algorithms. Furthermore, the confidence score correlates with factual alignment scores computed via Natural Language Inference (NLI) entailment metrics.`,
  },
  'doc-3': {
    title: 'Notes.txt',
    page: 1,
    section: 'System Architecture Notes',
    highlight: 'Speech audio is captured via client-side MediaRecorder',
    fullContent: `KNOWAI SYSTEM INTEGRATION NOTES - SPRINT 4
============================================
Frontend Stack:
- React + Tailwind CSS
- Lucide React iconography
- Modular service layers for easy FastAPI integration

Voice Module Architecture:
- Client uses MediaStream AudioContext / MediaRecorder API
- Audio chunks buffered and sent to /api/voice/transcribe
- Transcription response directly populates user query input

Backend Target (FastAPI):
- POST /api/documents/upload: multipart form-data
- POST /api/query: accepts question string, scope array, returns answer + citations + confidence
- GET /api/documents: lists registered files and index status`,
  },
};
