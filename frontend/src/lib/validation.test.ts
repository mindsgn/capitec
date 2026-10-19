import { describe, expect, it } from 'vitest'

import { toFormErrors, validateLoanSimulator } from './validation'
import type { LoanSimulatorFormValues } from './validation'
import { loanSimulatorSchema } from './validation'

const validValues: LoanSimulatorFormValues = {
  loanAmount: '150000',
  loanTerm: '24',
  monthlyIncome: '25000',
  monthlyExpenses: '15000',
  existingDebt: '5000',
}

describe('validateLoanSimulator', () => {
  it('parses a valid form into numbers', () => {
    const result = validateLoanSimulator(validValues)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        loanAmount: 150000,
        loanTerm: 24,
        monthlyIncome: 25000,
        monthlyExpenses: 15000,
        existingDebt: 5000,
      })
    }
  })

  it('treats an empty optional debt field as zero without inventing a value', () => {
    const result = validateLoanSimulator({ ...validValues, existingDebt: '' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.existingDebt).toBe(0)
    }
  })

  it('reports required fields that are left blank', () => {
    const result = validateLoanSimulator({
      loanAmount: '',
      loanTerm: '24',
      monthlyIncome: '',
      monthlyExpenses: '',
      existingDebt: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldIds = result.errors.map((error) => error.fieldId)
      expect(fieldIds).toContain('loanAmount')
      expect(fieldIds).toContain('monthlyIncome')
      expect(fieldIds).toContain('monthlyExpenses')
      expect(fieldIds).not.toContain('existingDebt')
    }
  })

  it('rejects negative currency amounts', () => {
    const result = validateLoanSimulator({ ...validValues, loanAmount: '-100' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toEqual([{ fieldId: 'loanAmount', key: 'loanAmount.negative' }])
    }
  })

  it('enforces the documented loan amount bounds with one clear key', () => {
    const tooLow = validateLoanSimulator({ ...validValues, loanAmount: '1000' })
    const tooHigh = validateLoanSimulator({ ...validValues, loanAmount: '400000' })

    expect(tooLow.success).toBe(false)
    expect(tooHigh.success).toBe(false)
    if (!tooLow.success && !tooHigh.success) {
      expect(tooLow.errors[0]).toEqual({
        fieldId: 'loanAmount',
        key: 'loanAmount.range',
        values: { min: 5_000, max: 300_000, format: 'currency' },
      })
      expect(tooHigh.errors[0]).toEqual({
        fieldId: 'loanAmount',
        key: 'loanAmount.range',
        values: { min: 5_000, max: 300_000, format: 'currency' },
      })
    }
  })

  it('enforces the repayment term bounds', () => {
    const result = validateLoanSimulator({ ...validValues, loanTerm: '3' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0]).toEqual({
        fieldId: 'loanTerm',
        key: 'loanTerm.range',
        values: { min: 6, max: 60, format: 'number' },
      })
    }
  })

  it('enforces the minimum monthly income', () => {
    const result = validateLoanSimulator({ ...validValues, monthlyIncome: '2000' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0]).toEqual({
        fieldId: 'monthlyIncome',
        key: 'monthlyIncome.min',
        values: { min: 5_000, format: 'currency' },
      })
    }
  })

  it('accepts a zero monthly expense amount', () => {
    const result = validateLoanSimulator({ ...validValues, monthlyExpenses: '0' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.monthlyExpenses).toBe(0)
    }
  })

  it('reports a non-numeric required amount as invalid', () => {
    const result = validateLoanSimulator({ ...validValues, loanAmount: 'abc' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0]).toEqual({
        fieldId: 'loanAmount',
        key: 'loanAmount.invalid',
      })
    }
  })
})

describe('toFormErrors', () => {
  it('maps each Zod issue to its field id and translation key', () => {
    const parsed = loanSimulatorSchema.safeParse({
      ...validValues,
      loanAmount: '',
      loanTerm: '3',
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const errors = toFormErrors(parsed.error)
      expect(errors).toEqual([
        { fieldId: 'loanAmount', key: 'loanAmount.required' },
        { fieldId: 'loanTerm', key: 'loanTerm.range', values: { min: 6, max: 60, format: 'number' } },
      ])
    }
  })
})
