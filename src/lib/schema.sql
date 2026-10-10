-- ====================================================================
-- Professional Customer Contact Management System - Supabase Schema
-- ====================================================================

-- 1. Enable UUID Extension (Available by default in Supabase)
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

-- 4. Automatically Update updated_at Timestamp on record modification
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
-- Ensure RLS is strictly enabled
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow anonymous public contact insert" ON public.customer_contacts;
DROP POLICY IF EXISTS "Disallow public anonymous select" ON public.customer_contacts;
DROP POLICY IF EXISTS "Allow authenticated admins full access" ON public.customer_contacts;

-- Policy A: Safe INSERT-Only Access for Public Visitors
-- Anonymous public users can only INSERT their own contact inquiry with consent.
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

-- Policy B: Authorized Administrators Full Management Access
-- Only authenticated users (admins) can SELECT, UPDATE, or DELETE records.
CREATE POLICY "Allow authenticated admins full access"
ON public.customer_contacts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Verification / Inspection Comments
COMMENT ON TABLE public.customer_contacts IS 'Enterprise customer contact submissions with Row Level Security.';
