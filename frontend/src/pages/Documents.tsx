import React, { useState } from 'react';
import { UploadDropzone } from '../components/UploadDropzone';
import { FileQueue } from '../components/FileQueue';
import { DocumentTable } from '../components/DocumentTable';
import { DocumentPreview } from '../components/DocumentPreview';
import { DocumentItem, QueuedFile, SourceCitation, LanguageType } from '../types';
import { 
  uploadDocuments, 
  deleteDocument, 
  formatBytes, 
  getDocumentType 
} from '../services/documentService';
import { TRANSLATIONS } from '../data/translations';

interface DocumentsPageProps {
  documents: DocumentItem[];
  onDocumentsUpdated: (updatedDocs: DocumentItem[]) => void;
  language: LanguageType;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents,
  onDocumentsUpdated,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewCitation, setPreviewCitation] = useState<SourceCitation | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

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

  const handleClearCompletedQueue = () => {
    setQueue([]);
  };

  const handleStartUpload = async () => {
    const readyItems = queue.filter((f) => f.status === 'ready');
    if (readyItems.length === 0) return;

    setIsUploading(true);

    try {
      const filesToUpload = readyItems.map((q) => q.file);

      const createdDocs = await uploadDocuments(filesToUpload, (fileIndex, stepIndex, progress) => {
        setQueue((prev) => {
          const next = [...prev];
          const target = next[fileIndex];
          if (target) {
            target.progress = progress;
            target.status = progress === 100 ? 'indexed' : 'processing';
            target.steps = target.steps.map((st, sIdx) => ({
              ...st,
              completed: sIdx <= stepIndex,
            }));
          }
          return next;
        });
      });

      onDocumentsUpdated([...createdDocs, ...documents]);
    } catch (err) {
      console.error('Error during upload simulation:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    setIsDeletingId(id);
    try {
      await deleteDocument(id);
      onDocumentsUpdated(documents.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleViewDocument = (doc: DocumentItem) => {
    const citation: SourceCitation = {
      id: `preview-${doc.id}`,
      documentId: doc.id,
      documentName: doc.name,
      type: doc.type,
      page: 1,
      section: 'Document Inspection',
      relevanceScore: 1.0,
      extractedText: `Document: ${doc.name} (${doc.type.toUpperCase()})
Size: ${doc.sizeFormatted} | Indexed Chunks: ${doc.chunksCount}

This document has been ingested and vectorized into ${doc.chunksCount} discrete semantic chunks in the KnowAI knowledge store. Each chunk retains metadata including character offsets, token boundaries, and dense vector representations for hybrid similarity lookup.`,
      highlightPhrase: 'discrete semantic chunks in the KnowAI knowledge store',
    };
    setPreviewCitation(citation);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {t.knowledgeDocumentsHeading}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t.knowledgeDocumentsDesc}
        </p>
      </div>

      {/* Drag & Drop Upload Area */}
      <UploadDropzone
        onFilesSelected={handleFilesSelected}
        disabled={isUploading}
      />

      {/* Upload Queue Component */}
      <FileQueue
        queue={queue}
        onRemoveFile={handleRemoveQueueFile}
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
