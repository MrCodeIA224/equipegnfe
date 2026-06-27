'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { User, Mail, Phone, Lock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { saveTokens, saveUser, getDashboardPath } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Role } from '@/types';

const ROLE_OPTIONS = [
  { value: 'CLIENT', label: 'Client', icon: '👤', desc: 'Commander et acheter' },
  { value: 'LIVREUR', label: 'Livreur', icon: '🏍️', desc: 'Effectuer des livraisons' },
  { value: 'COURSIER', label: 'Coursier', icon: '🛒', desc: 'Faire les courses au marché' },
  { value: 'RESTAURANT', label: 'Restaurant', icon: '🍽️', desc: 'Gérer mon restaurant' },
  { value: 'BOUTIQUIERR', label: 'Boutiquierr', icon: '🏪', desc: 'Gérer ma boutique' },
];

const CITIES = ['Conakry', 'Kindia', 'Kankan', 'Labé', "N'Zérékoré", 'Mamou', 'Faranah', 'Boké'];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = (params.get('role') as Role) || 'CLIENT';

  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password2: '', role: defaultRole,
    phone: '', city: 'Conakry', address: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      saveTokens(data.tokens.access, data.tokens.refresh);
      saveUser(data.user);
      toast.success('Compte créé avec succès !');
      router.push(getDashboardPath(data.user.role));
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const errors = error.response?.data;
      if (errors) {
        const first = Object.values(errors)[0];
        toast.error(Array.isArray(first) ? first[0] : String(first));
      } else { toast.error("Une erreur s'est produite."); }
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-xl">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xl">G</span>
          </div>
          <span className="font-black text-2xl text-warm-900">GnExpress</span>
        </Link>
        <h1 className="text-2xl font-black text-warm-900">Créer un compte</h1>
        <p className="text-warm-500 text-sm mt-1">Rejoignez la communauté GnExpress</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-warm-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-warm-800 block mb-3">Je souhaite...</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLE_OPTIONS.map(({ value, label, icon, desc }) => (
                <button key={value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, role: value as Role }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${
                    form.role === value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-warm-200 text-warm-600 hover:border-warm-300'
                  }`}>
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-bold">{label}</span>
                  <span className="text-xs text-warm-400 leading-tight">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input id="first_name" label="Prénom" placeholder="Mamadou" value={form.first_name} onChange={set('first_name')} required icon={<User className="w-4 h-4" />} />
            <Input id="last_name" label="Nom" placeholder="Diallo" value={form.last_name} onChange={set('last_name')} required />
          </div>
          <Input id="username" label="Nom d'utilisateur" placeholder="mamadou.diallo" value={form.username} onChange={set('username')} required icon={<User className="w-4 h-4" />} />
          <Input id="email" label="Email" type="email" placeholder="votre@email.gn" value={form.email} onChange={set('email')} required icon={<Mail className="w-4 h-4" />} />
          <Input id="phone" label="Téléphone" placeholder="+224 620 000 000" value={form.phone} onChange={set('phone')} required icon={<Phone className="w-4 h-4" />} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-warm-800">Ville</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 w-4 h-4" />
              <select value={form.city} onChange={set('city')}
                className="w-full rounded-xl border border-warm-200 bg-white pl-10 pr-4 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <Input id="password" label="Mot de passe" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required icon={<Lock className="w-4 h-4" />} />
          <Input id="password2" label="Confirmer le mot de passe" type="password" placeholder="••••••••" value={form.password2} onChange={set('password2')} required icon={<Lock className="w-4 h-4" />} />

          <Button type="submit" loading={loading} className="w-full" size="lg">Créer mon compte</Button>
        </form>

        <p className="text-center text-sm text-warm-500 mt-5">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-primary-500 font-semibold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-warm-50 py-10 px-4 flex items-start justify-center">
      <Suspense fallback={<div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mt-20" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
