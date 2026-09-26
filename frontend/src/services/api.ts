/**
 * Base API Configuration & Endpoint Constants
 * 
 * Future FastAPI backend endpoints:
 * - POST   /api/documents/upload
 * - GET    /api/documents
 * - DELETE /api/documents/{id}
 * - POST   /api/voice/transcribe
 * - POST   /api/query
 * - GET    /api/history
 * - GET    /api/documents/{id}/preview
 */

export const API_CONFIG = {
  baseUrl: (import.meta as any).env?.VITE_BACKEND_API_URL || 'http://localhost:8000',
  isMockMode: true, // Toggle when FastAPI backend is ready
};

export const API_ENDPOINTS = {
  DOCUMENTS: '/api/documents',
  DOCUMENT_UPLOAD: '/api/documents/upload',
  DOCUMENT_BY_ID: (id: string) => `/api/documents/${id}`,
  DOCUMENT_PREVIEW: (id: string) => `/api/documents/${id}/preview`,
  VOICE_TRANSCRIBE: '/api/voice/transcribe',
  QUERY: '/api/query',
  HISTORY: '/api/history',
};

// Utility to simulate network delay for realistic frontend loading states
export const simulateDelay = (ms: number = 600): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
