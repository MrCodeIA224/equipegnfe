'use client';
import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, Send } from 'lucide-react';
import { marketApi, authApi } from '@/lib/api';
import { MarketRequest } from '@/types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, MARKET_NAMES } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function CoursierDashboard() {
  const router = useRouter();
  const [openRequests, setOpenRequests] = useState<MarketRequest[]>([]);
  const [pendingOffers, setPendingOffers] = useState<MarketRequest[]>([]);
  const [myMissions, setMyMissions] = useState<MarketRequest[]>([]);
  const [tab, setTab] = useState<'available' | 'mine'>('available');
  const [loading, setLoading] = useState(true);
  const [offerForm, setOfferForm] = useState<{ requestId: number; message: string; fee: string } | null>(null);

  // Sépare les demandes ouvertes en "je n'ai pas encore proposé" / "j'ai déjà une offre en attente"
  const splitOpenRequests = (requests: MarketRequest[], userId: number) => {
    setOpenRequests(requests.filter(r => !r.offers?.some(o => o.coursier_id === userId)));
    setPendingOffers(requests.filter(r => r.offers?.some(o => o.coursier_id === userId)));
  };

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'COURSIER') { router.push('/auth/login'); return; }

    Promise.all([
      marketApi.getOpenRequests(),
      marketApi.getRequests(),
    ]).then(([open, all]) => {
      splitOpenRequests(open.data, user.id);
      const myAll = (all.data.results || all.data).filter((r: MarketRequest) => r.coursier_id === user.id);
      setMyMissions(myAll);
    }).catch(() => toast.error('Erreur.'))
      .finally(() => setLoading(false));
  }, [router]);

  const makeOffer = async (requestId: number, message: string, fee: string) => {
    const user = getUser();
    try {
      await marketApi.makeOffer(requestId, { message, proposed_fee: parseInt(fee) || 0 });
      toast.success('Offre envoyée !');
      setOfferForm(null);
      if (user) {
        const { data } = await marketApi.getOpenRequests();
        splitOpenRequests(data, user.id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = error.response?.data ? Object.values(error.response.data)[0] : 'Erreur.';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    }
  };

  const updateStatus = async (requestId: number, status: string) => {
    try {
      const { data } = await marketApi.updateStatus(requestId, status);
      setMyMissions(prev => prev.map(r => r.id === requestId ? data : r));
      toast.success('Statut mis à jour !');
    } catch { toast.error('Erreur.'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const user = getUser();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-warm-900">Dashboard Coursier</h1>
        <p className="text-warm-500 text-sm">Bienvenue, {user?.first_name}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-orange-600">{openRequests.length}</p>
          <p className="text-xs text-orange-500">Demandes ouvertes</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{myMissions.filter(m => ['ASSIGNED', 'SHOPPING'].includes(m.status)).length}</p>
          <p className="text-xs text-blue-500">En cours</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-green-600">{myMissions.filter(m => m.status === 'COMPLETED').length}</p>
          <p className="text-xs text-green-500">Terminées</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[{ id: 'available', l: `Demandes (${openRequests.length})` }, { id: 'mine', l: `Mes missions (${myMissions.length + pendingOffers.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t.id ? 'bg-green-500 text-white' : 'bg-white border border-warm-200 text-warm-600'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'available' && (
        <div className="space-y-4">
          {openRequests.length === 0 ? (
            <div className="text-center py-16 text-warm-500">
              <p className="text-5xl mb-3">🛒</p>
              <p className="font-semibold">Aucune demande disponible</p>
              <p className="text-sm mt-1">De nouvelles demandes apparaîtront ici</p>
            </div>
          ) : openRequests.map(req => (
            <Card key={req.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-warm-900">{req.title}</p>
                  <p className="text-xs text-warm-500 mt-0.5">🏪 {req.market_name}</p>
                  <p className="text-xs text-warm-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{req.delivery_address}
                  </p>
                </div>
                <div className="text-right">
                  {req.budget > 0 && <p className="text-sm font-bold text-primary-500">{formatCurrency(req.budget)}</p>}
                  <p className="text-xs text-warm-400">{req.total_items} articles</p>
                </div>
              </div>

              {/* Liste articles */}
              <div className="bg-warm-50 rounded-xl p-3 mb-3">
                {req.items.slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-warm-600">• {item.name} — {item.quantity}</p>
                ))}
                {req.items.length > 3 && <p className="text-xs text-warm-400">... et {req.items.length - 3} autres</p>}
              </div>

              <p className="text-xs text-warm-400 flex items-center gap-1 mb-3">
                <Clock className="w-3 h-3" />{formatDate(req.created_at)}
              </p>

              {offerForm?.requestId === req.id ? (
                <div className="space-y-2 border-t border-warm-200 pt-3">
                  <Input placeholder="Votre message..." value={offerForm.message}
                    onChange={e => setOfferForm(prev => prev ? { ...prev, message: e.target.value } : null)} />
                  <Input type="number" placeholder="Frais proposés (GNF)" value={offerForm.fee}
                    onChange={e => setOfferForm(prev => prev ? { ...prev, fee: e.target.value } : null)} />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600"
                      onClick={() => makeOffer(req.id, offerForm.message, offerForm.fee)}>
                      <Send className="w-4 h-4" /> Envoyer l&apos;offre
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setOfferForm(null)}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => setOfferForm({ requestId: req.id, message: '', fee: '10000' })}>
                  Faire une offre
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-3">
          {pendingOffers.length > 0 && (
            <>
              <h3 className="font-bold text-warm-700 text-sm">Offres en attente de réponse ({pendingOffers.length})</h3>
              {pendingOffers.map(req => {
                const myOffer = req.offers?.find(o => o.coursier_id === getUser()?.id);
                return (
                  <Card key={req.id}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-warm-900">{req.title}</p>
                        <p className="text-xs text-warm-500 mt-0.5">🏪 {req.market_name}</p>
                        <p className="text-xs text-warm-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{req.delivery_address}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-yellow-100 text-yellow-700 whitespace-nowrap">
                        En attente de réponse
                      </span>
                    </div>
                    {myOffer && (
                      <p className="text-xs text-warm-500">
                        Votre offre : <span className="font-semibold text-warm-700">{formatCurrency(myOffer.proposed_fee)}</span>
                        {myOffer.message && <> — « {myOffer.message} »</>}
                      </p>
                    )}
                  </Card>
                );
              })}
            </>
          )}

          {myMissions.length === 0 && pendingOffers.length === 0 ? (
            <div className="text-center py-16 text-warm-500">
              <p className="text-5xl mb-3">📋</p>
              <p className="font-semibold">Aucune mission</p>
            </div>
          ) : myMissions.length > 0 && (
            <>
              {pendingOffers.length > 0 && <h3 className="font-bold text-warm-700 text-sm mt-4">Mes missions</h3>}
              {myMissions.map(req => (
            <Card key={req.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-warm-900">{req.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[req.status]}`}>{req.status_display}</span>
                  </div>
                  <p className="text-xs text-warm-500 mt-0.5">🏪 {req.market_name}</p>
                  <p className="text-xs text-warm-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{req.delivery_address}</p>
                </div>
                <p className="font-bold text-primary-500">{formatCurrency(req.service_fee)}</p>
              </div>

              <div className="bg-warm-50 rounded-xl p-3 mb-3">
                {req.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-warm-700">• {item.name} — {item.quantity}</span>
                    {item.actual_price && <span className="font-semibold">{formatCurrency(item.actual_price)}</span>}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {req.status === 'ASSIGNED' && (
                  <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => updateStatus(req.id, 'SHOPPING')}>
                    Démarrer les courses
                  </Button>
                )}
                {req.status === 'SHOPPING' && (
                  <Button size="sm" variant="success" onClick={() => updateStatus(req.id, 'NEED_DELIVERY')}>
                    <CheckCircle className="w-4 h-4" /> Courses terminées
                  </Button>
                )}
              </div>
            </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
