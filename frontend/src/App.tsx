/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { Dashboard } from './pages/Dashboard';
import { DocumentsPage } from './pages/Documents';
import { AskKnowledgePage } from './pages/AskKnowledge';
import { HistoryPage } from './pages/History';
import { SettingsPage } from './pages/Settings';
import { getDocuments } from './services/documentService';
import { getChatHistory, clearChatHistory } from './services/chatService';
import { DocumentItem, HistoryItem, User, LanguageType, NavigationPage } from './types';
import { INITIAL_DOCUMENTS, MOCK_HISTORY } from './data/mockData';
import { API_CONFIG } from './services/api';
import { TRANSLATIONS } from './data/translations';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>(
    API_CONFIG.isMockMode ? INITIAL_DOCUMENTS : []
  );
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(
    API_CONFIG.isMockMode ? MOCK_HISTORY : []
  );
  const [isLoadingData, setIsLoadingData] = useState(!API_CONFIG.isMockMode);
  const [dataError, setDataError] = useState<string | null>(null);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(
    () => localStorage.getItem('knowai_voice_input') !== 'false'
  );
  const [prefilledQuestion, setPrefilledQuestion] = useState<string>('');

  // Theme State: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('knowai_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'light';
  });

  // Language State: 'English' | 'Hindi' | 'Marathi'
  const [language, setLanguage] = useState<LanguageType>(() => {
    const saved = localStorage.getItem('knowai_language');
    if (saved === 'Hindi' || saved === 'Marathi' || saved === 'English') return saved;
    return 'English';
  });

  const [user] = useState<User | null>(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  // Apply Theme to Document Element
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('knowai_theme', theme);
  }, [theme]);

  // Persist language
  useEffect(() => {
    localStorage.setItem('knowai_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('knowai_voice_input', String(voiceInputEnabled));
  }, [voiceInputEnabled]);

  const loadInitialData = async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      const [docs, hist] = await Promise.all([getDocuments(), getChatHistory()]);
      setDocuments(docs);
      setHistoryItems(hist);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Could not load data from the API.');
      if (!API_CONFIG.isMockMode) {
        setDocuments([]);
        setHistoryItems([]);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

  const handleSelectQuestion = (question: string) => {
    setPrefilledQuestion(question);
    setCurrentPage('ask');
  };

  const handleClearHistory = async () => {
    try {
      await clearChatHistory();
      setHistoryItems([]);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Could not clear query history.');
    }
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        documentsCount={documents.length}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => {}}
        language={language}
        demoMode={API_CONFIG.isMockMode}
      />

      {/* Main Content Layout */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigateToAsk={() => setCurrentPage('ask')}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          user={user}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={() => {}}
          language={language}
          onLanguageChange={(lang) => setLanguage(lang)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {API_CONFIG.isMockMode && (
            <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200" role="status">
              {t.demoModeNotice}
            </div>
          )}
          {dataError && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200" role="alert">
              <span>{dataError}</span>
              <button
                type="button"
                onClick={() => void loadInitialData()}
                disabled={isLoadingData}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/50"
              >
                {isLoadingData ? 'Refreshing…' : 'Retry'}
              </button>
            </div>
          )}
          {isLoadingData && (
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400" role="status">
              Loading documents and query history…
            </p>
          )}
          {currentPage === 'dashboard' && (
            <Dashboard
              documents={documents}
              history={historyItems}
              onNavigate={(page) => setCurrentPage(page)}
              onSelectQuestion={handleSelectQuestion}
              language={language}
              demoMode={API_CONFIG.isMockMode}
            />
          )}

          {currentPage === 'documents' && (
            <DocumentsPage
              documents={documents}
              onDocumentsUpdated={(updated) => setDocuments(updated)}
              onRefresh={() => void loadInitialData()}
              isRefreshing={isLoadingData}
              language={language}
            />
          )}

          {currentPage === 'ask' && (
            <AskKnowledgePage
              documents={documents}
              prefilledQuestion={prefilledQuestion}
              onClearPrefilledQuestion={() => setPrefilledQuestion('')}
              language={language}
              voiceInputEnabled={voiceInputEnabled}
              onHistoryUpdated={setHistoryItems}
              onHistoryError={setDataError}
            />
          )}

          {currentPage === 'history' && (
            <HistoryPage
              historyItems={historyItems}
              onSelectHistoryItem={handleSelectQuestion}
              onClearHistory={handleClearHistory}
              canClearHistory={API_CONFIG.isMockMode}
              language={language}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              currentTheme={theme}
              onThemeChange={(th) => setTheme(th)}
              currentLanguage={language}
              onLanguageChange={(lang) => setLanguage(lang)}
              user={user}
              onOpenLogin={() => setIsLoginOpen(true)}
              onLogout={() => {}}
              voiceInputEnabled={voiceInputEnabled}
              onVoiceInputChange={setVoiceInputEnabled}
            />
          )}
        </main>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        language={language}
      />
    </div>
  );
}
