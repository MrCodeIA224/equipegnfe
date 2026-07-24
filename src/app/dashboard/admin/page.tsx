'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, UtensilsCrossed, Truck, ShoppingBag,
  Store, ShoppingCart, CheckCircle, XCircle, Menu, X,
  RefreshCw, TrendingUp, Package, ChevronRight, Tag,
} from 'lucide-react';
import { authApi, deliveryApi, marketApi, marketplaceApi, promoApi } from '@/lib/api';
import { User, DeliveryOrder, MarketRequest, MarketplaceOrder, Restaurant, Shop, PromoCode } from '@/types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type Section =
  | 'apercu'
  | 'utilisateurs'
  | 'restaurants'
  | 'commandes_livraison'
  | 'courses_marche'
  | 'boutiques'
  | 'commandes_boutiques'
  | 'codes_promo';

const SECTIONS: { id: Section; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'apercu',              label: 'Vue d\'ensemble',     icon: LayoutDashboard, color: 'text-purple-500' },
  { id: 'utilisateurs',        label: 'Utilisateurs',        icon: Users,           color: 'text-blue-500'   },
  { id: 'restaurants',         label: 'Restaurants',         icon: UtensilsCrossed, color: 'text-red-500'    },
  { id: 'commandes_livraison', label: 'Commandes Livraison', icon: Truck,           color: 'text-orange-500' },
  { id: 'courses_marche',      label: 'Courses Marché',      icon: ShoppingBag,     color: 'text-green-500'  },
  { id: 'boutiques',           label: 'Boutiques',           icon: Store,           color: 'text-indigo-500' },
  { id: 'commandes_boutiques', label: 'Commandes Boutiques', icon: ShoppingCart,    color: 'text-teal-500'   },
  { id: 'codes_promo',         label: 'Codes Promo',         icon: Tag,             color: 'text-pink-500'   },
];

function AdminSidebar({ activeSection, onSelectSection, authUser }: {
  activeSection: Section;
  onSelectSection: (section: Section) => void;
  authUser: User | null;
}) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-warm-200">
      <div className="p-5 border-b border-warm-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-black text-warm-900">Admin</p>
            <p className="text-xs text-warm-500">GnExpress</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {SECTIONS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => onSelectSection(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeSection === id
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'text-warm-600 hover:bg-warm-50 hover:text-warm-900'
            }`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${activeSection === id ? 'text-primary-500' : color}`} />
            <span className="flex-1 text-left">{label}</span>
            {activeSection === id && <ChevronRight className="w-3.5 h-3.5 text-primary-400" />}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-warm-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {authUser?.first_name?.[0] || 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-warm-900 truncate">{authUser?.first_name || 'Admin'}</p>
            <p className="text-xs text-warm-400 truncate">{authUser?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('apercu');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<Record<string, number>>({});
  const [deliveryStats, setDeliveryStats] = useState<Record<string, unknown>>({});
  const [marketStats, setMarketStats] = useState<Record<string, unknown>>({});
  const [mpStats, setMpStats] = useState<Record<string, unknown>>({});
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [marketRequests, setMarketRequests] = useState<MarketRequest[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [mpOrders, setMpOrders] = useState<MarketplaceOrder[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '', discount_type: 'PERCENTAGE', value: '', min_order_amount: '', usage_limit: '',
  });
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Guard admin
  useEffect(() => {
    if (authUser && authUser.role !== 'ADMIN') {
      router.push('/dashboard/client');
    }
  }, [authUser, router]);

  // Initial load: overview stats
  useEffect(() => {
    Promise.all([
      authApi.adminUserStats(),
      deliveryApi.getAdminStats(),
      marketApi.getAdminStats(),
      marketplaceApi.getAdminStats(),
    ]).then(([us, ds, ms, mps]) => {
      setUserStats(us.data);
      setDeliveryStats(ds.data);
      setMarketStats(ms.data);
      setMpStats(mps.data);
    }).catch(() => toast.error('Erreur chargement stats.'))
      .finally(() => setLoading(false));
  }, []);

  const loadSection = useCallback(async (section: Section) => {
    setSectionLoading(true);
    try {
      switch (section) {
        case 'utilisateurs':
          if (users.length === 0) {
            const { data } = await authApi.adminUsers();
            setUsers(data.results || data);
          }
          break;
        case 'restaurants':
          if (restaurants.length === 0) {
            const { data } = await deliveryApi.getRestaurants();
            setRestaurants(data.results || data);
          }
          break;
        case 'commandes_livraison':
          if (deliveryOrders.length === 0) {
            const { data } = await deliveryApi.adminAllOrders();
            setDeliveryOrders(data.results || data);
          }
          break;
        case 'courses_marche':
          if (marketRequests.length === 0) {
            const { data } = await marketApi.getRequests();
            setMarketRequests(data.results || data);
          }
          break;
        case 'boutiques':
          if (shops.length === 0) {
            const { data } = await marketplaceApi.getShops();
            setShops(data.results || data);
          }
          break;
        case 'commandes_boutiques':
          if (mpOrders.length === 0) {
            const { data } = await marketplaceApi.getOrders();
            setMpOrders(data.results || data);
          }
          break;
        case 'codes_promo':
          if (promoCodes.length === 0) {
            const { data } = await promoApi.adminList();
            setPromoCodes(data.results || data);
          }
          break;
      }
    } catch {
      toast.error('Erreur de chargement.');
    } finally {
      setSectionLoading(false);
    }
  }, [users, restaurants, deliveryOrders, marketRequests, shops, mpOrders, promoCodes]);

  const handleSection = (section: Section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    loadSection(section);
  };

  const toggleVerify = async (userId: number) => {
    try {
      const { data } = await authApi.toggleVerify(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: data.is_verified } : u));
      toast.success(data.message);
    } catch { toast.error('Erreur.'); }
  };

  const toggleActive = async (userId: number) => {
    try {
      const { data } = await authApi.toggleActive(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: data.is_active } : u));
      toast.success(data.message);
    } catch { toast.error('Erreur.'); }
  };

  const refreshSection = () => {
    switch (activeSection) {
      case 'utilisateurs':      setUsers([]); break;
      case 'restaurants':       setRestaurants([]); break;
      case 'commandes_livraison': setDeliveryOrders([]); break;
      case 'courses_marche':    setMarketRequests([]); break;
      case 'boutiques':         setShops([]); break;
      case 'commandes_boutiques': setMpOrders([]); break;
      case 'codes_promo':       setPromoCodes([]); break;
    }
    setTimeout(() => loadSection(activeSection), 50);
  };

  const createPromoCode = async () => {
    if (!newPromo.code.trim() || !newPromo.value) {
      toast.error('Code et valeur requis.');
      return;
    }
    setCreatingPromo(true);
    try {
      const { data } = await promoApi.adminCreate({
        code: newPromo.code.trim().toUpperCase(),
        discount_type: newPromo.discount_type,
        value: Number(newPromo.value),
        min_order_amount: newPromo.min_order_amount ? Number(newPromo.min_order_amount) : 0,
        usage_limit: newPromo.usage_limit ? Number(newPromo.usage_limit) : null,
        applicable_order_types: [],
      });
      setPromoCodes(prev => [data, ...prev]);
      setNewPromo({ code: '', discount_type: 'PERCENTAGE', value: '', min_order_amount: '', usage_limit: '' });
      toast.success('Code promo créé.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = error.response?.data ? Object.values(error.response.data)[0] : 'Erreur lors de la création.';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setCreatingPromo(false);
    }
  };

  const togglePromoActive = async (id: number) => {
    try {
      const { data } = await promoApi.adminToggleActive(id);
      setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, is_active: data.is_active } : p));
    } catch { toast.error('Erreur.'); }
  };

  const currentSection = SECTIONS.find(s => s.id === activeSection)!;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex w-60 flex-col flex-shrink-0">
        <AdminSidebar activeSection={activeSection} onSelectSection={handleSection} authUser={authUser} />
      </div>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex flex-col shadow-2xl">
            <AdminSidebar activeSection={activeSection} onSelectSection={handleSection} authUser={authUser} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-warm-200 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-warm-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <currentSection.icon className={`w-5 h-5 ${currentSection.color}`} />
              <h1 className="text-base font-black text-warm-900">{currentSection.label}</h1>
            </div>
          </div>
          {activeSection !== 'apercu' && (
            <button
              onClick={refreshSection}
              className="flex items-center gap-1.5 text-xs font-semibold text-warm-500 hover:text-warm-800 px-3 py-1.5 rounded-xl hover:bg-warm-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualiser
            </button>
          )}
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {sectionLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!sectionLoading && activeSection === 'apercu' && (
            <div className="space-y-6">
              {/* Stats utilisateurs */}
              <div>
                <h2 className="text-sm font-bold text-warm-500 uppercase tracking-wider mb-3">Utilisateurs</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { label: 'Total',     value: userStats.total || 0,       bg: 'bg-blue-50',   text: 'text-blue-700'   },
                    { label: 'Clients',   value: userStats.CLIENT || 0,      bg: 'bg-blue-50',   text: 'text-blue-700'   },
                    { label: 'Livreurs',  value: userStats.LIVREUR || 0,     bg: 'bg-orange-50', text: 'text-orange-700' },
                    { label: 'Restos',    value: userStats.RESTAURANT || 0,  bg: 'bg-red-50',    text: 'text-red-700'    },
                    { label: 'Boutiques', value: userStats.BOUTIQUIERR || 0, bg: 'bg-green-50',  text: 'text-green-700'  },
                    { label: 'Coursiers', value: userStats.COURSIER || 0,    bg: 'bg-purple-50', text: 'text-purple-700' },
                  ].map(({ label, value, bg, text }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
                      <p className={`text-2xl font-black ${text}`}>{value as number}</p>
                      <p className="text-xs text-warm-500 mt-1 font-semibold">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats modules */}
              <div>
                <h2 className="text-sm font-bold text-warm-500 uppercase tracking-wider mb-3">Modules</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Livraison */}
                  <div className="bg-white rounded-2xl border border-warm-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Truck className="w-5 h-5 text-orange-500" />
                      <h3 className="font-bold text-warm-900">Livraison</h3>
                    </div>
                    <div className="space-y-2">
                      {[
                        ['Commandes',   deliveryStats.total_orders || 0],
                        ['En attente',  deliveryStats.pending || 0],
                        ['En livraison',deliveryStats.delivering || 0],
                        ['Livrées',     deliveryStats.delivered || 0],
                        ['Restaurants', deliveryStats.total_restaurants || 0],
                        ['Revenus',     formatCurrency(Number(deliveryStats.revenue) || 0)],
                      ].map(([l, v]) => (
                        <div key={String(l)} className="flex justify-between text-sm">
                          <span className="text-warm-500">{String(l)}</span>
                          <span className="font-semibold text-warm-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handleSection('commandes_livraison')}
                      className="mt-4 w-full text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1 py-2 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                      Voir les commandes <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Marché */}
                  <div className="bg-white rounded-2xl border border-warm-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingBag className="w-5 h-5 text-green-500" />
                      <h3 className="font-bold text-warm-900">Mon Marché</h3>
                    </div>
                    <div className="space-y-2">
                      {[
                        ['Demandes',    marketStats.total_requests || 0],
                        ['Ouvertes',    marketStats.open || 0],
                        ['En cours',    marketStats.in_progress || 0],
                        ['Terminées',   marketStats.completed || 0],
                        ['Annulées',    marketStats.cancelled || 0],
                        ['Rev. frais',  formatCurrency(Number(marketStats.revenue_service_fees) || 0)],
                      ].map(([l, v]) => (
                        <div key={String(l)} className="flex justify-between text-sm">
                          <span className="text-warm-500">{String(l)}</span>
                          <span className="font-semibold text-warm-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handleSection('courses_marche')}
                      className="mt-4 w-full text-xs font-semibold text-green-600 hover:text-green-700 flex items-center justify-center gap-1 py-2 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                      Voir les courses <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Marketplace */}
                  <div className="bg-white rounded-2xl border border-warm-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Store className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-bold text-warm-900">Marché Numérique</h3>
                    </div>
                    <div className="space-y-2">
                      {[
                        ['Commandes',   mpStats.total_orders || 0],
                        ['Boutiques',   mpStats.active_shops || 0],
                        ['Produits',    mpStats.available_products || 0],
                        ['Catégories',  mpStats.total_categories || 0],
                        ['Revenus',     formatCurrency(Number(mpStats.revenue) || 0)],
                      ].map(([l, v]) => (
                        <div key={String(l)} className="flex justify-between text-sm">
                          <span className="text-warm-500">{String(l)}</span>
                          <span className="font-semibold text-warm-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handleSection('commandes_boutiques')}
                      className="mt-4 w-full text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                      Voir les commandes <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div>
                <h2 className="text-sm font-bold text-warm-500 uppercase tracking-wider mb-3">Accès rapide</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {SECTIONS.slice(1).map(({ id, label, icon: Icon, color }) => (
                    <button key={id} onClick={() => handleSection(id)}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-warm-200 hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <Icon className={`w-6 h-6 ${color}`} />
                      <span className="text-xs font-semibold text-warm-700 text-center leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!sectionLoading && activeSection === 'utilisateurs' && (
            <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
              <div className="p-4 border-b border-warm-100 flex items-center justify-between">
                <h2 className="font-bold text-warm-900">Utilisateurs ({users.length})</h2>
                <div className="flex items-center gap-2 text-xs text-warm-500">
                  <Users className="w-4 h-4" />
                  Cliquer sur <CheckCircle className="w-3.5 h-3.5 inline text-green-500" /> pour vérifier
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-warm-50">
                    <tr>
                      {['Utilisateur', 'Email', 'Rôle', 'Tél.', 'Ville', 'Statut', 'Vérifié', 'Action'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-warm-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{user.first_name?.[0] || user.username[0]}</span>
                            </div>
                            <p className="text-sm font-semibold text-warm-900 whitespace-nowrap">{user.full_name || user.username}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-warm-600 whitespace-nowrap">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${ROLE_COLORS[user.role]}`}>
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-warm-600 whitespace-nowrap">{user.phone}</td>
                        <td className="px-4 py-3 text-sm text-warm-600">{user.city}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleVerify(user.id)} className="transition-colors">
                            {user.is_verified
                              ? <CheckCircle className="w-5 h-5 text-green-500 hover:text-green-600" />
                              : <XCircle className="w-5 h-5 text-warm-300 hover:text-warm-500" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(user.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
                              user.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}>
                            {user.is_active ? 'Désactiver' : 'Activer'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-12 text-warm-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Aucun utilisateur</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!sectionLoading && activeSection === 'restaurants' && (
            <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
              <div className="p-4 border-b border-warm-100">
                <h2 className="font-bold text-warm-900">Restaurants ({restaurants.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-warm-50">
                    <tr>
                      {['Restaurant', 'Ville', 'Tél.', 'Livraison', 'Commandes', 'Note', 'Statut'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {restaurants.map(r => (
                      <tr key={r.id} className="hover:bg-warm-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-warm-900">{r.name}</p>
                            <p className="text-xs text-warm-500 line-clamp-1">{r.description}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-warm-600">{r.city}</td>
                        <td className="px-4 py-3 text-sm text-warm-600 whitespace-nowrap">{r.phone}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-primary-600 whitespace-nowrap">{formatCurrency(r.delivery_fee)}</td>
                        <td className="px-4 py-3 text-sm text-warm-700 font-semibold">{r.total_orders}</td>
                        <td className="px-4 py-3 text-sm text-yellow-600 font-semibold">⭐ {r.rating}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${r.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {r.is_open ? 'Ouvert' : 'Fermé'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {restaurants.length === 0 && (
                  <div className="text-center py-12 text-warm-400">
                    <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Aucun restaurant</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!sectionLoading && activeSection === 'commandes_livraison' && (
            <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
              <div className="p-4 border-b border-warm-100">
                <h2 className="font-bold text-warm-900">Commandes Livraison ({deliveryOrders.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-warm-50">
                    <tr>
                      {['#', 'Client', 'Restaurant', 'Livreur', 'Total', 'Statut', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {deliveryOrders.map(order => (
                      <tr key={order.id} className="hover:bg-warm-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-warm-600">#{order.id}</td>
                        <td className="px-4 py-3 text-sm text-warm-700 whitespace-nowrap">{order.client_name}</td>
                        <td className="px-4 py-3 text-sm text-warm-700 whitespace-nowrap">{order.restaurant_name}</td>
                        <td className="px-4 py-3 text-sm text-warm-500 whitespace-nowrap">{order.livreur_name || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-primary-600 whitespace-nowrap">{formatCurrency(order.total_price)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${ORDER_STATUS_COLORS[order.status] || 'bg-warm-100 text-warm-700'}`}>
                            {order.status_display}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-warm-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {deliveryOrders.length === 0 && (
                  <div className="text-center py-12 text-warm-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Aucune commande</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!sectionLoading && activeSection === 'courses_marche' && (
            <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
              <div className="p-4 border-b border-warm-100">
                <h2 className="font-bold text-warm-900">Courses Marché ({marketRequests.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-warm-50">
                    <tr>
                      {['#', 'Client', 'Titre', 'Marché', 'Coursier', 'Budget', 'Statut', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {marketRequests.map(req => (
                      <tr key={req.id} className="hover:bg-warm-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-warm-600">#{req.id}</td>
                        <td className="px-4 py-3 text-sm text-warm-700 whitespace-nowrap">{req.client_name}</td>
                        <td className="px-4 py-3 text-sm text-warm-700">{req.title}</td>
                        <td className="px-4 py-3 text-sm text-warm-500 whitespace-nowrap">{req.market_name}</td>
                        <td className="px-4 py-3 text-sm text-warm-500 whitespace-nowrap">{req.coursier_name || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600 whitespace-nowrap">{formatCurrency(req.budget)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${ORDER_STATUS_COLORS[req.status] || 'bg-warm-100 text-warm-700'}`}>
                            {req.status_display}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-warm-500 whitespace-nowrap">{formatDate(req.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {marketRequests.length === 0 && (
                  <div className="text-center py-12 text-warm-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Aucune course</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!sectionLoading && activeSection === 'boutiques' && (
            <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
              <div className="p-4 border-b border-warm-100">
                <h2 className="font-bold text-warm-900">Boutiques ({shops.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-warm-50">
                    <tr>
                      {['Boutique', 'Propriétaire', 'Ville', 'Tél.', 'Produits', 'Livraison', 'Note', 'Statut'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {shops.map(shop => (
                      <tr key={shop.id} className="hover:bg-warm-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-warm-900">{shop.name}</p>
                          <p className="text-xs text-warm-500">{shop.category_name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-warm-600 whitespace-nowrap">{shop.owner_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-warm-600">{shop.city}</td>
                        <td className="px-4 py-3 text-sm text-warm-600 whitespace-nowrap">{shop.phone}</td>
                        <td className="px-4 py-3 text-sm text-warm-700 font-semibold">{shop.products_count}</td>
                        <td className="px-4 py-3">
                          {shop.has_delivery
                            ? <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">{formatCurrency(shop.delivery_fee)}</span>
                            : <span className="text-xs text-warm-400">Non</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-yellow-600 font-semibold">⭐ {shop.rating}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${shop.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {shop.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shops.length === 0 && (
                  <div className="text-center py-12 text-warm-400">
                    <Store className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Aucune boutique</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!sectionLoading && activeSection === 'commandes_boutiques' && (
            <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
              <div className="p-4 border-b border-warm-100">
                <h2 className="font-bold text-warm-900">Commandes Boutiques ({mpOrders.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-warm-50">
                    <tr>
                      {['#', 'Client', 'Boutique', 'Livreur', 'Total', 'Mode', 'Statut', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {mpOrders.map(order => (
                      <tr key={order.id} className="hover:bg-warm-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-warm-600">#{order.id}</td>
                        <td className="px-4 py-3 text-sm text-warm-700 whitespace-nowrap">{order.client_name}</td>
                        <td className="px-4 py-3 text-sm text-warm-700 whitespace-nowrap">{order.shop_name}</td>
                        <td className="px-4 py-3 text-sm text-warm-500 whitespace-nowrap">{order.livreur_name || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-primary-600 whitespace-nowrap">{formatCurrency(order.total_price)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${order.delivery_type === 'DELIVERY' ? 'bg-blue-100 text-blue-700' : 'bg-warm-100 text-warm-700'}`}>
                            {order.delivery_type === 'DELIVERY' ? '🚴 Livraison' : '🏪 Retrait'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${ORDER_STATUS_COLORS[order.status] || 'bg-warm-100 text-warm-700'}`}>
                            {order.status_display}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-warm-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mpOrders.length === 0 && (
                  <div className="text-center py-12 text-warm-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Aucune commande</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!sectionLoading && activeSection === 'codes_promo' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-warm-200 p-4">
                <h2 className="font-bold text-warm-900 mb-3">Nouveau code promo</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <Input
                    placeholder="Code (ex: BIENVENUE10)"
                    value={newPromo.code}
                    onChange={e => setNewPromo(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  />
                  <select
                    value={newPromo.discount_type}
                    onChange={e => setNewPromo(prev => ({ ...prev, discount_type: e.target.value }))}
                    className="rounded-xl border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="PERCENTAGE">Pourcentage (%)</option>
                    <option value="FIXED">Montant fixe (GNF)</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="Valeur"
                    value={newPromo.value}
                    onChange={e => setNewPromo(prev => ({ ...prev, value: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Commande min. (GNF)"
                    value={newPromo.min_order_amount}
                    onChange={e => setNewPromo(prev => ({ ...prev, min_order_amount: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Limite d'usage (optionnel)"
                    value={newPromo.usage_limit}
                    onChange={e => setNewPromo(prev => ({ ...prev, usage_limit: e.target.value }))}
                  />
                </div>
                <Button onClick={createPromoCode} loading={creatingPromo} className="mt-3" size="sm">
                  Créer le code promo
                </Button>
              </div>

              <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
                <div className="p-4 border-b border-warm-100">
                  <h2 className="font-bold text-warm-900">Codes promo ({promoCodes.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-warm-50">
                      <tr>
                        {['Code', 'Réduction', 'Min. commande', 'Utilisations', 'Statut', 'Action'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100">
                      {promoCodes.map(promo => (
                        <tr key={promo.id} className="hover:bg-warm-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-warm-900 whitespace-nowrap">{promo.code}</td>
                          <td className="px-4 py-3 text-sm text-warm-700 whitespace-nowrap">
                            {promo.discount_type === 'PERCENTAGE' ? `${promo.value}%` : formatCurrency(promo.value)}
                          </td>
                          <td className="px-4 py-3 text-sm text-warm-500 whitespace-nowrap">{formatCurrency(promo.min_order_amount)}</td>
                          <td className="px-4 py-3 text-sm text-warm-500 whitespace-nowrap">
                            {promo.times_used}{promo.usage_limit ? ` / ${promo.usage_limit}` : ''}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${promo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {promo.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => togglePromoActive(promo.id)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
                                promo.is_active
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}>
                              {promo.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {promoCodes.length === 0 && (
                    <div className="text-center py-12 text-warm-400">
                      <Tag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">Aucun code promo</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
