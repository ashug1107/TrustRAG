import React, { useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Paperclip, 
  Loader2, 
  Layers
} from 'lucide-react';
import { VoiceState } from '../hooks/useVoiceRecorder';
import { VoiceRecorder } from './VoiceRecorder';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  voiceState: VoiceState;
  onMicClick: () => void;
  onVoiceStop: () => void;
  onVoiceCancel: () => void;
  voiceTime: string;
  audioLevels: number[];
  selectedScopeText: string;
  onToggleScopeModal?: () => void;
  placeholderText?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  voiceState,
  onMicClick,
  onVoiceStop,
  onVoiceCancel,
  voiceTime,
  audioLevels,
  selectedScopeText,
  onToggleScopeModal,
  placeholderText = 'Type your question about uploaded documents...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && voiceState === 'idle') {
        onSubmit();
      }
    }
  };

  const getMicButtonContent = () => {
    switch (voiceState) {
      case 'recording':
        return (
          <button
            type="button"
            onClick={onMicClick}
            className="flex h-9.5 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
            title="Stop listening"
          >
            <Mic className="h-4 w-4 animate-pulse" />
            <span className="hidden sm:inline">Listening...</span>
          </button>
        );
      case 'processing':
        return (
          <button
            type="button"
            disabled
            className="flex h-9.5 items-center gap-1.5 rounded-xl bg-blue-100 dark:bg-blue-950 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 cursor-not-allowed"
            title="Transcribing audio"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Transcribing...</span>
          </button>
        );
      case 'idle':
      default:
        return (
          <button
            type="button"
            onClick={onMicClick}
            disabled={isLoading}
            className="flex h-9.5 w-9.5 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
            title="Ask using voice (Speech to Text)"
          >
            <Mic className="h-5 w-5" />
          </button>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Voice Recorder banner when active */}
      <VoiceRecorder
        state={voiceState}
        formattedTime={voiceTime}
        audioLevels={audioLevels}
        onStop={onVoiceStop}
        onCancel={onVoiceCancel}
      />

      {/* Main Composer Box */}
      <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-sm focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
        {/* Scope Pill */}
        <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
          <button
            type="button"
            onClick={onToggleScopeModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Change document retrieval scope"
          >
            <Layers className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span>Scope: <strong className="text-slate-800 dark:text-slate-200">{selectedScopeText}</strong></span>
          </button>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            Press <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1 font-mono text-[10px]">Enter ↵</kbd> to send
          </span>
        </div>

        {/* Input Textarea & Controls */}
        <div className="flex items-end gap-2 px-1">
          {/* Document Scope / Attachment Button [+] */}
          <button
            type="button"
            onClick={onToggleScopeModal}
            className="mb-1 flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Select document scope"
            aria-label="Document scope"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </button>

          {/* Text input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              voiceState === 'recording'
                ? 'Listening... (Speak your question)'
                : placeholderText
            }
            disabled={isLoading}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 px-1 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
          />

          {/* Microphone button with 3 states */}
          <div className="mb-0.5 shrink-0">
            {getMicButtonContent()}
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim() || isLoading || voiceState !== 'idle'}
            className={`mb-0.5 flex h-9.5 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              value.trim() && !isLoading && voiceState === 'idle'
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
