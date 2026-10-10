import React from 'react';
import { ShieldCheck, Zap, Eye, Cpu } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface Props {
  lang: Language;
}

export const WhyChooseUs: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];

  const icons = [
    <ShieldCheck className="w-6 h-6 text-indigo-500" key="0" />,
    <Zap className="w-6 h-6 text-amber-500" key="1" />,
    <Eye className="w-6 h-6 text-blue-500" key="2" />,
    <Cpu className="w-6 h-6 text-emerald-500" key="3" />,
  ];

  return (
    <section id="why-us" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {lang === 'bn' ? 'আমাদের বিশেষত্ব' : 'Enterprise Guarantees'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.whyUs.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t.whyUs.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.whyUs.cards.map((card, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                {icons[idx]}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {card.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
