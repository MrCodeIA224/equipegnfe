'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Truck, ShoppingBag, ShoppingCart, Star, ChevronRight, MapPin, Clock, Shield, Zap } from 'lucide-react';
import { deliveryApi, marketplaceApi } from '@/lib/api';
import { Restaurant, Product } from '@/types';
import { formatCurrency, truncate } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    deliveryApi.getRestaurants({ ordering: '-rating' })
      .then(r => setRestaurants(r.data.results || r.data))
      .catch(() => {});
    marketplaceApi.getFeaturedProducts()
      .then(r => setFeaturedProducts(r.data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-orange-700">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span className="text-lg">🇬🇳</span>
              La super-app de la Guinée
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              Tout ce dont vous avez besoin,{' '}
              <span className="text-yellow-300">livré chez vous</span>
            </h1>
            <p className="text-lg text-orange-100 mb-8 leading-relaxed">
              Commandez vos repas, faites vos courses au marché ou achetez chez les boutiquierrs guinéens — GnExpress connecte toute la Guinée.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/delivery">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-orange-50 shadow-xl">
                  <Truck className="w-5 h-5" />
                  Commander un repas
                </Button>
              </Link>
              <Link href="/boutiques">
                <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10">
                  <ShoppingCart className="w-5 h-5" />
                  Voir les boutiques
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 modules */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              href: '/delivery',
              icon: '🍽️',
              color: 'from-orange-500 to-red-500',
              title: 'Livraison & Restauration',
              desc: 'Commandez vos plats préférés dans les restaurants locaux. Livraison rapide à domicile.',
              badge: 'Module 1',
            },
            {
              href: '/marche',
              icon: '🛒',
              color: 'from-green-500 to-emerald-600',
              title: 'Mon Marché',
              desc: 'Un coursier fait vos courses au marché (Madina, Cosa...) et un livreur vous les apporte.',
              badge: 'Module 2',
            },
            {
              href: '/boutiques',
              icon: '🏪',
              color: 'from-blue-500 to-indigo-600',
              title: 'Marché Numérique',
              desc: 'Découvrez et achetez chez les boutiques et artisans guinéens. Mode, tech, artisanat...',
              badge: 'Module 3',
            },
          ].map((m) => (
            <Link key={m.href} href={m.href}
              className="group bg-white rounded-2xl border border-warm-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                {m.icon}
              </div>
              <span className="text-xs font-bold text-warm-400 uppercase tracking-wider">{m.badge}</span>
              <h3 className="text-lg font-bold text-warm-900 mt-1 mb-2">{m.title}</h3>
              <p className="text-sm text-warm-500 leading-relaxed">{m.desc}</p>
              <div className="flex items-center gap-1 mt-4 text-sm font-semibold text-primary-500 group-hover:gap-2 transition-all">
                Explorer <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Restaurants populaires */}
      {restaurants.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-warm-900">Restaurants populaires</h2>
              <p className="text-warm-500 text-sm">Commandez maintenant, livré en 20-45 min</p>
            </div>
            <Link href="/delivery" className="text-sm font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {restaurants.slice(0, 3).map((r) => (
              <Link key={r.id} href={`/delivery?restaurant=${r.id}`}
                className="group bg-white rounded-2xl border border-warm-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center relative overflow-hidden">
                  <span className="text-6xl group-hover:scale-110 transition-transform">🍽️</span>
                  {!r.is_open && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-warm-900 text-sm font-bold px-3 py-1.5 rounded-full">Fermé</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-warm-900 text-base leading-tight">{r.name}</h3>
                    <div className="flex items-center gap-1 text-sm font-semibold text-yellow-600 ml-2 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      {r.rating}
                    </div>
                  </div>
                  <p className="text-xs text-warm-500 mb-3">{truncate(r.description, 70)}</p>
                  <div className="flex items-center gap-3 text-xs text-warm-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.delivery_time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{r.city}</span>
                    <span className="ml-auto font-semibold text-primary-500">{formatCurrency(r.delivery_fee)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Produits en vedette */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-warm-900">Boutiques en vedette</h2>
              <p className="text-warm-500 text-sm">Produits sélectionnés chez nos boutiquierrs</p>
            </div>
            <Link href="/boutiques" className="text-sm font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredProducts.map((p) => (
              <Link key={p.id} href={`/boutiques?product=${p.id}`}
                className="group bg-white rounded-2xl border border-warm-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="aspect-square bg-gradient-to-br from-warm-100 to-warm-200 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                  🛍️
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-warm-900 leading-tight truncate">{p.name}</p>
                  <p className="text-xs text-primary-500 font-bold mt-1">{formatCurrency(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA pour rejoindre */}
      <section className="bg-secondary-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Vous avez une activité ?</h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Rejoignez GnExpress et développez votre business digital en Guinée.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {[
                { href: '/auth/register?role=RESTAURANT', label: '🍽️ Mon restaurant', desc: 'Restaurateurs' },
                { href: '/auth/register?role=BOUTIQUIERR', label: '🏪 Ma boutique', desc: 'Boutiquierrs' },
                { href: '/auth/register?role=LIVREUR', label: '🏍️ Devenir livreur', desc: 'Livreurs' },
                { href: '/auth/register?role=COURSIER', label: '🛒 Devenir coursier', desc: 'Coursiers' },
              ].map(({ href, label, desc }) => (
                <Link key={href} href={href}
                  className="flex flex-col items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-sm font-bold transition-colors"
                >
                  <span>{label}</span>
                  <span className="text-xs text-green-200">{desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'Livraison rapide', desc: '20 à 45 minutes pour vos commandes alimentaires', color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { icon: Shield, title: 'Paiements sécurisés', desc: 'Orange Money, Wave et autres méthodes locales', color: 'text-green-500', bg: 'bg-green-50' },
            { icon: MapPin, title: 'Couverture Conakry', desc: 'Tous les quartiers de Conakry couverts', color: 'text-blue-500', bg: 'bg-blue-50' },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-warm-200">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <h3 className="font-bold text-warm-900 mb-1">{title}</h3>
                <p className="text-sm text-warm-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
