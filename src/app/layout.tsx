import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'GnExpress - Livraison, Marché & Boutiques en Guinée',
  description: 'Commandez vos repas, faites vos courses et achetez chez les boutiques guinéennes - tout en un.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1c1917',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
