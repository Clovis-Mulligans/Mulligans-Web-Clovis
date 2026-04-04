'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MulligansLogo, Button, Input } from '@mulligans/ui';
import { signIn } from '@/lib/auth';

function LoginForm() {
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
    const result = await signIn(email, password);
    if (result.isSignedIn) {
      // Force a full page navigation to trigger auth re-check
      window.location.href = redirect;
    } else {
      setError('Sign in incomplete. Please try again.');
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'Invalid email or password'
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <MulligansLogo width={220} height={44} />
        <h1 className="text-xl font-semibold text-white">
          Pro Store Dashboard
        </h1>
        <p className="text-sm text-gray-400">
          Sign in to manage your store
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          variant="primary"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-400">
          Don&apos;t have a pro store?{' '}
          <a href="/apply" className="text-[#1DC690] hover:underline">
            Apply here
          </a>
        </p>
        <p className="text-sm text-gray-500">
          <a
            href="https://mulligans.uk.com"
            className="text-[#278AB0] hover:underline"
          >
            Visit Mulligans Marketplace
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06070A] px-4">
      <Suspense
        fallback={
          <div className="text-gray-400">Loading...</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
