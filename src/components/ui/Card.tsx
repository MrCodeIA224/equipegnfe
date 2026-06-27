import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({ className, hover, padding = 'md', children, ...props }: CardProps) {
  const paddings = { sm: 'p-3', md: 'p-5', lg: 'p-7', none: '' };
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-warm-200 shadow-sm',
        hover && 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-bold text-warm-900', className)} {...props}>
      {children}
    </h3>
  );
}
