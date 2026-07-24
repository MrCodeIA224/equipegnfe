'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, Star, Clock, MapPin, Filter, Truck, X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { deliveryApi } from '@/lib/api';

const LocationMap = dynamic(() => import('@/components/map/LocationMap'), { ssr: false });
import { Restaurant, MenuItem, CartItem, PaymentMethod } from '@/types';
import { formatCurrency, truncate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useCity } from '@/context/CityContext';
import AddressSelector from '@/components/checkout/AddressSelector';
import PromoCodeField from '@/components/checkout/PromoCodeField';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import PaymentStep from '@/components/checkout/PaymentStep';
import { popDeliveryReorder } from '@/lib/reorder';

const PROVIDER_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: 'à la livraison',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN Mobile Money',
};

export default function DeliveryPage() {
  const router = useRouter();
  const { city } = useCity();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menuByCategory, setMenuByCategory] = useState<{ category: { id: number | null; name: string; icon: string }; items: MenuItem[] }[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Conakry');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showOrder, setShowOrder] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    deliveryApi.getRestaurants({ city })
      .then(r => setRestaurants(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, [city]);

  useEffect(() => {
    const payload = popDeliveryReorder();
    if (!payload) return;

    (async () => {
      try {
        const [{ data: restaurant }, { data: menu }] = await Promise.all([
          deliveryApi.getRestaurant(payload.restaurantId),
          deliveryApi.getRestaurantMenu(payload.restaurantId),
        ]);
        setSelectedRestaurant(restaurant);
        setMenuByCategory(menu);

        const allItems: MenuItem[] = menu.flatMap((group: { items: MenuItem[] }) => group.items);
        const skipped: string[] = [];
        const newCart: CartItem[] = [];
        payload.items.forEach(stashedItem => {
          const menuItem = allItems.find(m => m.id === stashedItem.menu_item_id);
          if (!menuItem || !menuItem.is_available) {
            skipped.push(menuItem?.name || `Article #${stashedItem.menu_item_id}`);
            return;
          }
          newCart.push({
            id: menuItem.id, name: menuItem.name, price: menuItem.price,
            quantity: stashedItem.quantity, restaurantId: restaurant.id,
          });
        });

        setCart(newCart);
        setDeliveryAddress(payload.delivery_address);
        setDeliveryCity(payload.delivery_city);
        if (newCart.length > 0) {
          setShowOrder(true);
          toast.success('Panier recommandé ! Vérifiez votre commande avant de valider.');
        }
        if (skipped.length > 0) {
          toast.error(`Plus disponible : ${skipped.join(', ')}`);
        }
      } catch {
        toast.error('Impossible de recommander cette commande.');
      }
    })();
  }, []);

  const selectRestaurant = async (r: Restaurant) => {
    setSelectedRestaurant(r);
    setCart([]);
    try {
      const { data } = await deliveryApi.getRestaurantMenu(r.id);
      setMenuByCategory(data);
    } catch {
      toast.error('Impossible de charger le menu.');
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, restaurantId: selectedRestaurant?.id }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing && existing.quantity > 1) return prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => c.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + Number(c.price) * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const placeOrder = async () => {
    const user = getUser();
    if (!user) { router.push('/auth/login?redirect=/delivery'); return; }
    if (!deliveryAddress.trim()) { toast.error('Veuillez indiquer votre adresse de livraison.'); return; }
    if (!selectedRestaurant) return;
    if (paymentMethod !== 'CASH_ON_DELIVERY' && !phoneNumber.trim()) {
      toast.error('Numéro de téléphone requis pour ce mode de paiement.');
      return;
    }

    setOrderLoading(true);
    try {
      const { data: order } = await deliveryApi.createOrder({
        restaurant_id: selectedRestaurant.id,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.quantity })),
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        promo_code: promoCode,
      });
      toast.success('Commande passée avec succès !');
      setCart([]);
      setShowOrder(false);
      if (paymentMethod !== 'CASH_ON_DELIVERY') {
        setPaymentOrderId(order.id);
      } else {
        router.push('/dashboard/client');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = error.response?.data ? Object.values(error.response.data)[0] : 'Erreur lors de la commande.';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setOrderLoading(false);
    }
  };

  const filtered = restaurants.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.city.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-warm-900">Livraison & Restauration</h1>
            <p className="text-warm-500 text-sm">Commandez chez nos restaurants partenaires</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Restaurant list */}
        <div className={`${selectedRestaurant ? 'hidden lg:block lg:w-80 flex-shrink-0' : 'w-full'}`}>
          <div className="mb-4">
            <Input
              placeholder="Rechercher un restaurant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-warm-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <div
                  key={r.id}
                  onClick={() => selectRestaurant(r)}
                  className={`bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${
                    selectedRestaurant?.id === r.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-warm-200 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-warm-900 text-sm leading-tight">{r.name}</h3>
                      <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{r.description}</p>
                    </div>
                    {!r.is_open && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Fermé</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-warm-500">
                    <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{r.rating}
                    </span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.delivery_time}</span>
                    <span className="flex items-center gap-1 ml-auto font-semibold text-primary-500">{formatCurrency(r.delivery_fee)}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-warm-500">
                  <p className="text-4xl mb-3">🍽️</p>
                  <p className="font-semibold">Aucun restaurant trouvé</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu */}
        {selectedRestaurant && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setSelectedRestaurant(null)} className="lg:hidden p-2 hover:bg-warm-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-warm-900">{selectedRestaurant.name}</h2>
                    <div className="flex items-center gap-3 text-xs text-warm-500 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedRestaurant.delivery_time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedRestaurant.city}</span>
                      <span className="text-primary-500 font-semibold">Livraison: {formatCurrency(selectedRestaurant.delivery_fee)}</span>
                    </div>
                  </div>
                  {cartCount > 0 && (
                    <button
                      onClick={() => setShowOrder(true)}
                      className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors shadow-md"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {cartCount} article{cartCount > 1 ? 's' : ''} · {formatCurrency(cartTotal)}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {selectedRestaurant.latitude && selectedRestaurant.longitude && (
              <div className="mb-6">
                <LocationMap
                  latitude={parseFloat(selectedRestaurant.latitude)}
                  longitude={parseFloat(selectedRestaurant.longitude)}
                  label={selectedRestaurant.name}
                  height={200}
                />
              </div>
            )}

            {menuByCategory.map(({ category, items }) => (
              <div key={category.id ?? 'other'} className="mb-7">
                <h3 className="text-base font-bold text-warm-800 mb-3 flex items-center gap-2">
                  <span>{category.icon}</span> {category.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map(item => {
                    const inCart = cart.find(c => c.id === item.id);
                    return (
                      <div key={item.id} className="bg-white rounded-2xl border border-warm-200 p-4 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-warm-900 text-sm truncate">{item.name}</p>
                            {item.is_popular && <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">⭐ Populaire</span>}
                          </div>
                          {item.description && <p className="text-xs text-warm-500 mt-0.5 line-clamp-1">{item.description}</p>}
                          <p className="text-sm font-bold text-primary-500 mt-1">{formatCurrency(item.price)}</p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-warm-100 hover:bg-warm-200 flex items-center justify-center transition-colors">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-bold w-5 text-center">{inCart.quantity}</span>
                            <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-colors">
                              <Plus className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(item)} disabled={!item.is_available || !selectedRestaurant.is_open}
                            className="w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-warm-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0">
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!selectedRestaurant && (
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center text-warm-400">
              <p className="text-6xl mb-4">👈</p>
              <p className="font-semibold text-warm-600">Sélectionnez un restaurant</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal commande */}
      {showOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-warm-900">Confirmer la commande</h3>
              <button onClick={() => setShowOrder(false)} className="p-2 hover:bg-warm-100 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {cart.map(c => (
                <div key={c.id} className="flex justify-between text-sm">
                  <span className="text-warm-700">{c.quantity}x {c.name}</span>
                  <span className="font-semibold">{formatCurrency(c.price * c.quantity)}</span>
                </div>
              ))}
            </div>

            <hr className="border-warm-200 mb-4" />
            <div className="flex justify-between text-sm mb-1">
              <span className="text-warm-500">Sous-total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-warm-500">Livraison</span>
              <span>{formatCurrency(selectedRestaurant?.delivery_fee || 0)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm mb-3 text-green-600">
                <span>Réduction</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold mb-5">
              <span>Total</span>
              <span className="text-primary-500">
                {formatCurrency(cartTotal + Number(selectedRestaurant?.delivery_fee || 0) - discountAmount)}
              </span>
            </div>

            <div className="space-y-4">
              <AddressSelector
                value={deliveryAddress}
                city={deliveryCity}
                onChange={(addr, c) => { setDeliveryAddress(addr); setDeliveryCity(c); }}
              />

              <PromoCodeField
                orderType="DELIVERY"
                subtotal={cartTotal}
                onApplied={(codeVal, discount) => { setPromoCode(codeVal); setDiscountAmount(discount); }}
                onCleared={() => { setPromoCode(''); setDiscountAmount(0); }}
              />

              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

              {paymentMethod !== 'CASH_ON_DELIVERY' && (
                <Input
                  placeholder="Numéro de téléphone (+224 6XX XX XX XX)"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              )}
            </div>

            <Button onClick={placeOrder} loading={orderLoading} className="w-full mt-4" size="lg">
              Passer la commande
            </Button>
          </div>
        </div>
      )}

      {paymentOrderId && (
        <PaymentStep
          orderId={paymentOrderId}
          orderType="delivery"
          providerLabel={PROVIDER_LABELS[paymentMethod]}
          onDone={() => { setPaymentOrderId(null); router.push('/dashboard/client'); }}
          onClose={() => { setPaymentOrderId(null); router.push('/dashboard/client'); }}
        />
      )}
    </div>
  );
}
