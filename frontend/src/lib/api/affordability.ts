import type { AffordabilityScore } from './contracts';

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

export type BudgetVerdict = 'affordable' | 'stretch' | 'unaffordable';

/** Disposable income used by the eligibility affordability analysis. Existing debt is not subtracted here. */
export function disposableIncome(monthlyIncome: number, monthlyExpenses: number): number {
  return round2(monthlyIncome - monthlyExpenses);
}

/** Existing debt as a percentage of monthly income, matching affordabilityAnalysis.debtToIncomeRatio. */
export function debtToIncomeRatio(existingDebt: number, monthlyIncome: number): number {
  return monthlyIncome > 0 ? round1((existingDebt / monthlyIncome) * 100) : 0;
}

/** The published loan-to-income figure: requested amount / monthly income, times ten. */
export function loanToIncomeRatio(requestedAmount: number, monthlyIncome: number): number {
  return monthlyIncome > 0 ? round1((requestedAmount / monthlyIncome) * 10) : 0;
}

/** Same bands the eligibility response uses for affordabilityScore. */
export function affordabilityScoreOf(disposable: number, monthlyIncome: number, debtToIncome: number): AffordabilityScore {
  const incomeRatio = monthlyIncome > 0 ? disposable / monthlyIncome : 0;
  if (disposable > 0 && incomeRatio >= 0.3 && debtToIncome <= 35) return 'good';
  if (disposable > 0 && incomeRatio >= 0.15 && debtToIncome <= 50) return 'fair';
  return 'poor';
}

/**
 * Largest amount the eligibility check will consider.
 * Seventy-five percent of disposable income over the term, capped by the product.
 */
export function maxQualifyingAmount(disposable: number, term: number, product: { minAmount: number; maxAmount: number }): number {
  if (disposable <= 0) return 0;
  const raw = round2(disposable * term * 0.75);
  const capped = Math.min(product.maxAmount, raw);
  if (capped <= 0) return 0;
  return Math.max(product.minAmount, capped);
}

/**
 * Affordability phase verdict from the lending rule.
 * A loan that the eligibility check would reject on the numbers is unaffordable.
 * A loan that fits but is only fair or poor is a stretch. Employment is checked later.
 */
export function budgetVerdict(input: {
  disposable: number;
  monthlyPayment: number;
  requestedAmount: number;
  maxAmount: number;
  score: AffordabilityScore;
}): BudgetVerdict {
  const fits = input.disposable > 0 && input.monthlyPayment <= input.disposable && input.requestedAmount <= input.maxAmount;
  if (!fits) return 'unaffordable';
  return input.score === 'good' ? 'affordable' : 'stretch';
}
