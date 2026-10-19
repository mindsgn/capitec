/**
 * South African Rand formatting and parsing utilities.
 *
 * Formatting uses `Intl.NumberFormat` with the `en-ZA` locale and the `ZAR`
 * currency so displays follow the expected local convention (for example
 * `R 2 450,00`). Parsing intentionally accepts several common input shapes
 * (grouping spaces, a `R` prefix, `.` or `,` decimal separators) so users can
 * type amounts naturally without the input reformatting under the cursor.
 *
 * These helpers are pure and contain no React code so they can be reused by
 * the calculation layer and unit-tested in isolation.
 */

import { CURRENCY_LOCALE } from '@/i18n/config'

export interface ZARFormatOptions {
  /** Show cents. When `false`, amounts are rounded to whole rand. Defaults to `true`. */
  cents?: boolean
  /** Locale to use for formatting. Defaults to `en-ZA` (South African English). */
  locale?: string
}

export interface CurrencyFormatOptions extends ZARFormatOptions {
  /** Currency code to format with. Defaults to `ZAR`. */
  currency?: string
}

const formatters = new Map<string, Intl.NumberFormat>()
const wholeFormatters = new Map<string, Intl.NumberFormat>()
const decimalFormatters = new Map<string, Intl.NumberFormat>()

function getCurrencyFormatter(locale: string, cents: boolean, currency: string): Intl.NumberFormat {
  const key = `${locale}::${cents ? 'cents' : 'whole'}::${currency}`
  if (cents) {
    const cached = formatters.get(key)
    if (cached) return cached
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    formatters.set(key, formatter)
    return formatter
  }

  const cached = wholeFormatters.get(key)
  if (cached) return cached
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  wholeFormatters.set(key, formatter)
  return formatter
}

function getDecimalFormatter(locale: string): Intl.NumberFormat {
  const key = `dec::${locale}`
  const cached = decimalFormatters.get(key)
  if (cached) return cached
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  decimalFormatters.set(key, formatter)
  return formatter
}

/**
 * Formats a finite number as currency using the specified options.
 * Non-finite values are not valid currency amounts and are formatted as an
 * empty string so they can never masquerade as a real amount.
 */
export function formatCurrency(value: number, options: CurrencyFormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    return ''
  }

  const { cents = true, locale = CURRENCY_LOCALE, currency = 'ZAR' } = options
  try {
    return getCurrencyFormatter(locale, cents, currency).format(value)
  } catch {
    return getCurrencyFormatter(CURRENCY_LOCALE, cents, currency).format(value)
  }
}

/**
 * Formats a finite number as South African rand, e.g. `R 12 345,67`.
 * Non-finite values are not valid currency amounts and are formatted as an
 * empty string so they can never masquerade as a real amount.
 */
export function formatZAR(value: number, options: ZARFormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    return ''
  }
  return formatCurrency(value, { ...options, currency: 'ZAR' })
}

/** Formats a plain (non-currency) number using the provided locale (defaults to `en-ZA`). */
export function formatNumber(value: number, options: { locale?: string } = {}): string {
  if (!Number.isFinite(value)) {
    return ''
  }
  const { locale = CURRENCY_LOCALE } = options
  try {
    return getDecimalFormatter(locale).format(value)
  } catch {
    return getDecimalFormatter(CURRENCY_LOCALE).format(value)
  }
}

export type CurrencyParseError = 'format' | 'negative' | 'non-finite'

export type CurrencyParseResult =
  | { kind: 'empty' }
  | { kind: 'valid'; value: number }
  | { kind: 'invalid'; reason: CurrencyParseError }

const GROUPING_AND_SYMBOLS = /[\s\u00a0\u202f\u2019'Rr]/g

/**
 * Removes grouping separators from an integer part, validating that they form
 * well-formed groups (an optional first group of 1–3 digits followed by groups
 * of exactly 3 digits). Returns `null` when the grouping is malformed, so
 * ambiguous input such as `1,2,3,4` is rejected rather than guessed at.
 */
function stripGrouping(value: string, separator: string): string | null {
  const segments = value.split(separator)

  if (segments.some((segment) => !/^\d+$/.test(segment))) {
    return null
  }

  if (segments.length > 1) {
    if (segments[0].length > 3) {
      return null
    }
    for (let index = 1; index < segments.length; index += 1) {
      if (segments[index].length !== 3) {
        return null
      }
    }
  }

  return segments.join('')
}

/**
 * Parses free-form currency text into a number.
 *
 * - Empty / whitespace-only input returns `{ kind: 'empty' }` so callers can
 *   keep the field blank instead of coercing it to `0`.
 * - Negative values, malformed grouping and unparseable text return
 *   `{ kind: 'invalid' }` with a reason.
 * - Grouping spaces and a leading `R` are ignored. Both `.` and `,` are
 *   accepted as the decimal separator; when both appear the last one wins and
 *   the other is treated as a grouping separator.
 */
export function parseCurrency(text: string): CurrencyParseResult {
  const trimmed = text.trim()

  if (trimmed.length === 0) {
    return { kind: 'empty' }
  }

  if (trimmed.includes('-')) {
    return { kind: 'invalid', reason: 'negative' }
  }

  const cleaned = trimmed.replace(GROUPING_AND_SYMBOLS, '')

  if (cleaned.length === 0) {
    return { kind: 'invalid', reason: 'format' }
  }

  const lastDot = cleaned.lastIndexOf('.')
  const lastComma = cleaned.lastIndexOf(',')
  const dotCount = (cleaned.match(/\./g) ?? []).length
  const commaCount = (cleaned.match(/,/g) ?? []).length

  let integerDigits: string
  let fractionDigits = ''

  if (dotCount > 0 && commaCount > 0) {
    const decimalSeparator = lastDot > lastComma ? '.' : ','
    const groupingSeparator = decimalSeparator === '.' ? ',' : '.'
    const decimalIndex = Math.max(lastDot, lastComma)
    const integerPart = cleaned.slice(0, decimalIndex)
    const fractionPart = cleaned.slice(decimalIndex + 1)

    const grouped = stripGrouping(integerPart, groupingSeparator)
    if (grouped === null || integerPart.includes(decimalSeparator) || !/^\d*$/.test(fractionPart)) {
      return { kind: 'invalid', reason: 'format' }
    }

    integerDigits = grouped
    fractionDigits = fractionPart
  } else if (dotCount + commaCount === 0) {
    integerDigits = cleaned
  } else {
    const separator = dotCount > 0 ? '.' : ','
    const count = dotCount > 0 ? dotCount : commaCount

    if (count === 1) {
      const index = cleaned.indexOf(separator)
      const integerPart = cleaned.slice(0, index)
      const fractionPart = cleaned.slice(index + 1)

      if (!/^\d+$/.test(integerPart) || !/^\d*$/.test(fractionPart)) {
        return { kind: 'invalid', reason: 'format' }
      }

      integerDigits = integerPart
      fractionDigits = fractionPart
    } else {
      const grouped = stripGrouping(cleaned, separator)
      if (grouped === null) {
        return { kind: 'invalid', reason: 'format' }
      }
      integerDigits = grouped
    }
  }

  if (!/^\d+$/.test(integerDigits)) {
    return { kind: 'invalid', reason: 'format' }
  }

  const normalized =
    fractionDigits.length > 0 ? `${integerDigits}.${fractionDigits}` : integerDigits
  const value = Number(normalized)

  if (!Number.isFinite(value)) {
    return { kind: 'invalid', reason: 'non-finite' }
  }

  return { kind: 'valid', value }
}

/**
 * Convenience wrapper returning a finite number or `null`. Empty and invalid
 * input both yield `null`, which callers can treat as "no amount supplied".
 */
export function toCurrencyValue(text: string): number | null {
  const result = parseCurrency(text)
  return result.kind === 'valid' ? result.value : null
}

/** True when `value` is a finite number within the optional inclusive bounds. */
export function isWithinRange(
  value: number,
  bounds: { min?: number; max?: number } = {},
): boolean {
  if (!Number.isFinite(value)) {
    return false
  }
  if (bounds.min !== undefined && value < bounds.min) {
    return false
  }
  if (bounds.max !== undefined && value > bounds.max) {
    return false
  }
  return true
}

/** Clamps a finite number to the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}

/**
 * Produces a plain, editable string for a numeric amount. Not grouped with
 * spaces so editing a controlled value does not jump the caret.
 */
export function toEditableValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return ''
  }
  return String(value)
}
