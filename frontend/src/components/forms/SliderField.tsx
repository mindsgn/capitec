import type { ChangeEvent } from 'react'

import { clamp, formatNumber, formatZAR } from '@/lib/currency'
import { cn } from '@/lib/utils'

import { FieldError } from './FieldError'
import { FieldHint } from './FieldHint'
import { FieldLabel } from './FieldLabel'
import { useFieldIds } from './useFieldIds'

export interface SliderFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  hint?: string
  error?: string
  disabled?: boolean
  id?: string
  name?: string
  /** How the current value is displayed and announced. Defaults to `number`. */
  format?: 'number' | 'currency'
  className?: string
}

/**
 * Native range input with a readable value display. When `format="currency"`
 * the value is shown in rand (e.g. `R 150 000`). It only reports numbers; loan
 * calculations stay in the calculation layer. Values are clamped to the
 * configured bounds so the reported value can never leave the range.
 */
export function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  hint,
  error,
  disabled = false,
  id,
  name,
  format = 'number',
  className,
}: SliderFieldProps) {
  const ids = useFieldIds({ id, hasHint: Boolean(hint), hasError: Boolean(error) })

  const safeValue = clamp(Number.isFinite(value) ? value : min, min, max)
  const displayValue = format === 'currency' ? formatZAR(safeValue, { cents: false }) : formatNumber(safeValue)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.valueAsNumber)
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel htmlFor={ids.controlId}>{label}</FieldLabel>
        <output
          htmlFor={ids.controlId}
          className="text-sm font-semibold text-brand tabular-nums"
          aria-live="off"
        >
          {displayValue}
        </output>
      </div>
      <input
        id={ids.controlId}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={ids.describedBy}
        aria-invalid={error ? true : undefined}
        aria-valuetext={displayValue}
        className={cn(
          'mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--brand)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          '[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand',
          '[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand',
        )}
      />
      {hint ? <FieldHint id={ids.hintId}>{hint}</FieldHint> : null}
      {error ? <FieldError id={ids.errorId}>{error}</FieldError> : null}
    </div>
  )
}
