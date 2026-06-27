'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { getUser, saveUser, saveTokens, clearAuth } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  login: (access: string, refresh: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    return getUser();
  });

  const login = useCallback((access: string, refresh: string, userData: User) => {
    saveTokens(access, refresh);
    saveUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const updateUser = useCallback((userData: User) => {
    saveUser(userData);
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
