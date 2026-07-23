'use client';
import { useState, useEffect, useCallback } from 'react';
import { Truck, Package, CheckCircle, MapPin, AlertTriangle, RefreshCw, ShoppingCart } from 'lucide-react';
import { deliveryApi, marketApi, marketplaceApi } from '@/lib/api';
import { DeliveryOrder, MarketRequest, MarketplaceOrder } from '@/types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LivreurDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [availableDelivery, setAvailableDelivery] = useState<DeliveryOrder[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<DeliveryOrder[]>([]);
  const [needDelivery, setNeedDelivery] = useState<MarketRequest[]>([]);
  const [mpAvailable, setMpAvailable] = useState<MarketplaceOrder[]>([]);
  const [myMpOrders, setMyMpOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'available' | 'mine'>('available');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, mine, needDel, mpAvail, mpMine] = await Promise.all([
        deliveryApi.getAvailableOrders(),
        deliveryApi.getOrders(),                        // toutes mes commandes
        marketApi.getNeedDelivery(),
        marketplaceApi.getAvailableForDelivery(),
        marketplaceApi.getOrders(),                     // toutes mes commandes mp
      ]);
      setAvailableDelivery(avail.data);
      // Mes commandes delivery (en cours + historique livrées)
      const allMine: DeliveryOrder[] = mine.data.results || mine.data;
      setMyDeliveries(allMine.filter(o =>
        ['PICKED_UP', 'DELIVERING', 'LIVREUR_CANCELLED', 'DELIVERED'].includes(o.status)
      ));
      setNeedDelivery(needDel.data);
      setMpAvailable(mpAvail.data);
      // Mes commandes marketplace (en cours + historique livrées)
      const allMpMine: MarketplaceOrder[] = mpMine.data.results || mpMine.data;
      setMyMpOrders(allMpMine.filter(o =>
        ['DELIVERING', 'LIVREUR_CANCELLED', 'DELIVERED'].includes(o.status)
      ));
    } catch {
      toast.error('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'LIVREUR') { router.push('/dashboard/client'); return; }
    // loadData est aussi le handler du bouton "Actualiser" ; son setLoading(true) initial est un no-op ici.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [user, loadData, router]);

  const acceptDelivery = async (orderId: number) => {
    try {
      await deliveryApi.assignLivreur(orderId);
      toast.success('Commande acceptée ! Elle apparaît dans "Mes livraisons".');
      // Retire des disponibles et reload mes livraisons
      setAvailableDelivery(prev => prev.filter(o => o.id !== orderId));
      const { data } = await deliveryApi.getOrders();
      const allMine: DeliveryOrder[] = data.results || data;
      setMyDeliveries(allMine.filter(o =>
        ['PICKED_UP', 'DELIVERING', 'LIVREUR_CANCELLED', 'DELIVERED'].includes(o.status)
      ));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Erreur — cette commande a peut-être déjà été prise.');
    }
  };

  const acceptMpDelivery = async (orderId: number) => {
    try {
      await marketplaceApi.assignLivreur(orderId);
      toast.success('Commande boutique acceptée !');
      setMpAvailable(prev => prev.filter(o => o.id !== orderId));
      const { data } = await marketplaceApi.getOrders();
      const allMpMine: MarketplaceOrder[] = data.results || data;
      setMyMpOrders(allMpMine.filter(o =>
        ['DELIVERING', 'LIVREUR_CANCELLED', 'DELIVERED'].includes(o.status)
      ));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Erreur — commande déjà prise.');
    }
  };

  const updateDeliveryStatus = async (orderId: number, status: string) => {
    try {
      const { data } = await deliveryApi.updateOrderStatus(orderId, status);
      setMyDeliveries(prev => prev.map(o => o.id === orderId ? data : o));
      toast.success('Statut mis à jour !');
    } catch { toast.error('Erreur.'); }
  };

  const updateMpStatus = async (orderId: number, status: string) => {
    try {
      const { data } = await marketplaceApi.updateOrderStatus(orderId, status);
      setMyMpOrders(prev => prev.map(o => o.id === orderId ? data : o));
      toast.success('Statut mis à jour !');
    } catch { toast.error('Erreur.'); }
  };

  const cancelDelivery = async (orderId: number) => {
    if (!confirm('Annuler cette prise en charge ? Le restaurant devra confirmer.')) return;
    try {
      const { data } = await deliveryApi.cancelDelivery(orderId);
      setMyDeliveries(prev => prev.map(o => o.id === orderId ? data : o));
      toast.success('Annulation envoyée. Le restaurant doit confirmer.');
    } catch { toast.error('Erreur.'); }
  };

  const cancelMpDelivery = async (orderId: number) => {
    if (!confirm('Annuler cette livraison ? La boutique devra confirmer.')) return;
    try {
      const { data } = await marketplaceApi.cancelDelivery(orderId);
      setMyMpOrders(prev => prev.map(o => o.id === orderId ? data : o));
      toast.success('Annulation envoyée. La boutique doit confirmer.');
    } catch { toast.error('Erreur.'); }
  };

  const acceptMarketDelivery = async (reqId: number) => {
    try {
      await marketApi.assignLivreur(reqId, user!.id);
      toast.success('Mission acceptée !');
      setNeedDelivery(prev => prev.filter(r => r.id !== reqId));
    } catch { toast.error('Erreur.'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  const totalAvailable = availableDelivery.length + needDelivery.length + mpAvailable.length;
  const totalMine = myDeliveries.length + myMpOrders.length;
  const totalInProgress = myDeliveries.filter(o => o.status !== 'DELIVERED').length
    + myMpOrders.filter(o => o.status !== 'DELIVERED').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-warm-900">Dashboard Livreur</h1>
          <p className="text-warm-500 text-sm">Bienvenue, {user?.first_name}</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 text-xs font-semibold text-warm-500 hover:text-warm-800 px-3 py-2 rounded-xl hover:bg-warm-100 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-orange-600">{totalAvailable}</p>
          <p className="text-xs text-orange-500 font-semibold">Disponibles</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{totalInProgress}</p>
          <p className="text-xs text-blue-500 font-semibold">En cours</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-green-600">
            {myDeliveries.filter(o => o.status === 'DELIVERED').length + myMpOrders.filter(o => o.status === 'DELIVERED').length}
          </p>
          <p className="text-xs text-green-500 font-semibold">Livrées</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'available', l: `Disponibles (${totalAvailable})` },
          { id: 'mine',      l: `Mes livraisons (${totalMine})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t.id ? 'bg-primary-500 text-white' : 'bg-white border border-warm-200 text-warm-600'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'available' && (
        <div className="space-y-4">
          {/* Livraisons restaurant */}
          {availableDelivery.length > 0 && (
            <>
              <h3 className="font-bold text-warm-700 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-500" /> Restaurants ({availableDelivery.length})
              </h3>
              {availableDelivery.map(order => (
                <Card key={order.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-warm-900">{order.restaurant_name}</p>
                      <p className="text-xs text-warm-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />{order.delivery_address}
                      </p>
                      <p className="text-xs text-warm-400 mt-0.5">{formatDate(order.created_at)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-bold text-primary-500">{formatCurrency(order.delivery_fee)} frais</span>
                        <span className="text-xs text-warm-500">{order.order_items?.length || 0} article(s)</span>
                      </div>
                    </div>
                    <Button onClick={() => acceptDelivery(order.id)} size="sm">
                      Accepter
                    </Button>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* Livraisons boutiques */}
          {mpAvailable.length > 0 && (
            <>
              <h3 className="font-bold text-warm-700 text-sm flex items-center gap-2 mt-4">
                <ShoppingCart className="w-4 h-4 text-indigo-500" /> Boutiques ({mpAvailable.length})
              </h3>
              {mpAvailable.map(order => (
                <Card key={order.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-warm-900">{order.shop_name}</p>
                      <p className="text-xs text-warm-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />{order.delivery_address}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-bold text-primary-500">{formatCurrency(order.delivery_fee)} frais</span>
                        <span className="text-xs text-warm-500">{order.order_items?.length || 0} article(s)</span>
                      </div>
                    </div>
                    <Button onClick={() => acceptMpDelivery(order.id)} size="sm" variant="secondary">
                      Accepter
                    </Button>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* Courses marché */}
          {needDelivery.length > 0 && (
            <>
              <h3 className="font-bold text-warm-700 text-sm flex items-center gap-2 mt-4">
                <Package className="w-4 h-4 text-green-500" /> Courses à livrer ({needDelivery.length})
              </h3>
              {needDelivery.map(req => (
                <Card key={req.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-warm-900">{req.title}</p>
                      <p className="text-xs text-warm-500 mt-1">Coursier : {req.coursier_name}</p>
                      <p className="text-xs text-warm-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />{req.delivery_address}
                      </p>
                      <span className="text-sm font-bold text-green-600 mt-1 block">
                        {formatCurrency(req.delivery_fee)} frais
                      </span>
                    </div>
                    <Button onClick={() => acceptMarketDelivery(req.id)} size="sm" variant="secondary">
                      Accepter
                    </Button>
                  </div>
                </Card>
              ))}
            </>
          )}

          {totalAvailable === 0 && (
            <div className="text-center py-16 text-warm-500">
              <p className="text-5xl mb-3">🏍️</p>
              <p className="font-semibold">Aucune livraison disponible</p>
              <p className="text-sm mt-1 text-warm-400">Actualisez pour voir les nouvelles commandes</p>
            </div>
          )}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-3">
          {/* Commandes delivery */}
          {myDeliveries.length > 0 && (
            <>
              <h3 className="font-bold text-warm-700 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-500" /> Restaurants
              </h3>
              {myDeliveries.map(order => (
                <Card key={order.id}>
                  {order.status === 'LIVREUR_CANCELLED' && (
                    <div className="flex items-center gap-2 mb-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-700 font-semibold">
                        Annulation envoyée — en attente de confirmation du restaurant
                      </p>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-warm-900">{order.restaurant_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status] || 'bg-warm-100 text-warm-700'}`}>
                          {order.status_display}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-primary-500">{formatCurrency(order.delivery_fee)}</p>
                  </div>
                  <p className="text-xs text-warm-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" />{order.delivery_address}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'PICKED_UP' && (
                      <>
                        <Button size="sm" onClick={() => updateDeliveryStatus(order.id, 'DELIVERING')}>
                          Démarrer la livraison
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => cancelDelivery(order.id)}>
                          Annuler la prise en charge
                        </Button>
                      </>
                    )}
                    {order.status === 'DELIVERING' && (
                      <Button size="sm" variant="success" onClick={() => updateDeliveryStatus(order.id, 'DELIVERED')}>
                        <CheckCircle className="w-4 h-4" /> Marquer comme livré
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* Commandes marketplace */}
          {myMpOrders.length > 0 && (
            <>
              <h3 className="font-bold text-warm-700 text-sm flex items-center gap-2 mt-4">
                <ShoppingCart className="w-4 h-4 text-indigo-500" /> Boutiques
              </h3>
              {myMpOrders.map(order => (
                <Card key={order.id}>
                  {order.status === 'LIVREUR_CANCELLED' && (
                    <div className="flex items-center gap-2 mb-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-700 font-semibold">
                        Annulation envoyée — en attente de confirmation de la boutique
                      </p>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-warm-900">{order.shop_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status] || 'bg-warm-100 text-warm-700'}`}>
                          {order.status_display}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-primary-500">{formatCurrency(order.delivery_fee)}</p>
                  </div>
                  <p className="text-xs text-warm-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" />{order.delivery_address}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'DELIVERING' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => updateMpStatus(order.id, 'DELIVERED')}>
                          <CheckCircle className="w-4 h-4" /> Marquer comme livré
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => cancelMpDelivery(order.id)}>
                          Annuler la livraison
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}

          {totalMine === 0 && (
            <div className="text-center py-16 text-warm-500">
              <p className="text-5xl mb-3">📦</p>
              <p className="font-semibold">Aucune livraison en cours</p>
              <p className="text-sm mt-1 text-warm-400">Acceptez des commandes dans l&apos;onglet &quot;Disponibles&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
