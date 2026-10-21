import { affordabilityScoreOf, budgetVerdict, debtToIncomeRatio, disposableIncome, loanToIncomeRatio, maxQualifyingAmount } from './affordability';

describe('lending affordability rule', () => {
  it('matches the specification example', () => {
    expect(disposableIncome(25000, 15000)).toBe(10000);
    expect(debtToIncomeRatio(5000, 25000)).toBe(20);
    expect(loanToIncomeRatio(150000, 25000)).toBe(60);
    expect(affordabilityScoreOf(10000, 25000, 20)).toBe('good');
    expect(maxQualifyingAmount(10000, 24, { minAmount: 5000, maxAmount: 300000 })).toBe(180000);
  });

  it('treats a payment the eligibility check would reject as unaffordable', () => {
    expect(budgetVerdict({
      disposable: 500,
      monthlyPayment: 669.07,
      requestedAmount: 20000,
      maxAmount: 13500,
      score: 'poor',
    })).toBe('unaffordable');
    expect(budgetVerdict({
      disposable: -100,
      monthlyPayment: 669.07,
      requestedAmount: 20000,
      maxAmount: 0,
      score: 'poor',
    })).toBe('unaffordable');
  });

  it('calls a comfortable loan affordable and a fair one a stretch', () => {
    expect(budgetVerdict({
      disposable: 16500,
      monthlyPayment: 669.07,
      requestedAmount: 20000,
      maxAmount: 300000,
      score: 'good',
    })).toBe('affordable');
    expect(budgetVerdict({
      disposable: 4000,
      monthlyPayment: 669.07,
      requestedAmount: 20000,
      maxAmount: 300000,
      score: 'fair',
    })).toBe('stretch');
  });
});
