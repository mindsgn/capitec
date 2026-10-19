import { cn } from '@/lib/utils'

export interface SkipLinkProps {
  /** Target id of the main content. Defaults to `main-content`. */
  targetId?: string
  /** Link text. */
  children?: string
  className?: string
}

/**
 * Renders a real anchor that is visually hidden until focused, letting
 * keyboard users skip repeated navigation and jump straight to the main
 * content. The target must exist in the layout and have a matching id; using
 * `tabIndex={-1}` on the target makes it reliably focusable.
 */
export function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50',
        'focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-base focus:font-semibold focus:text-white',
        className,
      )}
    >
      {children}
    </a>
  )
}
