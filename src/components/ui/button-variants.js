import { cn } from '../../lib/cn.js';

const baseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-solid border-transparent text-base font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-[var(--gray-700)]',
  destructive: 'bg-destructive text-primary-foreground hover:bg-primary',
  outline: 'border border-input bg-card hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-foreground underline-offset-4 hover:underline',
};

const sizes = {
  default: 'h-12 px-4 py-3',
  sm: 'h-10 rounded-lg px-3 text-sm',
  lg: 'h-12 rounded-xl px-8',
  icon: 'h-11 w-11 p-0',
};

export const buttonVariants = ({ variant = 'default', size = 'default' } = {}) =>
  cn(baseClasses, variants[variant] ?? variants.default, sizes[size] ?? sizes.default);
