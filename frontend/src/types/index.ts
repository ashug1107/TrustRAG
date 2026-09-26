export type DocumentType = 'pdf' | 'docx' | 'txt';

export type NavigationPage = 'dashboard' | 'documents' | 'ask' | 'history' | 'settings';

export type DocumentStatus = 'ready' | 'processing' | 'indexed' | 'error';

export interface ProcessingStep {
  name: string;
  status: 'done' | 'active' | 'pending' | 'error';
}

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  sizeFormatted: string;
  uploadedAt: string;
  uploadedTimeFormatted: string;
  status: DocumentStatus;
  chunksCount: number;
  processingProgress: number; // 0 - 100
  processingSteps?: ProcessingStep[];
  error?: string;
}

export interface QueuedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  sizeFormatted: string;
  type: DocumentType;
  status: 'ready' | 'uploading' | 'processing' | 'indexed' | 'error';
  progress: number;
  steps: {
    name: string;
    completed: boolean;
  }[];
  error?: string;
}

export interface SourceCitation {
  id: string;
  documentId: string;
  documentName: string;
  type: DocumentType;
  page?: number;
  section: string;
  relevanceScore: number; // e.g. 0.94
  extractedText: string;
  highlightPhrase?: string;
}

export interface RetrievalDetailsInfo {
  retrievedDocumentsCount: number;
  retrievedChunksCount: number;
  retrievalMethod: string;
  denseSearch: string;
  sparseSearch: string;
  rerankerScore?: string;
  latencyMs?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceCitation[];
  confidence?: number; // 0 - 100
  retrievalDetails?: RetrievalDetailsInfo;
  documentScope?: string[];
  isVoiceInput?: boolean;
}

export interface HistoryItem {
  id: string;
  question: string;
  timestamp: string;
  relativeTime: string;
  sourcesCount: number;
  confidence: number;
  documentScope: string;
  answerSummary: string;
}

export type LanguageType = 'English' | 'Hindi' | 'Marathi';

export interface User {
  username: string;
  name: string;
  role: string;
  email?: string;
  avatar?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: LanguageType;
  voiceInputEnabled: boolean;
  defaultKnowledgeBase: 'all' | 'selected';
  retrievalMode: 'hybrid' | 'dense_only' | 'sparse_only';
  backendApiUrl: string;
  enableMockFallback: boolean;
}

