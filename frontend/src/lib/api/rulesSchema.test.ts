import { rulesFieldSchema } from '@/lib/api/rulesSchema';
import { validate } from '@/lib/schemas';
import { VALIDATION_RULES } from '@/mocks/loansApi';

const schema = rulesFieldSchema(VALIDATION_RULES);

const example = {
  age: 35,
  employmentStatus: 'employed',
  employmentDuration: 24,
  monthlyIncome: 25000,
  monthlyExpenses: 15000,
  creditScore: 650,
  requestedAmount: 150000,
  loanTerm: 24,
};

describe('rulesFieldSchema', () => {
  it('accepts the specification example and a blank credit score', () => {
    expect(validate(schema, example)).toEqual({});
    const { creditScore: _score, ...blankScore } = example;
    expect(validate(schema, blankScore)).toEqual({});
    expect(validate(schema, { ...example, creditScore: null })).toEqual({});
  });

  it('rejects values outside the published rules', () => {
    expect(validate(schema, { ...example, age: 17 })).toHaveProperty('age', 'Age must be between 18 and 65');
    expect(validate(schema, { ...example, age: 66 })).toHaveProperty('age', 'Age must be between 18 and 65');
    expect(validate(schema, { ...example, employmentDuration: 2 })).toHaveProperty('employmentDuration', 'Minimum 3 months employment required');
    expect(validate(schema, { ...example, monthlyIncome: 4999 })).toHaveProperty('monthlyIncome', 'Minimum monthly income of R5,000 required');
    expect(validate(schema, { ...example, creditScore: 299 })).toHaveProperty('creditScore', 'Credit score must be between 300 and 850');
    const { employmentStatus: _status, ...missingStatus } = example;
    expect(validate(schema, missingStatus)).toHaveProperty('employmentStatus', 'Please select your employment status');
  });
});
