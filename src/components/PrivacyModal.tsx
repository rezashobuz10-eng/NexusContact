import React from 'react';
import { X, ShieldCheck, Lock, UserCheck, Trash2, Mail } from 'lucide-react';
import { Language } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const PrivacyModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'গোপনীয়তা ও ডেটা সুরক্ষা নীতিমালা' : 'Privacy Notice & Data Protection Policy'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'আপনার তথ্যের নিরাপত্তা ও অধিকার বিষয়ক নির্দেশিকা' : 'How customer information is gathered, protected, and managed'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              {lang === 'bn' ? '১. কেন আমরা তথ্য সংগ্রহ করি' : '1. Purpose of Data Collection'}
            </h4>
            <p>
              {lang === 'bn'
                ? 'আমরা শুধুমাত্র আপনার অনুসন্ধানের যথাযথ উত্তর প্রদান, প্রকল্পের সম্ভাব্য সুযোগ আলোচনা এবং পারস্পরিক ব্যবসায়িক যোগাযোগ রক্ষার উদ্দেশ্যে প্রয়োজনীয় তথ্যাদি সংগ্রহ করি। আমরা কোনো অবস্থাতেই আপনার সম্মতি ব্যতিরেকে অনির্দিষ্ট মার্কেটিং বার্তা প্রেরণ করি না।'
                : 'We collect only the information strictly necessary to evaluate your inquiry, prepare relevant project proposals, and maintain direct communication. We never sell, rent, or lease your contact information to third parties, nor do we send unsolicited marketing emails without your explicit consent.'}
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {lang === 'bn' ? '২. ডেটাবেজ নিরাপত্তা ও রো-লেভেল সিকিউরিটি (RLS)' : '2. Storage & Row Level Security (RLS)'}
            </h4>
            <p>
              {lang === 'bn'
                ? 'আপনার তথ্যাদি সুপাবেজ পোস্টগ্রেস্কিউএল ডেটাবেজে সংরক্ষিত হয়। রো-লেভেল সিকিউরিটির (RLS) মাধ্যমে সাধারণ বা অননুমোদিত ব্যবহারকারীদের ডেটা পড়া সম্পূর্ণ অবরুদ্ধ থাকে। কেবল অনুমোদিত সিস্টেম অ্যাডমিনিস্ট্রেটরদের কাছেই এই ডেটা অ্যাক্সেসের অনুমতি থাকে।'
                : 'All customer contact inquiries are stored inside a secure PostgreSQL database on Supabase with Row Level Security (RLS) enabled. Public visitors can only submit contact inquiries (INSERT); they are strictly forbidden from viewing, listing, or querying existing customer records.'}
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-500" />
              {lang === 'bn' ? '৩. তথ্যের সত্যতা ও যাচাইকরণ স্বচ্ছতা' : '3. Verification Transparency'}
            </h4>
            <p>
              {lang === 'bn'
                ? 'ফর্মে জমাকৃত ইমেইল বা ফোন নম্বর স্বয়ংক্রিয়ভাবে যাচাইকৃত বলে দাবি করা হয় না। আমাদের সংশ্লিষ্ট দল যোগাযোগের পূর্বে স্বাভাবিক প্রটোকল অনুসারে সত্যতা পর্যালোচনা করে থাকেন।'
                : 'We do not claim or record that an entered email or phone number is pre-verified merely because it was submitted through the web form. Verification takes place through human representative outreach.'}
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              {lang === 'bn' ? '৪. তথ্য সংশোধন ও স্থায়ীভাবে মুছে ফেলার অধিকার' : '4. Data Rectification & Deletion Requests'}
            </h4>
            <p>
              {lang === 'bn'
                ? 'জিডিপিআর এবং ভোক্তা অধিকার অনুসারে, আপনি যেকোনো সময় আপনার ব্যক্তিগত তথ্য সংশোধন বা আমাদের সার্ভার থেকে স্থায়ীভাবে মুছে ফেলার আবেদন করতে পারেন।'
                : 'In accordance with modern privacy frameworks (including GDPR & CCPA principles), you retain full rights to request access to your submitted data, request corrections, or ask for complete, irreversible deletion from our customer records.'}
            </p>
          </section>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                privacy@nexuscontact.internal
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'গোপনীয়তা প্রতিনিধি' : 'Dedicated DPO Contact'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
          >
            {lang === 'bn' ? 'বুঝেছি / বন্ধ করুন' : 'I Understand & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
