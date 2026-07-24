'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Package, AlertTriangle, MapPin } from 'lucide-react';
import { marketplaceApi } from '@/lib/api';

const MapPicker = dynamic(() => import('@/components/map/MapPicker'), { ssr: false });
import { Shop, Product, MarketplaceOrder } from '@/types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function BoutiqueDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [loading, setLoading] = useState(true);
  const [locationPickerShopId, setLocationPickerShopId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'BOUTIQUIERR') { router.push('/auth/login'); return; }

    Promise.all([
      marketplaceApi.getShops(),
      marketplaceApi.getOrders(),
    ]).then(([s, o]) => {
      setShops(s.data.results || s.data);
      setOrders(o.data.results || o.data);
    }).catch(() => toast.error('Erreur.'))
      .finally(() => setLoading(false));
  }, [user, router]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const { data } = await marketplaceApi.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? data : o));
      toast.success('Statut mis à jour !');
    } catch { toast.error('Erreur.'); }
  };

  const livreurCancelledOrders = orders.filter(o => o.status === 'LIVREUR_CANCELLED');

  const saveShopLocation = async (shopId: number, lat: number, lng: number) => {
    try {
      const { data } = await marketplaceApi.updateShop(shopId, { latitude: lat, longitude: lng });
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, ...data } : s));
      toast.success('Emplacement enregistré.');
    } catch { toast.error('Erreur lors de l\'enregistrement de l\'emplacement.'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-warm-900">Dashboard Boutiquierr</h1>
          <p className="text-warm-500 text-sm">{shops.length} boutique(s) enregistrée(s)</p>
        </div>
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
                    Commande #{order.id} — Le livreur {order.livreur_name} a annulé la livraison
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{orders.filter(o => o.status === 'PENDING').length}</p>
          <p className="text-xs text-blue-500">Nouvelles commandes</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-orange-600">{orders.filter(o => ['CONFIRMED', 'PROCESSING'].includes(o.status)).length}</p>
          <p className="text-xs text-orange-500">En préparation</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-green-600">{orders.filter(o => o.status === 'DELIVERED').length}</p>
          <p className="text-xs text-green-500">Livrées</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[{ id: 'orders', l: `Commandes (${orders.length})` }, { id: 'products', l: 'Mes produits' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t.id ? 'bg-blue-500 text-white' : 'bg-white border border-warm-200 text-warm-600'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-warm-500">
              <p className="text-5xl mb-3">📦</p>
              <p className="font-semibold">Aucune commande</p>
            </div>
          ) : orders.map(order => (
            <Card key={order.id}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">Commande #{order.id}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>{order.status_display}</span>
                    <span className="text-xs bg-warm-100 text-warm-600 px-2 py-0.5 rounded-full">{order.delivery_type === 'DELIVERY' ? '🚴 Livraison' : '🏪 Retrait'}</span>
                  </div>
                  <p className="text-xs text-warm-500 mt-0.5">Client: {order.client_name}</p>
                  {order.delivery_address && <p className="text-xs text-warm-400">📍 {order.delivery_address}</p>}
                </div>
                <p className="font-bold text-primary-500">{formatCurrency(order.total_price)}</p>
              </div>

              <div className="text-xs text-warm-600 bg-warm-50 rounded-xl p-2 mb-3">
                {order.order_items?.map(item => (
                  <span key={item.id} className="mr-2">{item.quantity}x {item.product_name}</span>
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
                  <Button size="sm" onClick={() => updateOrderStatus(order.id, 'PROCESSING')}>En préparation</Button>
                )}
                {order.status === 'PROCESSING' && (
                  <Button size="sm" variant="success"
                    onClick={() => updateOrderStatus(order.id, order.delivery_type === 'PICKUP' ? 'PICKUP_READY' : 'READY')}>
                    Prêt{order.delivery_type === 'PICKUP' ? ' pour retrait' : ' pour livraison'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div>
          <div className="space-y-4">
            {shops.map(shop => (
              <div key={shop.id}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-warm-900">{shop.name}</h3>
                  <span className="text-xs text-warm-500">{shop.products_count} produits</span>
                </div>
                <button
                  onClick={() => setLocationPickerShopId(prev => prev === shop.id ? null : shop.id)}
                  className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-primary-600 hover:underline"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {shop.latitude ? 'Modifier l\'emplacement' : 'Définir l\'emplacement'}
                </button>
                {locationPickerShopId === shop.id && (
                  <div className="mb-4">
                    <MapPicker
                      latitude={shop.latitude ? parseFloat(shop.latitude) : null}
                      longitude={shop.longitude ? parseFloat(shop.longitude) : null}
                      onChange={(lat, lng) => saveShopLocation(shop.id, lat, lng)}
                      height={260}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {shop.products?.map(product => (
                    <Card key={product.id} className="!p-3">
                      <div className="w-full aspect-square bg-warm-50 rounded-xl flex items-center justify-center text-4xl mb-2">🛍️</div>
                      <p className="font-semibold text-sm text-warm-900 truncate">{product.name}</p>
                      <p className="text-xs font-bold text-primary-500 mt-0.5">{formatCurrency(product.price)}</p>
                      <p className="text-xs text-warm-400">Stock: {product.stock}</p>
                    </Card>
                  ))}
                  <Card className="!p-3 border-dashed border-2 border-warm-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors" padding="none">
                    <Plus className="w-8 h-8 text-warm-300" />
                    <p className="text-xs text-warm-400 font-semibold">Ajouter un produit</p>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
