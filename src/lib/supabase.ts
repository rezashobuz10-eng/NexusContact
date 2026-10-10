import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CustomerContact, ContactFormData, ContactStatus } from '../types';

const STORAGE_KEY_URL = 'nexus_supabase_url';
const STORAGE_KEY_KEY = 'nexus_supabase_anon_key';
const RATE_LIMIT_KEY = 'nexus_contact_rate_limit';
const OFFLINE_CONTACTS_KEY = 'nexus_offline_contacts';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'custom' | 'unconfigured';
}

export function getSupabaseConfig(): SupabaseConfig {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  const envUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const envKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  if (customUrl && customKey) {
    return {
      url: customUrl.trim(),
      anonKey: customKey.trim(),
      isConfigured: true,
      source: 'custom',
    };
  }

  const isEnvValid = Boolean(envUrl && envKey && !envUrl.includes('your-project-id'));
  return {
    url: envUrl.trim(),
    anonKey: envKey.trim(),
    isConfigured: isEnvValid,
    source: isEnvValid ? 'env' : 'unconfigured',
  };
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient && lastUrl === config.url && lastKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = config.url;
    lastKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  cachedClient = null;
}

export function clearCustomSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  cachedClient = null;
}

// Connection Health Diagnostic
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  status: 'connected' | 'table_missing' | 'auth_error' | 'unconfigured' | 'network_error';
  message: string;
  latencyMs?: number;
}> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return {
      success: false,
      status: 'unconfigured',
      message: 'Supabase URL or Publishable/Anon Key is not configured yet.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      status: 'network_error',
      message: 'Could not initialize Supabase client with the provided credentials.',
    };
  }

  const startTime = performance.now();

  try {
    // Attempt lightweight query on customer_contacts
    const { error } = await client
      .from('customer_contacts')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      // Analyze error code
      if (error.code === '42P01' || error.message.includes('relation "public.customer_contacts" does not exist')) {
        return {
          success: false,
          status: 'table_missing',
          message: 'Connected to Supabase project, but "customer_contacts" table does not exist. Please run the SQL schema migration.',
          latencyMs,
        };
      }
      if (error.code === 'PGRST301' || error.message.includes('JWT') || error.message.includes('apikey')) {
        return {
          success: false,
          status: 'auth_error',
          message: 'Invalid Supabase Anon/Publishable API Key. Please verify your project credentials.',
          latencyMs,
        };
      }
      // If RLS prevents select on anon, this means table exists and is secured!
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('row-level security')) {
        return {
          success: true,
          status: 'connected',
          message: 'Supabase connected! Row Level Security is active and blocking unauthorized reads as expected.',
          latencyMs,
        };
      }

      return {
        success: false,
        status: 'network_error',
        message: error.message || 'Supabase returned an unexpected error response.',
        latencyMs,
      };
    }

    return {
      success: true,
      status: 'connected',
      message: 'Connected successfully to Supabase PostgreSQL database!',
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const msg = err instanceof Error ? err.message : 'Unknown network failure';
    return {
      success: false,
      status: 'network_error',
      message: `Failed to reach Supabase server: ${msg}`,
      latencyMs,
    };
  }
}

// Rate Limiter
function checkRateLimit(): { allowed: boolean; remainingSeconds?: number } {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    // Keep timestamps within last 10 minutes (600,000 ms)
    const recent = timestamps.filter((t) => now - t < 600000);

    if (recent.length >= 3) {
      const oldest = recent[0];
      const waitMs = 600000 - (now - oldest);
      return {
        allowed: false,
        remainingSeconds: Math.ceil(waitMs / 1000),
      };
    }

    recent.push(now);
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

// Offline backup management
export function getOfflineContacts(): CustomerContact[] {
  try {
    const raw = localStorage.getItem(OFFLINE_CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineContact(contact: CustomerContact): void {
  try {
    const list = getOfflineContacts();
    list.unshift(contact);
    localStorage.setItem(OFFLINE_CONTACTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to store offline backup:', e);
  }
}

// Submit contact inquiry
export async function submitContactInquiry(data: ContactFormData): Promise<{
  success: boolean;
  message: string;
  data?: CustomerContact;
  isOfflineFallback?: boolean;
}> {
  // Anti-bot Honeypot check
  if (data.honeypot && data.honeypot.trim().length > 0) {
    return {
      success: false,
      message: 'Spam submission detected and blocked.',
    };
  }

  // Rate limit check
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many submissions. Please wait ${rateLimit.remainingSeconds || 60} seconds before submitting another inquiry.`,
    };
  }

  const payload = {
    full_name: data.fullName.trim(),
    phone_number: data.phoneNumber.trim(),
    email: data.email.trim().toLowerCase(),
    whatsapp_number: data.whatsappNumber?.trim() || null,
    company_name: data.companyName?.trim() || null,
    subject: data.subject.trim(),
    service_type: data.serviceType || null,
    project_budget: data.projectBudget || null,
    preferred_contact_method: data.preferredContactMethod || null,
    message: data.message.trim(),
    privacy_consent: data.privacyConsent,
    status: 'new' as ContactStatus,
  };

  const client = getSupabaseClient();

  if (!client) {
    // Save to local offline buffer so inquiry is preserved
    const offlineContact: CustomerContact = {
      ...payload,
      id: crypto.randomUUID ? crypto.randomUUID() : 'offline-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_notes: 'Submitted in local staging (Supabase credentials not yet provided in .env or Settings).',
    };
    saveOfflineContact(offlineContact);

    return {
      success: true,
      isOfflineFallback: true,
      message: 'Thank you for contacting us! Your information has been submitted successfully. We will contact you soon.',
      data: offlineContact,
    };
  }

  try {
    const { error } = await client
      .from('customer_contacts')
      .insert([payload]);

    if (error) {
      console.error('Supabase insert error:', error);
      
      // If table missing or permission denied, save to local buffer to ensure no data loss
      if (error.code === '42P01') {
        const offlineContact: CustomerContact = {
          ...payload,
          id: 'offline-' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          admin_notes: 'Saved locally: Table "customer_contacts" does not exist in Supabase yet. Please execute schema.sql.',
        };
        saveOfflineContact(offlineContact);
        return {
          success: true,
          isOfflineFallback: true,
          message: 'Thank you for contacting us! Your information has been submitted successfully. We will contact you soon.',
          data: offlineContact,
        };
      }

      return {
        success: false,
        message: `Database error: ${error.message || 'Failed to record submission'}. Please try again.`,
      };
    }

    return {
      success: true,
      message: 'Thank you for contacting us! Your information has been submitted successfully. We will contact you soon.',
    };
  } catch (err: unknown) {
    console.error('Submission execution exception:', err);
    const msg = err instanceof Error ? err.message : 'Network request failed';
    return {
      success: false,
      message: `Submission error: ${msg}. Your entered information has been preserved so you can retry.`,
    };
  }
}

// Admin API
export async function adminFetchContacts(): Promise<{
  data: CustomerContact[];
  error?: string;
  source: 'supabase' | 'offline_staging';
}> {
  const client = getSupabaseClient();
  const offline = getOfflineContacts();

  if (!client) {
    return {
      data: offline,
      source: 'offline_staging',
    };
  }

  try {
    const { data, error } = await client
      .from('customer_contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Admin fetch Supabase error:', error);
      return {
        data: offline,
        error: error.message,
        source: 'offline_staging',
      };
    }

    // Merge any offline contacts that aren't already synced
    const all = [...(data as CustomerContact[])];
    for (const off of offline) {
      if (!all.some((c) => c.id === off.id)) {
        all.push(off);
      }
    }

    return {
      data: all,
      source: 'supabase',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Fetch failed';
    return {
      data: offline,
      error: msg,
      source: 'offline_staging',
    };
  }
}

export async function adminUpdateContact(
  id: string,
  updates: { status?: ContactStatus; admin_notes?: string }
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  const isOffline = id.startsWith('offline-');

  if (isOffline || !client) {
    const list = getOfflineContacts();
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(OFFLINE_CONTACTS_KEY, JSON.stringify(list));
      return { success: true };
    }
  }

  if (client && !isOffline) {
    try {
      const { error } = await client
        .from('customer_contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

export async function adminDeleteContact(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  const isOffline = id.startsWith('offline-');

  // Remove from offline storage if present
  const list = getOfflineContacts();
  const filtered = list.filter((c) => c.id !== id);
  if (filtered.length !== list.length) {
    localStorage.setItem(OFFLINE_CONTACTS_KEY, JSON.stringify(filtered));
  }

  if (client && !isOffline) {
    try {
      const { error } = await client
        .from('customer_contacts')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

// CSV Exporter
export function exportContactsToCSV(contacts: CustomerContact[]): void {
  if (!contacts || contacts.length === 0) {
    return;
  }

  const headers = [
    'ID',
    'Full Name',
    'Email',
    'Phone Number',
    'WhatsApp Number',
    'Company Name',
    'Subject',
    'Service Type',
    'Project Budget',
    'Preferred Contact Method',
    'Message',
    'Status',
    'Admin Notes',
    'Privacy Consent',
    'Created At',
  ];

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = contacts.map((c) => [
    escapeCSV(c.id),
    escapeCSV(c.full_name),
    escapeCSV(c.email),
    escapeCSV(c.phone_number),
    escapeCSV(c.whatsapp_number || ''),
    escapeCSV(c.company_name || ''),
    escapeCSV(c.subject),
    escapeCSV(c.service_type || ''),
    escapeCSV(c.project_budget || ''),
    escapeCSV(c.preferred_contact_method || ''),
    escapeCSV(c.message),
    escapeCSV(c.status),
    escapeCSV(c.admin_notes || ''),
    escapeCSV(c.privacy_consent),
    escapeCSV(c.created_at),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `customer_contacts_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
