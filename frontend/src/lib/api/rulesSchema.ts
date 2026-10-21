import { z } from 'zod';
import type { LoanConfig } from '@/lib/loans';
import type { NumberRule, OptionsRule, ValidationRules } from './contracts';

/** The stricter of the loan's own age band and the validation-rules band. */
export function ageBand(loan: LoanConfig, rules: ValidationRules): { min: number; max: number } {
  return {
    min: Math.max(loan.minAge, rules.personalInfo.age.min ?? loan.minAge),
    max: Math.min(loan.maxAge, rules.personalInfo.age.max ?? loan.maxAge),
  };
}

export function numberRule(rule: NumberRule) {
  let schema = z.number({ required_error: rule.errorMessage, invalid_type_error: rule.errorMessage });
  if (rule.min != null) schema = schema.min(rule.min, rule.errorMessage);
  if (rule.max != null) schema = schema.max(rule.max, rule.errorMessage);
  return schema;
}

export function optionalNumberRule(rule: NumberRule) {
  return numberRule(rule).nullish();
}

export function enumRule(rule: OptionsRule) {
  const [first, ...rest] = rule.options;
  return z.enum([first, ...rest], { errorMap: () => ({ message: rule.errorMessage }) });
}

/** Flat schema whose messages and bounds come from GET /api/loans/validation-rules. */
export function rulesFieldSchema(rules: ValidationRules) {
  return z.object({
    age: numberRule(rules.personalInfo.age),
    employmentStatus: enumRule(rules.personalInfo.employmentStatus),
    employmentDuration: numberRule(rules.personalInfo.employmentDuration),
    monthlyIncome: numberRule(rules.financialInfo.monthlyIncome),
    monthlyExpenses: numberRule(rules.financialInfo.monthlyExpenses),
    creditScore: optionalNumberRule(rules.financialInfo.creditScore),
    requestedAmount: numberRule(rules.loanDetails.requestedAmount),
    loanTerm: numberRule(rules.loanDetails.loanTerm),
  });
}
