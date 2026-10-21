import { basicsSchema, expensesSchema, incomeSchema, loanDetailsSchema, translateIssue, validate } from './schemas';
import { LOAN_MAP, docsFor } from './loans';
import { LOAN_PRODUCTS, VALIDATION_RULES } from '@/mocks/loansApi';

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
  const personal = LOAN_PRODUCTS.find((product) => product.id === 'personal_loan');
  if (!personal) throw new Error('missing personal loan');
  const schema = loanDetailsSchema(personal);
  it('enforces the personal product bounds', () => {
    expect(validate(schema, { amount: 500, months: 36 })).toHaveProperty('amount');
    expect(validate(schema, { amount: 20000, months: 84 })).toHaveProperty('months');
    expect(validate(schema, { amount: 20000, months: 36 })).toEqual({});
  });
});

describe('basics', () => {
  const employment = { employmentStatus: 'employed' as const, employmentDuration: 12, creditScore: null, loanPurpose: null };
  const c = LOAN_MAP.home;
  const schema = basicsSchema(c, { askSalary: false, askMarital: true }, VALIDATION_RULES, []);
  it('uses the lending age band of 18 to 65 for a home loan', () => {
    const ok = { age: 40, confirmed: c.requirements, salaryIntoCapitec: null, married: false, ...employment };
    expect(validate(schema, ok)).toEqual({});
    expect(validate(schema, { ...ok, age: 65 })).toEqual({});
    expect(validate(schema, { ...ok, age: 66 })).toHaveProperty('age', 'Age must be between 18 and 65');
    expect(validate(schema, { ...ok, age: 17 })).toHaveProperty('age');
  });
  it('uses the same age band for other loans', () => {
    const personal = LOAN_MAP.personal;
    const personalSchema = basicsSchema(personal, { askSalary: true, askMarital: false }, VALIDATION_RULES, ['other']);
    const ok = { age: 65, confirmed: personal.requirements, salaryIntoCapitec: true, married: null, ...employment, loanPurpose: 'other' };
    expect(validate(personalSchema, ok)).toEqual({});
    expect(validate(personalSchema, { ...ok, age: 66 })).toHaveProperty('age');
    expect(validate(personalSchema, { ...ok, creditScore: 299 })).toHaveProperty('creditScore');
  });
  it('requires every requirement to be confirmed and the marital answer', () => {
    expect(validate(schema, { age: 40, confirmed: [], salaryIntoCapitec: null, married: false, ...employment })).toHaveProperty('confirmed');
    expect(validate(schema, { age: 40, confirmed: c.requirements, salaryIntoCapitec: null, married: null, ...employment })).toHaveProperty('married');
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
