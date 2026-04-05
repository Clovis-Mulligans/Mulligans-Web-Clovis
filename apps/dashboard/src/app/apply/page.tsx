'use client';

import React, { useState, useEffect } from 'react';
import { MulligansLogo } from '@mulligans/ui';
import {
  submitProStoreApplication,
  getApplicationStatus,
  type ProStoreApplication,
  type SubmitProStoreApplicationData,
  type SellerType,
  type EstimatedListings,
} from '@mulligans/api-client';
import { useAuth } from '@/lib/auth-provider';

// ─── Constants ───────────────────────────────────────────────

const SELLER_TYPES: { value: SellerType; label: string }[] = [
  { value: 'pro_shop', label: 'Independent Pro Shop' },
  { value: 'online_retailer', label: 'Online Golf Store' },
  { value: 'brand', label: 'Brand' },
];

const LISTING_RANGES: { value: EstimatedListings; label: string }[] = [
  { value: '1-50', label: '1-10' },
  { value: '51-200', label: '10-50' },
  { value: '201-500', label: '50-200' },
  { value: '500+', label: '200+' },
];

// ─── Store Name Validation ───────────────────────────────────

function validateStoreName(name: string): string | null {
  if (name.length < 3) return 'Store name must be at least 3 characters';
  if (name.length > 50) return 'Store name must be 50 characters or less';
  if (!/^[a-zA-Z0-9\s'-]+$/.test(name)) return 'Only letters, numbers, hyphens, apostrophes and spaces';
  if (/[-']{2}/.test(name)) return 'No consecutive hyphens or apostrophes';
  if (/^[-']/.test(name) || /[-']$/.test(name)) return 'Cannot start or end with a hyphen or apostrophe';
  return null;
}

// ─── Input Styles ────────────────────────────────────────────

const inputClass = "w-full rounded-lg border border-[#E0E0D8] bg-white px-3 text-sm text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#1DC690] focus:outline-none focus:ring-2 focus:ring-[#1DC690]/10";
const selectClass = "w-full rounded-lg border border-[#E0E0D8] bg-white px-3 text-sm text-[#0D0D0D] focus:border-[#1DC690] focus:outline-none focus:ring-2 focus:ring-[#1DC690]/10 appearance-none";

// ─── Main Page ───────────────────────────────────────────────

export default function ApplyPage() {
  const { isAuthenticated, isLoading: authLoading, isProStore } = useAuth();
  const [existingApp, setExistingApp] = useState<ProStoreApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<SubmitProStoreApplicationData>({
    business_name: '',
    business_email: '',
    business_phone: '',
    website: '',
    seller_type: 'pro_shop',
    description: '',
    estimated_listings: '1-50',
    instagram_handle: '',
    has_existing_store: false,
    existing_store_url: '',
  });

  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    async function checkExisting() {
      if (!isAuthenticated) { setLoading(false); return; }
      // Redirect approved pro stores to dashboard
      if (isProStore) { window.location.href = '/'; return; }
      try {
        const app = await getApplicationStatus();
        setExistingApp(app);
      } catch {
        // No existing application
      }
      setLoading(false);
    }
    if (!authLoading) checkExisting();
  }, [isAuthenticated, authLoading, isProStore]);

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate store name
    const nameErr = validateStoreName(form.business_name);
    if (nameErr) { setNameError(nameErr); return; }

    // Validate description length
    if (form.description.length < 50) { setError('Please provide at least 50 characters describing your store'); return; }

    setSubmitting(true);
    try {
      const app = await submitProStoreApplication(form);
      setExistingApp(app);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06070A]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1DC690] border-t-transparent" />
      </div>
    );
  }

  // ── Not Logged In ────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#06070A] px-4">
        <MulligansLogo width={180} height={36} />
        <div className="mt-8 w-full max-w-[520px] rounded-2xl bg-white p-8 text-center" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F4F0]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>Sign In to Apply</h2>
          <p className="mt-2 text-[#6B6B6B]" style={{ fontSize: '0.9rem' }}>You need a Mulligans account to apply for a Pro Store</p>
          <button onClick={() => (window.location.href = '/login?redirect=/apply')} className="mt-6 w-full rounded-lg py-3 text-sm font-bold text-white" style={{ backgroundColor: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, height: '48px' }}>
            Sign In
          </button>
          <p className="mt-3 text-sm text-[#6B6B6B]">Don&apos;t have an account? <a href="https://mulligans.uk.com" className="text-[#1DC690] hover:underline">Create one</a></p>
        </div>
        <p className="mt-6 text-sm text-[#6B6B6B]">Already a pro store? <a href="/login" className="text-[#1DC690] hover:underline">Sign in to your dashboard →</a></p>
      </div>
    );
  }

  // ── Already Applied (pending/under review) ───────────────
  if (existingApp && !success && existingApp.status !== 'rejected') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#06070A] px-4">
        <MulligansLogo width={180} height={36} />
        <div className="mt-8 w-full max-w-[520px] rounded-2xl bg-white p-8 text-center" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>Application Under Review</h2>
          <p className="mt-2 text-[#6B6B6B]" style={{ fontSize: '0.9rem' }}>We received your application and are reviewing it. We&apos;ll be in touch within 2-3 business days.</p>
          <p className="mt-4 text-[#ADADAD]" style={{ fontSize: '0.82rem' }}>Submitted on {new Date(existingApp.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <a href="https://mulligans.uk.com" className="mt-6 inline-block text-sm text-[#6B6B6B] hover:underline">Visit Mulligans Marketplace →</a>
        </div>
        <p className="mt-6 text-sm text-[#6B6B6B]">Already a pro store? <a href="/login" className="text-[#1DC690] hover:underline">Sign in to your dashboard →</a></p>
      </div>
    );
  }

  // ── Submission Success ───────────────────────────────────
  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#06070A] px-4">
        <MulligansLogo width={180} height={36} />
        <div className="mt-8 w-full max-w-[520px] rounded-2xl bg-white p-8 text-center" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(29,198,144,0.15)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>Application Submitted!</h2>
          <p className="mt-2 text-[#6B6B6B]" style={{ fontSize: '0.9rem' }}>Thank you for applying. We&apos;ll review your application and be in touch within 2-3 business days.</p>
          <a href="https://mulligans.uk.com" className="mt-6 inline-block text-sm text-[#6B6B6B] hover:underline">Visit Mulligans Marketplace →</a>
        </div>
        <p className="mt-6 text-sm text-[#6B6B6B]">Already a pro store? <a href="/login" className="text-[#1DC690] hover:underline">Sign in to your dashboard →</a></p>
      </div>
    );
  }

  // ── Application Form ─────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#06070A] px-4 py-12">
      <MulligansLogo width={180} height={36} />
      <h1 className="mt-6 text-white text-center" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.5rem' }}>Become a Verified Pro Store</h1>
      <p className="mt-2 text-center text-[#9CA3AF] max-w-[420px]" style={{ fontSize: '0.9rem' }}>Join our network of trusted golf retailers and reach thousands of golfers across the UK</p>

      <div className="mt-8 w-full max-w-[520px] rounded-2xl bg-white p-8" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Pro Store Application</h2>
        <p className="mt-1 text-[#6B6B6B]" style={{ fontSize: '0.85rem' }}>Tell us about your business</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm" style={{ color: '#E53E3E' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Store Name */}
          <div>
            <label className="block mb-1.5 text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.88rem' }}>
              Store / Business Name <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => { updateForm('business_name', e.target.value); setNameError(validateStoreName(e.target.value)); }}
              maxLength={50}
              required
              placeholder="Your Golf Pro Shop"
              className={inputClass}
              style={{ fontFamily: 'Montserrat, sans-serif', height: '44px' }}
            />
            {nameError && form.business_name.length > 0 && <p className="mt-1" style={{ color: '#E53E3E', fontSize: '0.78rem' }}>{nameError}</p>}
          </div>

          {/* Business Website */}
          <div>
            <label className="block mb-1.5 text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.88rem' }}>Business Website</label>
            <input type="url" value={form.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="https://yourshop.com" className={inputClass} style={{ fontFamily: 'Montserrat, sans-serif', height: '44px' }} />
            <p className="mt-1 text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Optional but recommended</p>
          </div>

          {/* Business Type */}
          <div>
            <label className="block mb-1.5 text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.88rem' }}>
              Business Type <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <select value={form.seller_type} onChange={(e) => updateForm('seller_type', e.target.value)} required className={selectClass} style={{ fontFamily: 'Montserrat, sans-serif', height: '44px' }}>
              <option value="" disabled>Select your business type...</option>
              {SELLER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1.5 text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.88rem' }}>
              Tell us about your store <span style={{ color: '#E53E3E' }}>*</span>
              <span className="ml-2 text-[#6B6B6B]" style={{ fontWeight: 400, fontSize: '0.78rem' }}>({form.description.length}/500)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value.slice(0, 500))}
              rows={4}
              maxLength={500}
              required
              placeholder="Describe your store, the brands you carry, your location, and why you'd like to join Mulligans..."
              className={`${inputClass} py-2.5`}
              style={{ fontFamily: 'Montserrat, sans-serif', height: 'auto', resize: 'vertical' }}
            />
            {form.description.length > 0 && form.description.length < 50 && (
              <p className="mt-1" style={{ color: '#F59E0B', fontSize: '0.78rem' }}>Minimum 50 characters ({50 - form.description.length} more needed)</p>
            )}
          </div>

          {/* Expected Listings */}
          <div>
            <label className="block mb-1.5 text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.88rem' }}>
              Expected number of listings <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <select value={form.estimated_listings} onChange={(e) => updateForm('estimated_listings', e.target.value)} required className={selectClass} style={{ fontFamily: 'Montserrat, sans-serif', height: '44px' }}>
              {LISTING_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Hidden fields the backend requires but we don't show prominently */}
          <input type="hidden" value={form.business_email} />
          <input type="hidden" value={form.business_phone} />

          {/* Business email + phone (backend requires them) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.88rem' }}>
                Business Email <span style={{ color: '#E53E3E' }}>*</span>
              </label>
              <input type="email" value={form.business_email} onChange={(e) => updateForm('business_email', e.target.value)} required placeholder="contact@shop.com" className={inputClass} style={{ fontFamily: 'Montserrat, sans-serif', height: '44px' }} />
            </div>
            <div>
              <label className="block mb-1.5 text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.88rem' }}>
                Business Phone <span style={{ color: '#E53E3E' }}>*</span>
              </label>
              <input type="tel" value={form.business_phone} onChange={(e) => updateForm('business_phone', e.target.value)} required placeholder="+44 7700 900000" className={inputClass} style={{ fontFamily: 'Montserrat, sans-serif', height: '44px' }} />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting} className="w-full rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, height: '48px' }}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </span>
            ) : 'Submit Application'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-[#6B6B6B]">Already a pro store? <a href="/login" className="text-[#1DC690] hover:underline">Sign in to your dashboard →</a></p>
    </div>
  );
}
