import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Building2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { ContactFormData, contactFormSchema, Language, PreferredContactMethod } from '../types';
import { translations } from '../lib/i18n';
import { submitContactInquiry, getSupabaseConfig } from '../lib/supabase';

interface Props {
  lang: Language;
  onOpenPrivacyModal: () => void;
  onOpenSupabaseModal: () => void;
}

export const ContactForm: React.FC<Props> = ({
  lang,
  onOpenPrivacyModal,
  onOpenSupabaseModal,
}) => {
  const t = translations[lang];
  const config = getSupabaseConfig();

  // Math CAPTCHA state
  const [captchaNum1, setCaptchaNum1] = useState(4);
  const [captchaNum2, setCaptchaNum2] = useState(7);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<ContactFormData>>({
    fullName: '',
    phoneNumber: '',
    email: '',
    whatsappNumber: '',
    companyName: '',
    subject: '',
    serviceType: '',
    projectBudget: '',
    preferredContactMethod: 'email',
    message: '',
    privacyConsent: false,
    honeypot: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [offlineNotice, setOfflineNotice] = useState(false);

  // Generate a random anti-spam math challenge
  const generateNewCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaInput('');
    setCaptchaError('');
  };

  useEffect(() => {
    generateNewCaptcha();
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b'],
      });
    } catch {
      // Ignore if confetti not supported in environment
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear specific field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleCopyPhoneToWhatsapp = () => {
    if (formData.phoneNumber) {
      setFormData((prev) => ({
        ...prev,
        whatsappNumber: prev.phoneNumber,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate anti-spam challenge
    const expected = captchaNum1 + captchaNum2;
    if (parseInt(captchaInput.trim(), 10) !== expected) {
      setCaptchaError(
        lang === 'bn'
          ? `ভুল উত্তর। অনুগ্রহ করে ${captchaNum1} + ${captchaNum2} এর সঠিক যোগফল লিখুন।`
          : `Incorrect verification answer. What is ${captchaNum1} + ${captchaNum2}?`
      );
      return;
    }

    setCaptchaError('');
    setErrorMessage('');
    setOfflineNotice(false);

    // Zod Validation
    const validationResult = contactFormSchema.safeParse({
      ...formData,
      captchaAnswer: captchaInput,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0] as string;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setErrorMessage(t.form.errorNotice);

      // Scroll to the first error
      const firstErrorField = Object.keys(fieldErrors)[0];
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await submitContactInquiry(validationResult.data);

      if (result.success) {
        setSubmitSuccess(true);
        setOfflineNotice(Boolean(result.isOfflineFallback));
        triggerConfetti();

        // Reset form data only on confirmed success as requested
        setFormData({
          fullName: '',
          phoneNumber: '',
          email: '',
          whatsappNumber: '',
          companyName: '',
          subject: '',
          serviceType: '',
          projectBudget: '',
          preferredContactMethod: 'email',
          message: '',
          privacyConsent: false,
          honeypot: '',
        });
        generateNewCaptcha();
      } else {
        // Recoverable error: preserve entered data and display helpful message
        setErrorMessage(result.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected submission error occurred.';
      setErrorMessage(`Error: ${msg}. Your entered information has been preserved.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact-form" className="py-16 lg:py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সরাসরি যোগাযোগ' : 'Direct Inquiry Form'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.form.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t.form.subtitle}
          </p>
        </div>

        {/* Database Diagnostic Notification if needed */}
        {!config.isConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">
                  {lang === 'bn' ? 'সুপাবেজ সংযোগ প্রাক-দর্শন মোড' : 'Supabase Integration Ready'}
                </span>
                <span>
                  {lang === 'bn'
                    ? 'আপনার সুপাবেজ প্রজেক্ট সরাসরি সংযুক্ত করতে এবং ডেটাবেজ স্কিমা প্রয়োগ করতে এখানে ক্লিক করুন।'
                    : 'Submissions will record securely. Click to connect your Supabase credentials or inspect the PostgreSQL table schema.'}
                </span>
              </div>
            </div>
            <button
              onClick={onOpenSupabaseModal}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shrink-0 transition"
            >
              {lang === 'bn' ? 'কনফিগার করুন' : 'Setup Supabase'}
            </button>
          </div>
        )}

        {/* Success Card (Shown upon successful submission) */}
        {submitSuccess ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xl text-center space-y-6 animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {t.form.successTitle}
              </h3>
              <p className="text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                "{t.form.successMessage}"
              </p>
              {offlineNotice && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 border border-slate-200 dark:border-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 inline mr-1" />
                  Your inquiry has been safely secured in local staging buffer until your Supabase credentials are connected.
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setSubmitSuccess(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md"
              >
                {t.form.submitAnother}
              </button>
            </div>
          </div>
        ) : (
          /* Form Card */
          <form
            onSubmit={handleSubmit}
            noValidate
            className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xl space-y-6 transition-all"
          >
            {/* Honeypot Spam-Trap: Hidden from human eyes, caught by bots */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website_url">Do not fill this field</label>
              <input
                id="website_url"
                type="text"
                name="honeypot"
                value={formData.honeypot || ''}
                onChange={handleInputChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block">Submission Notice</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Field Grid 1: Full Name & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 1. Full Name (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.form.fullName} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleInputChange}
                    placeholder={t.form.fullNamePlaceholder}
                    required
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white ${
                      errors.fullName
                        ? 'border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* 5. Company Name (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.form.company}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName || ''}
                    onChange={handleInputChange}
                    placeholder={t.form.companyPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm transition focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Field Grid 2: Email & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 3. Email Address / Gmail (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.form.email} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    placeholder={t.form.emailPlaceholder}
                    required
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white ${
                      errors.email
                        ? 'border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 2. Phone Number (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.form.phoneNumber} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleInputChange}
                    placeholder={t.form.phoneNumberPlaceholder}
                    required
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white ${
                      errors.phoneNumber
                        ? 'border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                <div className="flex items-center justify-between mt-1">
                  {errors.phoneNumber ? (
                    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.phoneNumber}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">{t.form.phoneHelp}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Field Grid 3: WhatsApp Number & Preferred Contact Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 4. WhatsApp Number (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {t.form.whatsapp}
                  </label>
                  {formData.phoneNumber && (
                    <button
                      type="button"
                      onClick={handleCopyPhoneToWhatsapp}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Copy className="w-3 h-3" />
                      {t.form.sameAsPhone}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber || ''}
                    onChange={handleInputChange}
                    placeholder={t.form.whatsappPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm transition focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {errors.whatsappNumber && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.whatsappNumber}
                  </p>
                )}
              </div>

              {/* 9. Preferred Contact Method */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.form.contactMethod}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['phone', 'email', 'whatsapp'] as PreferredContactMethod[]).map((method) => {
                    const isSelected = formData.preferredContactMethod === method;
                    const labels: Record<PreferredContactMethod, string> = {
                      phone: t.form.methodPhone,
                      email: t.form.methodEmail,
                      whatsapp: t.form.methodWhatsapp,
                    };
                    return (
                      <button
                        type="button"
                        key={method}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            preferredContactMethod: method,
                          }))
                        }
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition text-center flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {method === 'phone' && <Phone className="w-3.5 h-3.5" />}
                        {method === 'email' && <Mail className="w-3.5 h-3.5" />}
                        {method === 'whatsapp' && <MessageSquare className="w-3.5 h-3.5" />}
                        <span className="truncate w-full">{labels[method]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Field Grid 4: Subject, Service Interested In & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* 6. Subject (Required) */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.form.subject} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject || ''}
                  onChange={handleInputChange}
                  placeholder={t.form.subjectPlaceholder}
                  required
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white ${
                    errors.subject
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
                {errors.subject && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* 7. Service Interested In (Dropdown) */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.form.service}
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm transition focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="">{t.form.serviceSelectPrompt}</option>
                  {t.servicesOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. Project Budget (Optional) */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.form.budget}
                </label>
                <select
                  name="projectBudget"
                  value={formData.projectBudget || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm transition focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="">{t.form.budgetSelectPrompt}</option>
                  {t.budgetOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 10. Message / Project Details (Required) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t.form.message} <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {formData.message?.length || 0} / 3000
                </span>
              </div>
              <textarea
                name="message"
                rows={5}
                value={formData.message || ''}
                onChange={handleInputChange}
                placeholder={t.form.messagePlaceholder}
                required
                className={`w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white ${
                  errors.message
                    ? 'border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
              {errors.message && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.message}
                </p>
              )}
            </div>

            {/* Anti-Spam Security Question (Anti-Bot Protection) */}
            <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white">
                    {t.form.antiSpamQuestion}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    What is{' '}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {captchaNum1} + {captchaNum2}
                    </span>
                    ?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    setCaptchaError('');
                  }}
                  placeholder={t.form.antiSpamPlaceholder}
                  className="w-28 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={generateNewCaptcha}
                  title="Generate new question"
                  className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {captchaError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 -mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {captchaError}
              </p>
            )}

            {/* 11. Consent Checkbox (Required) */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="privacyConsent"
                  checked={Boolean(formData.privacyConsent)}
                  onChange={handleInputChange}
                  required
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed select-none">
                  {t.form.consentText}{' '}
                  <button
                    type="button"
                    onClick={onOpenPrivacyModal}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold inline"
                  >
                    {t.form.privacyPolicyLink}
                  </button>
                  . We never share customer contact information without consent. <span className="text-rose-500">*</span>
                </span>
              </label>
              {errors.privacyConsent && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.privacyConsent}
                </p>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.form.submittingButton}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.form.submitButton}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
