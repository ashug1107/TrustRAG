import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Search, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Filter,
  Layers
} from 'lucide-react';
import { DocumentItem, DocumentType } from '../types';

interface DocumentTableProps {
  documents: DocumentItem[];
  onViewDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (docId: string) => void;
  isDeletingId?: string | null;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onViewDocument,
  onDeleteDocument,
  isDeletingId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | DocumentType>('all');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getDocTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />;
      case 'docx':
        return <FileSpreadsheet className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />;
      case 'txt':
      default:
        return <FileCode className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-900/60';
      case 'docx':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60';
      case 'txt':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60';
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Document Library
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {documents.length} knowledge sources registered in retrieval index
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-56 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 py-1.5 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs font-medium">
            {(['all', 'pdf', 'docx', 'txt'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`rounded-lg px-2.5 py-1 uppercase text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedType === t
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Filter className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No matching documents found
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Try adjusting your search query or file type filter.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Document
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Size
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Uploaded
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Chunks
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          {getDocTypeIcon(doc.type)}
                        </div>
                        <span className="truncate max-w-xs font-semibold text-slate-800 dark:text-slate-200">
                          {doc.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${getDocTypeBadge(
                          doc.type
                        )}`}
                      >
                        {doc.type}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {doc.sizeFormatted}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{doc.uploadedTimeFormatted}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3 text-slate-400" />
                        <span>{doc.chunksCount} chunks</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        Indexed
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewDocument(doc)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                          title="View Document Extract"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          disabled={isDeletingId === doc.id}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors cursor-pointer"
                          title="Delete from knowledge index"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getDocTypeIcon(doc.type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {doc.name}
                      </h4>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{doc.sizeFormatted}</span>
                        <span>•</span>
                        <span>{doc.uploadedTimeFormatted}</span>
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Indexed
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span>{doc.chunksCount} chunks</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDocument(doc)}
                      className="rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="rounded-lg bg-red-50 dark:bg-red-950/60 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
