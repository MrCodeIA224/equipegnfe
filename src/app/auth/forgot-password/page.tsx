'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Veuillez indiquer votre email.'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.requestPasswordReset(email);
      setSimulatedOtp(data.simulated_otp);
      setStep(2);
      toast.success(data.message);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Erreur lors de la demande.');
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !newPassword || !newPassword2) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await authApi.confirmPasswordReset({
        email, otp_code: otpCode, new_password: newPassword, new_password2: newPassword2,
      });
      toast.success('Mot de passe réinitialisé avec succès !');
      router.push('/auth/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[] | string> } };
      const msg = error.response?.data ? Object.values(error.response.data)[0] : 'Erreur lors de la réinitialisation.';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-warm-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-warm-900">Mot de passe oublié</h1>
          <p className="text-warm-500 text-sm mt-1">
            {step === 1
              ? 'Indiquez votre email pour recevoir un code de vérification.'
              : 'Entrez le code reçu et votre nouveau mot de passe.'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <Input id="email" label="Email" type="email" placeholder="votre@email.gn"
              value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} />
            <Button type="submit" loading={loading} className="w-full" size="lg">Envoyer le code</Button>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="space-y-4">
            {simulatedOtp && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-sm text-primary-700">
                Code de démonstration (simulation, aucun email réel envoyé) : <strong>{simulatedOtp}</strong>
              </div>
            )}
            <Input id="otp_code" label="Code de vérification" type="text" placeholder="0000"
              value={otpCode} onChange={e => setOtpCode(e.target.value)} icon={<KeyRound className="w-4 h-4" />} />
            <Input id="new_password" label="Nouveau mot de passe" type="password" placeholder="••••••••"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} icon={<Lock className="w-4 h-4" />} />
            <Input id="new_password2" label="Confirmer le mot de passe" type="password" placeholder="••••••••"
              value={newPassword2} onChange={e => setNewPassword2(e.target.value)} icon={<Lock className="w-4 h-4" />} />
            <Button type="submit" loading={loading} className="w-full" size="lg">Réinitialiser le mot de passe</Button>
            <button type="button" onClick={() => setStep(1)}
              className="w-full text-center text-sm text-warm-500 hover:underline">
              ← Changer d&apos;adresse email
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-warm-500">
          <Link href="/auth/login" className="text-primary-500 font-semibold hover:underline">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
