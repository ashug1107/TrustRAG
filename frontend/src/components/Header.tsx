import React, { useState } from 'react';
import { 
  Menu, 
  Bell, 
  Sparkles, 
  Sun, 
  Moon, 
  User as UserIcon,
  LogOut,
  LogIn,
  X,
  Languages
} from 'lucide-react';
import { User, LanguageType, NavigationPage } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface HeaderProps {
  currentPage: NavigationPage;
  onToggleSidebar: () => void;
  onNavigateToAsk?: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  language: LanguageType;
  onLanguageChange: (lang: LanguageType) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentPage, 
  onToggleSidebar, 
  onNavigateToAsk,
  theme,
  onToggleTheme,
  user,
  onOpenLogin,
  onLogout,
  language,
  onLanguageChange,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  const PAGE_DETAILS: Record<NavigationPage, { title: string; subtitle: string }> = {
    dashboard: {
      title: t.dashboard,
      subtitle: 'High-level status of indexed knowledge and query operations',
    },
    documents: {
      title: t.knowledgeDocumentsHeading,
      subtitle: t.knowledgeDocumentsDesc,
    },
    ask: {
      title: t.askKnowledgeHeading,
      subtitle: t.askKnowledgeDesc,
    },
    history: {
      title: t.queryHistoryHeading,
      subtitle: 'Audit trail of past questions, retrieved citations, and confidence scores',
    },
    settings: {
      title: t.settingsHeading,
      subtitle: '',
    },
  };

  const { title, subtitle } = PAGE_DETAILS[currentPage];

  const notifications = [
    {
      id: 1,
      title: 'Corpus Indexing Complete',
      time: '12m ago',
      desc: 'Project_Proposal.docx and Research_Paper.pdf indexed into 498 chunks.',
    },
    {
      id: 2,
      title: 'Voice Transcription Ready',
      time: '1h ago',
      desc: 'Client-side audio capture pipeline calibrated for 16kHz speech input.',
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 backdrop-blur-xs sm:px-6 transition-colors duration-200">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {/* Right: Notifications, Quick Actions, Language, Theme & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Ask Question Quick Action if not already on ask page */}
        {currentPage !== 'ask' && onNavigateToAsk && (
          <button
            onClick={onNavigateToAsk}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t.askKnowledge}</span>
          </button>
        )}

        {/* Language Quick Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="inline-flex items-center gap-1.5 rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-xs font-semibold"
            title="Language Preference"
            aria-label="Language selection"
          >
            <Languages className="h-4.5 w-4.5" />
            <span className="hidden md:inline font-sans">{language}</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-lg z-50 animate-in fade-in">
              {(['English', 'Hindi', 'Marathi'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onLanguageChange(lang);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    language === lang
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {lang === 'English' && 'English'}
                  {lang === 'Hindi' && 'हिंदी (Hindi)'}
                  {lang === 'Marathi' && 'मराठी (Marathi)'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle dark/light mode"
        >
          {theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5 text-amber-400" />
          ) : (
            <Moon className="h-4.5 w-4.5 text-slate-600" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-blue-600"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  System Notifications
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Login Button */}
        <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800">
          {user ? (
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-blue-700 to-indigo-600 text-xs font-bold text-white shadow-xs focus:ring-2 focus:ring-blue-500"
              aria-label="User menu"
            >
              {user.name.slice(0, 2).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{t.signIn}</span>
            </button>
          )}

          {/* Profile Dropdown */}
          {user && showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-lg z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">{user.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">@{user.username}</div>
                <div className="mt-1 inline-block rounded bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                  {user.role}
                </div>
              </div>
              <div className="pt-1.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t.signOut}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
