'use client';
import { createContext, useContext, useState, useCallback, useEffect, useLayoutEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getUser, saveUser, saveTokens, clearAuth } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  login: (access: string, refresh: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Le serveur n'a pas accès à localStorage : on rend d'abord un état "null" identique
// des deux côtés, puis on hydrate depuis localStorage avant le premier paint client
// (useLayoutEffect ne s'exécute jamais côté serveur, d'où le garde typeof window).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useIsomorphicLayoutEffect(() => {
    setUser(getUser());
  }, []);

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
