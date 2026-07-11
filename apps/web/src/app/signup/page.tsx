'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!passwordValid) { setError('Password must be at least 8 characters'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }
    if (!agreed) { setError('Please agree to the Terms of Service and Privacy Policy'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          display_name: displayName.trim(),
          signup_platform: 'web',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { fontFamily: 'var(--font-sans)', height: '44px', borderColor: '#E0E0D8', color: '#0D0D0D', backgroundColor: '#FFFFFF' };
  const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#1DC690'; e.target.style.boxShadow = '0 0 0 3px rgba(29,198,144,0.12)'; };
  const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#E0E0D8'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12" style={{ backgroundColor: '#EAEAE0' }}>
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.8rem', color: '#1DC690', letterSpacing: '3px' }}>MULLIGANS</span>
        </div>

        <div className="rounded-2xl bg-white p-8" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.5rem', color: '#0D0D0D' }}>Join Mulligans</h1>
          <p className="mt-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#6B6B6B' }}>Buy smart. Sell easy. Play better.</p>

          {error && (
            <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(229,62,62,0.08)', color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Display Name <span style={{ color: '#E53E3E' }}>*</span></label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required className="w-full rounded-lg border px-3.5 text-sm focus:outline-none" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Email <span style={{ color: '#E53E3E' }}>*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full rounded-lg border px-3.5 text-sm focus:outline-none" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Password <span style={{ color: '#E53E3E' }}>*</span></label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required className="w-full rounded-lg border px-3.5 text-sm focus:outline-none" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              {password.length > 0 && !passwordValid && (
                <p className="mt-1 text-xs" style={{ color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>Password must be at least 8 characters</p>
              )}
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Confirm Password <span style={{ color: '#E53E3E' }}>*</span></label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className="w-full rounded-lg border px-3.5 text-sm focus:outline-none" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs" style={{ color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>Passwords do not match</p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#1DC690]" />
              <span className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>
                I agree to the{' '}
                <Link href="/terms" className="underline" style={{ color: '#1C4670' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline" style={{ color: '#1C4670' }}>Privacy Policy</Link>
              </span>
            </label>

            <button type="submit" disabled={loading} className="w-full rounded-[10px] text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, height: '48px', backgroundColor: '#1DC690' }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold transition-colors hover:underline" style={{ color: '#1DC690' }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
