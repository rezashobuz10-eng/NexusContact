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

export default function App() {
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
        onClose={() => setSupabaseModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
