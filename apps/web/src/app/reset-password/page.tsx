'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!passwordValid) { setError('Password must be at least 8 characters'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam, code: token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      router.push('/login?reset=success');
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
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.5rem', color: '#0D0D0D' }}>Set new password</h1>
          <p className="mt-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#6B6B6B' }}>
            Choose a strong password for your account
          </p>

          {error && (
            <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(229,62,62,0.08)', color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required className="w-full rounded-lg border px-3.5 text-sm focus:outline-none" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className="w-full rounded-lg border px-3.5 text-sm focus:outline-none" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs" style={{ color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-[10px] text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, height: '48px', backgroundColor: '#1DC690' }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <Link href="/login" className="mt-4 inline-block text-sm transition-colors hover:underline" style={{ fontFamily: 'var(--font-sans)', color: '#1DC690' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
