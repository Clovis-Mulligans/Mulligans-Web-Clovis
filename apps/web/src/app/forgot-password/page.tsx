'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send reset link');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12" style={{ backgroundColor: '#EAEAE0' }}>
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.8rem', color: '#1DC690', letterSpacing: '3px' }}>MULLIGANS</span>
        </div>

        <div className="rounded-2xl bg-white p-8" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(29,198,144,0.12)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.5rem', color: '#0D0D0D' }}>Check your email</h1>
              <p className="mt-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#6B6B6B', lineHeight: 1.6 }}>
                If an account exists with <strong style={{ color: '#1DC690' }}>{email}</strong>, we&apos;ve sent a password reset link.
              </p>
              <Link href="/login" className="mt-6 inline-block text-sm font-semibold transition-colors hover:underline" style={{ color: '#1DC690', fontFamily: 'var(--font-sans)' }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.5rem', color: '#0D0D0D' }}>Reset your password</h1>
              <p className="mt-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#6B6B6B' }}>
                Enter your email and we&apos;ll send you a reset link
              </p>

              {error && (
                <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(229,62,62,0.08)', color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>{error}</div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="w-full rounded-lg border px-3.5 text-sm focus:outline-none"
                    style={{ fontFamily: 'var(--font-sans)', height: '44px', borderColor: '#E0E0D8', color: '#0D0D0D' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1DC690'; e.target.style.boxShadow = '0 0 0 3px rgba(29,198,144,0.12)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E0E0D8'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full rounded-[10px] text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, height: '48px', backgroundColor: '#1DC690' }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <Link href="/login" className="mt-4 inline-block text-sm transition-colors hover:underline" style={{ fontFamily: 'var(--font-sans)', color: '#1DC690' }}>
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
