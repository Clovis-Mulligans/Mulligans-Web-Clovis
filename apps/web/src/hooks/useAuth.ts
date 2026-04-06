'use client';

import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating: number;
  location: string | null;
  is_verified_seller: boolean;
  created_at: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
