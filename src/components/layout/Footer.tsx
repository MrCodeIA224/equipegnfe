import Link from 'next/link';
import { Truck, ShoppingBag, ShoppingCart, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-warm-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-black text-lg">G</span>
              </div>
              <span className="font-black text-xl">GnExpress</span>
            </div>
            <p className="text-warm-300 text-sm leading-relaxed">
              Votre plateforme tout-en-un pour la Guinée. Livraison, courses et boutiques numériques.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm text-warm-400">
              <MapPin className="w-4 h-4 text-primary-400" />
              Conakry, Guinée
            </div>
          </div>

          {/* Modules */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-warm-300 mb-4">Nos Services</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/delivery" className="flex items-center gap-2 text-sm text-warm-400 hover:text-primary-400 transition-colors">
                  <Truck className="w-4 h-4" /> Livraison & Restauration
                </Link>
              </li>
              <li>
                <Link href="/marche" className="flex items-center gap-2 text-sm text-warm-400 hover:text-primary-400 transition-colors">
                  <ShoppingBag className="w-4 h-4" /> Mon Marché
                </Link>
              </li>
              <li>
                <Link href="/boutiques" className="flex items-center gap-2 text-sm text-warm-400 hover:text-primary-400 transition-colors">
                  <ShoppingCart className="w-4 h-4" /> Marché Numérique
                </Link>
              </li>
            </ul>
          </div>

          {/* Rejoindre */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-warm-300 mb-4">Rejoindre</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/auth/register?role=LIVREUR', label: 'Devenir livreur' },
                { href: '/auth/register?role=COURSIER', label: 'Devenir coursier' },
                { href: '/auth/register?role=RESTAURANT', label: 'Inscrire mon restaurant' },
                { href: '/auth/register?role=BOUTIQUIERR', label: 'Ouvrir ma boutique' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-warm-400 hover:text-primary-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-warm-300 mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-warm-400">
                <Phone className="w-4 h-4 text-primary-400" />
                +224 620 000 000
              </li>
              <li className="flex items-center gap-2 text-sm text-warm-400">
                <Mail className="w-4 h-4 text-primary-400" />
                contact@gnexpress.gn
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-warm-800 my-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-warm-500">
          <p>© 2024 GnExpress. Tous droits réservés.</p>
          <p>Fait avec ❤️ pour la Guinée 🇬🇳</p>
        </div>
      </div>
    </footer>
  );
}
