'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Plus } from 'lucide-react';
import { addressApi } from '@/lib/api';
import { Address } from '@/types';
import { GUINEA_CITIES } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const MapPicker = dynamic(() => import('@/components/map/MapPicker'), { ssr: false });

interface AddressSelectorProps {
  value: string;
  city: string;
  onChange: (address: string, city: string) => void;
}

export default function AddressSelector({ value, city, onChange }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('Conakry');
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);

  useEffect(() => {
    addressApi.list()
      .then(r => setAddresses(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveNewAddress = async () => {
    if (!newLabel.trim() || !newAddress.trim()) {
      toast.error('Libellé et adresse requis.');
      return;
    }
    try {
      const { data } = await addressApi.create({
        label: newLabel, full_address: newAddress, city: newCity,
        latitude: newLat, longitude: newLng,
      });
      setAddresses(prev => [data, ...prev]);
      onChange(data.full_address, data.city);
      setAdding(false);
      setNewLabel('');
      setNewAddress('');
      setNewLat(null);
      setNewLng(null);
      toast.success('Adresse enregistrée.');
    } catch {
      toast.error('Erreur lors de l\'enregistrement de l\'adresse.');
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-warm-800">Adresse de livraison</label>

      {!loading && addresses.length > 0 && !adding && (
        <div className="space-y-1.5">
          {addresses.map(addr => (
            <button
              key={addr.id}
              type="button"
              onClick={() => onChange(addr.full_address, addr.city)}
              className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                value === addr.full_address
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-warm-200 hover:bg-warm-50'
              }`}
            >
              <span className="font-semibold text-warm-900">{addr.label}</span>
              <span className="text-warm-500"> — {addr.full_address} ({addr.city})</span>
            </button>
          ))}
        </div>
      )}

      {adding ? (
        <div className="space-y-2 border border-warm-200 rounded-xl p-3">
          <Input
            placeholder="Libellé (ex: Maison, Bureau)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
          />
          <Input
            placeholder="Adresse complète"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            icon={<MapPin className="w-4 h-4" />}
          />
          <select
            value={newCity}
            onChange={e => setNewCity(e.target.value)}
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {GUINEA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div>
            <p className="text-xs text-warm-500 mb-1">Placez un repère sur la carte (optionnel).</p>
            <MapPicker
              latitude={newLat}
              longitude={newLng}
              onChange={(lat, lng) => { setNewLat(lat); setNewLng(lng); }}
              height={220}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="flex-1" onClick={saveNewAddress}>Enregistrer</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Annuler</Button>
          </div>
        </div>
      ) : (
        <>
          <Input
            placeholder="Votre adresse complète..."
            value={value}
            onChange={e => onChange(e.target.value, city)}
            icon={<MapPin className="w-4 h-4" />}
          />
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter une nouvelle adresse
          </button>
        </>
      )}
    </div>
  );
}
