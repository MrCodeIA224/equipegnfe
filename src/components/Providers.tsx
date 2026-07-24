'use client';
import { AuthProvider } from '@/context/AuthContext';
import { CityProvider } from '@/context/CityContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CityProvider>{children}</CityProvider>
    </AuthProvider>
  );
}
