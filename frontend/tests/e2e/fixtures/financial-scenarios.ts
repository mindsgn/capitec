/**
 * Deterministic borrower fixtures and an independent re-implementation of the
 * loan maths used for every expected value in this suite.
 *
 * Nothing here imports application source. Rules are derived from the
 * documented behaviour — `src/lib/loan.ts` (amortisation formula),
 * `LOAN_SIMULATOR_LIMITS` and `ILLUSTRATIVE_INTEREST_RATE` in the application,
 * and `docs/LoanEligibilitySimulatorEndpoints.md` (interest rate 12.5 %) — so a
 * regression in the application cannot make its own test pass. See
 * `docs/e2e-test-plan.md` for the audit these values came from.
 */

/** Limits and rate read from the implementation (never invented). */
export const RULES = {
  /** Fixed illustrative rate: `ILLUSTRATIVE_INTEREST_RATE`, also the API spec rate. */
  annualInterestRatePercent: 12.5,
  loanAmount: { min: 5_000, max: 300_000 },
  termMonths: { min: 6, max: 60 },
  /** The only terms the repayment-term select offers. */
  selectableTerms: [6, 12, 24, 36, 48, 60],
  monthlyIncome: { min: 5_000 },
  currencyLocale: 'en-ZA',
  currencyCode: 'ZAR',
} as const

export interface BorrowerScenario {
  readonly name: string
  readonly monthlyIncome: number
  readonly monthlyExpenses: number
  readonly existingDebt: number
}

/**
 * Synthetic borrowers: the examples supplied by the E2E specification plus the
 * ordinary case used for the happy path. They are illustrative inputs for a
 * demonstration calculator, not population statistics or eligibility criteria.
 */
export const BORROWERS = {
  ordinary: {
    name: 'Ordinary income',
    monthlyIncome: 18_000,
    monthlyExpenses: 10_000,
    existingDebt: 1_500,
  },
  limitedDisposable: {
    name: 'Limited disposable income',
    monthlyIncome: 6_000,
    monthlyExpenses: 4_500,
    existingDebt: 500,
  },
  higherIncome: {
    name: 'Higher income',
    monthlyIncome: 45_000,
    monthlyExpenses: 20_000,
    existingDebt: 4_000,
  },
  highlyIndebted: {
    name: 'Highly indebted',
    monthlyIncome: 15_000,
    monthlyExpenses: 9_000,
    existingDebt: 5_500,
  },
  noIncome: {
    name: 'No income',
    monthlyIncome: 0,
    monthlyExpenses: 0,
    existingDebt: 0,
  },
  expensesExceedIncome: {
    name: 'Expenses exceed income',
    monthlyIncome: 12_000,
    monthlyExpenses: 14_000,
    existingDebt: 0,
  },
} satisfies Record<string, BorrowerScenario>

export interface LoanRequest {
  readonly loanAmount: number
  readonly termMonths: number
}

export interface EstimateExpectation {
  readonly monthlyRepayment: number
  readonly totalRepayment: number
  readonly totalBorrowingCost: number
  /** income − expenses − existing debt − instalment (the application's definition). */
  readonly remainingIncome: number
}

/**
 * Monthly instalment of an amortising loan:
 * `P·i / (1 − (1 + i)^−n)` where `i = annualRate / 100 / 12`.
 *
 * A zero rate falls back to `P / n` (documented in `src/lib/loan.ts`); with the
 * fixed 12.5 % rate that branch is unreachable from the interface.
 */
export function repaymentFor(
  request: LoanRequest,
  annualInterestRatePercent: number = RULES.annualInterestRatePercent,
): number {
  const months = Math.max(request.termMonths, 1)
  const monthlyRate = annualInterestRatePercent / 100 / 12
  if (monthlyRate === 0) {
    return request.loanAmount / months
  }
  return (request.loanAmount * monthlyRate) / (1 - (1 + monthlyRate) ** -months)
}

/** Full expectation for a loan request and borrower, mirroring `calculateLoanEstimate`. */
export function estimateFor(request: LoanRequest, borrower: BorrowerScenario): EstimateExpectation {
  const monthlyRepayment = repaymentFor(request)
  const totalRepayment = monthlyRepayment * request.termMonths
  return {
    monthlyRepayment,
    totalRepayment,
    totalBorrowingCost: totalRepayment - request.loanAmount,
    remainingIncome:
      borrower.monthlyIncome - borrower.monthlyExpenses - borrower.existingDebt - monthlyRepayment,
  }
}

/**
 * Formats a figure the way the application does:
 * `Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })`.
 */
export function formatRand(value: number, cents = true): string {
  return new Intl.NumberFormat(RULES.currencyLocale, {
    style: 'currency',
    currency: RULES.currencyCode,
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value)
}

/** Normalises the NBSP/NNBSP grouping spaces `Intl` emits, for readable regexes. */
export function plain(text: string): string {
  return text.replace(/[\u00a0\u202f]/g, ' ')
}

/**
 * Shape of a displayed rand amount, e.g. `R 4 730,73`, `R 112,49` or
 * `-R 9 096,10`. `Intl` groups with a non-breaking space, and Playwright's
 * regex matching compares against the raw text, so `\s` is used for the
 * separators.
 */
export const MONEY_SHAPE = /^-?R\s\d{1,3}(\s\d{3})*,\d{2}$/
