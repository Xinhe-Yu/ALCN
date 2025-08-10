'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';
import { isAuthenticated, removeToken, setToken } from '@/lib/auth';
import type { User } from '@/app/types';
import { saveLastEmail, clearLastEmail } from '@/lib/utils/preferences';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch {
        // Token might be expired or invalid
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, code: string) => {
    try {
      const tokenResponse = await authService.verify(email, code);
      setToken(tokenResponse.access_token);

      // Get user data after successful login
      const userData = await authService.getMe();
      setUser(userData);

      // Save email to localStorage for future logins
      saveLastEmail(email);
    } catch (error) {
      throw error; // Re-throw to let the component handle the error
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    clearLastEmail();
    router.push('/');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
