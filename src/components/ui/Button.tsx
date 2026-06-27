import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95';

    const variants = {
      primary:   'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500 shadow-sm hover:shadow-md',
      secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white focus:ring-secondary-500 shadow-sm',
      outline:   'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost:     'text-warm-800 hover:bg-warm-100 focus:ring-warm-200',
      danger:    'bg-accent-500 hover:bg-accent-600 text-white focus:ring-accent-500 shadow-sm',
      success:   'bg-secondary-500 hover:bg-secondary-600 text-white focus:ring-secondary-500 shadow-sm',
    };

    const sizes = {
      sm:  'px-3 py-1.5 text-sm',
      md:  'px-5 py-2.5 text-sm',
      lg:  'px-7 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
