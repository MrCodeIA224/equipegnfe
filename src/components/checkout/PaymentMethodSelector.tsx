'use client';
import { Wallet, Smartphone } from 'lucide-react';
import { PaymentMethod } from '@/types';

const METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'CASH_ON_DELIVERY', label: 'Paiement à la livraison', icon: <Wallet className="w-4 h-4" /> },
  { value: 'ORANGE_MONEY', label: 'Orange Money', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'MTN_MOMO', label: 'MTN Mobile Money', icon: <Smartphone className="w-4 h-4" /> },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-warm-800">Mode de paiement</label>
      <div className="grid grid-cols-1 gap-2">
        {METHODS.map(m => (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
              value === m.value
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-warm-200 text-warm-600 hover:bg-warm-50'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
