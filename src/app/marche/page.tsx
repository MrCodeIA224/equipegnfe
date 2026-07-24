'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, ShoppingBag, Send } from 'lucide-react';
import { marketApi, authApi } from '@/lib/api';
import { MarketItem } from '@/types';
import { formatCurrency, MARKET_NAMES } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddressSelector from '@/components/checkout/AddressSelector';
import PromoCodeField from '@/components/checkout/PromoCodeField';
import { popMarketReorder } from '@/lib/reorder';

const SERVICE_FEE = 10000;

export default function MarchePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    title: 'Mes courses',
    market_name: 'Marché Madina',
    delivery_address: '',
    delivery_city: 'Conakry',
    budget: '',
    notes: '',
    is_delivery_needed: true,
  });
  const [items, setItems] = useState<MarketItem[]>([{ name: '', quantity: '', is_found: false }]);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    const payload = popMarketReorder();
    if (!payload) return;
    // Hydratation depuis sessionStorage (système externe) au montage : un des
    // deux usages légitimes d'un effect pour setState, pas un anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(prev => ({
      ...prev,
      title: payload.title,
      market_name: payload.market_name,
      delivery_address: payload.delivery_address,
      delivery_city: payload.delivery_city,
      budget: payload.budget ? String(payload.budget) : '',
      notes: payload.notes,
    }));
    setItems(payload.items.map(i => ({ name: i.name, quantity: i.quantity, is_found: false })));
    toast.success('Votre ancienne liste de courses a été pré-remplie !');
  }, []);

  const addItem = () => setItems(prev => [...prev, { name: '', quantity: '', is_found: false }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, k: keyof MarketItem, v: string) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  };

  const submit = async () => {
    const user = getUser();
    if (!user) { router.push('/auth/login?redirect=/marche'); return; }

    const validItems = items.filter(i => i.name.trim() && i.quantity.trim());
    if (validItems.length === 0) { toast.error('Ajoutez au moins un article.'); return; }
    if (!form.delivery_address.trim()) { toast.error('Indiquez une adresse de livraison.'); return; }

    setLoading(true);
    try {
      await marketApi.createRequest({
        ...form,
        budget: form.budget ? parseInt(form.budget) : 0,
        items: validItems,
        promo_code: promoCode,
      });
      setSuccess(true);
      toast.success('Demande de courses créée ! Des coursiers vont répondre.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = error.response?.data ? Object.values(error.response.data)[0] : 'Erreur.';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-warm-900 mb-2">Demande envoyée !</h2>
        <p className="text-warm-500 mb-8">Des coursiers disponibles vont voir votre demande et vous proposeront leurs services.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard/client"><Button>Suivre ma demande</Button></Link>
          <Button variant="outline" onClick={() => { setSuccess(false); setStep(1); setItems([{ name: '', quantity: '', is_found: false }]); }}>
            Nouvelle demande
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-warm-900">Mon Marché</h1>
          <p className="text-warm-500 text-sm">Un coursier fait vos courses, un livreur vous les apporte</p>
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8">
        <p className="text-sm font-bold text-green-800 mb-3">Comment ça marche ?</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { step: '1', icon: '📝', text: 'Faites votre liste de courses' },
            { step: '2', icon: '🛒', text: 'Un coursier va au marché pour vous' },
            { step: '3', icon: '🏍️', text: 'Un livreur vous livre à domicile' },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">{s.step}</div>
              <span className="text-xl">{s.icon}</span>
              <p className="text-xs text-green-700">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-2 mb-8">
        {[{ n: 1, l: 'Infos de livraison' }, { n: 2, l: 'Liste de courses' }].map(s => (
          <button key={s.n} onClick={() => setStep(s.n as 1 | 2)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              step === s.n ? 'bg-green-500 text-white' : 'bg-warm-100 text-warm-500 hover:bg-warm-200'
            }`}>
            <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs">{s.n}</span>
            {s.l}
          </button>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 space-y-5 shadow-sm">
          <Input label="Titre" placeholder="Courses de la semaine" value={form.title} onChange={set('title')} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-warm-800">Marché cible</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 w-4 h-4" />
              <select value={form.market_name} onChange={set('market_name')}
                className="w-full rounded-xl border border-warm-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {MARKET_NAMES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <AddressSelector
            value={form.delivery_address}
            city={form.delivery_city}
            onChange={(addr, c) => setForm(prev => ({ ...prev, delivery_address: addr, delivery_city: c }))}
          />

          <Input label="Budget estimé (optionnel)" type="number" placeholder="Ex: 200000"
            value={form.budget} onChange={set('budget')} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-warm-800">Instructions spéciales</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Ex: pas de piment, produits bio seulement..."
              className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          <Button onClick={() => setStep(2)} className="w-full bg-green-500 hover:bg-green-600" size="lg">
            Continuer vers la liste →
          </Button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-warm-900">Liste de courses</h3>
            <button onClick={addItem}
              className="flex items-center gap-2 text-sm text-green-600 font-semibold hover:bg-green-50 px-3 py-1.5 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Ajouter un article
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input placeholder={`Article ${i + 1} (ex: Riz)`} value={item.name}
                    onChange={e => updateItem(i, 'name', e.target.value)} />
                  <Input placeholder="Quantité (ex: 2 kg)" value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)} />
                </div>
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mb-5">
            <PromoCodeField
              orderType="MARKET"
              subtotal={SERVICE_FEE}
              onApplied={(codeVal, discount) => { setPromoCode(codeVal); setDiscountAmount(discount); }}
              onCleared={() => { setPromoCode(''); setDiscountAmount(0); }}
            />
          </div>

          <div className="bg-warm-50 rounded-xl p-4 mb-5 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-warm-600">Frais de service estimés</span>
              <span className="font-semibold">{formatCurrency(SERVICE_FEE)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between mb-1 text-green-600">
                <span>Réduction</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-warm-600">Livraison (variable)</span>
              <span className="font-semibold text-warm-400">Selon livreur</span>
            </div>
            {form.budget && (
              <div className="flex justify-between mt-1 pt-1 border-t border-warm-200">
                <span className="text-warm-600 font-semibold">Budget courses</span>
                <span className="font-bold text-green-600">{formatCurrency(parseInt(form.budget))}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              ← Retour
            </Button>
            <Button onClick={submit} loading={loading} className="flex-1 bg-green-500 hover:bg-green-600" size="lg">
              <Send className="w-4 h-4" /> Envoyer la demande
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
