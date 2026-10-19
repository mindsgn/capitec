import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  /** Optional action, typically a button or link. */
  action?: ReactNode
  /** Optional decorative icon. */
  icon?: ReactNode
  headingLevel?: 2 | 3 | 4
  className?: string
}

/**
 * Explains that there is nothing to show yet and what to do next. Content is
 * generic, so the same component works before inputs are supplied without ever
 * implying a loan has been approved or rejected.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  headingLevel = 3,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'

  return (
    <div className={cn('flex flex-col items-center gap-3 py-8 text-center', className)}>
      {icon ? (
        <div aria-hidden="true" className="text-ink-muted">
          {icon}
        </div>
      ) : null}
      <Heading className="text-base font-semibold text-ink">{title}</Heading>
      {description ? (
        <p className="max-w-md text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
