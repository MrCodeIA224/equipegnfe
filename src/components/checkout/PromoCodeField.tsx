'use client';
import { useState } from 'react';
import { Tag } from 'lucide-react';
import { promoApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface PromoCodeFieldProps {
  orderType: 'DELIVERY' | 'MARKET' | 'MARKETPLACE';
  subtotal: number;
  onApplied: (code: string, discountAmount: number) => void;
  onCleared: () => void;
}

export default function PromoCodeField({ orderType, subtotal, onApplied, onCleared }: PromoCodeFieldProps) {
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);

  const apply = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      const { data } = await promoApi.validate({ code: code.trim(), order_type: orderType, subtotal });
      setApplied({ code: code.trim(), discount: data.discount_amount });
      onApplied(code.trim(), data.discount_amount);
      toast.success(data.message);
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = error.response?.data ? Object.values(error.response.data)[0] : 'Code promo invalide.';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setApplying(false);
    }
  };

  const clear = () => {
    setApplied(null);
    setCode('');
    onCleared();
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm">
        <span className="text-green-700 font-semibold">
          Code {applied.code} appliqué : -{formatCurrency(applied.discount)}
        </span>
        <button type="button" onClick={clear} className="text-xs text-green-600 hover:underline">Retirer</button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Input
          placeholder="Code promo"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          icon={<Tag className="w-4 h-4" />}
        />
      </div>
      <Button type="button" size="sm" variant="outline" loading={applying} onClick={apply}>
        Appliquer
      </Button>
    </div>
  );
}
