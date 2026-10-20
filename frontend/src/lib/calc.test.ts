import { assess, initiationFee, maxAffordableAmount, pmt, principalFromPmt, simulateLoan } from './calc';

describe('pmt', () => {
  it('matches a known annuity value', () => {
    expect(pmt(100000, 12, 12)).toBeCloseTo(8884.88, 2);
  });
  it('handles zero interest and zero months', () => {
    expect(pmt(1200, 0, 12)).toBe(100);
    expect(pmt(1200, 10, 0)).toBe(0);
  });
  it('principalFromPmt inverts pmt', () => {
    expect(principalFromPmt(pmt(50000, 18, 36), 18, 36)).toBeCloseTo(50000, 2);
  });
});

describe('initiationFee', () => {
  it('grows with amount and is capped', () => {
    expect(initiationFee(10000)).toBeGreaterThan(initiationFee(2000));
    expect(initiationFee(5_000_000)).toBeCloseTo(6037.5 * 1.15, 2);
  });
});

describe('simulateLoan', () => {
  const q = simulateLoan({ amount: 20000, months: 36, ratePct: 24 });
  it('totals are internally consistent', () => {
    expect(q.totalRepayable).toBeCloseTo(q.instalment * 36, 1);
    expect(q.totalRepayable).toBeGreaterThan(20000);
    expect(q.instalment).toBeCloseTo(q.baseInstalment + q.serviceFee, 2);
  });
  it('longer terms lower the instalment but raise total cost', () => {
    const long = simulateLoan({ amount: 20000, months: 60, ratePct: 24 });
    expect(long.instalment).toBeLessThan(q.instalment);
    expect(long.totalRepayable).toBeGreaterThan(q.totalRepayable);
  });
});

describe('assess', () => {
  const base = { grossIncome: 30000, netIncome: 24000, expenses: 12000, existingDebt: 2000 };
  it('affordable when instalment is within 70% of disposable', () => {
    expect(assess({ ...base, instalment: 4000 }).verdict).toBe('affordable');
  });
  it('stretch between 70% and 100%', () => {
    expect(assess({ ...base, instalment: 8000 }).verdict).toBe('stretch');
  });
  it('unaffordable above disposable income or with none left', () => {
    expect(assess({ ...base, instalment: 11000 }).verdict).toBe('unaffordable');
    expect(assess({ ...base, expenses: 23000, instalment: 100 }).verdict).toBe('unaffordable');
  });
  it('computes debt-to-income', () => {
    expect(assess({ ...base, instalment: 4000 }).dti).toBeCloseTo(0.2, 5);
  });
});

describe('maxAffordableAmount', () => {
  const args = { months: 36, ratePct: 24, minAmount: 1000, maxAmount: 500000 };
  it('returns 0 when nothing is affordable', () => {
    expect(maxAffordableAmount({ ...args, disposable: 50 })).toBe(0);
  });
  it('stays within the affordable instalment', () => {
    const amount = maxAffordableAmount({ ...args, disposable: 10000 });
    expect(amount).toBeGreaterThan(0);
    expect(simulateLoan({ amount, months: 36, ratePct: 24 }).instalment).toBeLessThanOrEqual(7000 + 1);
  });
  it('respects the maximum', () => {
    expect(maxAffordableAmount({ ...args, disposable: 1_000_000 })).toBe(500000);
  });
});
