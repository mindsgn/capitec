import type { LabelHTMLAttributes, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { labelClasses } from './fieldStyles'

export interface FieldLabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children'> {
  children: ReactNode
  /** Marks the field as required. Renders a visible indicator plus screen-reader text. */
  required?: boolean
  /** Marks the field as optional. Ignored when `required` is set. */
  optional?: boolean
  /** Additional content rendered after the label text (e.g. a tooltip trigger). */
  trailing?: ReactNode
}

/**
 * A consistent standalone `<label>`. The required indicator is an asterisk and
 * a visually hidden "(required)" string, so the state is never communicated by
 * colour alone. Placeholder text is deliberately never used as a label.
 */
export function FieldLabel({
  children,
  required = false,
  optional = false,
  trailing,
  className,
  ...rest
}: FieldLabelProps) {
  const { t } = useTranslation('common')

  return (
    <label className={cn(labelClasses, 'flex flex-wrap items-center gap-1', className)} {...rest}>
      <span>{children}</span>
      {required ? (
        <>
          <span aria-hidden="true" className="text-danger-foreground">
            *
          </span>
          <span className="sr-only">{t('states.required')}</span>
        </>
      ) : null}
      {!required && optional ? (
        <span className="text-ink-muted">{t('states.optional')}</span>
      ) : null}
      {trailing}
    </label>
  )
}
