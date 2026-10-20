import { basicsSchema, expensesSchema, incomeSchema, loanDetailsSchema, translateIssue, validate } from './schemas';
import { LOAN_MAP, docsFor } from './loans';

describe('income', () => {
  it('requires values', () => {
    expect(validate(incomeSchema, { grossIncome: null, netIncome: null })).toHaveProperty('grossIncome', 'v.required');
  });
  it('rejects net above gross', () => {
    expect(validate(incomeSchema, { grossIncome: 20000, netIncome: 25000 })).toHaveProperty('netIncome', 'v.netAboveGross');
  });
  it('accepts valid income', () => {
    expect(validate(incomeSchema, { grossIncome: 30000, netIncome: 24000 })).toEqual({});
  });
});

describe('expenses', () => {
  it('allows zero but not negatives or blanks', () => {
    expect(validate(expensesSchema, { housing: 0, transport: 0, living: 0, other: 0, existingDebt: 0 })).toEqual({});
    expect(Object.keys(validate(expensesSchema, { housing: -1, transport: null, living: 0, other: 0, existingDebt: 0 }))).toEqual(['housing', 'transport']);
  });
});

describe('loan details', () => {
  const schema = loanDetailsSchema(LOAN_MAP.personal);
  it('enforces amount and term bounds', () => {
    expect(validate(schema, { amount: 500, months: 36 })).toHaveProperty('amount');
    expect(validate(schema, { amount: 20000, months: 200 })).toHaveProperty('months');
    expect(validate(schema, { amount: 20000, months: 36 })).toEqual({});
  });
});

describe('basics', () => {
  const c = LOAN_MAP.home;
  const schema = basicsSchema(c, { askSalary: false, askMarital: true });
  it('applies the home loan age band of 18 to 60', () => {
    const ok = { age: 40, confirmed: c.requirements, salaryIntoCapitec: null, married: false };
    expect(validate(schema, ok)).toEqual({});
    expect(validate(schema, { ...ok, age: 61 })).toHaveProperty('age');
    expect(validate(schema, { ...ok, age: 17 })).toHaveProperty('age');
  });
  it('requires every requirement to be confirmed and the marital answer', () => {
    expect(validate(schema, { age: 40, confirmed: [], salaryIntoCapitec: null, married: false })).toHaveProperty('confirmed');
    expect(validate(schema, { age: 40, confirmed: c.requirements, salaryIntoCapitec: null, married: null })).toHaveProperty('married');
  });
});

describe('conditional documents', () => {
  it('adds a bank statement only when salary is not paid into Capitec', () => {
    const ctx = { salaryIntoCapitec: true, married: null, amount: 10000 };
    expect(docsFor(LOAN_MAP.personal, ctx).map((d) => d.id)).toEqual(['saId', 'salarySlip']);
    expect(docsFor(LOAN_MAP.personal, { ...ctx, salaryIntoCapitec: false }).map((d) => d.id)).toContain('bankStatement3');
  });
  it('adds home loan extras by marital status and amount', () => {
    const ids = (m: boolean, a: number) => docsFor(LOAN_MAP.home, { salaryIntoCapitec: null, married: m, amount: a }).map((d) => d.id);
    expect(ids(false, 1_000_000)).not.toContain('marriageCert');
    expect(ids(true, 3_000_000)).toEqual(expect.arrayContaining(['marriageCert', 'assetsLiabilities']));
  });
});

describe('translateIssue', () => {
  it('splits key and arguments', () => {
    const t = jest.fn((k: string, o?: Record<string, string>) => `${k}:${o?.a0}:${o?.a1}`);
    expect(translateIssue(t, 'v.age|18|60')).toBe('v.age:18:60');
    expect(translateIssue(t, 'v.required')).toBe('v.required::');
  });
});
