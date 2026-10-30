import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Laptop, 
  Mic, 
  Languages, 
  Database, 
  Server, 
  CheckCircle2, 
  Save,
  User as UserIcon,
  LogIn,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { AppSettings, LanguageType, User } from '../types';
import { API_CONFIG } from '../services/api';
import { TRANSLATIONS } from '../data/translations';

interface SettingsPageProps {
  currentTheme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  currentLanguage: LanguageType;
  onLanguageChange: (language: LanguageType) => void;
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  voiceInputEnabled: boolean;
  onVoiceInputChange: (enabled: boolean) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentTheme,
  onThemeChange,
  currentLanguage,
  onLanguageChange,
  user,
  onOpenLogin,
  onLogout,
  voiceInputEnabled,
  onVoiceInputChange,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.English;

  const [settings, setSettings] = useState<AppSettings>({
    theme: currentTheme,
    language: currentLanguage,
    voiceInputEnabled,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleThemeSelect = (selectedTheme: 'light' | 'dark' | 'system') => {
    setSettings((prev) => ({ ...prev, theme: selectedTheme }));
    onThemeChange(selectedTheme);
  };

  const handleLanguageSelect = (selectedLang: LanguageType) => {
    setSettings((prev) => ({ ...prev, language: selectedLang }));
    onLanguageChange(selectedLang);
  };

  const handleSave = () => {
    localStorage.setItem('knowai_settings', JSON.stringify(settings));
    onThemeChange(settings.theme);
    onLanguageChange(settings.language);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {t.settingsHeading}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure appearance, language preferences, voice input, and user credentials.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Card 1: Appearance (Dark & Light Mode) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sun className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Appearance (Theme)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toggle between Dark Mode and Light Mode
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light' as const, label: t.lightMode, icon: Sun },
            { id: 'dark' as const, label: t.darkMode, icon: Moon },
            { id: 'system' as const, label: t.systemMode, icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = currentTheme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleThemeSelect(item.id)}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card 2: Language Preference (English, Hindi, Marathi only) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Languages className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Language Preference
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select interface language: English, Hindi, or Marathi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'English' as const, title: 'English', sub: 'Default' },
            { id: 'Hindi' as const, title: 'हिंदी (Hindi)', sub: 'भारतीय भाषा' },
            { id: 'Marathi' as const, title: 'मराठी (Marathi)', sub: 'राज्यभाषा' },
          ].map((lang) => {
            const isSelected = currentLanguage === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleLanguageSelect(lang.id)}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`text-xs font-bold ${isSelected ? 'text-blue-800 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'}`}>
                  {lang.title}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card 3: User Authentication & Account */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <UserIcon className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Account & Credentials
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your login session and access role
            </p>
          </div>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-sm shadow-xs">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{user.name}</span>
                  <span className="rounded-md bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Active Session
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Username: <strong className="text-slate-700 dark:text-slate-200 font-mono">@{user.username}</strong> • Role: {user.role}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenLogin}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Switch Account
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{t.signOut}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Authentication is not connected
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                This frontend has no authenticated session or protected-data access yet.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all shrink-0"
            >
              <LogIn className="h-4 w-4" />
              <span>{t.signIn}</span>
            </button>
          </div>
        )}
      </div>

      {/* Card 4: Voice Input & Audio Capture */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Mic className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Voice Input</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure speech-to-text recording settings</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Voice Input Microphone</span>
              <p className="text-slate-500 dark:text-slate-400">Enable microphone query input in the chat composer</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const enabled = !settings.voiceInputEnabled;
                setSettings({ ...settings, voiceInputEnabled: enabled });
                onVoiceInputChange(enabled);
              }}
              aria-pressed={settings.voiceInputEnabled}
              aria-label="Toggle voice input"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.voiceInputEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.voiceInputEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Card 5: Knowledge Retrieval Defaults */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Database className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Knowledge Retrieval Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Default search pipeline and document scope</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Default query scope</span>
              <p className="text-slate-500 dark:text-slate-400">Choose a document scope for each question in the chat screen.</p>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Per question</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Retrieval Pipeline</span>
              <p className="text-slate-500 dark:text-slate-400">Retrieval strategy and verification details come from the Python API.</p>
            </div>
            <span className="rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-1 font-semibold text-blue-700 dark:text-blue-300 text-[11px]">
              Backend-managed
            </span>
          </div>
        </div>
      </div>

      {/* Card 6: Backend API Configuration */}
      <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-blue-100 dark:border-blue-900/40">
          <Server className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Python API connection</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Base URL comes from the Vite environment, not this preferences screen.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">Configured API base URL</span>
            <code className="block rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {API_CONFIG.baseUrl || 'Not configured'}
            </code>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Confirm the backend host, routes, and response schemas with your teammate before enabling API mode.
            </p>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Proposed routes only — confirm before integration:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <div>• POST /api/documents/upload</div>
              <div>• GET /api/documents</div>
              <div>• DELETE /api/documents/:id</div>
              <div>• POST /api/voice/transcribe</div>
              <div>• POST /api/query</div>
              <div>• GET /api/history</div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs active:scale-98 transition-all"
        >
          <Save className="h-4 w-4" />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
};
