import { useEffect, useRef } from 'react';
import { useInterval } from './useInterval';
import { livreurPositionApi } from '@/lib/api';

/**
 * Diffuse la position GPS du livreur pendant une livraison active :
 * `watchPosition` garde la dernière position connue en mémoire (sans appel
 * réseau), et un intervalle séparé pousse cette position toutes les 12s -
 * on évite ainsi un POST à chaque micro-mouvement du GPS.
 */
export function useLivreurBroadcast(enabled: boolean, orderType?: string, orderId?: number) {
  const lastPosition = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Le backend stocke les coordonnées en DecimalField(max_digits=9, decimal_places=6) :
        // la précision brute du GPS (15+ décimales) dépasserait cette limite.
        lastPosition.current = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  useInterval(() => {
    if (!lastPosition.current) return;
    livreurPositionApi.push({
      ...lastPosition.current,
      order_type: orderType,
      order_id: orderId,
    }).catch(() => {});
  }, enabled ? 12000 : null);
}
