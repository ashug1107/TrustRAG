import { DocumentItem, DocumentType } from '../types';
import { INITIAL_DOCUMENTS, MOCK_PREVIEW_TEXTS } from '../data/mockData';
import { API_CONFIG, API_ENDPOINTS, simulateDelay } from './api';

// In-memory frontend store for documents during current session
let inMemoryDocuments: DocumentItem[] = [...INITIAL_DOCUMENTS];

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getDocumentType = (fileName: string): DocumentType => {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx' || ext === '.doc') return 'docx';
  return 'txt';
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `Unsupported file type "${ext}". Only PDF, DOCX, and TXT are supported.`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds the 20MB limit (${formatBytes(file.size)}).`,
    };
  }
  return { isValid: true };
};

/**
 * Fetch all documents
 * Future API: GET /api/documents
 */
export const getDocuments = async (): Promise<DocumentItem[]> => {
  if (!API_CONFIG.isMockMode) {
    const res = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.DOCUMENTS}`);
    if (!res.ok) throw new Error('Failed to fetch documents from server');
    return res.json();
  }

  // Simulated latency
  await simulateDelay(350);
  return [...inMemoryDocuments];
};

/**
 * Upload multiple files with step progress
 * Future API: POST /api/documents/upload (multipart/form-data)
 */
export const uploadDocuments = async (
  files: File[],
  onFileStepUpdate?: (fileIndex: number, stepIndex: number, progress: number) => void
): Promise<DocumentItem[]> => {
  if (!API_CONFIG.isMockMode) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.DOCUMENT_UPLOAD}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }

  // Simulate realistic multi-step processing for each file
  const createdDocs: DocumentItem[] = [];

  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const file = files[fIdx];
    const docType = getDocumentType(file.name);
    
    // Step 1: Uploading (25%)
    onFileStepUpdate?.(fIdx, 0, 25);
    await simulateDelay(400);

    // Step 2: Text extracted (50%)
    onFileStepUpdate?.(fIdx, 1, 55);
    await simulateDelay(500);

    // Step 3: Chunks created (75%)
    onFileStepUpdate?.(fIdx, 2, 80);
    await simulateDelay(450);

    // Step 4: Indexed (100%)
    onFileStepUpdate?.(fIdx, 3, 100);
    await simulateDelay(350);

    const estChunks = Math.max(12, Math.round(file.size / 7000));

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}-${fIdx}`,
      name: file.name,
      type: docType,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      uploadedAt: new Date().toISOString(),
      uploadedTimeFormatted: 'Just now',
      status: 'indexed',
      chunksCount: estChunks,
      processingProgress: 100,
      processingSteps: [
        { name: 'Uploaded', status: 'done' },
        { name: 'Text extracted', status: 'done' },
        { name: 'Chunks created', status: 'done' },
        { name: 'Indexed', status: 'done' },
      ],
    };

    createdDocs.push(newDoc);
  }

  // Prepend new docs to in-memory store
  inMemoryDocuments = [...createdDocs, ...inMemoryDocuments];
  return createdDocs;
};

/**
 * Delete a document by ID
 * Future API: DELETE /api/documents/{id}
 */
export const deleteDocument = async (id: string): Promise<boolean> => {
  if (!API_CONFIG.isMockMode) {
    const res = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.DOCUMENT_BY_ID(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  }

  await simulateDelay(300);
  inMemoryDocuments = inMemoryDocuments.filter((d) => d.id !== id);
  return true;
};

/**
 * Get document preview and snippet
 * Future API: GET /api/documents/{id}/preview
 */
export const getDocumentPreview = async (
  id: string,
  page: number = 1
): Promise<{ title: string; page: number; section: string; fullContent: string; highlight: string }> => {
  if (!API_CONFIG.isMockMode) {
    const res = await fetch(
      `${API_CONFIG.baseUrl}${API_ENDPOINTS.DOCUMENT_PREVIEW(id)}?page=${page}`
    );
    if (!res.ok) throw new Error('Preview not found');
    return res.json();
  }

  await simulateDelay(250);
  const found = MOCK_PREVIEW_TEXTS[id];
  if (found) {
    return found;
  }

  // Default fallback for any newly uploaded file
  const doc = inMemoryDocuments.find((d) => d.id === id);
  return {
    title: doc ? doc.name : 'Document Preview',
    page: page || 1,
    section: 'Extracted Passage & Chunks',
    highlight: 'AI-powered knowledge retrieval system that can retrieve relevant information',
    fullContent: `[SECTION: Extracted Context Chunk - Document: ${doc?.name || 'Knowledge File'}]

Extracted Text Passage:
This document segment was partitioned into semantically coherent chunk sequences. The retrieval module scored this segment as having high reciprocal rank for the active query. 

Relevant content:
The architecture emphasizes accurate source grounding and transparency, allowing verifiable citations to be produced for user inspection. The confidence scoring module verifies cross-encoder entailment to eliminate speculative statements.`,
  };
};
