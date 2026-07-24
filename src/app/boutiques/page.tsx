'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, Star, ShoppingBag, Filter, Plus, Minus, ShoppingCart, MapPin, Phone, X } from 'lucide-react';
import { marketplaceApi } from '@/lib/api';

const LocationMap = dynamic(() => import('@/components/map/LocationMap'), { ssr: false });
import { Category, Shop, Product, CartItem, PaymentMethod } from '@/types';
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

const PROVIDER_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: 'à la livraison',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN Mobile Money',
};

export default function BoutiquesPage() {
  const router = useRouter();
  const { city } = useCity();
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'shops' | 'products'>('shops');
  const [loading, setLoading] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Conakry');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderLoading, setOrderLoading] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      marketplaceApi.getCategories(),
      marketplaceApi.getShops({ city }),
    ]).then(([cats, shps]) => {
      setCategories(cats.data.results || cats.data);
      setShops(shps.data.results || shps.data);
    }).finally(() => setLoading(false));
  }, [city]);

  const filterShops = async (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    const params: Record<string, string> = { city };
    if (categoryId) params.category = String(categoryId);
    const { data } = await marketplaceApi.getShops(params);
    setShops(data.results || data);
  };

  const viewShopProducts = async (shop: Shop) => {
    setSelectedShop(shop);
    setView('products');
    const { data } = await marketplaceApi.getShopProducts(shop.id);
    setProducts(data);
  };

  const addToCart = (product: Product) => {
    if (cart.length > 0 && cart[0].shopId !== product.shop) {
      toast.error('Vous ne pouvez commander que dans une seule boutique à la fois.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, shopId: product.shop }];
    });
    toast.success(`${product.name} ajouté au panier`);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === productId);
      if (existing && existing.quantity > 1) return prev.map(c => c.id === productId ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => c.id !== productId);
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + Number(c.price) * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const placeOrder = async () => {
    const user = getUser();
    if (!user) { router.push('/auth/login?redirect=/boutiques'); return; }
    if (deliveryType === 'DELIVERY' && !deliveryAddress.trim()) {
      toast.error('Veuillez indiquer votre adresse de livraison.');
      return;
    }
    if (!selectedShop) return;
    if (paymentMethod !== 'CASH_ON_DELIVERY' && !phoneNumber.trim()) {
      toast.error('Numéro de téléphone requis pour ce mode de paiement.');
      return;
    }
    setOrderLoading(true);
    try {
      const { data: order } = await marketplaceApi.createOrder({
        shop_id: selectedShop.id,
        delivery_type: deliveryType,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        items: cart.map(c => ({ product_id: c.id, quantity: c.quantity })),
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
      const msg = error.response?.data ? Object.values(error.response.data)[0] : 'Erreur.';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setOrderLoading(false);
    }
  };

  const filteredShops = shops.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-warm-900">Marché Numérique</h1>
          <p className="text-warm-500 text-sm">Boutiques et artisans guinéens en ligne</p>
        </div>
        {cartCount > 0 && (
          <button onClick={() => setShowOrder(true)}
            className="ml-auto flex items-center gap-2 bg-primary-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-600 shadow-md"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount} article{cartCount > 1 ? 's' : ''} · {formatCurrency(cartTotal)}
          </button>
        )}
      </div>

      {/* Catégories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <button onClick={() => filterShops(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            !selectedCategory ? 'bg-primary-500 text-white' : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'
          }`}>
          Tout
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => filterShops(c.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              selectedCategory === c.id ? 'bg-primary-500 text-white' : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'
            }`}>
            <span>{c.icon}</span>{c.name}
          </button>
        ))}
      </div>

      <div className="mb-6 flex gap-3 items-center">
        <div className="flex-1">
          <Input placeholder={view === 'shops' ? 'Rechercher une boutique...' : 'Rechercher un produit...'}
            value={search} onChange={e => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
        </div>
        {view === 'products' && (
          <button onClick={() => { setView('shops'); setSelectedShop(null); setSearch(''); }}
            className="flex items-center gap-2 px-4 py-2.5 border border-warm-200 text-warm-700 font-semibold text-sm rounded-xl hover:bg-warm-50">
            <X className="w-4 h-4" /> Boutiques
          </button>
        )}
      </div>

      {/* Boutiques */}
      {view === 'shops' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? [1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-warm-100 rounded-2xl animate-pulse" />
          )) : filteredShops.map(shop => (
            <div key={shop.id} onClick={() => viewShopProducts(shop)}
              className="group bg-white rounded-2xl border border-warm-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300"
            >
              <div className="h-28 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                🏪
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="font-bold text-warm-900 text-sm leading-tight flex-1">{shop.name}</h3>
                  <div className="flex items-center gap-1 text-xs font-semibold text-yellow-600 ml-2 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{shop.rating}
                  </div>
                </div>
                <p className="text-xs text-warm-500 mb-3">{truncate(shop.description, 60)}</p>
                <div className="flex items-center gap-2 text-xs text-warm-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{shop.city}</span>
                  {shop.has_delivery && <span className="ml-auto text-green-600 font-semibold">✓ Livraison</span>}
                  <span className="bg-warm-100 px-2 py-0.5 rounded-full">{shop.products_count} produits</span>
                </div>
              </div>
            </div>
          ))}
          {!loading && filteredShops.length === 0 && (
            <div className="col-span-full text-center py-16 text-warm-500">
              <p className="text-5xl mb-3">🏪</p>
              <p className="font-semibold">Aucune boutique trouvée</p>
            </div>
          )}
        </div>
      )}

      {/* Produits de la boutique */}
      {view === 'products' && selectedShop && (
        <>
          <div className="bg-white rounded-2xl border border-warm-200 p-4 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
              🏪
            </div>
            <div className="flex-1">
              <h2 className="font-black text-warm-900 text-lg">{selectedShop.name}</h2>
              <div className="flex items-center gap-3 text-xs text-warm-500 mt-1">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedShop.city}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedShop.phone}</span>
                {selectedShop.has_delivery && <span className="text-green-600 font-semibold">✓ Livraison disponible</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-yellow-600">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{selectedShop.rating}
            </div>
          </div>

          {selectedShop.latitude && selectedShop.longitude && (
            <div className="mb-6">
              <LocationMap
                latitude={parseFloat(selectedShop.latitude)}
                longitude={parseFloat(selectedShop.longitude)}
                label={selectedShop.name}
                height={200}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.id === product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl border border-warm-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-warm-50 to-warm-100 flex items-center justify-center text-5xl">
                    🛍️
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-warm-900 text-sm leading-tight flex-1">{product.name}</h3>
                      {product.is_featured && <span className="ml-1 text-xs text-orange-600">⭐</span>}
                    </div>
                    <p className="text-xs text-warm-500 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-base font-black text-primary-500">{formatCurrency(product.price)}</p>
                      <span className="text-xs text-warm-400">Stock: {product.stock}</span>
                    </div>
                    {inCart ? (
                      <div className="flex items-center justify-between">
                        <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 rounded-full bg-warm-100 hover:bg-warm-200 flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold">{inCart.quantity}</span>
                        <button onClick={() => addToCart(product)} className="w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(product)} disabled={!product.is_available || product.stock === 0}
                        className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-warm-200 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                        <Plus className="w-4 h-4" /> Ajouter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-16 text-warm-500">
                <p className="text-5xl mb-3">📦</p>
                <p className="font-semibold">Aucun produit dans cette boutique</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal commande */}
      {showOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black">Confirmer la commande</h3>
              <button onClick={() => setShowOrder(false)} className="p-2 hover:bg-warm-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2 mb-4 max-h-36 overflow-y-auto">
              {cart.map(c => (
                <div key={c.id} className="flex justify-between text-sm">
                  <span className="text-warm-700">{c.quantity}x {c.name}</span>
                  <span className="font-semibold">{formatCurrency(c.price * c.quantity)}</span>
                </div>
              ))}
            </div>
            <hr className="border-warm-200 mb-4" />

            <div className="mb-4">
              <label className="text-sm font-semibold text-warm-800 block mb-2">Mode de réception</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: 'DELIVERY', l: '🚴 Livraison' }, { v: 'PICKUP', l: '🏪 Retrait' }].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => setDeliveryType(v as 'DELIVERY' | 'PICKUP')}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${deliveryType === v ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-warm-200 text-warm-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {deliveryType === 'DELIVERY' && (
              <div className="mb-4">
                <AddressSelector
                  value={deliveryAddress}
                  city={deliveryCity}
                  onChange={(addr, c) => { setDeliveryAddress(addr); setDeliveryCity(c); }}
                />
              </div>
            )}

            <div className="mb-4">
              <PromoCodeField
                orderType="MARKETPLACE"
                subtotal={cartTotal}
                onApplied={(codeVal, discount) => { setPromoCode(codeVal); setDiscountAmount(discount); }}
                onCleared={() => { setPromoCode(''); setDiscountAmount(0); }}
              />
            </div>

            <div className="mb-4">
              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
            </div>

            {paymentMethod !== 'CASH_ON_DELIVERY' && (
              <Input
                placeholder="Numéro de téléphone (+224 6XX XX XX XX)"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="mb-4"
              />
            )}

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm mb-2 text-green-600">
                <span>Réduction</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold mt-2 mb-5">
              <span>Total</span>
              <span className="text-primary-500">
                {formatCurrency(cartTotal + (deliveryType === 'DELIVERY' ? Number(selectedShop?.delivery_fee || 0) : 0) - discountAmount)}
              </span>
            </div>

            <Button onClick={placeOrder} loading={orderLoading} className="w-full" size="lg">
              Confirmer la commande
            </Button>
          </div>
        </div>
      )}

      {paymentOrderId && (
        <PaymentStep
          orderId={paymentOrderId}
          orderType="marketplace"
          providerLabel={PROVIDER_LABELS[paymentMethod]}
          onDone={() => { setPaymentOrderId(null); router.push('/dashboard/client'); }}
          onClose={() => { setPaymentOrderId(null); router.push('/dashboard/client'); }}
        />
      )}
    </div>
  );
}
