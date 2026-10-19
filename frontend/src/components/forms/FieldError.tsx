import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { errorClasses } from './fieldStyles'

export interface FieldErrorProps {
  /** Stable id used by the control's `aria-describedby`. */
  id?: string
  children: ReactNode
  /**
   * Opt in to an assertive `role="alert"` announcement. Left off by default so
   * validation that updates on every keystroke does not spam screen readers;
   * the text is still exposed through `aria-describedby`.
   */
  announce?: boolean
  className?: string
}

/**
 * Inline validation message. The icon plus hidden "Error:" prefix ensure the
 * message is not communicated by colour alone.
 */
export function FieldError({ id, children, announce = false, className }: FieldErrorProps) {
  const { t } = useTranslation('accessibility')

  return (
    <p id={id} className={cn(errorClasses, className)} role={announce ? 'alert' : undefined}>
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="sr-only">{t('errorPrefix')} </span>
        {children}
      </span>
    </p>
  )
}
