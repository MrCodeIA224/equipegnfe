'use client';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { GUINEA_CITIES } from '@/lib/utils';

const STORAGE_KEY = 'gn_city';
const DEFAULT_CITY = 'Conakry';

interface CityContextType {
  city: string;
  setCity: (city: string) => void;
}

const CityContext = createContext<CityContextType | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  // 'Conakry' est un défaut valide identique côté serveur et client : pas de
  // risque de mismatch d'hydratation ici (contrairement à l'utilisateur connecté),
  // donc un simple useEffect (pas besoin d'isomorphic layout effect) suffit pour
  // appliquer une préférence sauvegardée après le montage.
  const [city, setCityState] = useState(DEFAULT_CITY);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && GUINEA_CITIES.includes(saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCityState(saved);
    }
  }, []);

  const setCity = useCallback((newCity: string) => {
    localStorage.setItem(STORAGE_KEY, newCity);
    setCityState(newCity);
  }, []);

  return (
    <CityContext.Provider value={{ city, setCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity doit être utilisé dans CityProvider');
  return ctx;
}
