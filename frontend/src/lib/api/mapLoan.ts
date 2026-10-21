import type { LoanTypeId } from '@/lib/loans';
import type { SimState } from '@/lib/state';
import type { ApiLoanType, EligibilityRequest, LoanProduct, LoanPurpose, RateRequest } from './contracts';

export interface ProductMapping {
  productId: ApiLoanType;
  purpose: LoanPurpose;
}

/**
 * Each journey uses one lending product.
 * Education, medical, home improvement and multiple-income are purposes of personal_loan,
 * as published. Home is its own product so that path gets a rate and a decision too.
 */
export const PRODUCT_BY_LOAN: Record<LoanTypeId, ProductMapping> = {
  personal: { productId: 'personal_loan', purpose: 'other' },
  multiIncome: { productId: 'personal_loan', purpose: 'other' },
  homeImprovement: { productId: 'personal_loan', purpose: 'home_improvement' },
  education: { productId: 'personal_loan', purpose: 'education' },
  medical: { productId: 'personal_loan', purpose: 'medical' },
  vehicle: { productId: 'vehicle_loan', purpose: 'used_vehicle' },
  home: { productId: 'home_loan', purpose: 'home_purchase' },
};

export const hasApiProduct = (id: LoanTypeId | null): boolean => id != null;

export interface LoanLimits {
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
}

export function productForLoan(loanType: LoanTypeId, products: LoanProduct[]): LoanProduct | null {
  return products.find((item) => item.id === PRODUCT_BY_LOAN[loanType].productId) ?? null;
}

/** Amount and term limits from the lending product. Validation-rules messages still apply to personal loans. */
export function boundsForLoan(loanType: LoanTypeId, products: LoanProduct[]): LoanLimits | null {
  const product = productForLoan(loanType, products);
  if (!product) return null;
  return { minAmount: product.minAmount, maxAmount: product.maxAmount, minTerm: product.minTerm, maxTerm: product.maxTerm };
}

export function purposesFor(loanType: LoanTypeId, products: LoanProduct[]): LoanPurpose[] {
  return products.find((item) => item.id === PRODUCT_BY_LOAN[loanType].productId)?.purposes ?? [];
}

export function rateRequestKey(body: RateRequest): string {
  return `${body.loanType}:${body.loanAmount}:${body.loanTerm}:${body.creditScore ?? ''}`;
}

function monthlyExpensesOf(expenses: SimState['expenses']): number | null {
  const parts = [expenses.housing, expenses.transport, expenses.living, expenses.other];
  if (parts.some((value) => value == null) || expenses.existingDebt == null) return null;
  return (expenses.housing ?? 0) + (expenses.transport ?? 0) + (expenses.living ?? 0) + (expenses.other ?? 0);
}

/** Builds the eligibility body. Credit score is omitted when the applicant left it blank. */
export function mapEligibilityRequest(state: SimState): EligibilityRequest | null {
  if (!state.loanType) return null;
  const mapped = PRODUCT_BY_LOAN[state.loanType];
  const { age, employmentStatus, employmentDuration, creditScore, loanPurpose } = state.elig;
  const monthlyExpenses = monthlyExpensesOf(state.expenses);
  const { netIncome } = state.income;
  const { amount, months } = state.loan;
  if (age == null || !employmentStatus || employmentDuration == null || netIncome == null || monthlyExpenses == null || amount == null || months == null) return null;
  const purpose = loanPurpose ?? mapped.purpose;
  const financialInfo: EligibilityRequest['financialInfo'] = {
    monthlyIncome: netIncome,
    monthlyExpenses,
    existingDebt: state.expenses.existingDebt ?? 0,
  };
  if (creditScore != null) financialInfo.creditScore = creditScore;
  return {
    personalInfo: { age, employmentStatus, employmentDuration },
    financialInfo,
    loanDetails: { requestedAmount: amount, loanTerm: months, loanPurpose: purpose },
  };
}

/** Rate calls use 650 when the applicant did not enter a credit score. */
export function mapRateRequest(state: SimState): RateRequest | null {
  if (!state.loanType || state.loan.amount == null || state.loan.months == null) return null;
  const mapped = PRODUCT_BY_LOAN[state.loanType];
  return {
    loanAmount: state.loan.amount,
    loanTerm: state.loan.months,
    creditScore: state.elig.creditScore ?? 650,
    loanType: mapped.productId,
  };
}
