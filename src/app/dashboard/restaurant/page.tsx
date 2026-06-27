'use client';
import { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { deliveryApi } from '@/lib/api';
import { Restaurant, MenuItem, DeliveryOrder } from '@/types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [tab, setTab] = useState<'orders' | 'menu' | 'create'>('orders');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'RESTAURANT') { router.push('/auth/login'); return; }

    Promise.all([
      deliveryApi.getRestaurants(),
      deliveryApi.getOrders(),
    ]).then(([r, o]) => {
      const myRestaurants = (r.data.results || r.data).filter((rest: Restaurant) => {
        return true; // On affiche tout côté front (le back filtre)
      });
      setRestaurants(myRestaurants);
      if (myRestaurants.length > 0) setSelectedRestaurant(myRestaurants[0]);
      setOrders(o.data.results || o.data);
    }).catch(() => toast.error('Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleOpen = async (restaurantId: number) => {
    try {
      const { data } = await deliveryApi.toggleOpen(restaurantId);
      setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, is_open: data.is_open } : r));
      if (selectedRestaurant?.id === restaurantId) setSelectedRestaurant(prev => prev ? { ...prev, is_open: data.is_open } : prev);
    } catch { toast.error('Erreur.'); }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const { data } = await deliveryApi.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? data : o));
      toast.success('Statut mis à jour !');
    } catch { toast.error('Erreur.'); }
  };

  const livreurCancelledOrders = orders.filter(o => o.status === 'LIVREUR_CANCELLED');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-warm-900">Dashboard Restaurant</h1>
        <p className="text-warm-500 text-sm">Gérez vos restaurants et commandes</p>
      </div>

      {/* Alertes annulations livreur */}
      {livreurCancelledOrders.length > 0 && (
        <div className="mb-6 space-y-2">
          {livreurCancelledOrders.map(order => (
            <div key={order.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-800">
                    Commande #{order.id} — Le livreur {order.livreur_name} a annulé sa prise en charge
                  </p>
                  <p className="text-xs text-red-600">Confirmez pour remettre la commande à disposition des livreurs</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={() => updateOrderStatus(order.id, 'READY')}
              >
                Confirmer & Réassigner
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Sélecteur restaurant */}
      {restaurants.length > 1 && (
        <div className="flex gap-2 overflow-x-auto mb-6">
          {restaurants.map(r => (
            <button key={r.id} onClick={() => setSelectedRestaurant(r)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                selectedRestaurant?.id === r.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-warm-200 text-warm-600'
              }`}>
              {r.name} {r.is_open ? '🟢' : '🔴'}
            </button>
          ))}
        </div>
      )}

      {selectedRestaurant ? (
        <>
          {/* Info restaurant */}
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-warm-900">{selectedRestaurant.name}</h2>
                <p className="text-sm text-warm-500">{selectedRestaurant.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${selectedRestaurant.is_open ? 'text-green-600' : 'text-red-500'}`}>
                  {selectedRestaurant.is_open ? '🟢 Ouvert' : '🔴 Fermé'}
                </span>
                <button onClick={() => toggleOpen(selectedRestaurant.id)} className="p-2 hover:bg-warm-100 rounded-xl">
                  {selectedRestaurant.is_open ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-warm-400" />}
                </button>
              </div>
            </div>
          </Card>

          <div className="flex gap-2 mb-6">
            {[{ id: 'orders', l: `Commandes (${orders.length})` }, { id: 'menu', l: 'Mon menu' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t.id ? 'bg-primary-500 text-white' : 'bg-white border border-warm-200 text-warm-600'}`}>
                {t.l}
              </button>
            ))}
          </div>

          {tab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-16 text-warm-500">
                  <p className="text-5xl mb-3">📋</p>
                  <p className="font-semibold">Aucune commande</p>
                </div>
              ) : orders.map(order => (
                <Card key={order.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-warm-900 text-sm">Commande #{order.id}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>{order.status_display}</span>
                      </div>
                      <p className="text-xs text-warm-500 mt-0.5">Client: {order.client_name}</p>
                    </div>
                    <p className="font-bold text-primary-500">{formatCurrency(order.total_price)}</p>
                  </div>
                  <div className="text-xs text-warm-600 mb-3">
                    {order.order_items?.map(item => (
                      <span key={item.id} className="mr-2">{item.quantity}x {item.menu_item_name}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'PENDING' && (
                      <>
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}>Confirmer</Button>
                        <Button size="sm" variant="danger" onClick={() => updateOrderStatus(order.id, 'CANCELLED')}>Refuser</Button>
                      </>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, 'PREPARING')}>En préparation</Button>
                    )}
                    {order.status === 'PREPARING' && (
                      <Button size="sm" variant="success" onClick={() => updateOrderStatus(order.id, 'READY')}>Prêt pour livraison</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === 'menu' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-warm-900">Menu du restaurant</h3>
                <Button size="sm" onClick={() => setTab('create')}><Plus className="w-4 h-4" /> Ajouter un plat</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedRestaurant.menu_items?.map(item => (
                  <Card key={item.id} className="flex items-center gap-3 !p-3">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-warm-900 truncate">{item.name}</p>
                      <p className="text-xs text-warm-500">{item.category_name}</p>
                      <p className="text-sm font-bold text-primary-500">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full ${item.is_available ? 'bg-green-400' : 'bg-red-400'}`} />
                    </div>
                  </Card>
                ))}
                {(!selectedRestaurant.menu_items || selectedRestaurant.menu_items.length === 0) && (
                  <div className="col-span-full text-center py-8 text-warm-500">
                    <p className="text-4xl mb-2">🍽️</p>
                    <p className="text-sm">Aucun plat dans le menu. Chargez la page restaurant complète.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🍽️</p>
          <h2 className="font-bold text-warm-900 mb-2">Vous n'avez pas encore de restaurant</h2>
          <p className="text-warm-500 text-sm mb-6">Créez votre premier restaurant pour commencer à recevoir des commandes.</p>
          <Button onClick={() => setTab('create')}><Plus className="w-4 h-4" /> Créer mon restaurant</Button>
        </div>
      )}
    </div>
  );
}
