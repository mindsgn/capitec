import { boundsForLoan, mapEligibilityRequest, mapRateRequest, PRODUCT_BY_LOAN } from '@/lib/api/mapLoan';
import { LOAN_TYPES } from '@/lib/loans';
import { initialState, type SimState } from '@/lib/state';
import { LOAN_PRODUCTS } from '@/mocks/loansApi';

function specState(patch?: Partial<SimState>): SimState {
  return {
    ...initialState,
    loanType: 'homeImprovement',
    income: { grossIncome: 30000, netIncome: 25000 },
    expenses: { housing: 15000, transport: 0, living: 0, other: 0, existingDebt: 5000 },
    loan: { amount: 150000, months: 24 },
    elig: {
      ...initialState.elig,
      age: 35,
      employmentStatus: 'employed',
      employmentDuration: 24,
      creditScore: 650,
      loanPurpose: 'home_improvement',
    },
    ...patch,
  };
}

describe('mapEligibilityRequest', () => {
  it('builds the specification body from simulator state', () => {
    expect(mapEligibilityRequest(specState())).toEqual({
      personalInfo: { age: 35, employmentStatus: 'employed', employmentDuration: 24 },
      financialInfo: { monthlyIncome: 25000, monthlyExpenses: 15000, existingDebt: 5000, creditScore: 650 },
      loanDetails: { requestedAmount: 150000, loanTerm: 24, loanPurpose: 'home_improvement' },
    });
  });

  it('omits a blank credit score', () => {
    const blank = specState();
    blank.elig = { ...blank.elig, creditScore: null };
    const body = mapEligibilityRequest(blank);
    expect(body?.financialInfo).not.toHaveProperty('creditScore');
  });

  it('sends a home loan to the home product', () => {
    const home = specState({
      loanType: 'home',
      loan: { amount: 1000000, months: 240 },
      elig: { ...specState().elig, loanPurpose: 'home_purchase' },
    });
    expect(mapEligibilityRequest(home)?.loanDetails).toEqual({
      requestedAmount: 1000000,
      loanTerm: 240,
      loanPurpose: 'home_purchase',
    });
    expect(mapRateRequest(home)).toMatchObject({ loanType: 'home_loan', loanAmount: 1000000, loanTerm: 240 });
  });
});

describe('product mapping', () => {
  it('maps each simulator loan onto a product and purpose', () => {
    expect(PRODUCT_BY_LOAN.personal).toEqual({ productId: 'personal_loan', purpose: 'other' });
    expect(PRODUCT_BY_LOAN.multiIncome).toEqual({ productId: 'personal_loan', purpose: 'other' });
    expect(PRODUCT_BY_LOAN.homeImprovement).toEqual({ productId: 'personal_loan', purpose: 'home_improvement' });
    expect(PRODUCT_BY_LOAN.education).toEqual({ productId: 'personal_loan', purpose: 'education' });
    expect(PRODUCT_BY_LOAN.medical).toEqual({ productId: 'personal_loan', purpose: 'medical' });
    expect(PRODUCT_BY_LOAN.vehicle).toEqual({ productId: 'vehicle_loan', purpose: 'used_vehicle' });
    expect(PRODUCT_BY_LOAN.home).toEqual({ productId: 'home_loan', purpose: 'home_purchase' });

    for (const id of LOAN_TYPES) {
      const mapped = PRODUCT_BY_LOAN[id];
      expect(LOAN_PRODUCTS.some((product) => product.id === mapped.productId && product.purposes.includes(mapped.purpose))).toBe(true);
      const state = specState({ loanType: id, elig: { ...specState().elig, loanPurpose: mapped.purpose } });
      expect(mapRateRequest(state)).toMatchObject({ loanType: mapped.productId, creditScore: 650 });
      expect(mapEligibilityRequest(state)?.loanDetails.loanPurpose).toBe(mapped.purpose);
    }
  });

  it('uses 650 for the rate call when credit score is blank', () => {
    const state = specState();
    state.elig = { ...state.elig, creditScore: null };
    expect(mapRateRequest(state)?.creditScore).toBe(650);
  });

  it('uses each lending product for amount and term limits', () => {
    const personal = boundsForLoan('personal', LOAN_PRODUCTS);
    expect(personal).toEqual({ minAmount: 5000, maxAmount: 300000, minTerm: 6, maxTerm: 60 });
    expect(boundsForLoan('education', LOAN_PRODUCTS)).toEqual(personal);
    expect(boundsForLoan('medical', LOAN_PRODUCTS)).toEqual(personal);
    expect(boundsForLoan('homeImprovement', LOAN_PRODUCTS)).toEqual(personal);
    expect(boundsForLoan('multiIncome', LOAN_PRODUCTS)).toEqual(personal);
    expect(boundsForLoan('vehicle', LOAN_PRODUCTS)).toEqual({ minAmount: 50000, maxAmount: 1500000, minTerm: 12, maxTerm: 72 });
    expect(boundsForLoan('home', LOAN_PRODUCTS)).toEqual({ minAmount: 300000, maxAmount: 5000000, minTerm: 60, maxTerm: 360 });
  });
});
