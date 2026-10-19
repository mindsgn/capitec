import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface FocusManagerProps {
  /**
   * The current step/section key. When this changes, focus moves to the
   * managed region so keyboard and screen-reader users are placed at the start
   * of the new content.
   */
  focusKey: string | number
  /** Optional heading rendered at the top of the region. */
  heading?: ReactNode
  headingLevel?: 2 | 3 | 4
  /** Disable the automatic focus move (for example during initial render). */
  enabled?: boolean
  children: ReactNode
  className?: string
}

/**
 * Small, focused helper for multi-step flows.
 *
 * Focus only moves when `focusKey` changes and `enabled` is true, so it never
 * steals focus during normal input editing. The region is focusable through
 * `tabIndex={-1}`, which keeps it out of the tab order while still allowing
 * programmatic focus. For invalid submits, prefer moving focus to the
 * `FormErrorSummary` or the first invalid field instead of this component.
 */
export function FocusManager({
  focusKey,
  heading,
  headingLevel = 2,
  enabled = true,
  children,
  className,
}: FocusManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousKey = useRef(focusKey)

  useEffect(() => {
    if (!enabled) {
      previousKey.current = focusKey
      return
    }

    if (previousKey.current !== focusKey) {
      containerRef.current?.focus()
      previousKey.current = focusKey
    }
  }, [enabled, focusKey])

  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'

  return (
    <div ref={containerRef} tabIndex={-1} className={cn('focus-visible:outline-none', className)}>
      {heading ? <Heading className="text-lg font-semibold text-ink">{heading}</Heading> : null}
      {children}
    </div>
  )
}
