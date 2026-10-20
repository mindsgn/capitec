import { z } from 'zod';
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

export const incomeSchema = z
  .object({ grossIncome: money(1000, 10_000_000), netIncome: money(1, 10_000_000) })
  .refine((d) => d.netIncome <= d.grossIncome, { message: 'v.netAboveGross', path: ['netIncome'] });

export const expensesSchema = z.object({
  housing: money(0, 10_000_000),
  transport: money(0, 10_000_000),
  living: money(0, 10_000_000),
  other: money(0, 10_000_000),
  existingDebt: money(0, 10_000_000),
});

export const loanDetailsSchema = (c: LoanConfig) =>
  z.object({
    amount: money(c.minAmount, c.maxAmount),
    months: z.number({ required_error: required, invalid_type_error: required }).int()
      .min(c.minTerm, `v.months|${c.minTerm}|${c.maxTerm}`).max(c.maxTerm, `v.months|${c.minTerm}|${c.maxTerm}`),
  });

const choice = z.boolean({ required_error: 'v.choose', invalid_type_error: 'v.choose' });

export const basicsSchema = (c: LoanConfig, opts: { askSalary: boolean; askMarital: boolean }) =>
  z.object({
    age: z.number({ required_error: required, invalid_type_error: required })
      .int('v.required')
      .min(c.minAge, `v.age|${c.minAge}|${c.maxAge}`)
      .max(c.maxAge, `v.age|${c.minAge}|${c.maxAge}`),
    salaryIntoCapitec: opts.askSalary ? choice : z.any(),
    married: opts.askMarital ? choice : z.any(),
    confirmed: z.array(z.string()).refine((v) => c.requirements.every((r) => v.includes(r)), 'v.confirmAll'),
  });

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
