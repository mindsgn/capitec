import { useRef } from 'react'
import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'

import { formatZAR, parseCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

import { FieldError } from './FieldError'
import { FieldHint } from './FieldHint'
import { FieldLabel } from './FieldLabel'
import { controlBaseClasses } from './fieldStyles'
import { useFieldIds } from './useFieldIds'

export interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'type'> {
  label: string
  /** Controlled editable text. Kept as typed so the caret never jumps. */
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  /** Inclusive lower bound used for validation messaging. */
  min?: number
  /** Inclusive upper bound used for validation messaging. */
  max?: number
  /** Step forwarded to the input for consistency with numeric fields. */
  step?: number
  optional?: boolean
}

/**
 * Controlled South African rand input.
 *
 * The value stays as the raw text the user typed (no grouping separators are
 * forced in), so editing never jumps the caret. Empty stays empty — it is
 * never coerced to `0`. Formatting/parsing live in `@/lib/currency` and are
 * unit-tested separately. Validation errors from the schema layer can be
 * supplied through `error`; when absent the component surfaces its own message
 * for unparseable or out-of-range input.
 */
export function CurrencyInput({
  label,
  value,
  onChange,
  hint,
  error,
  min,
  max,
  step,
  optional = false,
  required = false,
  disabled,
  id,
  className,
  ...rest
}: CurrencyInputProps) {
  const { t } = useTranslation('validation')
  const inputRef = useRef<HTMLInputElement>(null)

  const parsed = parseCurrency(value)
  const isUnparseable = parsed.kind === 'invalid'

  let rangeError: string | undefined
  if (parsed.kind === 'valid') {
    if (min !== undefined && parsed.value < min) {
      rangeError = t('currency.min', { min: formatZAR(min) })
    } else if (max !== undefined && parsed.value > max) {
      rangeError = t('currency.max', { max: formatZAR(max) })
    }
  }

  const internalError = error ?? (isUnparseable ? t('currency.invalid') : rangeError)
  const hasError = Boolean(internalError)

  const ids = useFieldIds({ id, hasHint: Boolean(hint), hasError })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <FieldLabel htmlFor={ids.controlId} required={required} optional={optional}>
        {label}
      </FieldLabel>
      <div className="relative mt-1.5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-base font-medium text-ink-muted"
        >
          R
        </span>
        <input
          {...rest}
          ref={inputRef}
          id={ids.controlId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled}
          aria-describedby={ids.describedBy}
          aria-invalid={hasError || undefined}
          aria-required={required || undefined}
          className={cn(controlBaseClasses, 'pl-8 tabular-nums')}
        />
      </div>
      {hint ? <FieldHint id={ids.hintId}>{hint}</FieldHint> : null}
      {internalError ? <FieldError id={ids.errorId}>{internalError}</FieldError> : null}
    </div>
  )
}
