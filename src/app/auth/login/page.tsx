'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { getDashboardPath } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '';
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error('Veuillez remplir tous les champs.'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.login(form.username, form.password);
      login(data.access, data.refresh, data.user);
      toast.success(`Bienvenue, ${data.user.first_name || data.user.username} !`);
      router.push(redirect || getDashboardPath(data.user.role));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Email ou mot de passe incorrect.');
    } finally { setLoading(false); }
  };

  const quickAccess = [
    { label: 'Admin', email: 'admin@gnexpress.gn' },
    { label: 'Client', email: 'mamadou@test.gn' },
    { label: 'Livreur', email: 'ibrahima.livreur@test.gn' },
    { label: 'Restaurant', email: 'resto.madina@test.gn' },
    { label: 'Boutique', email: 'boutique.mode@test.gn' },
    { label: 'Coursier', email: 'kouyate.coursier@test.gn' },
  ];

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-xl border border-warm-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-warm-900">Connexion</h1>
          <p className="text-warm-500 text-sm mt-1">Accédez à votre compte GnExpress</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="username" label="Email ou nom d'utilisateur" type="text" placeholder="votre@email.gn"
            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
            icon={<Mail className="w-4 h-4" />} />
          <div className="relative">
            <Input id="password" label="Mot de passe" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              icon={<Lock className="w-4 h-4" />} />
            <button type="button" className="absolute right-3 top-[38px] text-warm-400 hover:text-warm-600"
              onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button type="submit" loading={loading} className="w-full" size="lg">Se connecter</Button>
        </form>
        <p className="mt-4 text-center text-sm text-warm-500">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-primary-500 font-semibold hover:underline">S'inscrire</Link>
        </p>
        <div className="mt-6 pt-6 border-t border-warm-100">
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3 text-center">
            Accès de test (mot de passe: GnExpress@2024)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {quickAccess.map(({ label, email }) => (
              <button key={email} type="button"
                onClick={() => setForm({ username: email, password: 'GnExpress@2024' })}
                className="text-xs font-semibold text-warm-600 bg-warm-50 hover:bg-warm-100 border border-warm-200 py-2 px-3 rounded-xl transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-warm-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-gradient-to-br from-primary-500 to-orange-700 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-2xl">G</span>
            </div>
            <span className="text-white font-black text-2xl">GnExpress</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">
            Bienvenue sur la super-app de la Guinée 🇬🇳
          </h2>
          <p className="text-orange-100 text-lg leading-relaxed">
            Livraison, courses au marché et boutiques numériques — tout en un.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {['🍽️ Livraison & Restauration', '🛒 Courses au marché (Mon Marché)', '🏪 Boutiques (Marché Numérique)'].map(item => (
              <div key={item} className="flex items-center gap-3 text-white/90">
                <div className="w-2 h-2 rounded-full bg-yellow-300" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={<div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
