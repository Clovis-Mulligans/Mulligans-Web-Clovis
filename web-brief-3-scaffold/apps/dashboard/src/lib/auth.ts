'use client';

import { Amplify } from 'aws-amplify';
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
          responseType: 'code', // PKCE flow
        },
      },
    },
  },
});

export async function signIn(email: string, password: string) {
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
