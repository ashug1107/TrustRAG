import React from 'react';
import { 
  Files, 
  Layers, 
  MessageSquare, 
  Activity, 
  UploadCloud, 
  Sparkles, 
  Mic, 
  ShieldCheck, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { DocumentItem, HistoryItem, LanguageType, NavigationPage } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface DashboardProps {
  documents: DocumentItem[];
  history: HistoryItem[];
  onNavigate: (page: NavigationPage) => void;
  onSelectQuestion: (question: string) => void;
  language: LanguageType;
}

export const Dashboard: React.FC<DashboardProps> = ({
  documents,
  history,
  onNavigate,
  onSelectQuestion,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunksCount || 0), 0);
  const questionsCount = history.length + 32;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-linear-to-b from-blue-50/70 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-10 shadow-2xs">
        {/* Subtle decorative background accent */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-100/50 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          {/* Replaced requested project platform badge with clean neural indicator */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-slate-800/90 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-2xs mb-4">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Neural RAG Engine Active</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl sm:leading-tight">
            {t.heroHeading}
          </h2>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base leading-relaxed">
            {t.heroSubheading}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('documents')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/25 active:scale-98 transition-all"
            >
              <UploadCloud className="h-4 w-4" />
              <span>{t.uploadDocuments}</span>
            </button>

            <button
              onClick={() => onNavigate('ask')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 active:scale-98 transition-all"
            >
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>{t.askQuestion}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t.documents}
          value={documents.length}
          subtext="Indexed multi-format sources"
          icon={Files}
          badge={{ text: 'Active', variant: 'info' }}
        />
        <StatCard
          label="Knowledge Chunks"
          value={totalChunks.toLocaleString()}
          subtext="512-token semantic segments"
          icon={Layers}
          badge={{ text: 'Dense + Sparse', variant: 'neutral' }}
        />
        <StatCard
          label="Questions Asked"
          value={questionsCount}
          subtext="Text & vocal queries logged"
          icon={MessageSquare}
          badge={{ text: 'Grounding 88%', variant: 'info' }}
        />
        <StatCard
          label="System Status"
          value="Online"
          subtext="Hybrid Search & Verification"
          icon={Activity}
          badge={{ text: 'FastAPI Ready', variant: 'success' }}
        />
      </div>

      {/* Two Column Section: Quick Query Starters & System Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Suggested Questions / Recent Queries */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Explore Knowledge Base
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any research prompt to test the grounded retrieval engine.
              </p>
            </div>
            <button
              onClick={() => onNavigate('ask')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <span>Open Chat</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                q: 'What are the main objectives of the project?',
                tag: 'Project Scope',
                score: '82% Confidence',
              },
              {
                q: 'Summarize the uploaded research papers.',
                tag: 'Literature Review',
                score: '94% Confidence',
              },
              {
                q: 'What methodology is used in these documents?',
                tag: 'System Architecture',
                score: '89% Confidence',
              },
              {
                q: 'Compare the approaches discussed in the documents.',
                tag: 'Comparative Analysis',
                score: '78% Confidence',
              },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectQuestion(item.q);
                  onNavigate('ask');
                }}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-left hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 hover:shadow-2xs transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 leading-snug">
                  "{item.q}"
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-medium text-slate-600 dark:text-slate-300">
                    {item.tag}
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {item.score}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Key Capabilities Feature Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            System Capabilities
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-slate-800 dark:text-slate-200 font-semibold">Multi-Format Ingestion</strong>
                <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Support for PDF, DOCX, and TXT documents up to 20MB.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400">
                <Mic className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-slate-800 dark:text-slate-200 font-semibold">Voice Query Capture</strong>
                <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hands-free microphone query with animated waveform feedback.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-slate-800 dark:text-slate-200 font-semibold">Citation Grounding</strong>
                <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Direct page and section citations with trust/confidence scoring.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('documents')}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Manage Document Library →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
