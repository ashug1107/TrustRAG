import React from 'react';
import { FileText, FileSpreadsheet, FileCode, ArrowUpRight } from 'lucide-react';
import { SourceCitation } from '../types';

interface SourceCardProps {
  citation: SourceCitation;
  onClick: (citation: SourceCitation) => void;
}

export const SourceCard: React.FC<SourceCardProps> = ({ citation, onClick }) => {
  const getIcon = () => {
    switch (citation.type) {
      case 'docx':
        return <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />;
      case 'txt':
        return <FileCode className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'pdf':
      default:
        return <FileText className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />;
    }
  };

  return (
    <button
      type="button"
      onClick={() => onClick(citation)}
      className="group relative flex flex-col items-start rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-left transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xs hover:bg-blue-50/20 dark:hover:bg-blue-950/20 active:scale-99 w-full sm:w-auto sm:min-w-64 cursor-pointer"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {getIcon()}
          <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
            {citation.documentName}
          </span>
        </div>

        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>

      <div className="mt-2 flex w-full items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {citation.page ? `Page ${citation.page}` : 'Document Chunk'}
        </span>
        <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
          Match {Math.round(citation.relevanceScore * 100)}%
        </span>
      </div>

      <div className="mt-1.5 w-full truncate text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-1.5">
        <span className="font-semibold text-slate-500 dark:text-slate-500">Section: </span>
        <span>{citation.section}</span>
      </div>
    </button>
  );
};
