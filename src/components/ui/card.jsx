import { cn } from '../../lib/cn.js';

export const Card = ({ className, ...props }) => (
  <div
    data-slot="card"
    className={cn('rounded-xl border border-solid border-border bg-card text-card-foreground shadow-sm', className)}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }) => (
  <div
    data-slot="card-header"
    className={cn('flex flex-col gap-1.5 p-6', className)}
    {...props}
  />
);

export const CardTitle = ({ className, ...props }) => (
  <h2
    data-slot="card-title"
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
);

export const CardDescription = ({ className, ...props }) => (
  <p
    data-slot="card-description"
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
);

export const CardContent = ({ className, ...props }) => (
  <div
    data-slot="card-content"
    className={cn('p-6 pt-0', className)}
    {...props}
  />
);

export const CardFooter = ({ className, ...props }) => (
  <div
    data-slot="card-footer"
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
);
