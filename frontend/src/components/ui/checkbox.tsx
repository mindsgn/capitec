import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator><Check className="h-4 w-4" strokeWidth={3} /></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
);
Checkbox.displayName = 'Checkbox';
