import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

import { FieldError } from './FieldError'
import { FieldHint } from './FieldHint'
import { FieldLabel } from './FieldLabel'
import { controlBaseClasses } from './fieldStyles'
import { useFieldIds } from './useFieldIds'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string
  options: readonly SelectOption[]
  placeholder?: string
  hint?: string
  error?: string
  optional?: boolean
  containerClassName?: string
}

/**
 * Accessible wrapper around a native `<select>`. Native keyboard behaviour is
 * preserved and validation messages are linked with `aria-describedby` /
 * `aria-invalid`.
 */
export function SelectField({
  label,
  options,
  placeholder,
  hint,
  error,
  optional = false,
  required = false,
  disabled,
  value,
  id,
  className,
  containerClassName,
  ...rest
}: SelectFieldProps) {
  const ids = useFieldIds({ id, hasHint: Boolean(hint), hasError: Boolean(error) })
  const isControlled = value !== undefined
  const hasEmptyOption = isControlled && String(value) === ''

  return (
    <div className={cn('flex flex-col', containerClassName)}>
      <FieldLabel htmlFor={ids.controlId} required={required} optional={optional}>
        {label}
      </FieldLabel>
      <div className="relative mt-1.5">
        <select
          {...rest}
          id={ids.controlId}
          value={value}
          disabled={disabled}
          required={required}
          aria-describedby={ids.describedBy}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          className={cn(controlBaseClasses, 'appearance-none pr-10', className)}
        >
          {placeholder ? (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          ) : hasEmptyOption ? (
            <option value="" aria-hidden="true" />
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-ink-muted"
        />
      </div>
      {hint ? <FieldHint id={ids.hintId}>{hint}</FieldHint> : null}
      {error ? <FieldError id={ids.errorId}>{error}</FieldError> : null}
    </div>
  )
}
