'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requires_verification) {
          router.push(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
          return;
        }
        throw new Error(data.error || 'Invalid email or password');
      }

      // Store the backend JWT
      localStorage.setItem('mulligans_auth_token', data.accessToken);
      window.location.href = redirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12" style={{ backgroundColor: '#EAEAE0' }}>
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.8rem', color: '#1DC690', letterSpacing: '3px' }}>
            MULLIGANS
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.5rem', color: '#0D0D0D' }}>
            Welcome back
          </h1>
          <p className="mt-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#6B6B6B' }}>
            Sign in to your Mulligans account
          </p>

          {error && (
            <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(229,62,62,0.08)', color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border px-3.5 text-sm focus:outline-none focus:ring-2"
                style={{ fontFamily: 'var(--font-sans)', height: '44px', borderColor: '#E0E0D8', color: '#0D0D0D', backgroundColor: '#FFFFFF' }}
                onFocus={(e) => { e.target.style.borderColor = '#1DC690'; e.target.style.boxShadow = '0 0 0 3px rgba(29,198,144,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E0E0D8'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm transition-colors hover:underline" style={{ fontFamily: 'var(--font-sans)', color: '#1C4670' }}>
                  Forgot your password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-lg border px-3.5 text-sm focus:outline-none focus:ring-2"
                style={{ fontFamily: 'var(--font-sans)', height: '44px', borderColor: '#E0E0D8', color: '#0D0D0D', backgroundColor: '#FFFFFF' }}
                onFocus={(e) => { e.target.style.borderColor = '#1DC690'; e.target.style.boxShadow = '0 0 0 3px rgba(29,198,144,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E0E0D8'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[10px] text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, height: '48px', backgroundColor: '#1DC690' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Below card links */}
        <p className="mt-6 text-center text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold transition-colors hover:underline" style={{ color: '#1DC690' }}>
            Sign up →
          </Link>
        </p>
        <p className="mt-2 text-center text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>
          Are you a pro store?{' '}
          <a href="https://dashboard.mulligans.uk.com/apply" className="font-semibold transition-colors hover:underline" style={{ color: '#1DC690' }}>
            Apply for a dashboard →
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
