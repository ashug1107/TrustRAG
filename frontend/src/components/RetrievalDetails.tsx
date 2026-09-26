import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { RetrievalDetailsInfo } from '../types';

interface RetrievalDetailsProps {
  details?: RetrievalDetailsInfo;
}

export const RetrievalDetails: React.FC<RetrievalDetailsProps> = ({ details }) => {
  const [isOpen, setIsOpen] = useState(false);

  const fallbackDetails: RetrievalDetailsInfo = {
    retrievedDocumentsCount: 4,
    retrievedChunksCount: 8,
    retrievalMethod: 'Hybrid Search',
    denseSearch: 'Sentence Embeddings',
    sparseSearch: 'BM25',
    rerankerScore: '0.92 (Cross-Encoder)',
    latencyMs: 342,
  };

  const data = details || fallbackDetails;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>{isOpen ? 'Hide retrieval details' : 'View retrieval details'}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 sm:p-4 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Card 1 */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Corpus Extraction
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Retrieved Documents:</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.retrievedDocumentsCount}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Retrieved Chunks:</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.retrievedChunksCount}</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Search Architecture
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Retrieval Method:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded text-[11px]">
                  {data.retrievalMethod}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Dense Search:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{data.denseSearch}</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Sparse & Rerank
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Sparse Search:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{data.sparseSearch}</span>
              </div>
              {data.rerankerScore && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Reranker:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">{data.rerankerScore}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
