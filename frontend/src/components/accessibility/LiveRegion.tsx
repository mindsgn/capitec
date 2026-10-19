import { cn } from '@/lib/utils'

export interface LiveRegionProps {
  /**
   * The message to announce. When the string is unchanged React makes no DOM
   * update, so the same message is never announced twice.
   */
  message: string
  /** `polite` (default) or `assertive`. */
  mode?: 'polite' | 'assertive'
  /** Whether the whole region is announced atomically. Defaults to `true`. */
  atomic?: boolean
  /** Visually render the message. Defaults to screen-reader-only. */
  visible?: boolean
  className?: string
}

/**
 * Announces dynamic updates (e.g. a new repayment estimate) to assistive
 * technology without moving focus. The region is always mounted and only its
 * text changes, which is the behaviour screen readers expect. Repeated
 * identical messages produce no DOM mutation and therefore no duplicate
 * announcement. Keep the visual result display separate and pass a concise
 * summary here.
 */
export function LiveRegion({
  message,
  mode = 'polite',
  atomic = true,
  visible = false,
  className,
}: LiveRegionProps) {
  const role = mode === 'assertive' ? 'alert' : 'status'

  return (
    <div
      role={role}
      aria-live={mode}
      aria-atomic={atomic}
      className={cn(visible ? 'text-sm' : 'sr-only', className)}
    >
      {message}
    </div>
  )
}
