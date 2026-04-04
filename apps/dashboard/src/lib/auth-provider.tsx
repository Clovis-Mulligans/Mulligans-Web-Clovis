'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, getSession } from './auth';
import { setTokenProvider } from '@mulligans/api-client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  isProStore: boolean | null;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  isProStore: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

// Set up token provider once at module level — not inside component
setTokenProvider(async () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mulligans_auth_token');
  }
  return null;
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
    isProStore: null,
  });

  // Read backend custom JWT from localStorage
  setTokenProvider(async () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mulligans_auth_token');
    }
    return null;
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const session = await getSession();
          const token = session?.tokens?.idToken?.toString();
          if (token && typeof window !== 'undefined') {
            localStorage.setItem('mulligans_auth_token', token);
          }
          setState({
            isAuthenticated: true,
            isLoading: false,
            userId: user.userId,
            isProStore: null, // Fetched from API after auth
          });
        } else {
          setState({
            isAuthenticated: false,
            isLoading: false,
            userId: null,
            isProStore: null,
          });
        }
      } catch {
        setState({
          isAuthenticated: false,
          isLoading: false,
          userId: null,
          isProStore: null,
        });
      }
    }
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
  );
}
