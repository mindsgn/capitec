import { z } from 'zod';
import { LOAN_TYPES } from './loans';

const n = z.number().nullable();
export const docMetaSchema = z.object({ name: z.string(), size: z.number(), type: z.string(), uploadedAt: z.string() });
export type DocMeta = z.infer<typeof docMetaSchema>;

export const stateSchema = z.object({
  version: z.literal(1),
  phase: z.enum(['affordability', 'eligibility', 'submitted']),
  step: z.number().int().min(0),
  loanType: z.enum(LOAN_TYPES).nullable(),
  income: z.object({ grossIncome: n, netIncome: n }),
  expenses: z.object({ housing: n, transport: n, living: n, other: n, existingDebt: n }),
  loan: z.object({ amount: n, months: n }),
  elig: z.object({
    age: n,
    confirmed: z.array(z.string()),
    salaryIntoCapitec: z.boolean().nullable(),
    married: z.boolean().nullable(),
    docs: z.record(docMetaSchema),
  }),
  submission: z.object({ reference: z.string(), at: z.string() }).nullable(),
});

export type SimState = z.infer<typeof stateSchema>;

export const initialState: SimState = {
  version: 1,
  phase: 'affordability',
  step: 0,
  loanType: null,
  income: { grossIncome: null, netIncome: null },
  expenses: { housing: null, transport: null, living: null, other: null, existingDebt: null },
  loan: { amount: null, months: null },
  elig: { age: null, confirmed: [], salaryIntoCapitec: null, married: null, docs: {} },
  submission: null,
};

export const AFFORDABILITY_STEPS = ['loanType', 'income', 'expenses', 'loanDetails', 'results'] as const;
