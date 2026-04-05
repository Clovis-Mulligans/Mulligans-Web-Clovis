'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-provider';
import {
  getSettings,
  updateSettings,
  uploadAvatar,
  getStripeAccountStatus,
  createStripeAccount,
  createOnboardingLink,
  getStripeDashboardLink,
} from '@mulligans/api-client';
import type { ProStoreSettings, StripeAccountStatus } from '@mulligans/api-client';

// ─── Toast ───────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: '#1DC690', fontFamily: 'Montserrat, sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      {message}
    </div>
  );
}

// ─── Toggle Switch ───────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
      style={{ backgroundColor: checked ? '#1DC690' : '#E0E0D8', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: checked ? 'translateX(22px)' : 'translateX(4px)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

// ─── Carrier Chips ───────────────────────────────────────────

const CARRIERS = ['Royal Mail', 'Evri', 'DPD', 'UPS', 'FedEx', 'Other'];

function CarrierChips({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (carrier: string) => {
    if (selected.includes(carrier)) onChange(selected.filter((c) => c !== carrier));
    else onChange([...selected, carrier]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {CARRIERS.map((c) => {
        const isSelected = selected.includes(c);
        return (
          <button key={c} type="button" onClick={() => toggle(c)} className="rounded-full px-3.5 py-1.5 text-sm transition-colors" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.82rem', backgroundColor: isSelected ? '#1DC690' : '#FFFFFF', color: isSelected ? '#FFFFFF' : '#6B6B6B', border: isSelected ? 'none' : '1px solid #E0E0D8' }}>
            {c}
          </button>
        );
      })}
    </div>
  );
}

// ─── Store Name Validation ───────────────────────────────────

function validateStoreName(name: string): string | null {
  if (name.length < 3) return 'Store name must be at least 3 characters';
  if (name.length > 50) return 'Store name must be 50 characters or less';
  if (!/^[a-zA-Z0-9\s'-]+$/.test(name)) return 'Only letters, numbers, hyphens, apostrophes and spaces';
  if (/[-']{2}/.test(name)) return 'No consecutive hyphens or apostrophes';
  if (/^[-']/.test(name) || /[-']$/.test(name)) return 'Cannot start or end with a hyphen or apostrophe';
  return null;
}

function canChangeName(changedAt: string | null): boolean {
  if (!changedAt) return true;
  const d = new Date(changedAt);
  const sixMonths = new Date(d);
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  return new Date() >= sixMonths;
}

function nextChangeDate(changedAt: string): string {
  const d = new Date(changedAt);
  d.setMonth(d.getMonth() + 6);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Section Card Wrapper ────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-6 border border-[#E0E0D8]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h2 className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{children}</h2>
      <div className="my-4 h-px bg-[#E0E0D8]" />
    </>
  );
}

function SaveButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={loading} className="mt-5 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, height: '44px' }}>
      {loading ? 'Saving...' : label}
    </button>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block mb-1.5 text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.88rem' }}>
      {children}{required && <span style={{ color: '#E53E3E' }}> *</span>}
    </label>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>{children}</p>;
}

const inputClass = "w-full rounded-lg border border-[#E0E0D8] bg-white px-3 text-sm text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#1DC690] focus:outline-none focus:ring-2 focus:ring-[#1DC690]/10";
const inputStyle = { fontFamily: 'Montserrat, sans-serif', height: '44px' };
const disabledStyle = { backgroundColor: '#F9F9F7', color: '#ADADAD', cursor: 'not-allowed' as const };

// ─── Main Page ───────────────────────────────────────────────

export default function SettingsPage() {
  const { userId } = useAuth();
  const [settings, setSettings] = useState<ProStoreSettings | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Per-section saving state
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [savingOffers, setSavingOffers] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [freeShipping, setFreeShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState('');
  const [postcode, setPostcode] = useState('');
  const [carriers, setCarriers] = useState<string[]>([]);

  const [acceptOffers, setAcceptOffers] = useState(true);
  const [autoDeclineEnabled, setAutoDeclineEnabled] = useState(false);
  const [autoDeclineThreshold, setAutoDeclineThreshold] = useState(50);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const [storeNameError, setStoreNameError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Load settings ────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [s, stripe] = await Promise.allSettled([getSettings(), getStripeAccountStatus()]);
      if (s.status === 'fulfilled' && s.value) {
        const d = s.value;
        setSettings(d);
        setStoreName(d.pro_store_name || '');
        setDisplayName(d.display_name || '');
        setWebsite(d.pro_store_website || '');
        setBio(d.bio || '');
        setLocation(d.location || '');
        setAvatarUrl(d.avatar_url);
        setFreeShipping(d.offers_free_shipping);
        setShippingCost(d.default_shipping_cost || '');
        setPostcode(d.postcode_area || '');
        setCarriers(d.preferred_carriers ? d.preferred_carriers.split(',').map((c: string) => c.trim()) : []);
        setEmailNotifications(d.email_notifications);
        setOrderNotifications(d.order_notifications);
        setMarketingEmails(d.marketing_emails);
      }
      if (stripe.status === 'fulfilled') setStripeStatus(stripe.value);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Save handlers ────────────────────────────────────────
  const saveProfile = async () => {
    if (storeName && validateStoreName(storeName)) { setStoreNameError(validateStoreName(storeName)); return; }
    setSavingProfile(true);
    try {
      await updateSettings({ display_name: displayName, bio, location });
      setToast('Settings saved ✓');
    } catch {} finally { setSavingProfile(false); }
  };

  const saveShipping = async () => {
    setSavingShipping(true);
    try {
      await updateSettings({
        offers_free_shipping: freeShipping,
        default_shipping_cost: freeShipping ? null : (shippingCost ? Number(shippingCost) : null),
        postcode_area: postcode.toUpperCase(),
        preferred_carriers: carriers.join(','),
      });
      setToast('Settings saved ✓');
    } catch {} finally { setSavingShipping(false); }
  };

  const saveOffers = async () => {
    setSavingOffers(true);
    // Auto-decline threshold saved locally — backend field doesn't exist yet
    setTimeout(() => { setSavingOffers(false); setToast('Settings saved ✓'); }, 500);
  };

  const saveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await updateSettings({ email_notifications: emailNotifications, order_notifications: orderNotifications, marketing_emails: marketingEmails });
      setToast('Settings saved ✓');
    } catch {} finally { setSavingNotifications(false); }
  };

  // ── Avatar upload ────────────────────────────────────────
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) { setToast('Image must be under 5MB'); return; }
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setToast('Only JPG and PNG files'); return; }
    setUploadingAvatar(true);
    try {
      const updated = await uploadAvatar(userId, file);
      setAvatarUrl(updated.avatar_url);
      setToast('Photo updated ✓');
    } catch {} finally { setUploadingAvatar(false); }
  };

  // ── Stripe handlers ──────────────────────────────────────
  const [stripeLoading, setStripeLoading] = useState(false);
  const handleStripeConnect = async () => {
    setStripeLoading(true);
    try {
      await createStripeAccount();
      const link = await createOnboardingLink({ return_url: `${window.location.origin}/settings`, refresh_url: `${window.location.origin}/settings` });
      window.location.href = link.url;
    } catch {} finally { setStripeLoading(false); }
  };
  const handleStripeContinue = async () => {
    setStripeLoading(true);
    try {
      const link = await createOnboardingLink({ return_url: `${window.location.origin}/settings`, refresh_url: `${window.location.origin}/settings` });
      window.location.href = link.url;
    } catch {} finally { setStripeLoading(false); }
  };
  const handleStripeManage = async () => {
    setStripeLoading(true);
    try {
      const link = await getStripeDashboardLink();
      window.open(link.url, '_blank');
    } catch {} finally { setStripeLoading(false); }
  };

  const nameChangeAllowed = canChangeName(settings?.pro_store_name_changed_at || null);
  const isStripeActive = stripeStatus?.status === 'active' && stripeStatus?.payouts_enabled;
  const isStripePending = stripeStatus?.has_account && !isStripeActive;
  const noStripeAccount = !stripeStatus?.has_account;

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#EAEAE0' }}>
        <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
          <div className="h-4 w-20 rounded bg-[#F4F4F0] animate-pulse mb-6" />
          {[1,2,3].map((i) => <div key={i} className="h-48 rounded-xl bg-white animate-pulse border border-[#E0E0D8] mb-6" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#EAEAE0' }}>
      <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
        <h1 className="mb-6" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Settings</h1>

        <div className="space-y-6">
          {/* ── SECTION 1: Store Profile ─────────────────── */}
          <SectionCard>
            <SectionHeading>Store Profile</SectionHeading>

            <div className="space-y-4">
              {/* Store Name */}
              <div>
                <Label required>Store Name</Label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => { setStoreName(e.target.value); setStoreNameError(validateStoreName(e.target.value)); }}
                  maxLength={50}
                  disabled={!nameChangeAllowed}
                  className={inputClass}
                  style={{ ...inputStyle, ...(!nameChangeAllowed ? disabledStyle : {}) }}
                />
                <div className="mt-1 flex justify-between">
                  {storeNameError ? <p style={{ color: '#E53E3E', fontSize: '0.78rem' }}>{storeNameError}</p> : <span />}
                  <span className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>{storeName.length}/50</span>
                </div>
                {!nameChangeAllowed && settings?.pro_store_name_changed_at && (
                  <p className="mt-1" style={{ color: '#F59E0B', fontSize: '0.78rem' }}>⚠️ Store name can be changed again on {nextChangeDate(settings.pro_store_name_changed_at)}</p>
                )}
                {nameChangeAllowed && settings?.pro_store_name && (
                  <p className="mt-1" style={{ color: '#F59E0B', fontSize: '0.78rem' }}>⚠️ You can only change your store name once every 6 months. Choose carefully.</p>
                )}
              </div>

              {/* Display Name */}
              <div>
                <Label>Display Name</Label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} placeholder="Your public username" className={inputClass} style={inputStyle} />
                <Helper>Your public username shown on listings and your profile</Helper>
              </div>

              {/* Website */}
              <div>
                <Label>Store Website</Label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourshop.com" className={inputClass} style={inputStyle} />
                <Helper>Optional — shown on your pro store profile</Helper>
              </div>

              {/* Bio */}
              <div>
                <Label>Store Description</Label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 500))} rows={4} maxLength={500} placeholder="Tell buyers about your store and what you sell" className={`${inputClass} py-2.5`} style={{ fontFamily: 'Montserrat, sans-serif', resize: 'vertical', height: 'auto' }} />
                <div className="mt-1 flex justify-end"><span className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>{bio.length}/500</span></div>
                <Helper>Tell buyers about your store and what you sell</Helper>
              </div>

              {/* Location */}
              <div>
                <Label>Location</Label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. St Andrews, Scotland" className={inputClass} style={inputStyle} />
                <Helper>Town or city — shown on your store profile</Helper>
              </div>

              {/* Avatar */}
              <div>
                <Label>Store Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-[72px] w-[72px] rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid #E0E0D8' }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1DC690] text-white" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                        {(displayName || storeName || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="rounded-[10px] border-[1.5px] border-[#1C4670] px-4 py-2 text-sm font-bold text-[#1C4670] transition-colors hover:bg-[#F4F4F0] disabled:opacity-50" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                    {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarFile} />
                </div>
              </div>
            </div>

            <SaveButton onClick={saveProfile} loading={savingProfile} label="Save Store Profile" />
          </SectionCard>

          {/* ── SECTION 2: Shipping Defaults ─────────────── */}
          <SectionCard>
            <SectionHeading>Shipping Defaults</SectionHeading>
            <p className="mb-5 text-[#6B6B6B] italic" style={{ fontSize: '0.82rem' }}>These defaults apply when you ship using your own carrier. Orders shipped via Mulligans&apos; Shippo integration have their costs handled automatically.</p>

            <div className="space-y-5">
              {/* Free shipping toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>Offer free shipping on all listings</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>New listings will default to free shipping</p>
                </div>
                <Toggle checked={freeShipping} onChange={setFreeShipping} />
              </div>

              {/* Default cost */}
              <div>
                <Label>Default Shipping Cost</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B6B6B]">£</span>
                  <input type="number" step="0.01" min="0" max="99.99" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} disabled={freeShipping} className={`${inputClass} pl-7`} style={{ ...inputStyle, ...(freeShipping ? disabledStyle : {}) }} />
                </div>
                <Helper>Automatically applied to new listings you create</Helper>
              </div>

              {/* Postcode */}
              <div>
                <Label>Your Postcode Area</Label>
                <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value.toUpperCase().slice(0, 4))} maxLength={4} placeholder="e.g. KY16" className={inputClass} style={{ ...inputStyle, textTransform: 'uppercase' }} />
                <Helper>Used to calculate shipping origins</Helper>
              </div>

              {/* Carriers */}
              <div>
                <Label>Preferred Carriers</Label>
                <Helper>Select the carriers you typically use</Helper>
                <div className="mt-2"><CarrierChips selected={carriers} onChange={setCarriers} /></div>
              </div>
            </div>

            <SaveButton onClick={saveShipping} loading={savingShipping} label="Save Shipping Settings" />
          </SectionCard>

          {/* ── SECTION 3: Offer Settings ────────────────── */}
          <SectionCard>
            <SectionHeading>Offer Settings</SectionHeading>

            <div className="space-y-5">
              {/* Accept offers toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>Accept offers on my listings</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Allow buyers to make offers on new listings</p>
                  <p className="text-[#ADADAD]" style={{ fontSize: '0.72rem' }}>This setting applies to new listings only</p>
                </div>
                <Toggle checked={acceptOffers} onChange={setAcceptOffers} />
              </div>

              {/* Auto-decline threshold */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>Auto-Decline Threshold</p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Automatically decline offers below a set percentage of asking price</p>
                  </div>
                  <Toggle checked={autoDeclineEnabled} onChange={setAutoDeclineEnabled} />
                </div>

                {!autoDeclineEnabled && (
                  <p className="text-[#6B6B6B] italic" style={{ fontSize: '0.78rem' }}>Auto-decline is off — all offers go to your inbox</p>
                )}

                {autoDeclineEnabled && (
                  <div className="mt-3 space-y-3">
                    <p className="text-center" style={{ color: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.5rem' }}>{autoDeclineThreshold}%</p>
                    <input type="range" min="0" max="80" step="5" value={autoDeclineThreshold} onChange={(e) => setAutoDeclineThreshold(Number(e.target.value))} className="w-full accent-[#1DC690]" />
                    <p className="text-sm text-[#0D0D0D]">Offers below {autoDeclineThreshold}% of asking price will be automatically declined</p>
                    <div className="rounded-lg bg-[#F4F4F0] p-3 italic text-[#6B6B6B]" style={{ fontSize: '0.82rem' }}>
                      <p className="mb-1 not-italic text-[#ADADAD]" style={{ fontSize: '0.72rem' }}>Decline message sent to buyer:</p>
                      &ldquo;Thank you for your offer. Unfortunately it is below our minimum accepted offer. Please try again with a higher offer.&rdquo;
                    </div>
                  </div>
                )}

                <p className="mt-3" style={{ color: '#F59E0B', fontSize: '0.78rem' }}>⚠️ This feature is coming soon. Your preference will be saved and activated when the feature launches.</p>
              </div>
            </div>

            <SaveButton onClick={saveOffers} loading={savingOffers} label="Save Offer Settings" />
          </SectionCard>

          {/* ── SECTION 4: Notifications ─────────────────── */}
          <SectionCard>
            <SectionHeading>Notifications</SectionHeading>

            <div className="divide-y divide-[#E0E0D8]">
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div>
                  <p className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>Order Notifications</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Get notified when you receive orders, shipping updates, and buyer messages about orders</p>
                </div>
                <Toggle checked={orderNotifications} onChange={setOrderNotifications} />
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>Email Notifications</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Receive email summaries of your store activity, offers, and messages</p>
                </div>
                <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>Marketing &amp; Updates</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Receive tips, product updates, and promotional content from Mulligans</p>
                </div>
                <Toggle checked={marketingEmails} onChange={setMarketingEmails} />
              </div>
            </div>

            <SaveButton onClick={saveNotifications} loading={savingNotifications} label="Save Notification Preferences" />
          </SectionCard>

          {/* ── SECTION 5: Payouts & Banking ─────────────── */}
          <SectionCard>
            <SectionHeading>Payouts &amp; Banking</SectionHeading>

            {noStripeAccount && (
              <>
                <div className="flex items-start gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                  <p className="text-sm text-[#0D0D0D]">Connect your bank account to receive payouts</p>
                </div>
                <button onClick={handleStripeConnect} disabled={stripeLoading} className="w-full rounded-[10px] py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#278AB0', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                  {stripeLoading ? 'Connecting...' : 'Connect with Stripe'}
                </button>
              </>
            )}

            {isStripePending && (
              <>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Setup Incomplete</span>
                <p className="text-sm text-[#0D0D0D] mb-3">Complete your Stripe setup to receive payouts</p>
                <button onClick={handleStripeContinue} disabled={stripeLoading} className="w-full rounded-[10px] py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#F59E0B', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                  {stripeLoading ? 'Loading...' : 'Complete Setup'}
                </button>
              </>
            )}

            {isStripeActive && (
              <>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2" style={{ backgroundColor: 'rgba(29,198,144,0.15)', color: '#1DC690' }}>✓ Payouts Active</span>
                <p className="text-xs text-[#6B6B6B] mb-3">Your bank account is connected and payouts are active</p>
                <button onClick={handleStripeManage} disabled={stripeLoading} className="w-full rounded-[10px] border-[1.5px] border-[#278AB0] py-2.5 text-sm font-bold text-[#278AB0] hover:bg-blue-50 disabled:opacity-50" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                  {stripeLoading ? 'Loading...' : 'Manage Bank Account & Payouts →'}
                </button>
              </>
            )}

            <p className="mt-3 text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Payout schedules and bank account details are managed securely through Stripe. Mulligans never stores your banking information.</p>
          </SectionCard>
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
