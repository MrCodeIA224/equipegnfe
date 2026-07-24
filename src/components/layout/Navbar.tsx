'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, ShoppingBag, Truck, ShoppingCart, User, LogOut, ChevronDown, MapPin } from 'lucide-react';
import { getDashboardPath, ROLE_LABELS, ROLE_COLORS } from '@/lib/auth';
import { authApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { cn, GUINEA_CITIES } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { city, setCity } = useCity();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    const refresh = Cookies.get('refresh_token');
    if (refresh) {
      try { await authApi.logout(refresh); } catch {}
    }
    logout();
    setProfileOpen(false);
    setMobileOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/delivery', label: 'Livraison', icon: Truck, color: 'text-orange-500' },
    { href: '/marche', label: 'Mon Marché', icon: ShoppingBag, color: 'text-green-600' },
    { href: '/boutiques', label: 'Boutiques', icon: ShoppingCart, color: 'text-blue-500' },
  ];

  return (
    <nav className="bg-white border-b border-warm-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-black text-lg">G</span>
            </div>
            <div className="leading-tight">
              <span className="font-black text-warm-900 text-lg">Gn</span>
              <span className="font-black text-primary-500 text-lg">Express</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-sm font-semibold text-warm-700">
              <MapPin className="w-4 h-4 text-warm-400" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
                aria-label="Choisir une ville"
              >
                {GUINEA_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {navLinks.map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-100 hover:text-warm-900 transition-colors"
              >
                <Icon className={cn('w-4 h-4', color)} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-warm-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user.first_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-warm-900 leading-tight">
                      {user.first_name || user.username}
                    </p>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full', ROLE_COLORS[user.role])}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-warm-500" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-warm-200 shadow-xl py-2 animate-fade-in">
                    <Link
                      href={getDashboardPath(user.role)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-700 hover:bg-warm-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Mon tableau de bord
                    </Link>
                    <hr className="my-1 border-warm-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-warm-700 hover:text-warm-900 rounded-xl hover:bg-warm-100 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl shadow-sm transition-colors"
                >
                  S&apos;inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-warm-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-warm-200 px-4 py-4 animate-fade-in">
          <div className="flex items-center gap-1.5 px-4 py-2 mb-1 rounded-xl text-sm font-semibold text-warm-700 bg-warm-50">
            <MapPin className="w-4 h-4 text-warm-400" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer w-full"
              aria-label="Choisir une ville"
            >
              {GUINEA_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-100 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Icon className={cn('w-5 h-5', color)} />
                {label}
              </Link>
            ))}
          </div>
          <hr className="my-3 border-warm-200" />
          {user ? (
            <div>
              <div className="flex items-center gap-3 px-4 py-3 mb-1">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">
                    {user.first_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-warm-900">{user.first_name || user.username}</p>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full', ROLE_COLORS[user.role])}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </div>
              <Link
                href={getDashboardPath(user.role)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-100"
                onClick={() => setMobileOpen(false)}
              >
                <User className="w-5 h-5" />
                Mon tableau de bord
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login" className="flex-1 py-2.5 text-center text-sm font-semibold border-2 border-primary-500 text-primary-600 rounded-xl" onClick={() => setMobileOpen(false)}>
                Connexion
              </Link>
              <Link href="/auth/register" className="flex-1 py-2.5 text-center text-sm font-semibold bg-primary-500 text-white rounded-xl" onClick={() => setMobileOpen(false)}>
                S&apos;inscrire
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
