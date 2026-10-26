import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  ChevronDown, 
  RotateCcw, 
  ArrowRight,
  Database
} from 'lucide-react';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { DocumentPreview } from '../components/DocumentPreview';
import { ScopeModal } from '../components/ScopeModal';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { askQuestion } from '../services/chatService';
import { SUGGESTED_QUESTIONS } from '../data/mockData';
import { ChatMessage as ChatMessageType, DocumentItem, HistoryItem, SourceCitation, LanguageType } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { API_CONFIG } from '../services/api';
import { getChatHistory } from '../services/chatService';

interface AskKnowledgeProps {
  documents: DocumentItem[];
  prefilledQuestion?: string;
  onClearPrefilledQuestion?: () => void;
  language: LanguageType;
  voiceInputEnabled: boolean;
  onHistoryUpdated: (history: HistoryItem[]) => void;
  onHistoryError: (message: string) => void;
}

export const AskKnowledgePage: React.FC<AskKnowledgeProps> = ({
  documents,
  prefilledQuestion,
  onClearPrefilledQuestion,
  language,
  voiceInputEnabled,
  onHistoryUpdated,
  onHistoryError,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [failedQuestion, setFailedQuestion] = useState('');
  const [isVoiceQuestion, setIsVoiceQuestion] = useState(false);
  const [failedVoiceQuestion, setFailedVoiceQuestion] = useState(false);
  const [failedDocumentScope, setFailedDocumentScope] = useState<string[]>(['all']);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(['all']);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [activePreviewCitation, setActivePreviewCitation] = useState<SourceCitation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefilledQuestion) {
      setInputText(prefilledQuestion);
      onClearPrefilledQuestion?.();
    }
  }, [prefilledQuestion, onClearPrefilledQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const {
    state: voiceState,
    formattedTime: voiceTime,
    audioLevels,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder({
    onTranscriptionComplete: (transcript) => {
      setInputText(transcript);
      setIsVoiceQuestion(true);
      setVoiceError(null);
    },
    onError: (err) => {
      setVoiceError(err);
    },
  });

  const handleMicClick = () => {
    if (voiceState === 'idle' || voiceState === 'error') {
      startRecording();
    } else if (voiceState === 'recording') {
      stopRecording();
    }
  };

  const handleSendMessage = async (textToSend?: string, isRetry = false) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;
    const voiceInput = isRetry ? failedVoiceQuestion : isVoiceQuestion;
    const requestScope = isRetry ? failedDocumentScope : selectedDocIds;

    if (!isRetry) {
      const userMsg: ChatMessageType = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        documentScope: requestScope,
        isVoiceInput: voiceInput,
      };
      setMessages((prev) => [...prev, userMsg]);
    }
    setRequestError(null);
    setFailedQuestion('');
    setInputText('');
    setIsVoiceQuestion(false);
    setIsLoading(true);

    try {
      const assistantResponse = await askQuestion(query, requestScope, voiceInput);
      setMessages((prev) => [...prev, assistantResponse]);
      setFailedVoiceQuestion(false);
      try {
        onHistoryUpdated(await getChatHistory());
      } catch (err) {
        onHistoryError(err instanceof Error ? err.message : 'Could not refresh query history.');
      }
    } catch (err) {
      setFailedQuestion(query);
      setFailedVoiceQuestion(voiceInput);
      setFailedDocumentScope(requestScope);
      setRequestError(err instanceof Error ? err.message : 'Could not get an answer. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
  };

  const handleSelectSuggestedQuestion = (q: string) => {
    setInputText(q);
  };

  const getScopeButtonLabel = () => {
    if (selectedDocIds.length === 0 || selectedDocIds.includes('all')) {
      return 'All Documents';
    }
    if (selectedDocIds.length === 1) {
      const doc = documents.find((d) => d.id === selectedDocIds[0]);
      return doc ? doc.name : '1 Document';
    }
    return `${selectedDocIds.length} Selected Docs`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[550px] animate-in fade-in duration-200">
      {/* Top Header / Scope Bar */}
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {t.askKnowledgeHeading}
            </h2>
            <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 hidden sm:inline-block">
              {API_CONFIG.isMockMode ? 'Mock demo' : 'API mode'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t.askKnowledgeDesc}
          </p>
        </div>

        {/* Scope Selector Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Knowledge Base:</span>
          </div>
          <button
            type="button"
            onClick={() => setIsScopeModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Database className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="truncate max-w-44">{getScopeButtonLabel()}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
        {messages.length === 0 ? (
          /* Initial Empty State */
          <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center max-w-xl mx-auto px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <Bot className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              How can I help?
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ask a question about your uploaded documents. The AI system will retrieve relevant chunks and generate grounded answers.
            </p>

            {/* Suggested Questions */}
            <div className="mt-6 w-full space-y-2 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t.suggestedQuestionsTitle}
              </span>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {SUGGESTED_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestedQuestion(question)}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>{question}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-1 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSourceClick={(citation) => setActivePreviewCitation(citation)}
              />
            ))}

            {requestError && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200" role="alert">
                <span>{requestError}</span>
                <button
                  type="button"
                  onClick={() => void handleSendMessage(failedQuestion, true)}
                  disabled={isLoading || !failedQuestion}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/50"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading / Generating State */}
            {isLoading && (
              <div className="flex w-full justify-start py-4">
                <div className="flex max-w-3xl items-start gap-3 sm:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white animate-pulse">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
                        <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                        <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Waiting for the knowledge service…
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input Section */}
      <div className="pt-2 shrink-0 max-w-4xl mx-auto w-full">
        {voiceError && (
          <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200" role="alert">
            {voiceError}
          </div>
        )}
        <ChatInput
          value={inputText}
          onChange={(value) => {
            setInputText(value);
            setIsVoiceQuestion(false);
            setVoiceError(null);
          }}
          onSubmit={() => handleSendMessage()}
          isLoading={isLoading}
          voiceState={voiceState}
          voiceInputEnabled={voiceInputEnabled}
          onMicClick={handleMicClick}
          onVoiceStop={stopRecording}
          onVoiceCancel={cancelRecording}
          voiceTime={voiceTime}
          audioLevels={audioLevels}
          selectedScopeText={getScopeButtonLabel()}
          onToggleScopeModal={() => setIsScopeModalOpen(true)}
          placeholderText={t.typeQuestionPlaceholder}
        />
      </div>

      {/* Document Scope Modal */}
      <ScopeModal
        isOpen={isScopeModalOpen}
        onClose={() => setIsScopeModalOpen(false)}
        documents={documents}
        selectedDocIds={selectedDocIds}
        onSelectScope={(ids) => setSelectedDocIds(ids)}
      />

      {/* Document Preview Drawer when citation clicked */}
      <DocumentPreview
        citation={activePreviewCitation}
        onClose={() => setActivePreviewCitation(null)}
      />
    </div>
  );
};
