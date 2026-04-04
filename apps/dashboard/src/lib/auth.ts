'use client';

import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage } from 'aws-amplify/utils';
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

// Configure Amplify — call this once at app startup
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [
            typeof window !== 'undefined'
              ? `${window.location.origin}/`
              : 'http://localhost:3001/',
          ],
          redirectSignOut: [
            typeof window !== 'undefined'
              ? `${window.location.origin}/login`
              : 'http://localhost:3001/login',
          ],
          responseType: 'code',
        },
      },
    },
  },
});

// Configure Amplify to use cookie storage instead of localStorage
// This allows the middleware to read tokens server-side
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  new CookieStorage({
    domain: typeof window !== 'undefined'
      ? window.location.hostname
      : 'dashboard.mulligans.uk.com',
    path: '/',
    expires: 30,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  })
);

export async function signIn(email: string, password: string) {
  // Sign out any existing session first to prevent "already signed in" error
  try {
    await amplifySignOut();
  } catch {
    // No existing session — that's fine
  }
  
  const result = await amplifySignIn({
    username: email,
    password,
  });
  if (result.isSignedIn) {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('mulligans_auth_token', token);
    }
  }
  return result;
}

export async function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mulligans_auth_token');
  }
  await amplifySignOut();
}

export async function getCurrentUser() {
  try {
    const user = await amplifyGetCurrentUser();
    return user;
  } catch {
    return null;
  }
}

export async function getSession() {
  try {
    const session = await fetchAuthSession();
    return session;
  } catch {
    return null;
  }
}

export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}
