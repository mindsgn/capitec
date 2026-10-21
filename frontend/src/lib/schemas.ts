import { z } from 'zod';
import type { ValidationRules } from './api/contracts';
import { ageBand, enumRule, numberRule, optionalNumberRule } from './api/rulesSchema';
import { formatZAR } from './utils';
import type { LoanConfig } from './loans';

/**
 * Validation messages are i18n keys, optionally with arguments: "key|arg0|arg1".
 * Use translateIssue() from the UI to turn them into text.
 */
const required = 'v.required';
const money = (min: number, max: number) =>
  z.number({ required_error: required, invalid_type_error: required })
    .min(min, `v.range|${formatZAR(min)}|${formatZAR(max)}`)
    .max(max, `v.range|${formatZAR(min)}|${formatZAR(max)}`);

const boundedMoney = (min: number, max: number, message?: string) => {
  const schema = z.number({ required_error: required, invalid_type_error: required });
  return message ? schema.min(min, message).max(max, message) : schema.min(min, `v.range|${formatZAR(min)}|${formatZAR(max)}`).max(max, `v.range|${formatZAR(min)}|${formatZAR(max)}`);
};

export const incomeSchema = z
  .object({ grossIncome: money(1000, 10_000_000), netIncome: money(1, 10_000_000) })
  .refine((d) => d.netIncome <= d.grossIncome, { message: 'v.netAboveGross', path: ['netIncome'] });

/** Net (and gross) minimum comes from the validation-rules monthly income rule. */
export const incomeSchemaFor = (minIncome: number, message?: string) => z
  .object({
    grossIncome: boundedMoney(Math.max(1000, minIncome), 10_000_000, message),
    netIncome: boundedMoney(minIncome, 10_000_000, message),
  })
  .refine((d) => d.netIncome <= d.grossIncome, { message: 'v.netAboveGross', path: ['netIncome'] });

export const expensesSchema = z.object({
  housing: money(0, 10_000_000),
  transport: money(0, 10_000_000),
  living: money(0, 10_000_000),
  other: money(0, 10_000_000),
  existingDebt: money(0, 10_000_000),
});

export interface LoanLimitInput { minAmount: number; maxAmount: number; minTerm: number; maxTerm: number }

export const loanDetailsSchema = (c: LoanLimitInput, messages?: { amount?: string; term?: string }) =>
  z.object({
    amount: messages?.amount
      ? z.number({ required_error: required, invalid_type_error: required }).min(c.minAmount, messages.amount).max(c.maxAmount, messages.amount)
      : money(c.minAmount, c.maxAmount),
    months: z.number({ required_error: required, invalid_type_error: required }).int()
      .min(c.minTerm, messages?.term ?? `v.months|${c.minTerm}|${c.maxTerm}`)
      .max(c.maxTerm, messages?.term ?? `v.months|${c.minTerm}|${c.maxTerm}`),
  });

const choice = z.boolean({ required_error: 'v.choose', invalid_type_error: 'v.choose' });

const purposeRule = (purposes: readonly string[]) => {
  if (purposes.length === 0) return z.any();
  const [first, ...rest] = purposes;
  return z.enum([first, ...rest], { errorMap: () => ({ message: 'v.purpose' }) });
};

export const basicsSchema = (c: LoanConfig, opts: { askSalary: boolean; askMarital: boolean }, rules: ValidationRules, purposes: readonly string[] = []) => {
  const band = ageBand(rules);
  const ageMessage = rules.personalInfo.age.errorMessage;
  return z.object({
    age: z.number({ required_error: required, invalid_type_error: required })
      .int(required)
      .min(band.min, ageMessage)
      .max(band.max, ageMessage),
    employmentStatus: enumRule(rules.personalInfo.employmentStatus),
    employmentDuration: numberRule(rules.personalInfo.employmentDuration).int(rules.personalInfo.employmentDuration.errorMessage),
    creditScore: optionalNumberRule(rules.financialInfo.creditScore),
    loanPurpose: purposeRule(purposes),
    salaryIntoCapitec: opts.askSalary ? choice : z.any(),
    married: opts.askMarital ? choice : z.any(),
    confirmed: z.array(z.string()).refine((v) => c.requirements.every((r) => v.includes(r)), 'v.confirmAll'),
  });
};

/** Returns the first error message per field. Empty object means valid. */
export function validate(schema: z.ZodTypeAny, data: unknown): Record<string, string> {
  const res = schema.safeParse(data);
  if (res.success) return {};
  const out: Record<string, string> = {};
  for (const issue of res.error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function translateIssue(t: (...a: any[]) => any, message: string): string {
  const [key, ...args] = message.split('|');
  return String(t(key, { a0: args[0] ?? '', a1: args[1] ?? '' }));
}
