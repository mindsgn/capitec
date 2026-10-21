import {
  affordabilityScoreOf,
  debtToIncomeRatio,
  disposableIncome,
  loanToIncomeRatio,
  maxQualifyingAmount,
} from '../lib/api/affordability';
import {
  eligibilityRequestSchema,
  eligibilityResponseSchema,
  productsResponseSchema,
  rateRequestSchema,
  rateResponseSchema,
  validationRulesSchema,
  type ApiLoanType,
  type EligibilityRequest,
  type EligibilityResponse,
  type LoanProduct,
  type RateRequest,
  type RateResponse,
} from '../lib/api/contracts';

/** Published catalogue from GET /api/loans/products. */
export const LOAN_PRODUCTS: LoanProduct[] = [
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
];

/** Published field rules from GET /api/loans/validation-rules. */
export const VALIDATION_RULES = {
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
};

const ELIGIBLE_REASON = 'Strong income-to-expense ratio and manageable existing debt';
const NEUTRAL_CREDIT_SCORE = 650;

/** Score bands. Personal credit of 650 maps to 12.5%, inside 10.5–18.5. Vehicle uses 8.5–15. */
const RATE_BANDS: Record<ApiLoanType, ReadonlyArray<readonly [number, number]>> = {
  personal_loan: [[750, 10.5], [700, 11.5], [650, 12.5], [600, 14.5], [550, 16.5], [300, 18.5]],
  vehicle_loan: [[750, 8.5], [700, 9.5], [650, 11], [600, 12.5], [550, 13.5], [300, 15]],
  home_loan: [[750, 9.75], [700, 10.75], [650, 11.75], [600, 13.25], [550, 14.75], [300, 16]],
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function interestRateFor(score: number | undefined, loanType: ApiLoanType): number {
  const credit = score ?? NEUTRAL_CREDIT_SCORE;
  const band = RATE_BANDS[loanType].find(([minScore]) => credit >= minScore);
  return band ? band[1] : RATE_BANDS[loanType][RATE_BANDS[loanType].length - 1][1];
}

/** Reducing-balance quote. The regular instalment is rounded to cents; the last row clears the balance. */
export function amortize(principal: number, annualPct: number, months: number): RateResponse {
  const monthly = annualPct / 100 / 12;
  const raw = monthly === 0 ? principal / months : (principal * monthly) / (1 - Math.pow(1 + monthly, -months));
  const payment = round2(raw);
  let balance = principal;
  const paymentSchedule: RateResponse['paymentSchedule'] = [];
  for (let month = 1; month <= months; month++) {
    const interest = round2(balance * monthly);
    let principalPart = round2(payment - interest);
    if (month === months || principalPart > balance) principalPart = round2(balance);
    const rowPayment = month === months ? round2(principalPart + interest) : payment;
    balance = round2(balance - principalPart);
    paymentSchedule.push({ month, payment: rowPayment, principal: principalPart, interest, balance });
  }
  const totalCents = paymentSchedule.reduce((sum, row) => sum + Math.round(row.payment * 100), 0);
  const totalRepayment = totalCents / 100;
  return {
    interestRate: annualPct,
    monthlyPayment: payment,
    totalInterest: round2(totalRepayment - principal),
    totalRepayment,
    paymentSchedule,
  };
}

function productById(id: ApiLoanType): LoanProduct {
  const product = LOAN_PRODUCTS.find((item) => item.id === id);
  if (!product) throw new Error(`Unknown loan type ${id}`);
  return product;
}

function productForPurpose(purpose: EligibilityRequest['loanDetails']['loanPurpose']): LoanProduct | undefined {
  return LOAN_PRODUCTS.find((product) => product.purposes.includes(purpose));
}

function likelihoodOf(input: { status: EligibilityRequest['personalInfo']['employmentStatus']; duration: number; credit: number; dti: number }): number {
  if (input.status === 'unemployed') return 15;
  let score = 50;
  if (input.status === 'employed') score += 15;
  else if (input.status === 'self_employed') score += 10;
  else score += 5;
  if (input.duration >= 24) score += 10;
  else if (input.duration >= 12) score += 5;
  if (input.credit >= 700) score += 10;
  else if (input.credit >= 650) score += 5;
  else if (input.credit < 550) score -= 10;
  if (input.dti <= 20) score += 5;
  else if (input.dti > 40) score -= 15;
  return Math.max(0, Math.min(99, score));
}

export function assessEligibility(input: EligibilityRequest): EligibilityResponse {
  const product = productForPurpose(input.loanDetails.loanPurpose);
  if (!product) throw new Error('Unknown loan purpose');
  const { monthlyIncome, monthlyExpenses, existingDebt, creditScore } = input.financialInfo;
  const { requestedAmount, loanTerm } = input.loanDetails;
  const disposable = disposableIncome(monthlyIncome, monthlyExpenses);
  const debtToIncome = debtToIncomeRatio(existingDebt, monthlyIncome);
  const loanToIncome = loanToIncomeRatio(requestedAmount, monthlyIncome);
  const maxAmount = maxQualifyingAmount(disposable, loanTerm, product);
  const recommendedAmount = round2(Math.min(requestedAmount, maxAmount));
  const credit = creditScore ?? NEUTRAL_CREDIT_SCORE;
  const interestRate = interestRateFor(credit, product.id);
  const quote = amortize(recommendedAmount > 0 ? recommendedAmount : requestedAmount, interestRate, loanTerm);
  const affordabilityScore = affordabilityScoreOf(disposable, monthlyIncome, debtToIncome);

  let isEligible = true;
  let decisionReason = affordabilityScore === 'good' ? ELIGIBLE_REASON : 'You meet the minimum requirements for this loan';
  if (input.personalInfo.employmentStatus === 'unemployed') {
    isEligible = false;
    decisionReason = 'Employment status does not meet the minimum requirement';
  } else if (input.personalInfo.employmentDuration < 3) {
    isEligible = false;
    decisionReason = 'Minimum 3 months employment required';
  } else if (disposable <= 0) {
    isEligible = false;
    decisionReason = 'Monthly expenses leave no disposable income';
  } else if (requestedAmount > maxAmount) {
    isEligible = false;
    decisionReason = 'Requested amount is above the maximum you qualify for';
  } else if (quote.monthlyPayment > disposable) {
    isEligible = false;
    decisionReason = 'The instalment is higher than your disposable income';
  }

  const approvalLikelihood = likelihoodOf({
    status: input.personalInfo.employmentStatus,
    duration: input.personalInfo.employmentDuration,
    credit,
    dti: debtToIncome,
  });
  const riskCategory: EligibilityResponse['eligibilityResult']['riskCategory'] = !isEligible || approvalLikelihood < 40 ? 'high' : approvalLikelihood >= 70 ? 'low' : 'medium';

  return {
    eligibilityResult: { isEligible, approvalLikelihood, riskCategory, decisionReason },
    recommendedLoan: {
      maxAmount,
      recommendedAmount,
      interestRate,
      monthlyPayment: quote.monthlyPayment,
      totalRepayment: quote.totalRepayment,
    },
    affordabilityAnalysis: { disposableIncome: disposable, debtToIncomeRatio: debtToIncome, loanToIncomeRatio: loanToIncome, affordabilityScore },
  };
}

export function calculateRate(input: RateRequest): RateResponse {
  const product = productById(input.loanType);
  const rate = interestRateFor(input.creditScore, product.id);
  return amortize(input.loanAmount, rate, input.loanTerm);
}

export interface ApiResult { status: number; body: unknown }

/** Pure router used by the Vite dev server, the Cloudflare Worker, and the Node server. */
export function handleLoanApi(method: string, path: string, rawBody: string): ApiResult {
  const verb = method.toUpperCase();
  if (verb === 'GET' && path === '/api/loans/products') {
    return { status: 200, body: productsResponseSchema.parse({ products: LOAN_PRODUCTS }) };
  }
  if (verb === 'GET' && path === '/api/loans/validation-rules') {
    return { status: 200, body: validationRulesSchema.parse(VALIDATION_RULES) };
  }
  if (verb === 'POST' && (path === '/api/loans/eligibility' || path === '/api/loans/calculate-rate')) {
    let json: unknown;
    try {
      json = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return { status: 400, body: { error: 'Invalid request' } };
    }
    if (path === '/api/loans/eligibility') {
      const parsed = eligibilityRequestSchema.safeParse(json);
      if (!parsed.success || !productForPurpose(parsed.data.loanDetails.loanPurpose)) return { status: 400, body: { error: 'Invalid request' } };
      return { status: 200, body: eligibilityResponseSchema.parse(assessEligibility(parsed.data)) };
    }
    const parsed = rateRequestSchema.safeParse(json);
    if (!parsed.success) return { status: 400, body: { error: 'Invalid request' } };
    return { status: 200, body: rateResponseSchema.parse(calculateRate(parsed.data)) };
  }
  return { status: 404, body: { error: 'Not found' } };
}
