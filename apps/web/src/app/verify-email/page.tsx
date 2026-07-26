'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !code.trim()) return;
    setError('');
    setVerifying(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (data.accessToken) {
        localStorage.setItem('mulligans_auth_token', data.accessToken);
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError('');
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

  const inputStyle = { fontFamily: 'var(--font-sans)', height: '48px', borderColor: '#E0E0D8', color: '#0D0D0D', backgroundColor: '#FFFFFF' };
  const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#1DC690'; e.target.style.boxShadow = '0 0 0 3px rgba(29,198,144,0.12)'; };
  const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#E0E0D8'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12" style={{ backgroundColor: '#EAEAE0' }}>
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1.8rem', color: '#1DC690', letterSpacing: '3px' }}>MULLIGANS</span>
        </div>

        <div className="rounded-2xl bg-white p-8 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          {success ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(29,198,144,0.12)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1.5rem', color: '#0D0D0D' }}>Email Verified</h1>
              <p className="mt-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#6B6B6B', lineHeight: 1.6 }}>
                Your account is ready. Redirecting you now...
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(29,198,144,0.12)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>

              <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1.5rem', color: '#0D0D0D' }}>Check your email</h1>
              <p className="mt-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#6B6B6B', lineHeight: 1.6 }}>
                We&apos;ve sent a verification code to{' '}
                <strong style={{ color: '#1DC690' }}>{email || 'your email'}</strong>.
                Enter the code below to activate your account.
              </p>

              {error && (
                <div className="mt-4 rounded-lg p-3 text-sm text-left" style={{ backgroundColor: 'rgba(229,62,62,0.08)', color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="mt-6">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter verification code"
                  maxLength={6}
                  className="w-full rounded-lg border px-3.5 text-center text-lg tracking-widest focus:outline-none"
                  style={inputStyle}
                  onFocus={focusHandler}
                  onBlur={blurHandler}
                />
                <button
                  type="submit"
                  disabled={verifying || !code.trim()}
                  className="mt-4 w-full rounded-[10px] py-3 text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, height: '48px', backgroundColor: '#1DC690' }}
                >
                  {verifying ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>

              <div className="mt-4">
                <button
                  onClick={handleResend}
                  disabled={resending || resent}
                  className="w-full rounded-[10px] py-3 text-sm transition-colors disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, border: '1.5px solid #1C4670', color: '#1C4670' }}
                >
                  {resent ? 'Email Resent' : resending ? 'Resending...' : 'Resend Code'}
                </button>
              </div>

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

export default function VerifyEmailPageWrapper() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  );
}
