import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  ArrowRight, 
  Trash2
} from 'lucide-react';
import { HistoryItem, LanguageType } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface HistoryPageProps {
  historyItems: HistoryItem[];
  onSelectHistoryItem: (question: string) => void;
  onClearHistory: () => void;
  language: LanguageType;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  historyItems,
  onSelectHistoryItem,
  onClearHistory,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = historyItems.filter((item) =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayItems = filteredItems.filter(
    (item) => item.relativeTime.includes('ago') || item.relativeTime.includes('Just now')
  );
  const olderItems = filteredItems.filter(
    (item) => !item.relativeTime.includes('ago') && !item.relativeTime.includes('Just now')
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t.queryHistoryHeading}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Audit trail of past questions, retrieved citations, and confidence scores.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 hover:border-red-200 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search past questions or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* History Items List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto">
            <HistoryIcon className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No query history found
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Questions asked in the Knowledge Base will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's Section */}
          {todayItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Today
              </h3>
              <div className="space-y-2.5">
                {todayItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectHistoryItem(item.question)}
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 hover:shadow-2xs cursor-pointer transition-all"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                          "{item.question}"
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {item.relativeTime}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                          {item.sourcesCount} sources
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          {item.confidence}% confidence
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                        {item.answerSummary}
                      </p>
                    </div>

                    <div className="mt-3 sm:mt-0 flex items-center justify-end shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors">
                        <span>Ask Again</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Older Section */}
          {olderItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Previous Days
              </h3>
              <div className="space-y-2.5">
                {olderItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectHistoryItem(item.question)}
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 hover:shadow-2xs cursor-pointer transition-all"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                          "{item.question}"
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {item.relativeTime} ({item.timestamp})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                          {item.sourcesCount} sources
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          {item.confidence}% confidence
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                        {item.answerSummary}
                      </p>
                    </div>

                    <div className="mt-3 sm:mt-0 flex items-center justify-end shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors">
                        <span>Ask Again</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
