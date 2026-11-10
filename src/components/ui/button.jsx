import { cn } from '../../lib/cn.js';
import { Slot } from '../../lib/slot.jsx';
import { buttonVariants } from './button-variants.js';

export const Button = ({ asChild = false, className, variant = 'default', size = 'default', ...props }) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
};
