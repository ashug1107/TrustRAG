import { API_CONFIG, API_ENDPOINTS, apiRequest, simulateDelay } from './api';

// Rotating realistic mock queries for voice testing if user asks multiple voice questions
const MOCK_VOICE_QUERIES = [
  'What are the main objectives of the project?',
  'Summarize the uploaded research papers.',
  'What methodology is used in these documents?',
  'Compare the approaches discussed in the documents.',
  'How does the hybrid search combine BM25 with dense embeddings?',
];

let queryIndex = 0;

/**
 * Transcribe recorded audio
 * 
 * Today: Mock simulation with realistic delay and query rotation.
 * Tomorrow: 
 *   const formData = new FormData();
 *   formData.append('audio', audioBlob, 'query.webm');
 *   const res = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.VOICE_TRANSCRIBE}`, {
 *     method: 'POST',
 *     body: formData
 *   });
 *   const data = await res.json();
 *   return data.text;
 */
export const transcribeAudio = async (audioBlob?: Blob): Promise<string> => {
  if (!API_CONFIG.isMockMode) {
    if (!audioBlob) {
      throw new Error('No audio was recorded. Check microphone permissions and try again.');
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'query.webm');
    const res = await apiRequest(API_ENDPOINTS.VOICE_TRANSCRIBE, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.text || '';
  }

  // Realistic mock transcription delay
  await simulateDelay(1400);

  // Return realistic mock voice transcript
  const transcript = MOCK_VOICE_QUERIES[queryIndex % MOCK_VOICE_QUERIES.length];
  queryIndex++;
  return transcript;
};
