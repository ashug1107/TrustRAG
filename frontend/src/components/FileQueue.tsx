import React from 'react';
import { 
  FileText, 
  FileCode, 
  FileSpreadsheet, 
  X, 
  Check, 
  Loader2, 
  AlertCircle,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';
import { QueuedFile, DocumentType } from '../types';

interface FileQueueProps {
  queue: QueuedFile[];
  onRemoveFile: (fileId: string) => void;
  onStartUpload: () => void;
  isUploading: boolean;
  onClearCompleted: () => void;
}

const FileTypeIcon: React.FC<{ type: DocumentType }> = ({ type }) => {
  switch (type) {
    case 'pdf':
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40">
          <FileText className="h-5 w-5" />
        </div>
      );
    case 'docx':
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
      );
    case 'txt':
    default:
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
          <FileCode className="h-5 w-5" />
        </div>
      );
  }
};

export const FileQueue: React.FC<FileQueueProps> = ({
  queue,
  onRemoveFile,
  onStartUpload,
  isUploading,
  onClearCompleted,
}) => {
  if (queue.length === 0) return null;

  const readyFiles = queue.filter((f) => f.status === 'ready');
  const allIndexed = queue.every((f) => f.status === 'indexed');

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Selected Files Queue ({queue.length})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review queued files before parsing into knowledge vector chunks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allIndexed ? (
            <button
              onClick={onClearCompleted}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Done & Clear Queue
            </button>
          ) : (
            <button
              onClick={onStartUpload}
              disabled={isUploading || readyFiles.length === 0}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer ${
                isUploading || readyFiles.length === 0
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-blue-500/20'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Knowledge Queue...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload {readyFiles.length} {readyFiles.length === 1 ? 'Document' : 'Documents'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Files List */}
      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        {queue.map((item) => (
          <div key={item.id} className="py-3.5 first:pt-2 last:pb-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <FileTypeIcon type={item.type} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.name}
                    </span>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 uppercase">
                      {item.type}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{item.sizeFormatted}</span>
                    <span>•</span>
                    {item.status === 'ready' && (
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Ready to upload</span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Uploading ({item.progress}%)
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Processing Chunks...
                      </span>
                    )}
                    {item.status === 'indexed' && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Indexed in Knowledge Base
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Failed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              {!isUploading && (
                <button
                  onClick={() => onRemoveFile(item.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Step Progression */}
            {(item.status === 'uploading' ||
              item.status === 'processing' ||
              item.status === 'indexed') && (
              <div className="mt-3 pl-13">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      item.status === 'indexed' ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {item.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 text-xs rounded-md px-2 py-1 ${
                        step.completed
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 font-medium'
                          : item.status !== 'ready' && idx === Math.floor(item.progress / 25)
                          ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 font-medium'
                          : 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    >
                      {step.completed ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : item.status !== 'ready' && idx === Math.floor(item.progress / 25) ? (
                        <Loader2 className="h-3 w-3 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                      )}
                      <span className="truncate">{step.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
