'use client';
import { useState, useEffect } from 'react';
import { Package, ShoppingBag, Store, Clock, ChevronRight, MapPin, MessageCircle, RotateCcw } from 'lucide-react';
import { deliveryApi, marketApi, marketplaceApi } from '@/lib/api';
import { DeliveryOrder, MarketRequest, MarketplaceOrder } from '@/types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import OrderTrackingPanel from '@/components/tracking/OrderTrackingPanel';
import ChatPanel from '@/components/chat/ChatPanel';
import { stashDeliveryReorder, stashMarketReorder } from '@/lib/reorder';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const REORDERABLE_DELIVERY_STATUSES = ['DELIVERED', 'CANCELLED', 'LIVREUR_CANCELLED'];
const REORDERABLE_MARKET_STATUSES = ['COMPLETED', 'CANCELLED'];

export default function ClientDashboard() {
  const router = useRouter();
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [marketRequests, setMarketRequests] = useState<MarketRequest[]>([]);
  const [mpOrders, setMpOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'delivery' | 'market' | 'marketplace'>('delivery');
  const [openPanelKey, setOpenPanelKey] = useState<string | null>(null);

  const togglePanel = (key: string) => setOpenPanelKey(prev => (prev === key ? null : key));

  const reorderDelivery = (order: DeliveryOrder) => {
    stashDeliveryReorder({
      restaurantId: order.restaurant,
      items: order.order_items.map(oi => ({ menu_item_id: oi.menu_item, quantity: oi.quantity })),
      delivery_address: order.delivery_address,
      delivery_city: order.delivery_city,
    });
    router.push('/delivery');
  };

  const reorderMarket = (req: MarketRequest) => {
    stashMarketReorder({
      title: req.title,
      market_name: req.market_name,
      delivery_address: req.delivery_address,
      delivery_city: req.delivery_city,
      budget: req.budget,
      notes: req.notes,
      items: req.items.map(i => ({ name: i.name, quantity: i.quantity })),
    });
    router.push('/marche');
  };

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/auth/login'); return; }

    Promise.all([
      deliveryApi.getOrders(),
      marketApi.getRequests(),
      marketplaceApi.getOrders(),
    ]).then(([d, m, mp]) => {
      setDeliveryOrders(d.data.results || d.data);
      setMarketRequests(m.data.results || m.data);
      setMpOrders(mp.data.results || mp.data);
    }).catch(() => toast.error('Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [router]);

  const user = getUser();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-warm-900">Bonjour, {user?.first_name || user?.username} 👋</h1>
          <p className="text-warm-500 text-sm">Bienvenue sur votre espace client GnExpress</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { href: '/delivery', icon: '🍽️', label: 'Commander', color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
          { href: '/marche', icon: '🛒', label: 'Mon Marché', color: 'bg-green-50 border-green-200', text: 'text-green-700' },
          { href: '/boutiques', icon: '🏪', label: 'Boutiques', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
        ].map(({ href, icon, label, color, text }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${color} hover:shadow-md transition-all`}>
            <span className="text-3xl">{icon}</span>
            <span className={`text-sm font-bold ${text}`}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'delivery', label: `🍽️ Livraisons (${deliveryOrders.length})` },
          { id: 'market', label: `🛒 Courses (${marketRequests.length})` },
          { id: 'marketplace', label: `🏪 Achats (${mpOrders.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === t.id ? 'bg-primary-500 text-white' : 'bg-white border border-warm-200 text-warm-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Delivery Orders */}
      {tab === 'delivery' && (
        <div className="space-y-3">
          {deliveryOrders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🍽️</p>
              <p className="font-semibold text-warm-600 mb-4">Aucune commande</p>
              <Link href="/delivery" className="text-primary-500 font-semibold text-sm">Commander maintenant →</Link>
            </div>
          ) : deliveryOrders.map(order => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-warm-900 text-sm">{order.restaurant_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                      {order.status_display}
                    </span>
                  </div>
                  <p className="text-xs text-warm-500">
                    {order.order_items?.length || 0} article(s) · {formatCurrency(order.total_price)}
                  </p>
                  <p className="text-xs text-warm-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />{formatDate(order.created_at)}
                  </p>
                </div>
                <p className="text-base font-black text-primary-500">{formatCurrency(order.total_price)}</p>
              </div>
              {(order.livreur_id || REORDERABLE_DELIVERY_STATUSES.includes(order.status)) && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {order.livreur_id && ['PICKED_UP', 'DELIVERING'].includes(order.status) && (
                    <Button size="sm" variant="ghost" onClick={() => togglePanel(`track-delivery-${order.id}`)}>
                      <MapPin className="w-4 h-4" /> Suivre la livraison
                    </Button>
                  )}
                  {order.livreur_id && (
                    <Button size="sm" variant="ghost" onClick={() => togglePanel(`chat-delivery-${order.id}`)}>
                      <MessageCircle className="w-4 h-4" /> Chat
                    </Button>
                  )}
                  {REORDERABLE_DELIVERY_STATUSES.includes(order.status) && (
                    <Button size="sm" variant="ghost" onClick={() => reorderDelivery(order)}>
                      <RotateCcw className="w-4 h-4" /> Recommander
                    </Button>
                  )}
                </div>
              )}
              {openPanelKey === `track-delivery-${order.id}` && (
                <div className="mt-3"><OrderTrackingPanel orderKind="delivery" orderId={order.id} /></div>
              )}
              {openPanelKey === `chat-delivery-${order.id}` && (
                <div className="mt-3"><ChatPanel orderType="DELIVERY" orderId={order.id} /></div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Market Requests */}
      {tab === 'market' && (
        <div className="space-y-3">
          {marketRequests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🛒</p>
              <p className="font-semibold text-warm-600 mb-4">Aucune demande de courses</p>
              <Link href="/marche" className="text-primary-500 font-semibold text-sm">Faire mes courses →</Link>
            </div>
          ) : marketRequests.map(req => (
            <Card key={req.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-warm-900 text-sm">{req.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[req.status]}`}>
                      {req.status_display}
                    </span>
                  </div>
                  <p className="text-xs text-warm-500">{req.market_name} · {req.total_items} article(s)</p>
                  {req.coursier_name && <p className="text-xs text-green-600 font-semibold mt-0.5">Coursier: {req.coursier_name}</p>}
                  <p className="text-xs text-warm-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />{formatDate(req.created_at)}
                  </p>
                  {/* Offres en attente */}
                  {req.status === 'OPEN' && req.offers.length > 0 && (
                    <div className="mt-2 bg-green-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-green-700 mb-2">{req.offers.length} offre(s) reçue(s)</p>
                      {req.offers.map(offer => (
                        <div key={offer.id} className="flex items-center justify-between mb-1">
                          <span className="text-xs text-warm-700">{offer.coursier_name} - {formatCurrency(offer.proposed_fee)}</span>
                          <button onClick={async () => {
                            try {
                              const { data } = await marketApi.acceptOffer(req.id, offer.id);
                              setMarketRequests(prev => prev.map(r => r.id === req.id ? data : r));
                              toast.success('Offre acceptée !');
                            } catch { toast.error('Erreur.'); }
                          }} className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg font-semibold">
                            Accepter
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {(req.coursier_id || REORDERABLE_MARKET_STATUSES.includes(req.status)) && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {req.coursier_id && req.livreur_id && req.status === 'DELIVERING' && (
                      <Button size="sm" variant="ghost" onClick={() => togglePanel(`track-market-${req.id}`)}>
                        <MapPin className="w-4 h-4" /> Suivre la livraison
                      </Button>
                    )}
                    {req.coursier_id && (
                      <Button size="sm" variant="ghost" onClick={() => togglePanel(`chat-market-${req.id}`)}>
                        <MessageCircle className="w-4 h-4" /> Chat
                      </Button>
                    )}
                    {REORDERABLE_MARKET_STATUSES.includes(req.status) && (
                      <Button size="sm" variant="ghost" onClick={() => reorderMarket(req)}>
                        <RotateCcw className="w-4 h-4" /> Recommander
                      </Button>
                    )}
                  </div>
                )}
                {openPanelKey === `track-market-${req.id}` && (
                  <div className="mt-3"><OrderTrackingPanel orderKind="market" orderId={req.id} /></div>
                )}
                {openPanelKey === `chat-market-${req.id}` && (
                  <div className="mt-3"><ChatPanel orderType="MARKET" orderId={req.id} /></div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Marketplace Orders */}
      {tab === 'marketplace' && (
        <div className="space-y-3">
          {mpOrders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🏪</p>
              <p className="font-semibold text-warm-600 mb-4">Aucun achat</p>
              <Link href="/boutiques" className="text-primary-500 font-semibold text-sm">Découvrir les boutiques →</Link>
            </div>
          ) : mpOrders.map(order => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-warm-900 text-sm">{order.shop_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                      {order.status_display}
                    </span>
                  </div>
                  <p className="text-xs text-warm-500">{order.order_items?.length || 0} article(s) · {order.delivery_type === 'DELIVERY' ? 'Livraison' : 'Retrait'}</p>
                  <p className="text-xs text-warm-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />{formatDate(order.created_at)}
                  </p>
                </div>
                <p className="text-base font-black text-primary-500">{formatCurrency(order.total_price)}</p>
              </div>
              {order.livreur_id && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {order.status === 'DELIVERING' && (
                    <Button size="sm" variant="ghost" onClick={() => togglePanel(`track-marketplace-${order.id}`)}>
                      <MapPin className="w-4 h-4" /> Suivre la livraison
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => togglePanel(`chat-marketplace-${order.id}`)}>
                    <MessageCircle className="w-4 h-4" /> Chat
                  </Button>
                </div>
              )}
              {openPanelKey === `track-marketplace-${order.id}` && (
                <div className="mt-3"><OrderTrackingPanel orderKind="marketplace" orderId={order.id} /></div>
              )}
              {openPanelKey === `chat-marketplace-${order.id}` && (
                <div className="mt-3"><ChatPanel orderType="MARKETPLACE" orderId={order.id} /></div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
