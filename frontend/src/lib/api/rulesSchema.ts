import { z } from 'zod';
import type { NumberRule, OptionsRule, ValidationRules } from './contracts';

/** Age limits published by GET /api/loans/validation-rules. Every product uses this band. */
export function ageBand(rules: ValidationRules): { min: number; max: number } {
  return {
    min: rules.personalInfo.age.min ?? 18,
    max: rules.personalInfo.age.max ?? 65,
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
