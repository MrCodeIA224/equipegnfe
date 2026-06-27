import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'orange' | 'green' | 'red' | 'blue' | 'purple';
  sub?: string;
}

const colorMap = {
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-100' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100' },
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' },
};

export default function StatCard({ title, value, icon: Icon, color = 'orange', sub }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('bg-white rounded-2xl border p-5 flex items-center gap-4', c.border)}>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}>
        <Icon className={cn('w-6 h-6', c.icon)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-warm-900">{value}</p>
        <p className="text-sm text-warm-500">{title}</p>
        {sub && <p className="text-xs text-warm-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
