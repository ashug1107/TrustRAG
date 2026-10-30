export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? '',
  isMockMode: import.meta.env.DEV && import.meta.env.VITE_TRUSTRAG_DEMO_MODE === 'true',
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

export const simulateDelay = (ms: number = 600): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const apiRequest = async (path: string, init?: RequestInit): Promise<Response> => {
  if (!API_CONFIG.baseUrl) {
    throw new Error('API base URL is not configured. Set VITE_API_BASE_URL in .env.local.');
  }

  const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
    credentials: 'include',
    ...init,
  });

  if (response.status === 401) {
    throw new Error('Your session has expired or is not authorized. Sign in again if authentication is enabled.');
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `API request failed (${response.status})${detail ? `: ${detail}` : ''}`
    );
  }

  return response;
};
