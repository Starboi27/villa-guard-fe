import { cn } from '../../lib/cn.js';

export const Textarea = ({ className, ...props }) => (
  <textarea
    data-slot="textarea"
    className={cn(
      'flex min-h-[120px] w-full min-w-0 rounded-xl border border-solid border-input bg-card px-3 py-3 text-base text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
);
