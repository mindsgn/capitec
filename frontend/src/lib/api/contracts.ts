import { z } from 'zod';

export const EMPLOYMENT_STATUSES = ['employed', 'self_employed', 'unemployed', 'retired'] as const;
export const LOAN_PURPOSES = ['debt_consolidation', 'home_improvement', 'education', 'medical', 'other', 'new_vehicle', 'used_vehicle', 'home_purchase'] as const;
export const API_LOAN_TYPES = ['personal_loan', 'vehicle_loan', 'home_loan'] as const;
export const RISK_CATEGORIES = ['low', 'medium', 'high'] as const;
export const AFFORDABILITY_SCORES = ['good', 'fair', 'poor'] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];
export type LoanPurpose = (typeof LOAN_PURPOSES)[number];
export type ApiLoanType = (typeof API_LOAN_TYPES)[number];
export type AffordabilityScore = (typeof AFFORDABILITY_SCORES)[number];

const numberRuleSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  required: z.boolean(),
  errorMessage: z.string(),
});

const optionsRuleSchema = z.object({
  required: z.boolean(),
  options: z.array(z.string()).min(1),
  errorMessage: z.string(),
});

export const validationRulesSchema = z.object({
  personalInfo: z.object({
    age: numberRuleSchema,
    employmentStatus: optionsRuleSchema,
    employmentDuration: numberRuleSchema,
  }),
  financialInfo: z.object({
    monthlyIncome: numberRuleSchema,
    monthlyExpenses: numberRuleSchema,
    creditScore: numberRuleSchema,
  }),
  loanDetails: z.object({
    requestedAmount: numberRuleSchema,
    loanTerm: numberRuleSchema,
  }),
});

export type ValidationRules = z.infer<typeof validationRulesSchema>;
export type NumberRule = z.infer<typeof numberRuleSchema>;
export type OptionsRule = z.infer<typeof optionsRuleSchema>;

export const loanProductSchema = z.object({
  id: z.enum(API_LOAN_TYPES),
  name: z.string(),
  description: z.string(),
  minAmount: z.number(),
  maxAmount: z.number(),
  minTerm: z.number(),
  maxTerm: z.number(),
  interestRateRange: z.object({ min: z.number(), max: z.number() }),
  purposes: z.array(z.enum(LOAN_PURPOSES)),
});

export const productsResponseSchema = z.object({ products: z.array(loanProductSchema) });
export type LoanProduct = z.infer<typeof loanProductSchema>;
export type ProductsResponse = z.infer<typeof productsResponseSchema>;

export const eligibilityRequestSchema = z.object({
  personalInfo: z.object({
    age: z.number(),
    employmentStatus: z.enum(EMPLOYMENT_STATUSES),
    employmentDuration: z.number(),
  }),
  financialInfo: z.object({
    monthlyIncome: z.number(),
    monthlyExpenses: z.number(),
    existingDebt: z.number(),
    creditScore: z.number().optional(),
  }),
  loanDetails: z.object({
    requestedAmount: z.number(),
    loanTerm: z.number(),
    loanPurpose: z.enum(LOAN_PURPOSES),
  }),
});

export type EligibilityRequest = z.infer<typeof eligibilityRequestSchema>;

const scheduleRowSchema = z.object({
  month: z.number(),
  payment: z.number(),
  principal: z.number(),
  interest: z.number(),
  balance: z.number(),
});

export const rateResponseSchema = z.object({
  interestRate: z.number(),
  monthlyPayment: z.number(),
  totalInterest: z.number(),
  totalRepayment: z.number(),
  paymentSchedule: z.array(scheduleRowSchema),
});

export type RateResponse = z.infer<typeof rateResponseSchema>;

export const eligibilityResponseSchema = z.object({
  eligibilityResult: z.object({
    isEligible: z.boolean(),
    approvalLikelihood: z.number(),
    riskCategory: z.enum(RISK_CATEGORIES),
    decisionReason: z.string(),
  }),
  recommendedLoan: z.object({
    maxAmount: z.number(),
    recommendedAmount: z.number(),
    interestRate: z.number(),
    monthlyPayment: z.number(),
    totalRepayment: z.number(),
  }),
  affordabilityAnalysis: z.object({
    disposableIncome: z.number(),
    debtToIncomeRatio: z.number(),
    loanToIncomeRatio: z.number(),
    affordabilityScore: z.enum(AFFORDABILITY_SCORES),
  }),
});

export type EligibilityResponse = z.infer<typeof eligibilityResponseSchema>;

export const rateRequestSchema = z.object({
  loanAmount: z.number().positive(),
  loanTerm: z.number().int().positive(),
  creditScore: z.number().optional(),
  loanType: z.enum(API_LOAN_TYPES),
});

export type RateRequest = z.infer<typeof rateRequestSchema>;
