import { cloneElement, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { FieldError } from './FieldError'
import { FieldHint } from './FieldHint'
import { FieldLabel } from './FieldLabel'
import { useFieldIds } from './useFieldIds'

/** Properties `FormField` injects into its child control. */
export interface FieldControlProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

export interface FormFieldProps {
  label: ReactNode
  /** Explicit control id. Defaults to a generated, stable id. */
  id?: string
  /** Explicit `htmlFor`. Defaults to the resolved control id. */
  htmlFor?: string
  required?: boolean
  optional?: boolean
  hint?: ReactNode
  error?: ReactNode
  /** A single control element. Standard ARIA props are merged in, not replaced. */
  children: ReactElement<FieldControlProps> | ReactNode
  className?: string
}

/**
 * Consistent wrapper for a single form control.
 *
 * `FormField` owns the *presentation* of label, hint and error, and wires the
 * control's `aria-describedby`, `aria-invalid` and `aria-required`. It never
 * validates values — validation belongs to the form/schema layer.
 */
export function FormField({
  label,
  id,
  htmlFor,
  required = false,
  optional = false,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  const ids = useFieldIds({ id, hasHint: Boolean(hint), hasError: Boolean(error) })

  const childId = isValidElement<FieldControlProps>(children) ? children.props.id : undefined
  const controlId = id ?? childId ?? ids.controlId
  const labelFor = htmlFor ?? controlId

  let control: ReactNode = children

  if (isValidElement<FieldControlProps>(children)) {
    control = cloneElement(children, {
      id: childId ?? controlId,
      'aria-describedby': [children.props['aria-describedby'], ids.describedBy]
        .filter(Boolean)
        .join(' ') || undefined,
      'aria-invalid': error ? true : children.props['aria-invalid'],
      'aria-required': required || children.props['aria-required'] || undefined,
    })
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <FieldLabel htmlFor={labelFor} required={required} optional={optional}>
        {label}
      </FieldLabel>
      <div className="mt-1.5">{control}</div>
      {hint ? <FieldHint id={ids.hintId}>{hint}</FieldHint> : null}
      {error ? <FieldError id={ids.errorId}>{error}</FieldError> : null}
    </div>
  )
}
