import { describe, expect, it } from 'vitest'

import { calculateLoanEstimate } from './loan'

describe('calculateLoanEstimate', () => {
  it('calculates an amortising instalment for the documented example', () => {
    const estimate = calculateLoanEstimate({
      loanAmount: 150000,
      annualInterestRate: 12.5,
      termMonths: 24,
      monthlyIncome: 25000,
      monthlyExpenses: 15000,
      existingDebt: 5000,
    })

    expect(estimate.monthlyRepayment).toBeCloseTo(7096.1, 1)
    expect(estimate.totalRepayment).toBeCloseTo(170306.31, 1)
    expect(estimate.totalBorrowingCost).toBeCloseTo(20306.31, 1)
    expect(estimate.remainingIncome).toBeCloseTo(-2096.1, 1)
  })

  it('falls back to straight division when the interest rate is zero', () => {
    const estimate = calculateLoanEstimate({
      loanAmount: 12000,
      annualInterestRate: 0,
      termMonths: 12,
      monthlyIncome: 10000,
      monthlyExpenses: 0,
      existingDebt: 0,
    })

    expect(estimate.monthlyRepayment).toBe(1000)
    expect(estimate.totalRepayment).toBe(12000)
    expect(estimate.totalBorrowingCost).toBe(0)
    expect(estimate.remainingIncome).toBe(9000)
  })

  it('never divides by a zero or negative term', () => {
    const estimate = calculateLoanEstimate({
      loanAmount: 10000,
      annualInterestRate: 0,
      termMonths: 0,
      monthlyIncome: 10000,
      monthlyExpenses: 0,
      existingDebt: 0,
    })

    expect(Number.isFinite(estimate.monthlyRepayment)).toBe(true)
    expect(estimate.monthlyRepayment).toBe(10000)
  })

  it('keeps the relationships between the returned figures consistent', () => {
    const estimate = calculateLoanEstimate({
      loanAmount: 80000,
      annualInterestRate: 15,
      termMonths: 36,
      monthlyIncome: 30000,
      monthlyExpenses: 12000,
      existingDebt: 2000,
    })

    expect(estimate.totalRepayment).toBeCloseTo(estimate.monthlyRepayment * 36, 6)
    expect(estimate.totalBorrowingCost).toBeCloseTo(estimate.totalRepayment - 80000, 6)
    expect(estimate.remainingIncome).toBeCloseTo(
      30000 - 12000 - 2000 - estimate.monthlyRepayment,
      6,
    )
  })
})
