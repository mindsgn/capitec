import { buttonVariants } from '@/components/ui/button-variants';

describe('buttonVariants', () => {
  test('produces the default variant and size classes', () => {
    const cls = buttonVariants();
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('h-11');
  });

  test('swaps in the requested variant and size', () => {
    const cls = buttonVariants({ variant: 'accent', size: 'lg' });
    expect(cls).toContain('bg-accent');
    expect(cls).toContain('h-12');
    expect(cls).not.toContain('bg-primary');
  });
});
