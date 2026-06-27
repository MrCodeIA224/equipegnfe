import Cookies from 'js-cookie';
import { User, Role } from '@/types';

const TOKEN_EXPIRY_DAYS = 1;
const REFRESH_EXPIRY_DAYS = 7;

export function saveTokens(access: string, refresh: string) {
  Cookies.set('access_token', access, { expires: TOKEN_EXPIRY_DAYS });
  Cookies.set('refresh_token', refresh, { expires: REFRESH_EXPIRY_DAYS });
}

export function saveUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gn_user', JSON.stringify(user));
  }
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('gn_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth() {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gn_user');
  }
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('access_token');
}

export function getDashboardPath(role: Role): string {
  const paths: Record<Role, string> = {
    ADMIN: '/dashboard/admin',
    CLIENT: '/dashboard/client',
    LIVREUR: '/dashboard/livreur',
    RESTAURANT: '/dashboard/restaurant',
    BOUTIQUIERR: '/dashboard/boutique',
    COURSIER: '/dashboard/coursier',
  };
  return paths[role] || '/dashboard/client';
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  CLIENT: 'Client',
  LIVREUR: 'Livreur',
  RESTAURANT: 'Restaurant / Vendeur',
  BOUTIQUIERR: 'Boutiquierr',
  COURSIER: 'Coursier de Marché',
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  CLIENT: 'bg-blue-100 text-blue-800',
  LIVREUR: 'bg-orange-100 text-orange-800',
  RESTAURANT: 'bg-red-100 text-red-800',
  BOUTIQUIERR: 'bg-green-100 text-green-800',
  COURSIER: 'bg-yellow-100 text-yellow-800',
};
