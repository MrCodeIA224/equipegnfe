import { describe, it, expect, beforeEach } from 'vitest';
import {
  stashDeliveryReorder, popDeliveryReorder,
  stashMarketReorder, popMarketReorder,
} from '@/lib/reorder';

describe('reorder handoff', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns null when nothing was stashed', () => {
    expect(popDeliveryReorder()).toBeNull();
    expect(popMarketReorder()).toBeNull();
  });

  it('round-trips a delivery reorder payload', () => {
    const payload = {
      restaurantId: 12,
      items: [{ menu_item_id: 3, quantity: 2 }],
      delivery_address: 'Quartier Almamya',
      delivery_city: 'Conakry',
    };
    stashDeliveryReorder(payload);
    expect(popDeliveryReorder()).toEqual(payload);
  });

  it('round-trips a market reorder payload', () => {
    const payload = {
      title: 'Mes courses', market_name: 'Marché Madina',
      delivery_address: 'Quartier Almamya', delivery_city: 'Conakry',
      budget: 50000, notes: 'Pas de piment',
      items: [{ name: 'Riz', quantity: '2 kg' }],
    };
    stashMarketReorder(payload);
    expect(popMarketReorder()).toEqual(payload);
  });

  it('clears the payload after popping so it is consumed once', () => {
    stashDeliveryReorder({
      restaurantId: 1, items: [], delivery_address: 'X', delivery_city: 'Conakry',
    });
    popDeliveryReorder();
    expect(popDeliveryReorder()).toBeNull();
  });

  it('does not mix up delivery and market payloads', () => {
    stashDeliveryReorder({ restaurantId: 1, items: [], delivery_address: 'X', delivery_city: 'Conakry' });
    expect(popMarketReorder()).toBeNull();
  });

  it('returns null on corrupted stored JSON instead of throwing', () => {
    sessionStorage.setItem('gnexpress_reorder_delivery', 'not json');
    expect(popDeliveryReorder()).toBeNull();
  });
});
