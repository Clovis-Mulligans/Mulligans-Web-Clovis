'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from './auth';
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

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Prevent zombie state: Cognito session exists but backend JWT is absent
          if (typeof window !== 'undefined' && !localStorage.getItem('mulligans_auth_token')) {
            setState({
              isAuthenticated: false,
              isLoading: false,
              userId: null,
              isProStore: null,
            });
            return;
          }
          setState({
            isAuthenticated: true,
            isLoading: false,
            userId: user.userId,
            isProStore: null,
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
