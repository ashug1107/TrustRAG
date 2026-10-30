import React from 'react';
import { Database, X } from 'lucide-react';
import { LanguageType } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageType;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close authentication notice"
        className="fixed inset-0 cursor-default bg-slate-900/50 backdrop-blur-xs"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-notice-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              TrustRAG
            </p>
            <h2 id="auth-notice-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {t.loginTitle}
            </h2>
          </div>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Authentication is not connected yet. No credentials are requested, sent, or stored by this frontend.
          Connect this screen after the Python backend authentication contract is confirmed.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Close
        </button>
      </section>
    </div>
  );
};
