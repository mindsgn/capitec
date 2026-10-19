import { useId } from 'react'
import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface CardProps {
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Optional footer area, e.g. actions. */
  footer?: ReactNode
  /** Element used for the outer wrapper. Defaults to a semantic `<section>`. */
  as?: ElementType
  /** Heading level for the title. Defaults to `h2`. */
  headingLevel?: 2 | 3 | 4
  className?: string
  /** Class applied to the inner content wrapper. */
  contentClassName?: string
}

/**
 * Reusable visual container. Non-interactive by default — no roles or tab
 * stops are added, so an interactive card would need explicit semantics at the
 * call site. Titled cards use `aria-labelledby` for a useful accessible name.
 */
export function Card({
  title,
  description,
  children,
  footer,
  as: Component = 'section',
  headingLevel = 2,
  className,
  contentClassName,
}: CardProps) {
  const Heading = `h${headingLevel}` as ElementType
  const hasHeader = Boolean(title || description)
  const titleId = useId()

  return (
    <Component
      aria-labelledby={title ? titleId : undefined}
      className={cn('rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6', className)}
    >
      {hasHeader ? (
        <header className="mb-4 flex flex-col gap-1">
          {title ? (
            <Heading id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </Heading>
          ) : null}
          {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
        </header>
      ) : null}
      {children ? <div className={contentClassName}>{children}</div> : null}
      {footer ? <footer className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">{footer}</footer> : null}
    </Component>
  )
}
