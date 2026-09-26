import React from 'react';
import { Mic, Square, X, Loader2 } from 'lucide-react';
import { VoiceState } from '../hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  state: VoiceState;
  formattedTime: string;
  audioLevels: number[];
  onStop: () => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  state,
  formattedTime,
  audioLevels,
  onStop,
  onCancel,
}) => {
  if (state === 'idle') return null;

  return (
    <div className="mb-3 w-full rounded-2xl border border-red-200/80 dark:border-red-900/60 bg-linear-to-r from-red-50/90 via-white to-blue-50/80 dark:from-red-950/40 dark:via-slate-900 dark:to-blue-950/40 p-3.5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          {state === 'recording' ? (
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-500/30">
              <Mic className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900" />
              </span>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {state === 'recording'
                  ? 'Listening for voice query...'
                  : 'Transcribing audio speech...'}
              </span>
              {state === 'recording' && (
                <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-950/80 px-2 py-0.5 rounded-md">
                  {formattedTime}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {state === 'recording'
                ? 'Speak clearly into your microphone'
                : 'Routing audio to transcription engine (POST /api/voice/transcribe)'}
            </p>
          </div>
        </div>

        {/* Center: Waveform */}
        {state === 'recording' && (
          <div className="flex items-center justify-center gap-1 h-8 px-4">
            {audioLevels.map((lvl, idx) => (
              <div
                key={idx}
                className="w-1.5 rounded-full bg-red-500 dark:bg-red-400 transition-all duration-100 ease-out"
                style={{
                  height: `${Math.max(6, Math.min(30, (lvl / 100) * 30))}px`,
                  opacity: Math.max(0.4, lvl / 100),
                }}
              />
            ))}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {state === 'recording' ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 active:scale-98 transition-all cursor-pointer"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Stop Recording</span>
              </button>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Transcribing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
