import { useState, useRef, useEffect, useCallback } from 'react';
import { transcribeAudio } from '../services/voiceService';

export type VoiceState = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

interface UseVoiceRecorderProps {
  language?: string;
  onTranscriptionComplete?: (transcript: string) => void;
  onError?: (errorMessage: string) => void;
}

export function useVoiceRecorder({ language, onTranscriptionComplete, onError }: UseVoiceRecorderProps = {}) {
  const [state, setState] = useState<VoiceState>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 25, 45, 70, 40, 60, 30, 20]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const waveIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up timer and streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('Audio recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.start(200);

      waveIntervalRef.current = window.setInterval(() => {
        setAudioLevels([
          Math.floor(Math.random() * 50) + 15,
          Math.floor(Math.random() * 70) + 20,
          Math.floor(Math.random() * 90) + 10,
          Math.floor(Math.random() * 100) + 30,
          Math.floor(Math.random() * 85) + 25,
          Math.floor(Math.random() * 75) + 15,
          Math.floor(Math.random() * 60) + 20,
          Math.floor(Math.random() * 40) + 10,
        ]);
      }, 120);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setState('recording');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not access the microphone.';
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setState('error');
      setErrorMessage(message);
      onError?.(message);
      window.setTimeout(() => setState('idle'), 3000);
    }
  }, [onError]);

  const stopRecording = useCallback(async () => {
    if (state !== 'recording') return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }

    setState('processing');

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) {
      setState('error');
      const message = 'No audio recorder is available. Please try again.';
      setErrorMessage(message);
      onError?.(message);
      return;
    }

    try {
      if (mediaRecorder.state !== 'inactive') {
        await new Promise<void>((resolve, reject) => {
          mediaRecorder.addEventListener('stop', () => resolve(), { once: true });
          mediaRecorder.addEventListener('error', () => reject(new Error('Audio recording failed.')), { once: true });
          mediaRecorder.stop();
        });
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorder.mimeType || 'audio/webm',
      });
      const transcript = await transcribeAudio(audioBlob, language);
      setState('completed');
      onTranscriptionComplete?.(transcript);

      // Return to idle after a brief indicator
      setTimeout(() => {
        setState('idle');
        setRecordingSeconds(0);
      }, 500);
    } catch (err) {
      setState('error');
      const msg = err instanceof Error ? err.message : 'Voice transcription failed';
      setErrorMessage(msg);
      onError?.(msg);
      setTimeout(() => {
        setState('idle');
      }, 3000);
    }
  }, [state, onTranscriptionComplete, onError]);

  const cancelRecording = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setState('idle');
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  }, []);

  // Format seconds to mm:ss
  const formattedTime = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(
    recordingSeconds % 60
  ).padStart(2, '0')}`;

  return {
    state,
    isRecording: state === 'recording',
    isProcessing: state === 'processing',
    isCompleted: state === 'completed',
    recordingSeconds,
    formattedTime,
    audioLevels,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
