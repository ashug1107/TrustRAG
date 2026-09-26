import { ChatMessage, HistoryItem, SourceCitation } from '../types';
import { INITIAL_CHAT_MESSAGES, MOCK_HISTORY, INITIAL_CITATIONS } from '../data/mockData';
import { API_CONFIG, API_ENDPOINTS, simulateDelay } from './api';

let inMemoryChatHistory: ChatMessage[] = [...INITIAL_CHAT_MESSAGES];
let inMemoryHistoryItems: HistoryItem[] = [...MOCK_HISTORY];

/**
 * Send a user query to retrieve knowledge & generate grounded answer
 * 
 * Future API: POST /api/query
 * Payload: { question: string, document_scope?: string[] }
 * Returns: { answer: string, sources: SourceCitation[], confidence: number, retrieval_details: ... }
 */
export const askQuestion = async (
  question: string,
  documentScope: string[] = ['all'],
  isVoiceInput: boolean = false
): Promise<ChatMessage> => {
  if (!API_CONFIG.isMockMode) {
    const res = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.QUERY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        document_scope: documentScope,
        is_voice: isVoiceInput,
      }),
    });
    if (!res.ok) throw new Error('Query request failed');
    return res.json();
  }

  // Realistic retrieval + synthesis latency (800ms)
  await simulateDelay(900);

  const lowerQ = question.toLowerCase();
  let content = '';
  let sources: SourceCitation[] = [];
  let confidence = 82;
  let retrievedChunks = 8;
  let denseSearch = 'Sentence Embeddings';
  let sparseSearch = 'BM25';

  if (lowerQ.includes('objective') || lowerQ.includes('main goal')) {
    content =
      'Based on the uploaded documents, the project focuses on building an AI-powered knowledge retrieval system that can retrieve relevant information from multiple documents and provide grounded responses with supporting evidence.\n\nKey identified objectives include:\n1. Multi-Format Knowledge Extraction: Ingesting and vectorizing unstructured documents across PDF, DOCX, and TXT files.\n2. Dual-Mode Query Ingestion: Enabling both typed textual queries and hands-free voice transcription.\n3. Grounded Retrieval: Eliminating hallucination through citation verification, attributing exact document pages and sections to answers.\n4. Trust & Confidence Quantification: Providing transparent confidence scores based on semantic agreement between the generated answer and retrieved source chunks.';
    sources = INITIAL_CITATIONS;
    confidence = 82;
    retrievedChunks = 8;
  } else if (lowerQ.includes('method') || lowerQ.includes('how does')) {
    content =
      'According to the system architecture and research documentation, the methodology utilizes a 3-tier hybrid pipeline:\n\n1. Ingestion & Chunking: Ingested documents (PDF, DOCX, TXT) are normalized and broken into semantic chunks of 512 tokens with 64-token overlap.\n2. Dual-Path Retrieval: Queries are concurrently executed across dense bi-encoders (for semantic context) and BM25 sparse index (for exact lexical matching).\n3. Reciprocal Rank Fusion & Grounding: Chunks are merged, reranked with a cross-encoder model, and assigned confidence scores based on citation coverage.';
    sources = [
      {
        id: 'cite-m1',
        documentId: 'doc-2',
        documentName: 'Research_Paper.pdf',
        type: 'pdf',
        page: 6,
        section: 'Section 3: System Methodology',
        relevanceScore: 0.95,
        extractedText:
          'Our methodology combines dense bi-encoder sentence representations with an inverted index powered by BM25. This hybrid scheme bridges vocabulary mismatches while preserving domain-specific terminology.',
        highlightPhrase: 'combines dense bi-encoder sentence representations with an inverted index powered by BM25',
      },
      {
        id: 'cite-m2',
        documentId: 'doc-3',
        documentName: 'Notes.txt',
        type: 'txt',
        page: 1,
        section: 'Technical Notes',
        relevanceScore: 0.89,
        extractedText:
          'FastAPI endpoints receive the query payload, dispatch asynchronous tasks to the retrieval engine, and verify grounding before returning the final response to the React frontend.',
        highlightPhrase: 'verify grounding before returning the final response',
      },
    ];
    confidence = 89;
    retrievedChunks = 6;
  } else if (lowerQ.includes('summar') || lowerQ.includes('overview')) {
    content =
      'Here is an executive summary of the uploaded knowledge documents:\n\n• Project_Proposal.docx outlines the scope, deliverables, and technical criteria for developing a production-grade AI knowledge retrieval assistant with audio transcription.\n• Research_Paper.pdf details empirical experiments on hybrid dense-sparse indexing, demonstrating improved Mean Reciprocal Rank (MRR@10) and hallucination suppression.\n• Notes.txt and Evaluation_Benchmark_Results.pdf provide architectural integration guidelines and token latency benchmarks across varied document sizes.';
    sources = [
      {
        id: 'cite-s1',
        documentId: 'doc-1',
        documentName: 'Project_Proposal.docx',
        type: 'docx',
        page: 2,
        section: 'Executive Summary',
        relevanceScore: 0.91,
        extractedText:
          'This proposal delineates a next-generation retrieval architecture designed to make academic and enterprise knowledge repositories accessible through conversational inquiry and voice transcription.',
        highlightPhrase: 'make academic and enterprise knowledge repositories accessible through conversational inquiry',
      },
      {
        id: 'cite-s2',
        documentId: 'doc-4',
        documentName: 'Evaluation_Benchmark_Results.pdf',
        type: 'pdf',
        page: 3,
        section: 'Table 2: Corpus Breakdown',
        relevanceScore: 0.84,
        extractedText:
          'Across all benchmark datasets tested, the hybrid retrieval scheme achieved 94.2% precision on top-3 retrieved passages and reduced user search time by 68%.',
        highlightPhrase: 'hybrid retrieval scheme achieved 94.2% precision on top-3 retrieved passages',
      },
    ];
    confidence = 94;
    retrievedChunks = 12;
  } else if (lowerQ.includes('compare') || lowerQ.includes('difference')) {
    content =
      'Based on the comparative analysis across the literature and proposal documents:\n\n• Sparse vs Dense: The research paper demonstrates that sparse BM25 retrieval excels at exact keyword lookups (e.g., specific acronyms, identifiers), whereas dense embeddings excel at paraphrased thematic questions. Combining both yielded a 21.6% performance gain.\n• Grounded vs Generative QA: Pure generative models produced unsupported claims in 28% of complex queries, whereas KnowAI’s grounded citation engine suppressed speculative responses, raising verified answer confidence above 85%.';
    sources = [
      {
        id: 'cite-c1',
        documentId: 'doc-2',
        documentName: 'Research_Paper.pdf',
        type: 'pdf',
        page: 9,
        section: 'Comparative Discussion',
        relevanceScore: 0.87,
        extractedText:
          'Comparison between dense-only, sparse-only, and reciprocal hybrid fusion indicates consistent superiority of the hybrid formulation across precision, recall, and citation faithfulness.',
        highlightPhrase: 'consistent superiority of the hybrid formulation across precision, recall, and citation faithfulness',
      },
    ];
    confidence = 78;
    retrievedChunks = 7;
  } else {
    content = `Based on the uploaded documents in the knowledge base, the retrieved passages indicate relevant information regarding "${question}". The system performed hybrid retrieval across the indexed knowledge base and identified verified text segments that address this query with high contextual grounding.`;
    sources = INITIAL_CITATIONS;
    confidence = 80;
    retrievedChunks = 5;
  }

  const assistantMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    confidence,
    sources,
    retrievalDetails: {
      retrievedDocumentsCount: Math.min(sources.length + 1, 4),
      retrievedChunksCount: retrievedChunks,
      retrievalMethod: 'Hybrid Search',
      denseSearch,
      sparseSearch,
      rerankerScore: '0.91 (Cross-Encoder)',
      latencyMs: Math.floor(Math.random() * 80 + 280),
    },
    documentScope,
  };

  // Add to in-memory history
  const newHistoryItem: HistoryItem = {
    id: `hist-${Date.now()}`,
    question,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    relativeTime: 'Just now',
    sourcesCount: sources.length,
    confidence,
    documentScope: documentScope.includes('all') ? 'All Documents' : `${documentScope.length} Documents`,
    answerSummary: content.slice(0, 110) + '...',
  };

  inMemoryHistoryItems = [newHistoryItem, ...inMemoryHistoryItems];

  return assistantMessage;
};

/**
 * Fetch past query history
 * Future API: GET /api/history
 */
export const getChatHistory = async (): Promise<HistoryItem[]> => {
  if (!API_CONFIG.isMockMode) {
    const res = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.HISTORY}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  }

  await simulateDelay(200);
  return [...inMemoryHistoryItems];
};

/**
 * Clear history
 */
export const clearChatHistory = async (): Promise<void> => {
  await simulateDelay(150);
  inMemoryHistoryItems = [];
};
