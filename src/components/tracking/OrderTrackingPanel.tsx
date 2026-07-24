'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePolling } from '@/hooks/usePolling';
import { livreurPositionApi } from '@/lib/api';

const LocationMap = dynamic(() => import('@/components/map/LocationMap'), { ssr: false });

interface Position {
  latitude: number;
  longitude: number;
  updated_at: string;
}

type OrderKind = 'delivery' | 'market' | 'marketplace';

interface OrderTrackingPanelProps {
  orderKind: OrderKind;
  orderId: number;
}

function fetchPosition(orderKind: OrderKind, orderId: number) {
  if (orderKind === 'delivery') return livreurPositionApi.getForDeliveryOrder(orderId);
  if (orderKind === 'market') return livreurPositionApi.getForMarketRequest(orderId);
  return livreurPositionApi.getForMarketplaceOrder(orderId);
}

export default function OrderTrackingPanel({ orderKind, orderId }: OrderTrackingPanelProps) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePolling(() => {
    fetchPosition(orderKind, orderId)
      .then((res) => {
        setPosition(res.data);
        setError(null);
      })
      .catch(() => setError("Suivi indisponible pour le moment."));
  }, 12000);

  if (error) {
    return <p className="text-sm text-gray-500">{error}</p>;
  }

  if (!position) {
    return <p className="text-sm text-gray-500">En attente de la position du livreur...</p>;
  }

  return (
    <div className="space-y-2">
      <LocationMap latitude={position.latitude} longitude={position.longitude} label="Livreur" />
      <p className="text-xs text-gray-500">
        Dernière mise à jour : {new Date(position.updated_at).toLocaleTimeString('fr-FR')}
      </p>
    </div>
  );
}
