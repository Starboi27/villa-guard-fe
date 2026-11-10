import { cn } from '../../lib/cn.js';

export const Input = ({ className, type = 'text', ...props }) => (
  <input
    type={type}
    data-slot="input"
    className={cn(
      'flex h-12 w-full min-w-0 rounded-xl border border-solid border-input bg-card px-3 py-3 text-base text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
);
