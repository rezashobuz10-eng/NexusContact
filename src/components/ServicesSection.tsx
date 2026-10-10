import React from 'react';
import {
  Code2,
  Smartphone,
  Database,
  Layers,
  CloudCog,
  Headphones,
  ArrowUpRight,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface Props {
  lang: Language;
}

export const ServicesSection: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];

  const icons = [
    <Code2 className="w-5 h-5 text-indigo-500" key="0" />,
    <Smartphone className="w-5 h-5 text-blue-500" key="1" />,
    <Database className="w-5 h-5 text-emerald-500" key="2" />,
    <Layers className="w-5 h-5 text-purple-500" key="3" />,
    <CloudCog className="w-5 h-5 text-sky-500" key="4" />,
    <Headphones className="w-5 h-5 text-amber-500" key="5" />,
  ];

  const scrollToContact = () => {
    const el = document.getElementById('contact-form');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="services" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {lang === 'bn' ? 'আমাদের দক্ষতাসমূহ' : 'Core Capabilities'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.services.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t.services.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.services.items.map((service, index) => (
            <div
              key={index}
              onClick={scrollToContact}
              className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                    {icons[index % icons.length]}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {service.tag}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {service.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {service.desc}
                </p>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-4">
                <span>{lang === 'bn' ? 'অনুসন্ধান পাঠান' : 'Inquire for Project'}</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
