import { useState, useRef, useEffect, useCallback } from 'react';
import { transcribeAudio } from '../services/voiceService';

export type VoiceState = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

interface UseVoiceRecorderProps {
  onTranscriptionComplete?: (transcript: string) => void;
  onError?: (errorMessage: string) => void;
}

export function useVoiceRecorder({ onTranscriptionComplete, onError }: UseVoiceRecorderProps = {}) {
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

    // Start UI audio waveform animation
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

    // Start timer interval
    timerIntervalRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    setState('recording');

    // Attempt browser MediaRecorder if audio hardware/permission available
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(200);
      }
    } catch (err: any) {
      // In sandboxed iframes or browsers without mic permissions, we gracefully maintain the recording state
      // and use mock voice data without crashing.
      console.warn('Microphone stream notice (using fallback simulated voice input):', err);
    }
  }, []);

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

    let audioBlob: Blob | undefined;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
      }
    }

    try {
      // Call voiceService
      const transcript = await transcribeAudio(audioBlob);
      setState('completed');
      onTranscriptionComplete?.(transcript);

      // Return to idle after a brief indicator
      setTimeout(() => {
        setState('idle');
        setRecordingSeconds(0);
      }, 500);
    } catch (err: any) {
      setState('error');
      const msg = err?.message || 'Voice transcription failed';
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
