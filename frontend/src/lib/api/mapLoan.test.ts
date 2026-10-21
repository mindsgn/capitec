import { boundsForLoan, mapEligibilityRequest, mapRateRequest, PRODUCT_BY_LOAN } from '@/lib/api/mapLoan';
import { LOAN_TYPES } from '@/lib/loans';
import { initialState, type SimState } from '@/lib/state';
import { LOAN_PRODUCTS, VALIDATION_RULES } from '@/mocks/loansApi';

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

  it('omits a blank credit score and skips home loans', () => {
    const blank = specState();
    blank.elig = { ...blank.elig, creditScore: null };
    const body = mapEligibilityRequest(blank);
    expect(body?.financialInfo).not.toHaveProperty('creditScore');
    expect(mapEligibilityRequest({ ...blank, loanType: 'home' })).toBeNull();
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
    expect(PRODUCT_BY_LOAN.home).toBeNull();

    for (const id of LOAN_TYPES) {
      const mapped = PRODUCT_BY_LOAN[id];
      const state = specState({ loanType: id, elig: { ...specState().elig, loanPurpose: mapped?.purpose ?? null } });
      if (!mapped) {
        expect(mapRateRequest(state)).toBeNull();
      } else {
        expect(mapRateRequest(state)).toMatchObject({ loanType: mapped.productId, creditScore: 650 });
      }
    }
  });

  it('uses 650 for the rate call when credit score is blank', () => {
    const state = specState();
    state.elig = { ...state.elig, creditScore: null };
    expect(mapRateRequest(state)?.creditScore).toBe(650);
  });

  it('clamps personal loans to the validation rules and vehicles to the product', () => {
    const personal = boundsForLoan('personal', VALIDATION_RULES, LOAN_PRODUCTS);
    expect(personal).toEqual({ minAmount: 5000, maxAmount: 300000, minTerm: 6, maxTerm: 60 });
    expect(boundsForLoan('education', VALIDATION_RULES, LOAN_PRODUCTS).maxTerm).toBe(60);
    expect(boundsForLoan('vehicle', VALIDATION_RULES, LOAN_PRODUCTS)).toEqual({ minAmount: 50000, maxAmount: 1500000, minTerm: 12, maxTerm: 72 });
    expect(boundsForLoan('home', VALIDATION_RULES, LOAN_PRODUCTS).maxAmount).toBe(5000000);
    expect(boundsForLoan('home', VALIDATION_RULES, LOAN_PRODUCTS).maxTerm).toBe(360);
  });
});
