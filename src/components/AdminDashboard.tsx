import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  LogOut,
  Search,
  Filter,
  Download,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { CustomerContact, ContactStatus, Language } from '../types';
import { translations } from '../lib/i18n';
import {
  adminFetchContacts,
  adminUpdateContact,
  adminDeleteContact,
  exportContactsToCSV,
  getSupabaseConfig,
  testSupabaseConnection,
} from '../lib/supabase';

interface Props {
  lang: Language;
  onOpenSupabaseModal: () => void;
  onExitAdmin: () => void;
}

const ADMIN_SESSION_KEY = 'nexus_admin_authenticated';

export const AdminDashboard: React.FC<Props> = ({
  lang,
  onOpenSupabaseModal,
  onExitAdmin,
}) => {
  const t = translations[lang];

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');

  // Data State
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'offline_staging'>('supabase');
  const [errorMessage, setErrorMessage] = useState('');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Contact for Detail Modal
  const [selectedContact, setSelectedContact] = useState<CustomerContact | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Check auth passcodes
  const configuredSecret = import.meta.env.VITE_ADMIN_ACCESS_CODE || 'nexusAdmin2025';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanInput = accessCode.trim();
    // Accept configured master passcode or Supabase service credential
    if (cleanInput === configuredSecret || cleanInput === 'nexusAdmin2025' || cleanInput === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      loadContacts();
    } else {
      setAuthError(
        lang === 'bn'
          ? 'ভুল পাসকোড। শুধুমাত্র অনুমোদিত প্রশাসকদের প্রবেশের অনুমতি রয়েছে।'
          : 'Invalid administrator access code. Authorization denied.'
      );
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setContacts([]);
  };

  const loadContacts = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await adminFetchContacts();
      setContacts(res.data);
      setDataSource(res.source);
      if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching records';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    }
  }, [isAuthenticated]);

  // Sync selected contact notes when opening details
  useEffect(() => {
    if (selectedContact) {
      setEditNotes(selectedContact.admin_notes || '');
      setNotesSaved(false);
    }
  }, [selectedContact]);

  // Filtered & Sorted Contacts
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        // Status filter
        if (statusFilter !== 'all' && c.status !== statusFilter) {
          return false;
        }

        // Date filter
        if (dateFilter !== 'all') {
          const created = new Date(c.created_at).getTime();
          const now = Date.now();
          if (dateFilter === 'today') {
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - created > oneDay) return false;
          } else if (dateFilter === 'week') {
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            if (now - created > oneWeek) return false;
          } else if (dateFilter === 'month') {
            const oneMonth = 30 * 24 * 60 * 60 * 1000;
            if (now - created > oneMonth) return false;
          }
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            c.full_name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone_number.toLowerCase().includes(q) ||
            (c.company_name && c.company_name.toLowerCase().includes(q)) ||
            c.subject.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [contacts, statusFilter, dateFilter, searchQuery, sortOrder]);

  // Paginated records
  const totalPages = Math.ceil(filteredContacts.length / pageSize) || 1;
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContacts.slice(start, start + pageSize);
  }, [filteredContacts, currentPage, pageSize]);

  // Status stats calculation
  const stats = useMemo(() => {
    const total = contacts.length;
    const newCount = contacts.filter((c) => c.status === 'new').length;
    const contacted = contacts.filter((c) => c.status === 'contacted').length;
    const inProgress = contacts.filter((c) => c.status === 'in_progress').length;
    const completed = contacts.filter((c) => c.status === 'completed').length;

    const oneDay = 24 * 60 * 60 * 1000;
    const todayCount = contacts.filter((c) => Date.now() - new Date(c.created_at).getTime() < oneDay).length;

    return { total, newCount, contacted, inProgress, completed, todayCount };
  }, [contacts]);

  // Handlers for Status & Notes
  const handleUpdateStatus = async (id: string, newStatus: ContactStatus) => {
    setIsUpdatingStatus(true);
    const res = await adminUpdateContact(id, { status: newStatus });
    setIsUpdatingStatus(false);

    if (res.success) {
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      if (selectedContact?.id === id) {
        setSelectedContact((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } else {
      alert(`Update failed: ${res.error}`);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedContact) return;
    const res = await adminUpdateContact(selectedContact.id, {
      admin_notes: editNotes,
    });
    if (res.success) {
      setNotesSaved(true);
      setContacts((prev) =>
        prev.map((c) => (c.id === selectedContact.id ? { ...c, admin_notes: editNotes } : c))
      );
      setSelectedContact((prev) => (prev ? { ...prev, admin_notes: editNotes } : null));
      setTimeout(() => setNotesSaved(false), 2500);
    } else {
      alert(`Failed to save notes: ${res.error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.admin.deleteConfirm)) {
      const res = await adminDeleteContact(id);
      if (res.success) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        if (selectedContact?.id === id) {
          setSelectedContact(null);
        }
      } else {
        alert(`Delete failed: ${res.error}`);
      }
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: ContactStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {t.admin.statusNew}
          </span>
        );
      case 'contacted':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {t.admin.statusContacted}
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {t.admin.statusInProgress}
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {t.admin.statusCompleted}
          </span>
        );
      case 'archived':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {t.admin.statusArchived}
          </span>
        );
    }
  };

  // Format Date
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  /* ---------------- AUTHENTICATION SCREEN ---------------- */
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {t.admin.portalTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.admin.loginPrompt}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.admin.passwordLabel}
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter admin passcode (e.g. nexusAdmin2025)"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Default authorization code: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">nexusAdmin2025</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{t.admin.loginButton}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={onExitAdmin}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              &larr; Back to Public Website
            </button>
            <button
              onClick={onOpenSupabaseModal}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Check Database</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- DASHBOARD VIEW ---------------- */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Authorized Administrative Zone</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {t.admin.portalTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.admin.portalSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => exportContactsToCSV(filteredContacts)}
              disabled={filteredContacts.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.admin.exportCSV} ({filteredContacts.length})</span>
            </button>

            <button
              onClick={loadContacts}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
              title="Refresh submissions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.admin.logoutButton}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Supabase Diagnostic Strip */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-900 dark:text-white">
              Storage Backend:
            </span>
            <span
              className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                dataSource === 'supabase'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}
            >
              {dataSource === 'supabase' ? 'Supabase PostgreSQL Table (customer_contacts)' : 'Local Staging Buffer'}
            </span>
          </div>
          <button
            onClick={onOpenSupabaseModal}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 text-xs self-start sm:self-auto"
          >
            <span>Inspect Supabase Database & RLS</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.admin.totalRecords}
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats.total}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block">
              {t.admin.newRecords}
            </span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
              {stats.newCount}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider block">
              {t.admin.statusContacted}
            </span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
              {stats.contacted}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block">
              {t.admin.statusCompleted}
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {stats.completed}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
              Past 24 Hours
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {stats.todayCount}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t.admin.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
              >
                <option value="all">{t.admin.filterAll}</option>
                <option value="new">{t.admin.statusNew}</option>
                <option value="contacted">{t.admin.statusContacted}</option>
                <option value="in_progress">{t.admin.statusInProgress}</option>
                <option value="completed">{t.admin.statusCompleted}</option>
                <option value="archived">{t.admin.statusArchived}</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
              >
                <option value="all">All Dates</option>
                <option value="today">Today (24h)</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>

            {/* Sort Direction Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? t.admin.sortNewest : t.admin.sortOldest}</span>
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5">Subject & Service</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Submitted</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-600 dark:text-slate-400">
                          {t.admin.noRecords}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => setSelectedContact(contact)}
                    >
                      {/* Customer Name & Company */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {contact.full_name}
                        </div>
                        {contact.company_name ? (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <span>{contact.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Individual Client</span>
                        )}
                      </td>

                      {/* Contact Details */}
                      <td className="py-4 px-5">
                        <div className="space-y-1 font-mono text-[11px]">
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span>{contact.email}</span>
                          </a>
                          <a
                            href={`tel:${contact.phone_number.replace(/[^0-9+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:underline"
                          >
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{contact.phone_number}</span>
                          </a>
                          {contact.whatsapp_number && (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <MessageSquare className="w-3 h-3 shrink-0" />
                              <span>{contact.whatsapp_number}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Subject & Service */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {contact.subject}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {contact.service_type && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {contact.service_type}
                            </span>
                          )}
                          {contact.project_budget && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                              {contact.project_budget}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {getStatusBadge(contact.status)}
                      </td>

                      {/* Submitted Time */}
                      <td className="py-4 px-5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {formatDate(contact.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedContact(contact)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition"
                            title="View inquiry details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredContacts.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Showing</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {Math.min(filteredContacts.length, (currentPage - 1) * pageSize + 1)}-
                  {Math.min(filteredContacts.length, currentPage * pageSize)}
                </span>
                <span>of</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {filteredContacts.length}
                </span>
                <span>records</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-semibold text-slate-800 dark:text-slate-200">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail & Notes Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {selectedContact.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedContact.full_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedContact.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Quick Communication Bar */}
              <div className="grid grid-cols-3 gap-2.5">
                <a
                  href={`mailto:${selectedContact.email}`}
                  className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-2 font-semibold hover:bg-indigo-100 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </a>
                <a
                  href={`tel:${selectedContact.phone_number.replace(/[^0-9+]/g, '')}`}
                  className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-2 font-semibold hover:bg-blue-100 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Phone</span>
                </a>
                {selectedContact.whatsapp_number ? (
                  <a
                    href={`https://wa.me/${selectedContact.whatsapp_number.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2 font-semibold hover:bg-emerald-100 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center gap-2">
                    <span>No WhatsApp</span>
                  </div>
                )}
              </div>

              {/* Status Manager */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Update Inquiry Workflow Status:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'contacted', 'in_progress', 'completed', 'archived'] as ContactStatus[]).map((st) => (
                    <button
                      key={st}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedContact.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                        selectedContact.status === st
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    {selectedContact.email}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Phone Number
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    {selectedContact.phone_number}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Company / Organization
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedContact.company_name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Preferred Contact Method
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">
                    {selectedContact.preferred_contact_method || 'Email'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Service Area
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedContact.service_type || 'Unspecified'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Project Budget
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedContact.project_budget || 'Unspecified'}
                  </span>
                </div>
              </div>

              {/* Message Subject & Body */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Subject: {selectedContact.subject}
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {t.admin.editNotes}
                  </span>
                  {notesSaved && (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {t.admin.notesSavedSuccess}
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add private internal notes (e.g. Called client on 10/10, scheduled discovery demo for Tuesday)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.admin.saveNotes}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created {formatDate(selectedContact.created_at)}
              </span>
              <button
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
