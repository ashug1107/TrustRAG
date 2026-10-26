import React from 'react';
import { X, Check, Files } from 'lucide-react';
import { DocumentItem } from '../types';

interface ScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  selectedDocIds: string[];
  onSelectScope: (docIds: string[]) => void;
}

export const ScopeModal: React.FC<ScopeModalProps> = ({
  isOpen,
  onClose,
  documents,
  selectedDocIds,
  onSelectScope,
}) => {
  if (!isOpen) return null;

  const isAll = selectedDocIds.length === 0 || selectedDocIds.includes('all');

  const handleToggleDoc = (docId: string) => {
    if (isAll) {
      onSelectScope([docId]);
    } else {
      if (selectedDocIds.includes(docId)) {
        const next = selectedDocIds.filter((id) => id !== docId);
        onSelectScope(next.length === 0 ? ['all'] : next);
      } else {
        onSelectScope([...selectedDocIds, docId]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Files className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Select Knowledge Retrieval Scope
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Restrict queries to specific documents or search across your entire indexed knowledge base.
        </p>

        {/* Option 1: All Documents */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => onSelectScope(['all'])}
            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
              isAll
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>
              <div className="text-xs font-bold">All Documents (Recommended)</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Search across all {documents.length} indexed files simultaneously
              </div>
            </div>
            {isAll && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 font-bold" />}
          </button>

          {/* Specific Document Checkboxes */}
          <div className="mt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Or pick individual documents:
            </span>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {documents.map((doc) => {
                const isSelected = !isAll && selectedDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleToggleDoc(doc.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-2 text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/60 font-semibold text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="truncate max-w-xs">{doc.name}</div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {doc.type.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Apply Scope
          </button>
        </div>
      </div>
    </div>
  );
};
