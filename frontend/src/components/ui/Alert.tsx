import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { noticeStyles } from './noticeStyles'
import type { NoticeVariant } from './noticeStyles'

export interface AlertProps {
  variant?: NoticeVariant
  /** Optional heading rendered in bold above the message. */
  heading?: ReactNode
  children: ReactNode
  /**
   * ARIA role. Defaults to `alert` for urgent variants (warning/error) and
   * `status` for non-urgent feedback (info/success). Pass an explicit role to
   * override.
   */
  role?: 'alert' | 'status' | 'note'
  /** When provided, renders a clearly labelled dismiss button. */
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
}

const defaultRoles: Record<NoticeVariant, 'alert' | 'status'> = {
  info: 'status',
  success: 'status',
  warning: 'alert',
  error: 'alert',
}

/**
 * Feedback message with a variant. An icon plus a visually hidden variant word
 * are always rendered so meaning never depends on colour alone. Urgent
 * variants default to `role="alert"`; others to `role="status"`.
 */
export function Alert({
  variant = 'info',
  heading,
  children,
  role,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
}: AlertProps) {
  const style = noticeStyles[variant]
  const Icon = style.icon
  const ariaRole = role ?? defaultRoles[variant]

  return (
    <div
      role={ariaRole}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 text-sm leading-relaxed',
        style.container,
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex-1">
        <span className="sr-only">{style.srLabel} </span>
        {heading ? <p className="font-semibold">{heading}</p> : null}
        <div>{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 rounded p-1 text-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">{dismissLabel}</span>
        </button>
      ) : null}
    </div>
  )
}
