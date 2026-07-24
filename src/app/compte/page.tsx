'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function ComptePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) router.push('/auth/login?redirect=/compte');
  }, [user, router]);

  const requestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmail.trim() || !newEmail.trim()) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.requestEmailChange({ current_email: currentEmail, new_email: newEmail });
      setSimulatedOtp(data.simulated_otp);
      setStep(2);
      toast.success(data.message);
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[] | string> } };
      const msg = error.response?.data ? Object.values(error.response.data)[0] : 'Erreur lors de la demande.';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setLoading(false);
    }
  };

  const confirmChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error('Veuillez saisir le code reçu.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.confirmEmailChange(otpCode);
      updateUser(data);
      toast.success('Adresse email mise à jour avec succès !');
      setStep(1);
      setCurrentEmail('');
      setNewEmail('');
      setOtpCode('');
      setSimulatedOtp('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black text-warm-900 mb-1">Mon compte</h1>
      <p className="text-warm-500 text-sm mb-8">Gérez les informations de votre compte</p>

      <Card>
        <h2 className="font-bold text-warm-900 mb-1">Changer d&apos;adresse email</h2>
        <p className="text-sm text-warm-500 mb-4">Email actuel : <strong>{user.email}</strong></p>

        {step === 1 ? (
          <form onSubmit={requestChange} className="space-y-4">
            <Input id="current_email" label="Confirmez votre email actuel" type="email" placeholder={user.email}
              value={currentEmail} onChange={e => setCurrentEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} />
            <Input id="new_email" label="Nouvelle adresse email" type="email" placeholder="nouvelle@email.gn"
              value={newEmail} onChange={e => setNewEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} />
            <Button type="submit" loading={loading} className="w-full">Envoyer le code de validation</Button>
          </form>
        ) : (
          <form onSubmit={confirmChange} className="space-y-4">
            {simulatedOtp && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-sm text-primary-700">
                Code de démonstration (simulation, aucun email réel envoyé) : <strong>{simulatedOtp}</strong>
              </div>
            )}
            <p className="text-sm text-warm-500">Un code de validation a été envoyé à <strong>{newEmail}</strong>.</p>
            <Input id="otp_code" label="Code de vérification" type="text" placeholder="0000"
              value={otpCode} onChange={e => setOtpCode(e.target.value)} icon={<KeyRound className="w-4 h-4" />} />
            <div className="flex gap-2">
              <Button type="submit" loading={loading} className="flex-1">Valider</Button>
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>Annuler</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
