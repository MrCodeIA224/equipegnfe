'use client';
import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { deliveryApi, marketplaceApi } from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface PaymentStepProps {
  orderId: number;
  orderType: 'delivery' | 'marketplace';
  providerLabel: string;
  onDone: () => void;
  onClose: () => void;
}

/**
 * Confirmation du paiement Mobile Money simulé, affichée juste APRÈS la
 * création de la commande (non bloquant pour le checkout - voir Phase 1
 * du plan). L'OTP simulé est affiché à l'écran façon sandbox puisqu'il n'y
 * a pas de vraie passerelle SMS branchée.
 */
export default function PaymentStep({ orderId, orderType, providerLabel, onDone, onClose }: PaymentStepProps) {
  const api = orderType === 'delivery' ? deliveryApi : marketplaceApi;
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const initiate = async () => {
    if (!phone.trim()) { toast.error('Numéro de téléphone requis.'); return; }
    setLoading(true);
    try {
      const { data } = await api.initiatePayment(orderId, { phone_number: phone });
      setReference(data.transaction_reference);
      setSimulatedOtp(data.simulated_otp);
      setStep('otp');
      toast.success(data.message);
    } catch {
      toast.error('Erreur lors de l\'initiation du paiement.');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!otp.trim()) { toast.error('Code de confirmation requis.'); return; }
    setLoading(true);
    try {
      await api.confirmPayment(orderId, { reference, otp_code: otp });
      toast.success('Paiement confirmé !');
      onDone();
    } catch {
      toast.error('Code de confirmation incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-warm-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary-500" /> Paiement {providerLabel}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-warm-100 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'phone' ? (
          <>
            <p className="text-sm text-warm-500 mb-4">
              Entrez votre numéro {providerLabel} pour recevoir un code de confirmation.
            </p>
            <Input placeholder="+224 6XX XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} />
            <Button onClick={initiate} loading={loading} className="w-full mt-4" size="lg">
              Recevoir le code
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-warm-500 mb-2">Code envoyé par SMS (simulation).</p>
            <p className="text-xs text-warm-400 mb-4">
              Code de test : <span className="font-mono font-bold text-warm-700">{simulatedOtp}</span>
            </p>
            <Input placeholder="Code à 4 chiffres" value={otp} onChange={e => setOtp(e.target.value)} maxLength={4} />
            <Button onClick={confirm} loading={loading} className="w-full mt-4" size="lg">
              Confirmer le paiement
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
