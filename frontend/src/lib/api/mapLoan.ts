import type { LoanTypeId } from '@/lib/loans';
import { LOAN_MAP } from '@/lib/loans';
import type { SimState } from '@/lib/state';
import type { ApiLoanType, EligibilityRequest, LoanProduct, LoanPurpose, RateRequest, ValidationRules } from './contracts';

export interface ProductMapping {
  productId: ApiLoanType;
  purpose: LoanPurpose;
}

/** Existing simulator loans mapped onto the two mock products. Home has no product. */
export const PRODUCT_BY_LOAN: Record<LoanTypeId, ProductMapping | null> = {
  personal: { productId: 'personal_loan', purpose: 'other' },
  multiIncome: { productId: 'personal_loan', purpose: 'other' },
  homeImprovement: { productId: 'personal_loan', purpose: 'home_improvement' },
  education: { productId: 'personal_loan', purpose: 'education' },
  medical: { productId: 'personal_loan', purpose: 'medical' },
  vehicle: { productId: 'vehicle_loan', purpose: 'used_vehicle' },
  home: null,
};

export const hasApiProduct = (id: LoanTypeId | null): boolean => id != null && PRODUCT_BY_LOAN[id] != null;

export interface LoanLimits {
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
}

export function boundsForLoan(loanType: LoanTypeId, rules: ValidationRules, products: LoanProduct[]): LoanLimits {
  const local = LOAN_MAP[loanType];
  const mapped = PRODUCT_BY_LOAN[loanType];
  if (!mapped) return { minAmount: local.minAmount, maxAmount: local.maxAmount, minTerm: local.minTerm, maxTerm: local.maxTerm };
  if (mapped.productId === 'personal_loan') {
    const amount = rules.loanDetails.requestedAmount;
    const term = rules.loanDetails.loanTerm;
    return {
      minAmount: amount.min ?? local.minAmount,
      maxAmount: amount.max ?? local.maxAmount,
      minTerm: term.min ?? local.minTerm,
      maxTerm: term.max ?? local.maxTerm,
    };
  }
  const product = products.find((item) => item.id === mapped.productId);
  if (!product) return { minAmount: local.minAmount, maxAmount: local.maxAmount, minTerm: local.minTerm, maxTerm: local.maxTerm };
  return { minAmount: product.minAmount, maxAmount: product.maxAmount, minTerm: product.minTerm, maxTerm: product.maxTerm };
}

export function purposesFor(loanType: LoanTypeId, products: LoanProduct[]): LoanPurpose[] {
  const mapped = PRODUCT_BY_LOAN[loanType];
  if (!mapped) return [];
  return products.find((item) => item.id === mapped.productId)?.purposes ?? [];
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
  if (!mapped) return null;
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
  if (!mapped) return null;
  return {
    loanAmount: state.loan.amount,
    loanTerm: state.loan.months,
    creditScore: state.elig.creditScore ?? 650,
    loanType: mapped.productId,
  };
}
