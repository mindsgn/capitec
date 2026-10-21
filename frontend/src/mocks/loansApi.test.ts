import { handleLoanApi } from './loansApi';
import type { EligibilityResponse, ProductsResponse, RateResponse, ValidationRules } from '@/lib/api/contracts';

const specRequest = {
  personalInfo: { age: 35, employmentStatus: 'employed', employmentDuration: 24 },
  financialInfo: { monthlyIncome: 25000, monthlyExpenses: 15000, existingDebt: 5000, creditScore: 650 },
  loanDetails: { requestedAmount: 150000, loanTerm: 24, loanPurpose: 'home_improvement' },
};

function post(path: string, body: unknown) {
  return handleLoanApi('POST', path, JSON.stringify(body));
}

describe('loan mock catalogue', () => {
  it('returns the published products', () => {
    const res = handleLoanApi('GET', '/api/loans/products', '');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      products: [
        {
          id: 'personal_loan',
          name: 'Personal Loan',
          description: 'Flexible personal financing for various needs',
          minAmount: 5000,
          maxAmount: 300000,
          minTerm: 6,
          maxTerm: 60,
          interestRateRange: { min: 10.5, max: 18.5 },
          purposes: ['debt_consolidation', 'home_improvement', 'education', 'medical', 'other'],
        },
        {
          id: 'vehicle_loan',
          name: 'Vehicle Finance',
          description: 'Financing for new and used vehicles',
          minAmount: 50000,
          maxAmount: 1500000,
          minTerm: 12,
          maxTerm: 72,
          interestRateRange: { min: 8.5, max: 15 },
          purposes: ['new_vehicle', 'used_vehicle'],
        },
        {
          id: 'home_loan',
          name: 'Home Loan',
          description: 'Bond finance for buying a property',
          minAmount: 300000,
          maxAmount: 5000000,
          minTerm: 60,
          maxTerm: 360,
          interestRateRange: { min: 9.75, max: 16 },
          purposes: ['home_purchase'],
        },
      ],
    } satisfies ProductsResponse);
  });

  it('returns the published validation rules', () => {
    const res = handleLoanApi('GET', '/api/loans/validation-rules', '');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      personalInfo: {
        age: { min: 18, max: 65, required: true, errorMessage: 'Age must be between 18 and 65' },
        employmentStatus: {
          required: true,
          options: ['employed', 'self_employed', 'unemployed', 'retired'],
          errorMessage: 'Please select your employment status',
        },
        employmentDuration: { min: 3, required: true, errorMessage: 'Minimum 3 months employment required' },
      },
      financialInfo: {
        monthlyIncome: { min: 5000, required: true, errorMessage: 'Minimum monthly income of R5,000 required' },
        monthlyExpenses: { min: 0, required: true, errorMessage: 'Please enter your monthly expenses' },
        creditScore: { min: 300, max: 850, required: false, errorMessage: 'Credit score must be between 300 and 850' },
      },
      loanDetails: {
        requestedAmount: { min: 5000, max: 300000, required: true, errorMessage: 'Loan amount must be between R5,000 and R300,000' },
        loanTerm: { min: 6, max: 60, required: true, errorMessage: 'Loan term must be between 6 and 60 months' },
      },
    } satisfies ValidationRules);
  });
});

describe('eligibility assessment', () => {
  it('reproduces the specification example', () => {
    const res = post('/api/loans/eligibility', specRequest);
    expect(res.status).toBe(200);
    const body = res.body as EligibilityResponse;
    expect(body.eligibilityResult).toEqual({
      isEligible: true,
      approvalLikelihood: 85,
      riskCategory: 'low',
      decisionReason: 'Strong income-to-expense ratio and manageable existing debt',
    });
    expect(body.affordabilityAnalysis).toEqual({
      disposableIncome: 10000,
      debtToIncomeRatio: 20,
      loanToIncomeRatio: 60,
      affordabilityScore: 'good',
    });
    expect(body.recommendedLoan.maxAmount).toBe(180000);
    expect(body.recommendedLoan.recommendedAmount).toBe(150000);
    expect(body.recommendedLoan.interestRate).toBe(12.5);
    // Reducing-balance at 12.5% rounds to these cents. The published sample's 7089.50 / 1562.33 does not reconcile with that rate.
    expect(body.recommendedLoan.monthlyPayment).toBe(7096.1);
    expect(body.recommendedLoan.totalRepayment).toBe(170306.3);
  });

  it('marks the same finances as high risk when the applicant is unemployed', () => {
    const res = post('/api/loans/eligibility', {
      ...specRequest,
      personalInfo: { ...specRequest.personalInfo, employmentStatus: 'unemployed' },
    });
    const body = res.body as EligibilityResponse;
    expect(body.eligibilityResult.isEligible).toBe(false);
    expect(body.eligibilityResult.riskCategory).toBe('high');
  });

  it('marks a loan ineligible when the instalment is above disposable income', () => {
    const res = post('/api/loans/eligibility', {
      personalInfo: { age: 35, employmentStatus: 'employed', employmentDuration: 24 },
      financialInfo: { monthlyIncome: 10000, monthlyExpenses: 6000, existingDebt: 0, creditScore: 300 },
      loanDetails: { requestedAmount: 180000, loanTerm: 60, loanPurpose: 'other' },
    });
    const body = res.body as EligibilityResponse;
    expect(body.eligibilityResult.isEligible).toBe(false);
    expect(body.recommendedLoan.monthlyPayment).toBeGreaterThan(body.affordabilityAnalysis.disposableIncome);
  });
});

describe('interest rate calculator', () => {
  it('locks the specification example at 12.5% including the first schedule rows', () => {
    const res = post('/api/loans/calculate-rate', {
      loanAmount: 150000,
      loanTerm: 24,
      creditScore: 650,
      loanType: 'personal_loan',
    });
    expect(res.status).toBe(200);
    const body = res.body as RateResponse;
    expect(body.interestRate).toBe(12.5);
    expect(body.monthlyPayment).toBe(7096.1);
    expect(body.totalInterest).toBe(20306.3);
    expect(body.totalRepayment).toBe(170306.3);
    expect(body.paymentSchedule).toHaveLength(24);
    expect(body.paymentSchedule[0]).toEqual({ month: 1, payment: 7096.1, principal: 5533.6, interest: 1562.5, balance: 144466.4 });
    expect(body.paymentSchedule[1]).toEqual({ month: 2, payment: 7096.1, principal: 5591.24, interest: 1504.86, balance: 138875.16 });
    expect(body.paymentSchedule[23].balance).toBe(0);
  });

  it('uses a credit score of 650 when the rate request omits one', () => {
    const res = post('/api/loans/calculate-rate', { loanAmount: 150000, loanTerm: 24, loanType: 'personal_loan' });
    expect((res.body as RateResponse).interestRate).toBe(12.5);
  });

  it('prices the simulator default personal loan at 12.5%', () => {
    const res = post('/api/loans/calculate-rate', { loanAmount: 20000, loanTerm: 36, creditScore: 650, loanType: 'personal_loan' });
    const body = res.body as RateResponse;
    expect(body.interestRate).toBe(12.5);
    expect(body.monthlyPayment).toBe(669.07);
  });

  it('prices a home loan on its own product', () => {
    const res = post('/api/loans/calculate-rate', { loanAmount: 1000000, loanTerm: 240, creditScore: 650, loanType: 'home_loan' });
    expect(res.status).toBe(200);
    const body = res.body as RateResponse;
    expect(body.interestRate).toBe(11.75);
    expect(body.interestRate).toBeGreaterThanOrEqual(9.75);
    expect(body.interestRate).toBeLessThanOrEqual(16);
  });

  it('accepts a home purchase on the eligibility check', () => {
    const res = post('/api/loans/eligibility', {
      ...specRequest,
      loanDetails: { requestedAmount: 1000000, loanTerm: 240, loanPurpose: 'home_purchase' },
    });
    expect(res.status).toBe(200);
    expect((res.body as EligibilityResponse).recommendedLoan.interestRate).toBe(11.75);
  });

  it('prices a vehicle loan inside its own rate band', () => {
    const res = post('/api/loans/calculate-rate', { loanAmount: 150000, loanTerm: 24, creditScore: 650, loanType: 'vehicle_loan' });
    const rate = (res.body as RateResponse).interestRate;
    expect(rate).toBeGreaterThanOrEqual(8.5);
    expect(rate).toBeLessThanOrEqual(15);
    expect(rate).not.toBe(12.5);
  });

  it('rejects an unknown route and a broken body', () => {
    expect(handleLoanApi('GET', '/api/loans/missing', '').status).toBe(404);
    expect(handleLoanApi('POST', '/api/loans/eligibility', '{').status).toBe(400);
  });
});
