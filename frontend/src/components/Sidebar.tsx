import React from 'react';
import { 
  LayoutDashboard, 
  Files, 
  MessageSquare, 
  History, 
  Settings, 
  Database,
  CheckCircle2, 
  X,
  Sparkles,
  LogIn,
  LogOut
} from 'lucide-react';
import { User, LanguageType, NavigationPage } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  isOpen: boolean;
  onClose: () => void;
  documentsCount: number;
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  language: LanguageType;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  documentsCount,
  user,
  onOpenLogin,
  onLogout,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  const navItems = [
    { id: 'dashboard' as const, label: t.dashboard, icon: LayoutDashboard },
    { id: 'documents' as const, label: t.documents, icon: Files, badge: documentsCount },
    { id: 'ask' as const, label: t.askKnowledge, icon: MessageSquare, highlight: true },
    { id: 'history' as const, label: t.history, icon: History },
    { id: 'settings' as const, label: t.settings, icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-68 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex h-18 items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">KnowAI</span>
                <span className="rounded-sm bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Knowledge Retrieval System</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Platform Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4.5 w-4.5 transition-colors ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.highlight && !isActive && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                      <Sparkles className="h-3 w-3" /> Core
                    </span>
                  )}

                  {typeof item.badge === 'number' && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-4">
          {/* Status Indicator */}
          <div className="mb-3 flex items-center justify-between rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
              </span>
              <span>{t.systemOnline}</span>
            </div>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* User Profile or Login Trigger */}
          {user ? (
            <div className="flex items-center justify-between rounded-xl p-2 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {user.name}
                  </div>
                  <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                    @{user.username}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={t.signOut}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 p-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>{t.signIn}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
