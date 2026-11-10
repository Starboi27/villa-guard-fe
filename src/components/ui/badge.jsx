import { cn } from '../../lib/cn.js';

const variants = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  outline: 'border-border bg-card text-foreground',
  destructive: 'border-transparent bg-destructive text-primary-foreground',
};

export const Badge = ({ className, variant = 'default', ...props }) => (
  <span
    data-slot="badge"
    data-variant={variant}
    className={cn(
      'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border border-solid px-2 py-0.5 text-xs font-medium transition-colors',
      variants[variant] ?? variants.default,
      className,
    )}
    {...props}
  />
);
