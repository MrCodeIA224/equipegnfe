// Recommande rapide : passe un panier/formulaire pré-rempli d'une page à
// l'autre (dashboard client -> /delivery ou /marche) via sessionStorage,
// puisque ces pages ne partagent pas d'état React ni de query params dédiés.
// sessionStorage (pas localStorage) : la pré-sélection ne doit survivre qu'à
// la navigation immédiate qui suit le clic sur "Recommander", pas persister
// entre les sessions.

const DELIVERY_KEY = 'gnexpress_reorder_delivery';
const MARKET_KEY = 'gnexpress_reorder_market';

export interface DeliveryReorderPayload {
  restaurantId: number;
  items: { menu_item_id: number; quantity: number }[];
  delivery_address: string;
  delivery_city: string;
}

export interface MarketReorderPayload {
  title: string;
  market_name: string;
  delivery_address: string;
  delivery_city: string;
  budget: number;
  notes: string;
  items: { name: string; quantity: string }[];
}

export function stashDeliveryReorder(payload: DeliveryReorderPayload) {
  sessionStorage.setItem(DELIVERY_KEY, JSON.stringify(payload));
}

export function popDeliveryReorder(): DeliveryReorderPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(DELIVERY_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(DELIVERY_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function stashMarketReorder(payload: MarketReorderPayload) {
  sessionStorage.setItem(MARKET_KEY, JSON.stringify(payload));
}

export function popMarketReorder(): MarketReorderPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(MARKET_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(MARKET_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
