import React from 'react';
import {
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Database,
  Lock,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { Language, Theme } from '../types';
import { translations } from '../lib/i18n';
import { getSupabaseConfig } from '../lib/supabase';

interface Props {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSupabaseModal: () => void;
  onNavigateAdmin: () => void;
  currentView: 'home' | 'admin';
}

export const Navbar: React.FC<Props> = ({
  lang,
  onLanguageChange,
  theme,
  onToggleTheme,
  onOpenSupabaseModal,
  onNavigateAdmin,
  currentView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const t = translations[lang];
  const config = getSupabaseConfig();

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (currentView === 'admin') {
      window.location.hash = '';
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div
            onClick={() => {
              if (currentView === 'admin') {
                window.location.hash = '';
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                {t.nav.brand}
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
                  Postgres
                </span>
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t.nav.tagline}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          {currentView === 'home' && (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
              <button
                onClick={() => scrollTo('contact-form')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                {t.nav.contact}
              </button>
              <button
                onClick={() => scrollTo('services')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                {t.nav.services}
              </button>
              <button
                onClick={() => scrollTo('why-us')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                {t.nav.whyUs}
              </button>
              <button
                onClick={() => scrollTo('faq')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                {t.nav.faq}
              </button>
            </nav>
          )}

          {/* Controls & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Supabase Status Pill */}
            <button
              onClick={onOpenSupabaseModal}
              title="Click to check or configure Supabase database"
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                config.isConfigured
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span className="truncate max-w-[110px]">
                {config.isConfigured ? t.nav.connected : t.nav.setupNeeded}
              </span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(lang === 'en' ? 'bn' : 'en')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              title="Switch Language / ভাষা পরিবর্তন"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Admin Portal Button */}
            {currentView === 'home' ? (
              <button
                onClick={onNavigateAdmin}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t.nav.adminPortal}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  window.location.hash = '';
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
              >
                <span>&larr; Back to Website</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-3 shadow-lg">
          {currentView === 'home' && (
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <button
                onClick={() => scrollTo('contact-form')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.nav.contact}
              </button>
              <button
                onClick={() => scrollTo('services')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.nav.services}
              </button>
              <button
                onClick={() => scrollTo('why-us')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.nav.whyUs}
              </button>
              <button
                onClick={() => scrollTo('faq')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.nav.faq}
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSupabaseModal();
              }}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                {t.nav.supabaseConfig}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
            {currentView === 'home' && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateAdmin();
                }}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-indigo-600 text-white text-xs font-bold"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t.nav.adminPortal}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
