import React from 'react';
import { X, FileText, Copy, Check, BookmarkCheck } from 'lucide-react';
import { SourceCitation } from '../types';

interface DocumentPreviewProps {
  citation: SourceCitation | null;
  onClose: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ citation, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHighlightedContent = () => {
    const text = citation.extractedText;
    const highlight = citation.highlightPhrase;

    if (!highlight || !text.includes(highlight)) {
      return (
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
          {text}
        </p>
      );
    }

    const parts = text.split(highlight);
    return (
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
        {parts[0]}
        <mark className="bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 font-semibold px-1 rounded-sm border-b-2 border-amber-400">
          {highlight}
        </mark>
        {parts[1]}
      </p>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Document Grounding Preview
                </span>
                <h3 className="truncate max-w-xs text-sm font-bold text-slate-900 dark:text-white">
                  {citation.documentName}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-6 py-3 text-xs">
            <span className="rounded-md bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-2 py-1 font-semibold text-slate-700 dark:text-slate-300">
              {citation.page ? `Page ${citation.page}` : 'Section Chunk'}
            </span>
            <span className="rounded-md bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-2 py-1 text-slate-600 dark:text-slate-400">
              Section: <strong className="text-slate-800 dark:text-slate-200">{citation.section}</strong>
            </span>
            <span className="rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-2 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
              Relevance: {Math.round(citation.relevanceScore * 100)}%
            </span>
          </div>

          {/* Drawer Body: Extracted content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Extracted Text Segment
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 p-4">
              {renderHighlightedContent()}
            </div>

            <div className="mt-5 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 p-3.5 text-xs text-blue-900 dark:text-blue-300">
              <div className="flex items-center gap-2 font-semibold">
                <BookmarkCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Citation Verification</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                This exact text chunk was extracted by the hybrid retrieval engine and passed as grounded context to synthesize the answer.
              </p>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              GET /api/documents/{'{id}'}/preview
            </span>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
