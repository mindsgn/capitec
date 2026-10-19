import { describe, expect, it } from 'vitest'

import {
  clamp,
  formatNumber,
  formatZAR,
  isWithinRange,
  parseCurrency,
  toCurrencyValue,
  toEditableValue,
} from './currency'

/** Normalises the non-breaking spaces `Intl` emits so assertions stay readable. */
const plain = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ')

describe('formatZAR', () => {
  it('formats rand with two decimals and the local grouping convention', () => {
    expect(plain(formatZAR(2450))).toBe('R 2 450,00')
    expect(plain(formatZAR(1234567.5))).toBe('R 1 234 567,50')
  })

  it('can format whole rand when cents are disabled', () => {
    expect(plain(formatZAR(150000, { cents: false }))).toBe('R 150 000')
  })

  it('never renders a non-finite value as a currency amount', () => {
    expect(formatZAR(Number.NaN)).toBe('')
    expect(formatZAR(Number.POSITIVE_INFINITY)).toBe('')
  })
})

describe('formatNumber', () => {
  it('formats plain numbers without a currency symbol', () => {
    expect(plain(formatNumber(1500))).toBe('1 500')
  })

  it('returns an empty string for non-finite values', () => {
    expect(formatNumber(Number.NaN)).toBe('')
  })
})

describe('parseCurrency', () => {
  it('keeps empty and whitespace-only input empty rather than coercing to zero', () => {
    expect(parseCurrency('')).toEqual({ kind: 'empty' })
    expect(parseCurrency('   ')).toEqual({ kind: 'empty' })
  })

  it('parses a plain integer', () => {
    expect(parseCurrency('150000')).toEqual({ kind: 'valid', value: 150000 })
  })

  it('ignores grouping spaces and a rand prefix', () => {
    expect(parseCurrency('R 150 000')).toEqual({ kind: 'valid', value: 150000 })
    expect(parseCurrency('R150000')).toEqual({ kind: 'valid', value: 150000 })
  })

  it('accepts both a comma and a dot as the decimal separator', () => {
    expect(parseCurrency('2450,50')).toEqual({ kind: 'valid', value: 2450.5 })
    expect(parseCurrency('2450.50')).toEqual({ kind: 'valid', value: 2450.5 })
  })

  it('treats the right-most separator as the decimal point when both appear', () => {
    // Grouping uses dots, decimal uses a comma.
    expect(parseCurrency('1.234.567,89')).toEqual({ kind: 'valid', value: 1234567.89 })
  })

  it('rejects negative amounts with an explicit reason', () => {
    expect(parseCurrency('-100')).toEqual({ kind: 'invalid', reason: 'negative' })
  })

  it('rejects text that is not a valid amount', () => {
    expect(parseCurrency('abc')).toEqual({ kind: 'invalid', reason: 'format' })
    expect(parseCurrency('.')).toEqual({ kind: 'invalid', reason: 'format' })
    expect(parseCurrency('1,2,3,4')).toEqual({ kind: 'invalid', reason: 'format' })
  })

  it('accepts a genuinely grouped amount when the groups are well formed', () => {
    expect(parseCurrency('1.234.567')).toEqual({ kind: 'valid', value: 1234567 })
  })
})

describe('toCurrencyValue', () => {
  it('returns the number for valid input and null otherwise', () => {
    expect(toCurrencyValue('150000')).toBe(150000)
    expect(toCurrencyValue('')).toBeNull()
    expect(toCurrencyValue('nonsense')).toBeNull()
  })

  it('never turns an empty field into zero', () => {
    expect(toCurrencyValue('')).not.toBe(0)
  })
})

describe('isWithinRange', () => {
  it('honours inclusive bounds', () => {
    expect(isWithinRange(5000, { min: 5000, max: 10000 })).toBe(true)
    expect(isWithinRange(10000, { min: 5000, max: 10000 })).toBe(true)
    expect(isWithinRange(4999, { min: 5000 })).toBe(false)
    expect(isWithinRange(10001, { max: 10000 })).toBe(false)
  })

  it('rejects non-finite values', () => {
    expect(isWithinRange(Number.NaN)).toBe(false)
  })
})

describe('clamp', () => {
  it('clamps into the inclusive range', () => {
    expect(clamp(50, 0, 100)).toBe(50)
    expect(clamp(-10, 0, 100)).toBe(0)
    expect(clamp(200, 0, 100)).toBe(100)
  })

  it('falls back to the minimum for non-finite values', () => {
    expect(clamp(Number.NaN, 5000, 10000)).toBe(5000)
  })
})

describe('toEditableValue', () => {
  it('produces a plain editable string without grouping separators', () => {
    expect(toEditableValue(150000)).toBe('150000')
    expect(toEditableValue(2450.5)).toBe('2450.5')
  })

  it('returns an empty string for null, undefined and non-finite values', () => {
    expect(toEditableValue(null)).toBe('')
    expect(toEditableValue(undefined)).toBe('')
    expect(toEditableValue(Number.NaN)).toBe('')
  })
})
