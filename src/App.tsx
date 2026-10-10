/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ContactForm } from './components/ContactForm';
import { ServicesSection } from './components/ServicesSection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Language, Theme } from './types';

import { getSupabaseConfig } from './lib/supabase';
import { Database, ArrowRight } from 'lucide-react';

export default function App() {
  const [supabaseConfigState, setSupabaseConfigState] = useState(() => getSupabaseConfig());

  // Language State
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('nexus_lang') as Language;
    return saved === 'bn' ? 'bn' : 'en';
  });

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('nexus_theme') as Theme;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // View state: 'home' | 'admin'
  const [currentView, setCurrentView] = useState<'home' | 'admin'>(() => {
    return window.location.pathname.startsWith('/admin') || window.location.hash === '#admin'
      ? 'admin'
      : 'home';
  });

  // Modals
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Sync theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  // Sync language to document element
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('nexus_lang', lang);
  }, [lang]);

  // URL Hash routing listener for #admin or /admin
  useEffect(() => {
    const handleLocationChange = () => {
      const isHashAdmin = window.location.hash === '#admin';
      const isPathAdmin = window.location.pathname.startsWith('/admin');
      if (isHashAdmin || isPathAdmin) {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleNavigateAdmin = () => {
    window.location.hash = 'admin';
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitAdmin = () => {
    window.location.hash = '';
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col ${lang === 'bn' ? 'font-bangla' : ''}`}>
      {/* Top Navigation */}
      <Navbar
        lang={lang}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        onNavigateAdmin={handleNavigateAdmin}
        currentView={currentView}
      />

      {/* Connection Notice Banner if Supabase is unconfigured */}
      {!supabaseConfigState.isConfigured && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs py-2.5 px-4 font-medium shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center">
              <Database className="w-4 h-4 shrink-0 animate-bounce" />
              <span>
                {lang === 'bn'
                  ? 'আপনার ওয়েবসাইটটি সরাসরি Supabase ডাটাবেজের সাথে কানেক্ট করতে চান?'
                  : 'Ready to connect your website directly to your Supabase PostgreSQL database?'}
              </span>
            </div>
            <button
              onClick={() => setSupabaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-amber-900 font-bold hover:bg-amber-50 transition shadow-xs cursor-pointer text-[11px]"
            >
              <span>{lang === 'bn' ? 'সুপাবেজ কানেক্ট করুন' : 'Connect Supabase Now'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'admin' ? (
          <AdminDashboard
            lang={lang}
            onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
            onExitAdmin={handleExitAdmin}
          />
        ) : (
          <>
            <Hero lang={lang} />
            <ContactForm
              lang={lang}
              onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
              onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
            />
            <ServicesSection lang={lang} />
            <WhyChooseUs lang={lang} />
            <FaqSection lang={lang} />
          </>
        )}
      </main>

      {/* Footer (Always shown on public site, minimal in admin) */}
      {currentView === 'home' && (
        <Footer
          lang={lang}
          onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          onNavigateAdmin={handleNavigateAdmin}
        />
      )}

      {/* Modals */}
      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        lang={lang}
      />

      <SupabaseSetupModal
        isOpen={supabaseModalOpen}
        onClose={() => {
          setSupabaseModalOpen(false);
          setSupabaseConfigState(getSupabaseConfig());
        }}
        lang={lang}
      />
    </div>
  );
}
