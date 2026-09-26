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

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(MOCK_HISTORY);
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

  // User Authentication State
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('knowai_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // fallback
      }
    }
    return {
      username: 'sanskruti_ai',
      name: 'Sanskruti',
      role: 'Research Scholar',
      email: 'sanskruti@knowai.org',
    };
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);

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

  // Persist user
  useEffect(() => {
    if (user) {
      localStorage.setItem('knowai_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('knowai_user');
    }
  }, [user]);

  // Initial data load via service layer
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [docs, hist] = await Promise.all([getDocuments(), getChatHistory()]);
        if (docs && docs.length > 0) setDocuments(docs);
        if (hist && hist.length > 0) setHistoryItems(hist);
      } catch (err) {
        console.warn('Initial data loading using fallback mock data:', err);
      }
    };
    loadInitialData();
  }, []);

  const handleSelectQuestion = (question: string) => {
    setPrefilledQuestion(question);
    setCurrentPage('ask');
  };

  const handleClearHistory = async () => {
    await clearChatHistory();
    setHistoryItems([]);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
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
        onLogout={handleLogout}
        language={language}
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
          onLogout={handleLogout}
          language={language}
          onLanguageChange={(lang) => setLanguage(lang)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <Dashboard
              documents={documents}
              history={historyItems}
              onNavigate={(page) => setCurrentPage(page)}
              onSelectQuestion={handleSelectQuestion}
              language={language}
            />
          )}

          {currentPage === 'documents' && (
            <DocumentsPage
              documents={documents}
              onDocumentsUpdated={(updated) => setDocuments(updated)}
              language={language}
            />
          )}

          {currentPage === 'ask' && (
            <AskKnowledgePage
              documents={documents}
              prefilledQuestion={prefilledQuestion}
              onClearPrefilledQuestion={() => setPrefilledQuestion('')}
              language={language}
            />
          )}

          {currentPage === 'history' && (
            <HistoryPage
              historyItems={historyItems}
              onSelectHistoryItem={handleSelectQuestion}
              onClearHistory={handleClearHistory}
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
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        language={language}
      />
    </div>
  );
}
