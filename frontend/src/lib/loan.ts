/**
 * Pure loan calculations for the illustrative simulator.
 *
 * Kept free of React so it can be reused and unit-tested in isolation. These
 * are standard amortising-loan formulas used for estimation only — they are not
 * a credit decision or an offer of finance.
 */

export interface LoanEstimateInput {
  /** Amount borrowed, in rand. */
  loanAmount: number
  /** Nominal annual interest rate, as a percentage (e.g. 12.5). */
  annualInterestRate: number
  /** Repayment term in months. */
  termMonths: number
  /** Gross monthly income, in rand. */
  monthlyIncome: number
  /** Monthly living expenses, in rand. */
  monthlyExpenses: number
  /** Existing monthly debt repayments, in rand. */
  existingDebt: number
}

export interface LoanEstimate {
  /** Estimated monthly instalment. */
  monthlyRepayment: number
  /** Every instalment added together over the full term. */
  totalRepayment: number
  /** Total repayment minus the amount borrowed (interest and fees). */
  totalBorrowingCost: number
  /** Estimated income left after expenses, existing debt and the instalment. */
  remainingIncome: number
}

/**
 * Calculates an illustrative amortising-loan estimate.
 *
 * `monthlyRepayment = P * i / (1 - (1 + i)^-n)` where `i` is the monthly
 * interest rate (`annualInterestRate / 100 / 12`) and `n` is the term in
 * months. A zero interest rate falls back to a straight division.
 */
export function calculateLoanEstimate(input: LoanEstimateInput): LoanEstimate {
  const { loanAmount, annualInterestRate, termMonths, monthlyIncome, monthlyExpenses, existingDebt } =
    input

  const monthlyRate = annualInterestRate / 100 / 12
  const safeTerm = Math.max(termMonths, 1)

  const monthlyRepayment =
    monthlyRate === 0
      ? loanAmount / safeTerm
      : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -safeTerm))

  const totalRepayment = monthlyRepayment * safeTerm
  const totalBorrowingCost = totalRepayment - loanAmount
  const remainingIncome = monthlyIncome - monthlyExpenses - existingDebt - monthlyRepayment

  return {
    monthlyRepayment,
    totalRepayment,
    totalBorrowingCost,
    remainingIncome,
  }
}
