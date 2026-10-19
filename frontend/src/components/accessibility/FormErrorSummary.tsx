import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'

import type { FormError } from '@/lib/validation'
import { cn } from '@/lib/utils'

export interface FormErrorSummaryProps {
  errors: readonly FormError[]
  /** Heading text. Defaults to a clear instruction. */
  title?: string
  /**
   * Focus the summary when it first receives errors. Use after an invalid
   * submit; leave off for live validation to avoid stealing focus while typing.
   */
  autoFocus?: boolean
  /** Optional id, useful for `aria-describedby` on the form. */
  id?: string
  className?: string
}

/**
 * Summarises validation errors after an unsuccessful submit.
 *
 * Renders `role="alert"` so a single announcement is made when it appears,
 * links each message to its control, and (optionally) moves focus to itself.
 * Clicking a link focuses the target control without a page jump. Missing
 * targets are handled gracefully — the summary still renders.
 */
export function FormErrorSummary({
  errors,
  title = 'Please correct the following errors',
  autoFocus = false,
  id,
  className,
}: FormErrorSummaryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hasErrors = errors.length > 0
  const hadErrors = useRef(false)

  useEffect(() => {
    if (!autoFocus) {
      return
    }
    if (hasErrors && !hadErrors.current) {
      containerRef.current?.focus()
    }
    hadErrors.current = hasErrors
  }, [autoFocus, hasErrors])

  if (!hasErrors) {
    return null
  }

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, fieldId: string) => {
    const target = document.getElementById(fieldId)
    if (!target) {
      // Leave default anchor behaviour so the user still gets feedback.
      return
    }
    event.preventDefault()
    target.focus()
    target.scrollIntoView({ block: 'center' })
  }

  return (
    <div
      ref={containerRef}
      id={id}
      role="alert"
      tabIndex={-1}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn(
        'rounded-lg border border-danger/40 bg-danger-soft p-4 text-danger-foreground',
        className,
      )}
    >
      <p id={id ? `${id}-title` : undefined} className="font-semibold">
        {title}
      </p>
      <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">
        {errors.map((error, index) => (
          <li key={`${error.fieldId}-${index}`}>
            <a
              href={`#${error.fieldId}`}
              onClick={(event) => handleLinkClick(event, error.fieldId)}
              className="underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
