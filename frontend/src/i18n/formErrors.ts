import type { TFunction } from 'i18next'

import type { FormError, FormErrorValues } from '@/lib/validation'
import { formatCurrency } from '@/lib/currency'

/**
 * Renders an interpolation value the way the message expects it.
 *
 * Rand amounts are formatted with the application currency locale (en-ZA);
 * plain counts (a repayment term in months) are stringified untouched. Keeping
 * the formatting here means no formatted money ever hardcodes into a
 * translation resource, and the result never changes with the interface
 * language.
 */
function formatValue(value: number, format: FormErrorValues['format']): string {
  if (format === 'number') {
    return String(value)
  }
  return formatCurrency(value, { cents: false })
}

/**
 * Translates a validation error produced by `validateLoanSimulator` into a
 * human-readable sentence in the active language.
 */
export function translateFormError(
  error: FormError,
  t: TFunction<'validation'>,
): string {
  const values: Record<string, string> = {}
  if (error.values?.min !== undefined) {
    values.min = formatValue(error.values.min, error.values?.format)
  }
  if (error.values?.max !== undefined) {
    values.max = formatValue(error.values.max, error.values?.format)
  }
  return t(error.key, values)
}
