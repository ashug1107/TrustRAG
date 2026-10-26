import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { UploadDropzone } from '../components/UploadDropzone';
import { FileQueue } from '../components/FileQueue';
import { DocumentTable } from '../components/DocumentTable';
import { DocumentPreview } from '../components/DocumentPreview';
import { DocumentItem, QueuedFile, SourceCitation, LanguageType } from '../types';
import { 
  uploadDocuments, 
  deleteDocument, 
  getDocumentPreview,
  formatBytes, 
  getDocumentType 
} from '../services/documentService';
import { TRANSLATIONS } from '../data/translations';

interface DocumentsPageProps {
  documents: DocumentItem[];
  onDocumentsUpdated: (updatedDocs: DocumentItem[]) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  language: LanguageType;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents,
  onDocumentsUpdated,
  onRefresh,
  isRefreshing,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewCitation, setPreviewCitation] = useState<SourceCitation | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    const newQueueItems: QueuedFile[] = files.map((file) => ({
      id: `queue-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      type: getDocumentType(file.name),
      status: 'ready',
      progress: 0,
      steps: [
        { name: 'Uploaded', completed: false },
        { name: 'Text extracted', completed: false },
        { name: 'Chunks created', completed: false },
        { name: 'Indexed', completed: false },
      ],
    }));

    setQueue((prev) => [...prev, ...newQueueItems]);
  };

  const handleRemoveQueueFile = (fileId: string) => {
    setQueue((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleRetryQueueFile = (fileId: string) => {
    setQueue((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? { ...file, status: 'ready', progress: 0, error: undefined }
          : file
      )
    );
  };

  const handleClearCompletedQueue = () => {
    setQueue([]);
  };

  const handleStartUpload = async () => {
    const readyItems = queue.filter((f) => f.status === 'ready');
    if (readyItems.length === 0) return;

    setIsUploading(true);
    setActionError(null);
    const readyIds = readyItems.map((item) => item.id);

    try {
      const filesToUpload = readyItems.map((q) => q.file);

      const createdDocs = await uploadDocuments(filesToUpload, (fileIndex, currentStepIndex, progress) => {
        const targetId = readyIds[fileIndex];
        setQueue((prev) =>
          prev.map((item) =>
            item.id === targetId
              ? {
                  ...item,
                  progress: Math.max(item.progress, progress),
                  status: progress === 100 ? 'indexed' : progress <= 25 ? 'uploading' : 'processing',
                  steps: item.steps.map((step, index) => ({
                    ...step,
                    completed: index <= currentStepIndex,
                  })),
                }
              : item
          )
        );
      });

      onDocumentsUpdated([...createdDocs, ...documents]);
      setQueue((prev) =>
        prev.map((item) => {
          const index = readyIds.indexOf(item.id);
          if (index < 0) return item;
          const document = createdDocs[index];
          if (!document) {
            return { ...item, status: 'uploaded', progress: 100 };
          }
          const status = document.status === 'indexed'
            ? 'indexed'
            : document.status === 'error'
              ? 'error'
              : 'processing';
          return {
            ...item,
            status,
            progress: document.processingProgress,
            steps: item.steps.map((step, stepIndex) => ({
              ...step,
              completed: status === 'indexed' || stepIndex < 1,
            })),
            error: document.error,
          };
        })
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setQueue((prev) =>
        prev.map((item) =>
          readyIds.includes(item.id)
            ? { ...item, status: 'ready', progress: 0, error: undefined }
            : item
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const document = documents.find((item) => item.id === id);
    if (!document || !window.confirm(`Delete "${document.name}"?`)) return;

    setIsDeletingId(id);
    setActionError(null);
    try {
      await deleteDocument(id);
      onDocumentsUpdated(documents.filter((d) => d.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the document.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleViewDocument = async (doc: DocumentItem) => {
    setActionError(null);
    try {
      const preview = await getDocumentPreview(doc.id);
      setPreviewCitation({
        id: `preview-${doc.id}`,
        documentId: doc.id,
        documentName: preview.title,
        type: doc.type,
        page: preview.page,
        section: preview.section,
        extractedText: preview.fullContent,
        highlightPhrase: preview.highlight,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not load the document preview.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t.knowledgeDocumentsHeading}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t.knowledgeDocumentsDesc}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200" role="alert">
          {actionError}
        </div>
      )}

      {/* Drag & Drop Upload Area */}
      <UploadDropzone
        onFilesSelected={handleFilesSelected}
        disabled={isUploading}
      />

      {/* Upload Queue Component */}
      <FileQueue
        queue={queue}
        onRemoveFile={handleRemoveQueueFile}
        onRetryFile={handleRetryQueueFile}
        onStartUpload={handleStartUpload}
        isUploading={isUploading}
        onClearCompleted={handleClearCompletedQueue}
      />

      {/* Document Library Table */}
      <DocumentTable
        documents={documents}
        onViewDocument={handleViewDocument}
        onDeleteDocument={handleDeleteDocument}
        isDeletingId={isDeletingId}
      />

      {/* Document Preview Drawer */}
      <DocumentPreview
        citation={previewCitation}
        onClose={() => setPreviewCitation(null)}
      />
    </div>
  );
};
