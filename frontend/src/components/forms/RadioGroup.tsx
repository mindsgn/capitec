import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { FieldError } from './FieldError'
import { FieldHint } from './FieldHint'
import { useFieldIds } from './useFieldIds'

export interface RadioOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps {
  /** Group label rendered in a `<legend>`. */
  label: ReactNode
  /** Shared `name` applied to every radio input. */
  name: string
  options: readonly RadioOption[]
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  disabled?: boolean
  id?: string
  className?: string
  /** Layout of the options. Defaults to a vertical stack. */
  orientation?: 'vertical' | 'horizontal'
}

/**
 * Native radio group built on `<fieldset>`/`<legend>` so the options are
 * semantically grouped, with browser-native arrow-key navigation and a unique
 * id per input.
 */
export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  hint,
  error,
  required = false,
  disabled = false,
  id,
  className,
  orientation = 'vertical',
}: RadioGroupProps) {
  const ids = useFieldIds({ id, hasHint: Boolean(hint), hasError: Boolean(error) })

  return (
    <fieldset
      id={ids.controlId}
      className={cn('flex flex-col', className)}
      aria-describedby={ids.describedBy}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
    >
      <legend className="flex flex-wrap items-center gap-1 text-sm font-medium text-ink">
        <span>{label}</span>
        {required ? (
          <>
            <span aria-hidden="true" className="text-danger-foreground">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        ) : null}
      </legend>
      <div
        className={cn(
          'mt-1.5 flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        )}
      >
        {options.map((option) => {
          const optionId = `${ids.controlId}-${option.value}`
          const optionDisabled = disabled || option.disabled
          return (
            <div key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                disabled={optionDisabled}
                required={required}
                className="size-4 shrink-0 accent-[var(--brand)] disabled:cursor-not-allowed"
              />
              <label
                htmlFor={optionId}
                className={cn(
                  'text-base text-ink',
                  optionDisabled && 'cursor-not-allowed text-ink-muted',
                )}
              >
                {option.label}
              </label>
            </div>
          )
        })}
      </div>
      {hint ? <FieldHint id={ids.hintId}>{hint}</FieldHint> : null}
      {error ? <FieldError id={ids.errorId}>{error}</FieldError> : null}
    </fieldset>
  )
}
