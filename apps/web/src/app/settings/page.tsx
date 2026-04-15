'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon, Bell, Ruler, Truck, Lock, ShieldAlert,
  Camera, Check, AlertCircle, Download, Trash2, LogOut,
  ExternalLink, Info,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import {
  apiClient,
  changePassword,
  getAuthProfile,
  updateMyProfile,
  uploadAvatar,
  clearAuthToken,
  type User,
} from '@mulligans/api-client';

/* ───────────────────────── Constants ───────────────────────── */

const PALETTE = {
  bg: '#EAEAE0',
  card: '#FFFFFF',
  green: '#1DC690',
  textDark: '#111827',
  textMid: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  warn: '#F59E0B',
  warnBg: '#FFFBEB',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
  toggleOn: '#1DC690',
  toggleOff: '#D1D5DB',
  selectedBg: '#ECFDF5',
};

type TabKey =
  | 'profile' | 'notifications' | 'sizing'
  | 'shipping' | 'security' | 'account';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'profile',       label: 'Profile',       icon: UserIcon },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'sizing',        label: 'Sizing',        icon: Ruler },
  { key: 'shipping',      label: 'Shipping',      icon: Truck },
  { key: 'security',      label: 'Security',      icon: Lock },
  { key: 'account',       label: 'Account',       icon: ShieldAlert },
];

const MENS_CLOTHING = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const WOMENS_CLOTHING = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const MENS_SHOES = ['6', '7', '8', '9', '10', '11', '12', '13', '14'];
const WOMENS_SHOES = ['3', '4', '5', '6', '7', '8', '9'];
const MENS_GLOVES = ['S', 'M', 'ML', 'L', 'XL'];
const WOMENS_GLOVES = ['XS', 'S', 'M', 'L'];

const PARCEL_INFO = [
  { name: 'Small',       price: '£3.49',  desc: 'Balls, gloves, small accessories' },
  { name: 'Medium',      price: '£5.99',  desc: 'Single clubs, shoes, clothing' },
  { name: 'Large',       price: '£9.99',  desc: 'Sets of irons, drivers, stand bags' },
  { name: 'Extra Large', price: '£14.99', desc: 'Full bags, travel covers' },
  { name: 'Oversized',   price: '£19.99', desc: 'Large equipment or bulk' },
];

const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

/* ───────────────────────── Helpers ───────────────────────── */

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string' && v.trim()) {
    try {
      const j = JSON.parse(v);
      if (Array.isArray(j)) return j.map(String);
    } catch { /* fallthrough */ }
    return [v];
  }
  return [];
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(x => x !== value) : [...list, value];
}

function validateNewPassword(pw: string): string | null {
  if (pw.length < 8)            return 'At least 8 characters';
  if (!/[A-Z]/.test(pw))        return 'At least one uppercase letter';
  if (!/[a-z]/.test(pw))        return 'At least one lowercase letter';
  if (!/\d/.test(pw))           return 'At least one number';
  if (!/[!@#$%^&*]/.test(pw))   return 'At least one special character (!@#$%^&*)';
  return null;
}

/* ───────────────────────── Page ───────────────────────── */

export default function SettingsPage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  const [tab, setTab] = useState<TabKey>('profile');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  /* Auth gate */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/settings');
    }
  }, [authLoading, isAuthenticated, router]);

  /* Load fresh user data */
  const refresh = useCallback(async () => {
    try {
      const res = await getAuthProfile();
      const u = (res as unknown as { user?: User }).user || (res as unknown as User);
      setUser(u);
    } catch {
      // Fall back to auth-context user
      if (authUser) setUser(authUser as unknown as User);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated, refresh]);

  if (authLoading || !isAuthenticated || loading || !user) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: PALETTE.textMid, fontSize: 14,
      }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PALETTE.bg, minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <PageHeader title="Settings" subtitle="Manage your account and preferences" />

        <TabBar tab={tab} onChange={setTab} />

        <div style={{ marginTop: 20 }}>
          {tab === 'profile'       && <ProfileTab user={user} onSaved={refresh} />}
          {tab === 'notifications' && <NotificationsTab user={user} onSaved={refresh} />}
          {tab === 'sizing'        && <SizingTab user={user} onSaved={refresh} />}
          {tab === 'shipping'      && <ShippingTab user={user} onSaved={refresh} />}
          {tab === 'security'      && <SecurityTab />}
          {tab === 'account'       && <AccountTab user={user} onSaved={refresh} signOut={signOut} />}
        </div>

        {/* Legal + logout footer — mirrors mobile's Settings bottom block */}
        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h3 style={sectionTitleStyle}>About &amp; support</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
            <Link href="/help" style={linkRow}>Help Centre <ExternalLink size={14} /></Link>
            <Link href="/legal/terms" style={linkRow}>Terms &amp; Conditions <ExternalLink size={14} /></Link>
            <Link href="/legal/privacy" style={linkRow}>Privacy Policy <ExternalLink size={14} /></Link>
            <a href="mailto:support@mulligans.uk.com" style={linkRow}>Contact Support <ExternalLink size={14} /></a>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!confirm('Log out of Mulligans?')) return;
              try { clearAuthToken(); } catch { /* ignore */ }
              signOut();
              router.push('/');
            }}
            style={{ ...btnSecondary(false), marginTop: 16 }}
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Tabs ───────────────────────── */

function TabBar({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <div style={{
      display: 'flex', gap: 4, overflowX: 'auto',
      backgroundColor: '#fff', borderRadius: 12,
      padding: 6, border: `1px solid ${PALETTE.border}`,
    }}>
      {TABS.map(t => {
        const Icon = t.icon;
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              flex: '1 1 auto',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '10px 12px', borderRadius: 8, border: 'none',
              backgroundColor: active ? PALETTE.selectedBg : 'transparent',
              color: active ? PALETTE.green : PALETTE.textMid,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderBottom: active ? `2px solid ${PALETTE.green}` : '2px solid transparent',
            }}
          >
            <Icon size={16} /> {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ───── Profile ───── */

function ProfileTab({ user, onSaved }: { user: User; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null!);
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [location, setLocation] = useState(user.location || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { setMsg({ kind: 'err', text: 'Please pick an image file' }); return; }
    setUploading(true); setMsg(null);
    try {
      const res = await uploadAvatar(file);
      setAvatarUrl(res.avatar_url);
      onSaved();
      setMsg({ kind: 'ok', text: 'Avatar updated' });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (displayName.trim().length < 3) { setMsg({ kind: 'err', text: 'Display name must be at least 3 characters' }); return; }
    if (displayName.length > 30)       { setMsg({ kind: 'err', text: 'Display name must be 30 characters or fewer' }); return; }
    if (location.length > 50)          { setMsg({ kind: 'err', text: 'Location must be 50 characters or fewer' }); return; }
    if (bio.length > 500)              { setMsg({ kind: 'err', text: 'Bio must be 500 characters or fewer' }); return; }

    setSaving(true); setMsg(null);
    try {
      await updateMyProfile({
        display_name: displayName.trim(),
        location: location.trim(),
        bio: bio.trim(),
      } as Partial<User>);
      onSaved();
      setMsg({ kind: 'ok', text: 'Profile saved' });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={cardStyle}>
      <SectionHeader title="Profile" subtitle="How other golfers see you" />

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          backgroundColor: '#F3F4F6', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: PALETTE.textLight, fontSize: 28, fontWeight: 700,
        }}>
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (user.display_name || user.email || '?').charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={btnSecondary(uploading)}
          >
            <Camera size={16} /> {uploading ? 'Uploading…' : 'Change photo'}
          </button>
          <input
            ref={fileRef} type="file" accept="image/*"
            onChange={onAvatarPick} style={{ display: 'none' }}
          />
          <p style={{ fontSize: 12, color: PALETTE.textLight, marginTop: 6 }}>JPG or PNG, up to ~5MB.</p>
        </div>
      </div>

      <Field label="Display name" required hint={`${displayName.length} / 30`}>
        <input
          type="text" value={displayName}
          onChange={e => setDisplayName(e.target.value.slice(0, 30))}
          maxLength={30} style={inputStyle}
        />
      </Field>

      <Field label="Email" hint="Email cannot be changed for security reasons">
        <input type="email" value={user.email} disabled
          style={{ ...inputStyle, backgroundColor: '#F3F4F6', color: PALETTE.textMid, cursor: 'not-allowed' }} />
      </Field>

      <Field label="Location" hint={`${location.length} / 50 — helps with local pickups`}>
        <input
          type="text" value={location}
          onChange={e => setLocation(e.target.value.slice(0, 50))}
          maxLength={50} style={inputStyle}
          placeholder="e.g. London, Manchester"
        />
      </Field>

      <Field label="Bio" hint={`${bio.length} / 500`}>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value.slice(0, 500))}
          maxLength={500} rows={4}
          placeholder="Tell buyers about yourself… (e.g. handicap, favourite brands, years playing)"
          style={{ ...inputStyle, resize: 'vertical', minHeight: 96, fontFamily: 'inherit' }}
        />
      </Field>

      {msg && <Banner kind={msg.kind} text={msg.text} />}

      <button type="button" onClick={onSave} disabled={saving} style={{ ...btnPrimary(saving), marginTop: 8 }}>
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </div>
  );
}

/* ───── Notifications ───── */

function NotificationsTab({ user, onSaved }: { user: User; onSaved: () => void }) {
  const [emailN, setEmailN] = useState<boolean>(user.email_notifications !== false);
  const [orderN, setOrderN] = useState<boolean>(user.order_notifications !== false);
  const [marketing, setMarketing] = useState<boolean>(!!user.marketing_emails);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function onSave() {
    setSaving(true); setMsg(null);
    try {
      await updateMyProfile({
        email_notifications: emailN,
        order_notifications: orderN,
        marketing_emails: marketing,
      } as Partial<User>);
      onSaved();
      setMsg({ kind: 'ok', text: 'Preferences saved' });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={cardStyle}>
      <SectionHeader title="Notifications" subtitle="Control which emails you receive from Mulligans" />

      <Toggle
        label="Email notifications"
        helper="General updates and account activity"
        checked={emailN} onChange={setEmailN}
      />
      <Toggle
        label="Order updates"
        helper="Order status, shipping, and delivery updates"
        checked={orderN} onChange={setOrderN}
      />
      <Toggle
        label="Marketing emails"
        helper="Promotional offers and new features"
        checked={marketing} onChange={setMarketing}
      />

      {msg && <Banner kind={msg.kind} text={msg.text} />}

      <button type="button" onClick={onSave} disabled={saving} style={{ ...btnPrimary(saving), marginTop: 8 }}>
        {saving ? 'Saving…' : 'Save preferences'}
      </button>
    </div>
  );
}

/* ───── Sizing & Interests ───── */

function SizingTab({ user, onSaved }: { user: User; onSaved: () => void }) {
  const [handicap, setHandicap] = useState<string>(user.handicap || '');
  const [pref, setPref] = useState<string>(user.sizing_preference || '');
  const [clothing, setClothing] = useState<string[]>(asArray(user.clothing_size));
  const [shoes, setShoes] = useState<string[]>(asArray(user.shoe_size));
  const [gloves, setGloves] = useState<string[]>(asArray(user.glove_size));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const showMens = pref === 'mens' || pref === 'both';
  const showWomens = pref === 'womens' || pref === 'both';

  async function onSave() {
    if (handicap && !/^-?\d+(\.\d+)?$/.test(handicap)) {
      setMsg({ kind: 'err', text: 'Handicap must be a number (e.g. 12.5)' });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      await updateMyProfile({
        handicap: handicap || null,
        sizing_preference: pref || null,
        clothing_size: clothing,
        shoe_size: shoes,
        glove_size: gloves,
      } as Partial<User>);
      onSaved();
      setMsg({ kind: 'ok', text: 'Sizing saved' });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={cardStyle}>
      <SectionHeader title="Sizing &amp; interests" subtitle="Helps us show you the right items" />

      <Field label="Handicap (optional)">
        <input
          type="text" inputMode="decimal" value={handicap}
          onChange={e => setHandicap(e.target.value.slice(0, 6))}
          placeholder="e.g. 12.5" style={inputStyle}
        />
      </Field>

      <Field label="I shop for">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ v: 'mens', l: "Men's sizes" }, { v: 'womens', l: "Women's sizes" }, { v: 'both', l: 'Both' }].map(o => (
            <button
              key={o.v} type="button"
              onClick={() => setPref(p => (p === o.v ? '' : o.v))}
              style={chipStyle(pref === o.v)}
            >{o.l}</button>
          ))}
        </div>
      </Field>

      {showMens && (
        <>
          <h4 style={subHeaderStyle}>Men&apos;s sizes</h4>
          <ChipGroup label="Clothing size" options={MENS_CLOTHING} selected={clothing} onToggle={v => setClothing(toggleInList(clothing, v))} />
          <ChipGroup label="Shoe size (UK)" options={MENS_SHOES} selected={shoes} onToggle={v => setShoes(toggleInList(shoes, v))} prefix="UK " />
          <ChipGroup label="Glove size" options={MENS_GLOVES} selected={gloves} onToggle={v => setGloves(toggleInList(gloves, v))} />
        </>
      )}

      {showWomens && (
        <>
          <h4 style={subHeaderStyle}>Women&apos;s sizes</h4>
          <ChipGroup label="Clothing size" options={WOMENS_CLOTHING} selected={clothing} onToggle={v => setClothing(toggleInList(clothing, v))} />
          <ChipGroup label="Shoe size (UK)" options={WOMENS_SHOES} selected={shoes} onToggle={v => setShoes(toggleInList(shoes, v))} prefix="UK " />
          <ChipGroup label="Glove size" options={WOMENS_GLOVES} selected={gloves} onToggle={v => setGloves(toggleInList(gloves, v))} />
        </>
      )}

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: 12, borderRadius: 8, backgroundColor: PALETTE.infoBg,
        color: '#1E40AF', fontSize: 13, marginTop: 16,
      }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>Select your sizing preference first, then choose your sizes. This helps us show you the most relevant items.</span>
      </div>

      {msg && <Banner kind={msg.kind} text={msg.text} />}

      <button type="button" onClick={onSave} disabled={saving} style={{ ...btnPrimary(saving), marginTop: 16 }}>
        {saving ? 'Saving…' : 'Save sizing'}
      </button>
    </div>
  );
}

/* ───── Shipping ───── */

function ShippingTab({ user, onSaved }: { user: User; onSaved: () => void }) {
  const [postcode, setPostcode] = useState<string>(user.postcode_area || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function onSave() {
    if (postcode && !UK_POSTCODE_RE.test(postcode.trim())) {
      setMsg({ kind: 'err', text: 'Please enter a full UK postcode (e.g. SW1A 1AA, M1 1AE)' });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      await updateMyProfile({ postcode_area: postcode.trim().toUpperCase() || null } as Partial<User>);
      onSaved();
      setMsg({ kind: 'ok', text: 'Shipping info saved' });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={cardStyle}>
      <SectionHeader title="Shipping info" subtitle="Used to generate shipping labels" />

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: 12, borderRadius: 8, backgroundColor: PALETTE.infoBg,
        color: '#1E40AF', fontSize: 13, marginBottom: 16,
      }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>We don&apos;t store your full address. Stripe collects delivery addresses from buyers at checkout.</span>
      </div>

      <Field label="Your postcode" hint="Full UK postcode needed to generate accurate shipping labels">
        <input
          type="text" value={postcode}
          onChange={e => setPostcode(e.target.value.slice(0, 8).toUpperCase())}
          placeholder="e.g. SW1A 1AA, M1 1AE"
          style={inputStyle} maxLength={8}
        />
      </Field>

      <h4 style={subHeaderStyle}>Shipping options</h4>
      <p style={{ fontSize: 13, color: PALETTE.textMid, margin: '0 0 12px' }}>
        Shipping costs are calculated from your item&apos;s parcel size. Buyers pay the shipping fee at checkout.
      </p>
      <div style={{ border: `1px solid ${PALETTE.border}`, borderRadius: 8, overflow: 'hidden' }}>
        {PARCEL_INFO.map((p, i) => (
          <div key={p.name} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: 12, gap: 12,
            borderTop: i === 0 ? 'none' : `1px solid ${PALETTE.border}`,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: PALETTE.textDark }}>{p.name}</div>
              <div style={{ fontSize: 12, color: PALETTE.textLight }}>{p.desc}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: PALETTE.green }}>{p.price}</div>
          </div>
        ))}
      </div>

      {msg && <Banner kind={msg.kind} text={msg.text} />}

      <button type="button" onClick={onSave} disabled={saving} style={{ ...btnPrimary(saving), marginTop: 16 }}>
        {saving ? 'Saving…' : 'Save shipping info'}
      </button>
    </div>
  );
}

/* ───── Security (change password) ───── */

function SecurityTab() {
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [conf, setConf] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function onSave() {
    if (!cur) { setMsg({ kind: 'err', text: 'Enter your current password' }); return; }
    const v = validateNewPassword(nw);
    if (v) { setMsg({ kind: 'err', text: `New password: ${v}` }); return; }
    if (nw !== conf) { setMsg({ kind: 'err', text: 'New passwords do not match' }); return; }

    setSaving(true); setMsg(null);
    try {
      await changePassword({ currentPassword: cur, newPassword: nw });
      setMsg({ kind: 'ok', text: 'Password changed successfully' });
      setCur(''); setNw(''); setConf('');
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Password change failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={cardStyle}>
      <SectionHeader title="Change password" subtitle="Choose a strong password you don't use elsewhere" />

      <Field label="Current password" required>
        <input type="password" value={cur} onChange={e => setCur(e.target.value)}
          placeholder="Enter current password" style={inputStyle} autoComplete="current-password" />
      </Field>

      <Field
        label="New password"
        required
        hint="Min 8 chars · uppercase · lowercase · number · special (!@#$%^&*)"
      >
        <input type="password" value={nw} onChange={e => setNw(e.target.value)}
          placeholder="Enter new password" style={inputStyle} autoComplete="new-password" />
      </Field>

      <Field label="Confirm new password" required>
        <input type="password" value={conf} onChange={e => setConf(e.target.value)}
          placeholder="Confirm new password" style={inputStyle} autoComplete="new-password" />
      </Field>

      {msg && <Banner kind={msg.kind} text={msg.text} />}

      <button type="button" onClick={onSave} disabled={saving} style={{ ...btnPrimary(saving), marginTop: 8 }}>
        {saving ? 'Changing…' : 'Change password'}
      </button>

      <div style={{ marginTop: 16, fontSize: 13, color: PALETTE.textMid }}>
        Can&apos;t remember your password?{' '}
        <Link href="/forgot-password" style={{ color: PALETTE.green, fontWeight: 600 }}>Reset it</Link>
      </div>
    </div>
  );
}

/* ───── Account (data download, delete) ───── */

function AccountTab({
  user, onSaved, signOut,
}: { user: User; onSaved: () => void; signOut: () => void }) {
  const router = useRouter();
  const [pendingUntil, setPendingUntil] = useState<string | null>(user.deletion_scheduled_for || null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState<'' | 'delete' | 'cancel' | 'download'>('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (pendingUntil) {
      const ms = new Date(pendingUntil).getTime() - Date.now();
      setDaysLeft(Math.max(0, Math.ceil(ms / 86_400_000)));
    } else {
      setDaysLeft(null);
    }
  }, [pendingUntil]);

  async function onDownload() {
    setBusy('download'); setMsg(null);
    try {
      const res = await apiClient.get<unknown>(`/api/users/${user.id}/download-data`);
      const json = JSON.stringify(res, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mulligans-data-${user.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg({ kind: 'ok', text: 'Download started' });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Download failed' });
    } finally {
      setBusy('');
    }
  }

  async function onRequestDelete() {
    if (!pw) { setMsg({ kind: 'err', text: 'Enter your password to confirm' }); return; }
    setBusy('delete'); setMsg(null);
    try {
      const res = await apiClient.post<{ deletion_scheduled_for?: string; days_remaining?: number }>(
        '/api/users/request-deletion', { password: pw });
      setPendingUntil(res?.deletion_scheduled_for || null);
      setDaysLeft(res?.days_remaining ?? null);
      setShowDelete(false); setPw('');
      onSaved();
      setMsg({ kind: 'ok', text: 'Deletion scheduled' });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setBusy('');
    }
  }

  async function onCancelDelete() {
    setBusy('cancel'); setMsg(null);
    try {
      await apiClient.post<{ message: string }>('/api/users/cancel-deletion');
      setPendingUntil(null); setDaysLeft(null);
      onSaved();
      setMsg({ kind: 'ok', text: 'Deletion cancelled' });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Cancel failed' });
    } finally {
      setBusy('');
    }
  }

  return (
    <div style={cardStyle}>
      <SectionHeader title="Account" subtitle="Your data and account deletion" />

      {pendingUntil && (
        <div style={{
          padding: 16, borderRadius: 8,
          backgroundColor: PALETTE.warnBg,
          border: `1px solid ${PALETTE.warn}`, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertCircle size={18} color={PALETTE.warn} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: PALETTE.textDark, marginBottom: 4 }}>
                Account deletion scheduled
              </div>
              <div style={{ fontSize: 13, color: PALETTE.textMid }}>
                Your account will be permanently deleted on{' '}
                {new Date(pendingUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                {daysLeft !== null && ` (${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining)`}.
                You can cancel anytime during this window.
              </div>
            </div>
          </div>
          <button
            type="button" onClick={onCancelDelete}
            disabled={busy === 'cancel'}
            style={{ ...btnSecondary(busy === 'cancel'), marginTop: 12 }}
          >
            {busy === 'cancel' ? 'Cancelling…' : 'Cancel deletion'}
          </button>
        </div>
      )}

      <h4 style={subHeaderStyle}>Your data</h4>
      <p style={{ fontSize: 13, color: PALETTE.textMid, margin: '0 0 12px' }}>
        Export all your data as a JSON file.
      </p>
      <button type="button" onClick={onDownload} disabled={busy === 'download'} style={btnSecondary(busy === 'download')}>
        <Download size={16} /> {busy === 'download' ? 'Preparing…' : 'Download my data'}
      </button>

      {!pendingUntil && (
        <>
          <h4 style={{ ...subHeaderStyle, marginTop: 24, color: PALETTE.error }}>Danger zone</h4>
          <p style={{ fontSize: 13, color: PALETTE.textMid, margin: '0 0 12px' }}>
            Permanently delete your account. There&apos;s a 30-day cooling-off period during which
            you can cancel.
          </p>
          {!showDelete ? (
            <button
              type="button" onClick={() => setShowDelete(true)}
              style={btnDanger(false)}
            >
              <Trash2 size={16} /> Delete account
            </button>
          ) : (
            <div style={{
              padding: 16, borderRadius: 8,
              backgroundColor: PALETTE.errorBg,
              border: `1px solid ${PALETTE.error}`,
            }}>
              <div style={{ fontWeight: 700, color: PALETTE.error, marginBottom: 8 }}>
                Confirm account deletion
              </div>
              <ul style={{ fontSize: 13, color: PALETTE.textMid, margin: '0 0 12px', paddingLeft: 20 }}>
                <li>Your listings will be hidden immediately</li>
                <li>Your account will be permanently deleted after 30 days</li>
                <li>You can cancel anytime during the cooling-off period</li>
                <li>Transaction records are retained for legal compliance</li>
              </ul>
              <Field label="Enter your password to confirm" required>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                  placeholder="Password" style={inputStyle} autoComplete="current-password" />
              </Field>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={() => { setShowDelete(false); setPw(''); }} style={btnSecondary(false)}>
                  Cancel
                </button>
                <button type="button" onClick={onRequestDelete} disabled={busy === 'delete'} style={btnDanger(busy === 'delete')}>
                  {busy === 'delete' ? 'Scheduling…' : 'Confirm deletion'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {msg && <Banner kind={msg.kind} text={msg.text} />}
    </div>
  );
}

/* ───────────────────────── Shared bits ───────────────────────── */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: PALETTE.textDark, margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: PALETTE.textLight, margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
  );
}

function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: PALETTE.textDark }}>
          {label}{required && <span style={{ color: PALETTE.error, marginLeft: 4 }}>*</span>}
        </label>
        {hint && <span style={{ fontSize: 11, color: PALETTE.textLight }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label, helper, checked, onChange,
}: { label: string; helper?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: `1px solid ${PALETTE.border}`, gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: PALETTE.textDark }}>{label}</div>
        {helper && <div style={{ fontSize: 12, color: PALETTE.textLight, marginTop: 2 }}>{helper}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 26, borderRadius: 999,
          backgroundColor: checked ? PALETTE.toggleOn : PALETTE.toggleOff,
          border: 'none', cursor: 'pointer',
          position: 'relative', transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          backgroundColor: '#fff', transition: 'left 0.15s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }} />
      </button>
    </div>
  );
}

function ChipGroup({
  label, options, selected, onToggle, prefix,
}: {
  label: string; options: string[]; selected: string[];
  onToggle: (v: string) => void; prefix?: string;
}) {
  const count = options.filter(o => selected.includes(o)).length;
  return (
    <Field label={`${label}${count ? ` (${count} selected)` : ''}`}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(o => (
          <button
            key={o} type="button"
            onClick={() => onToggle(o)}
            style={chipStyle(selected.includes(o))}
          >
            {prefix}{o}
          </button>
        ))}
      </div>
    </Field>
  );
}

function Banner({ kind, text }: { kind: 'ok' | 'err'; text: string }) {
  const ok = kind === 'ok';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 8,
      backgroundColor: ok ? '#ECFDF5' : PALETTE.errorBg,
      color: ok ? '#065F46' : PALETTE.error,
      fontSize: 13, fontWeight: 600, marginTop: 12,
    }}>
      {ok ? <Check size={16} /> : <AlertCircle size={16} />}
      <span>{text}</span>
    </div>
  );
}

/* ───────────────────────── Styles ───────────────────────── */

const cardStyle: React.CSSProperties = {
  backgroundColor: PALETTE.card,
  borderRadius: 12,
  padding: 24,
  border: `1px solid ${PALETTE.border}`,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: PALETTE.textDark, margin: '0 0 12px',
};

const subHeaderStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: PALETTE.textDark, margin: '12px 0 10px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  border: `1px solid ${PALETTE.border}`,
  borderRadius: 8,
  fontSize: 14,
  color: PALETTE.textDark,
  backgroundColor: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${active ? PALETTE.green : PALETTE.border}`,
    backgroundColor: active ? PALETTE.green : '#fff',
    color: active ? '#fff' : PALETTE.textMid,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  };
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '12px 20px', borderRadius: 8, border: 'none',
    backgroundColor: disabled ? '#9CA3AF' : PALETTE.green,
    color: '#fff', fontSize: 14, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

function btnSecondary(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', borderRadius: 8,
    border: `1px solid ${PALETTE.borderStrong}`,
    backgroundColor: '#fff', color: PALETTE.textMid,
    fontSize: 13, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}

function btnDanger(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', borderRadius: 8, border: 'none',
    backgroundColor: disabled ? '#FCA5A5' : PALETTE.error,
    color: '#fff', fontSize: 13, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

const linkRow: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 12px', borderRadius: 8,
  color: PALETTE.textMid, fontSize: 14, fontWeight: 500,
  textDecoration: 'none', border: `1px solid ${PALETTE.border}`,
};
