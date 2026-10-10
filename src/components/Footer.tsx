import React from 'react';
import {
  ShieldCheck,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Lock,
  Heart,
  Database,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface Props {
  lang: Language;
  onOpenPrivacyModal: () => void;
  onOpenSupabaseModal: () => void;
  onNavigateAdmin: () => void;
}

export const Footer: React.FC<Props> = ({
  lang,
  onOpenPrivacyModal,
  onOpenSupabaseModal,
  onNavigateAdmin,
}) => {
  const t = translations[lang];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const whatsappMessage = encodeURIComponent(
    lang === 'bn'
      ? 'হ্যালো NexusContact, আমি আপনাদের সেবা সম্পর্কে একটি নতুন অনুসন্ধান জানাতে চাই।'
      : 'Hello NexusContact, I would like to inquire about your services and discuss a project.'
  );

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800 text-xs">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-black text-white">
                  {t.nav.brand}
                </span>
                <span className="block text-[11px] text-slate-400">
                  {t.nav.tagline}
                </span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {t.footer.tagline}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={onOpenSupabaseModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase PostgreSQL Active</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollTo('contact-form')}
                  className="hover:text-indigo-400 transition"
                >
                  {t.nav.contact}
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('services')}
                  className="hover:text-indigo-400 transition"
                >
                  {t.nav.services}
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('why-us')}
                  className="hover:text-indigo-400 transition"
                >
                  {t.nav.whyUs}
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('faq')}
                  className="hover:text-indigo-400 transition"
                >
                  {t.nav.faq}
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPrivacyModal}
                  className="hover:text-indigo-400 transition text-indigo-300 font-medium"
                >
                  {t.footer.privacyNotice}
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Contact Channels */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">
              {t.footer.contactInfo}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${t.footer.email}`}
                  className="flex items-center gap-2.5 hover:text-white transition group"
                >
                  <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="group-hover:underline">{t.footer.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${t.footer.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-2.5 hover:text-white transition group"
                >
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="group-hover:underline">{t.footer.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/18005550199?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition group text-emerald-400"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="group-hover:underline font-semibold">{t.footer.whatsapp}</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400 pt-1">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t.footer.hours}</span>
              </li>
            </ul>
          </div>

          {/* Admin & Security Column */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">
              {lang === 'bn' ? 'নিরাপত্তা ও প্রশাসন' : 'Governance & Admin'}
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Customer inquiries are strictly private and accessible only by authorized team leads through cryptographic session tokens.
            </p>
            <div className="pt-2">
              <button
                onClick={onNavigateAdmin}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 transition border border-slate-700 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.footer.adminPortal}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} {t.nav.brand}. {t.footer.rights}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPrivacyModal}
              className="hover:text-white transition underline"
            >
              {t.footer.privacyNotice}
            </button>
            <span>&bull;</span>
            <button
              onClick={onOpenSupabaseModal}
              className="hover:text-white transition underline"
            >
              Supabase PostgreSQL RLS
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
