import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 GNF';
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + ' GNF';
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING:       'bg-yellow-100 text-yellow-800',
  CONFIRMED:     'bg-blue-100 text-blue-800',
  PREPARING:     'bg-blue-100 text-blue-800',
  PROCESSING:    'bg-blue-100 text-blue-800',
  READY:         'bg-indigo-100 text-indigo-800',
  PICKUP_READY:  'bg-indigo-100 text-indigo-800',
  PICKED_UP:     'bg-purple-100 text-purple-800',
  DELIVERING:    'bg-orange-100 text-orange-800',
  DELIVERED:     'bg-green-100 text-green-800',
  COMPLETED:     'bg-green-100 text-green-800',
  CANCELLED:     'bg-red-100 text-red-800',
  OPEN:          'bg-teal-100 text-teal-800',
  ASSIGNED:      'bg-cyan-100 text-cyan-800',
  SHOPPING:      'bg-purple-100 text-purple-800',
  NEED_DELIVERY:      'bg-orange-100 text-orange-800',
  LIVREUR_CANCELLED:  'bg-red-100 text-red-800',
};

export const MARKET_NAMES = [
  'Marché Madina', 'Marché Cosa', 'Marché Dixinn', 'Marché Matam',
  'Marché Bambeto', 'Marché Koloma', 'Marché Kaloum', 'Grand Marché'
];

// Doit rester synchronisé avec config/constants.py (GUINEA_CITIES) côté backend.
export const GUINEA_CITIES = [
  'Conakry', 'Kindia', 'Kankan', 'Labé', "N'Zérékoré",
  'Boké', 'Mamou', 'Faranah', 'Kissidougou', 'Guéckédou',
];
