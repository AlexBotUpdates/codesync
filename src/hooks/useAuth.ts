'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import type { User } from '@/types';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    if (!user && isLoading) {
      checkAuth();
    }
  }, [user, isLoading, setUser]);

  const login = async (email: string, password: string, remember: boolean = false) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.data.user);
    return data.data;
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    setUser(data.data.user);
    return data.data;
  };

  const logoutUser = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout: logoutUser,
    setUser,
  };
}
