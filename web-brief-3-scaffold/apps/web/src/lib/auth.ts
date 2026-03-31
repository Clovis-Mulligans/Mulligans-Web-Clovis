'use client';

import { Amplify } from 'aws-amplify';
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

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
              : 'http://localhost:3000/',
          ],
          redirectSignOut: [
            typeof window !== 'undefined'
              ? `${window.location.origin}/login`
              : 'http://localhost:3000/login',
          ],
          responseType: 'code',
        },
      },
    },
  },
});

export async function signIn(email: string, password: string) {
  const result = await amplifySignIn({ username: email, password });
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
    return await amplifyGetCurrentUser();
  } catch {
    return null;
  }
}

export async function getSession() {
  try {
    return await fetchAuthSession();
  } catch {
    return null;
  }
}
