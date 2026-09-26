import React, { useState } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  BookOpen, 
  Mic
} from 'lucide-react';
import { ChatMessage as ChatMessageType, SourceCitation } from '../types';
import { SourceCard } from './SourceCard';
import { ConfidenceScore } from './ConfidenceScore';
import { RetrievalDetails } from './RetrievalDetails';

interface ChatMessageProps {
  message: ChatMessageType;
  onSourceClick: (citation: SourceCitation) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSourceClick }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex w-full justify-end py-3">
        <div className="flex max-w-2xl items-start gap-3">
          <div className="flex flex-col items-end">
            <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-sm text-white shadow-xs">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
              {message.isVoiceInput && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                  <Mic className="h-3 w-3" /> Voice Query
                </span>
              )}
              <span>{message.timestamp}</span>
            </div>
          </div>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-700 text-xs font-bold text-white shadow-xs">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex w-full justify-start py-4">
      <div className="flex max-w-3xl items-start gap-3 sm:gap-4">
        {/* Assistant Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-blue-700 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
          <Bot className="h-5 w-5" />
        </div>

        {/* Message Card */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
            {/* Header info & copy button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  KnowAI Retrieval Engine
                </span>
                <span className="rounded-md bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                  Grounded Response
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{message.timestamp}</span>
                <button
                  onClick={handleCopy}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Copy response"
                  aria-label="Copy response"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Answer Content */}
            <div className="mt-3.5 space-y-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {message.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Sources Citations Section */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Sources</span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    (Click to inspect grounded page)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {message.sources.map((citation) => (
                    <SourceCard
                      key={citation.id}
                      citation={citation}
                      onClick={onSourceClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Trust / Confidence Indicator */}
            {typeof message.confidence === 'number' && (
              <ConfidenceScore
                score={message.confidence}
                sourcesCount={message.sources?.length || 4}
              />
            )}

            {/* Collapsible Retrieval Details */}
            <RetrievalDetails details={message.retrievalDetails} />
          </div>
        </div>
      </div>
    </div>
  );
};
