import { cva } from 'class-variance-authority';

/**
 * Shared class builder for link-as-button usages. Lives in its own module so
 * button.tsx exports only components and Fast Refresh can preserve its state.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:border-transparent',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
        outline: 'border border-input bg-background hover:bg-secondary',
        ghost: 'hover:bg-secondary',
      },
      size: { default: 'h-11 px-6', sm: 'h-9 px-4', lg: 'h-12 px-8 text-base' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
