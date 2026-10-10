import { z } from 'zod';

export type ContactStatus = 'new' | 'contacted' | 'in_progress' | 'completed' | 'archived';

export type PreferredContactMethod = 'phone' | 'email' | 'whatsapp';

export interface CustomerContact {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  whatsapp_number?: string | null;
  company_name?: string | null;
  subject: string;
  service_type?: string | null;
  project_budget?: string | null;
  preferred_contact_method?: PreferredContactMethod | null;
  message: string;
  privacy_consent: boolean;
  status: ContactStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Zod Schema for validation
export const contactFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Full Name must be at least 2 characters.' })
    .max(100, { message: 'Full Name cannot exceed 100 characters.' }),
  phoneNumber: z
    .string()
    .trim()
    .min(7, { message: 'Please enter a valid phone number with area code.' })
    .max(25, { message: 'Phone number is too long.' })
    .regex(/^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}$/, {
      message: 'Please provide a valid phone number (e.g. +1 555-0199 or +880 1712-345678).',
    }),
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email or Gmail address.' })
    .max(120, { message: 'Email address cannot exceed 120 characters.' }),
  whatsappNumber: z
    .string()
    .trim()
    .max(25, { message: 'WhatsApp number is too long.' })
    .optional()
    .refine((val) => !val || /^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}$/.test(val), {
      message: 'Please provide a valid WhatsApp number with country code (e.g. +1..., +880...).',
    }),
  companyName: z
    .string()
    .trim()
    .max(120, { message: 'Company name cannot exceed 120 characters.' })
    .optional(),
  subject: z
    .string()
    .trim()
    .min(3, { message: 'Subject must be at least 3 characters.' })
    .max(150, { message: 'Subject cannot exceed 150 characters.' }),
  serviceType: z.string().optional(),
  projectBudget: z.string().optional(),
  preferredContactMethod: z.enum(['phone', 'email', 'whatsapp']).optional(),
  message: z
    .string()
    .trim()
    .min(10, { message: 'Please provide at least 10 characters describing your inquiry.' })
    .max(3000, { message: 'Message is too long (maximum 3,000 characters).' }),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the privacy policy before submitting.',
  }),
  honeypot: z.string().max(0, { message: 'Bot activity detected.' }).optional(),
  captchaAnswer: z.string().min(1, { message: 'Please solve the anti-spam security question.' }),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export type Language = 'en' | 'bn';
export type Theme = 'light' | 'dark';
