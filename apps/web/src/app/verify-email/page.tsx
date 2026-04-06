'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch {} finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12" style={{ backgroundColor: '#EAEAE0' }}>
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.8rem', color: '#1DC690', letterSpacing: '3px' }}>MULLIGANS</span>
        </div>

        <div className="rounded-2xl bg-white p-8 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          {/* Envelope icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(29,198,144,0.12)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </div>

          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.5rem', color: '#0D0D0D' }}>Check your email</h1>
          <p className="mt-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#6B6B6B', lineHeight: 1.6 }}>
            We&apos;ve sent a verification link to{' '}
            <strong style={{ color: '#1DC690' }}>{email || 'your email'}</strong>.
            Click the link to activate your account.
          </p>

          <div className="mt-6">
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="w-full rounded-[10px] py-3 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, border: '1.5px solid #1C4670', color: '#1C4670' }}
            >
              {resent ? 'Email Resent ✓' : resending ? 'Resending...' : 'Resend Email'}
            </button>
          </div>

          <Link href="/login" className="mt-4 inline-block text-sm transition-colors hover:underline" style={{ fontFamily: 'var(--font-sans)', color: '#1DC690' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
