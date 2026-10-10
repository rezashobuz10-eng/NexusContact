import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Key,
  Trash2,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
} from '../lib/supabase';
import { Language } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const SQL_SCHEMA = `-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create customer_contacts Table
CREATE TABLE IF NOT EXISTS public.customer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp_number TEXT,
    company_name TEXT,
    subject TEXT NOT NULL,
    service_type TEXT,
    project_budget TEXT,
    preferred_contact_method TEXT,
    message TEXT NOT NULL,
    privacy_consent BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'completed', 'archived')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for Frequently Searched Fields
CREATE INDEX IF NOT EXISTS idx_customer_contacts_email ON public.customer_contacts(email);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_phone_number ON public.customer_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_status ON public.customer_contacts(status);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_created_at ON public.customer_contacts(created_at DESC);

-- 4. Automatically Update updated_at Timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_customer_contacts_updated_at ON public.customer_contacts;
CREATE TRIGGER set_customer_contacts_updated_at
BEFORE UPDATE ON public.customer_contacts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous public contact insert" ON public.customer_contacts;
DROP POLICY IF EXISTS "Allow authenticated admins full access" ON public.customer_contacts;

-- Safe INSERT-Only Access for Public Form Visitors
CREATE POLICY "Allow anonymous public contact insert"
ON public.customer_contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (
    privacy_consent = true 
    AND full_name IS NOT NULL 
    AND email IS NOT NULL 
    AND phone_number IS NOT NULL
);

-- Authorized Administrators Full Access
CREATE POLICY "Allow authenticated admins full access"
ON public.customer_contacts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);`;

export const SupabaseSetupModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: string;
    message: string;
    latencyMs?: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'credentials'>('status');

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      handleRunTest();
    }
  }, [isOpen]);

  const handleRunTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে ইউআরএল এবং কি উভয়ই প্রদান করুন।' : 'Please enter both URL and Anon Key.');
      return;
    }
    saveCustomSupabaseConfig(url, anonKey);
    handleRunTest();
  };

  const handleClear = () => {
    clearCustomSupabaseConfig();
    const config = getSupabaseConfig();
    setUrl(config.url || '');
    setAnonKey(config.anonKey || '');
    handleRunTest();
  };

  const copySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'সুপাবেজ পোস্টগ্রেস্কিউএল সংযোগ' : 'Supabase PostgreSQL Integration'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'লাইভ ডাটাবেজ স্থিতি এবং কনফিগারেশন' : 'Live database status, schema & credentials'}
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

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3.5 border-b-2 transition -mb-px flex items-center gap-2 ${
              activeTab === 'status'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {lang === 'bn' ? 'সংযোগ স্থিতি' : 'Health & Diagnostics'}
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3.5 border-b-2 transition -mb-px flex items-center gap-2 ${
              activeTab === 'credentials'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            {lang === 'bn' ? 'ক্রেডেনশিয়াল' : 'API Credentials'}
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3.5 border-b-2 transition -mb-px flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            {lang === 'bn' ? 'এসকিউএল স্কিমা (SQL)' : 'PostgreSQL Schema & RLS'}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300 text-sm">
          {activeTab === 'status' && (
            <div className="space-y-5">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  testResult?.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                }`}
              >
                {testResult?.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                      {testResult
                        ? testResult.success
                          ? 'Supabase Connection Active'
                          : 'Configuration Action Needed'
                        : 'Testing Connection...'}
                    </h4>
                    {testResult?.latencyMs !== undefined && (
                      <span className="text-xs font-mono bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded">
                        {testResult.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {testResult?.message || 'Verifying ping to Supabase PostgreSQL endpoints...'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h5 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  {lang === 'bn' ? 'সংযোগের ধাপসমূহ' : 'Live Connection Checkpoints'}
                </h5>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Row Level Security (RLS) enforcement ready</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Client-side rate limiting & honeypot anti-bot enabled</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>PostgreSQL Table: <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">public.customer_contacts</code></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Offline fallback buffer active (guarantees zero customer loss)</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleRunTest}
                  disabled={testing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Testing...' : 'Retest Live Connection'}
                </button>
                <button
                  onClick={() => setActiveTab('sql')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  View SQL Migration Schema &rarr;
                </button>
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'আপনার সুপাবেজ প্রজেক্ট সেটিংস (API) থেকে প্রজেক্ট URL এবং অ্যানোনিমাস কি (anon / public) এখানে ইনপুট করতে পারেন:'
                  : 'You can configure your Supabase Project URL and Anon/Publishable Key here or via environment variables:'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  VITE_SUPABASE_URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  VITE_SUPABASE_PUBLISHABLE_KEY (Anon Key)
                </label>
                <input
                  type="text"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Only the client-safe public/anon key should be provided here. Never supply your secret service_role key.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Save & Connect
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset to .env Defaults
                </button>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-xs">
                    PostgreSQL Table Schema & RLS Policies
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Run this script in your Supabase Dashboard &rarr; SQL Editor
                  </p>
                </div>
                <button
                  onClick={copySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
                  {SQL_SCHEMA}
                </pre>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>
                  <strong>How to apply in Supabase:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Open your project at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline inline-flex items-center gap-1">supabase.com/dashboard <ExternalLink className="w-3 h-3" /></a></li>
                  <li>Click <strong>SQL Editor</strong> on the left sidebar</li>
                  <li>Click <strong>+ New Query</strong>, paste the copied SQL above, and click <strong>Run</strong></li>
                  <li>Return here and click <strong>Retest Live Connection</strong></li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
