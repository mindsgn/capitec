export const LOAN_TYPES = ['personal', 'vehicle', 'home', 'education', 'homeImprovement', 'medical', 'multiIncome'] as const;
export type LoanTypeId = (typeof LOAN_TYPES)[number];
export type DocCondition = 'salaryNotCapitec' | 'married' | 'largeHome';
export interface DocDef { id: string; condition?: DocCondition; optional?: boolean }
export type LoanIcon = 'user' | 'car' | 'home' | 'graduation' | 'hammer' | 'heart' | 'layers';

export interface LoanConfig {
  id: LoanTypeId;
  icon: LoanIcon;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
  minTerm: number;
  maxTerm: number;
  defaultTerm: number;
  /** Indicative annual interest rate (%). The real rate is set by the lender's assessment. */
  rate: number;
  minAge: number;
  maxAge: number;
  /** Requirement ids the applicant confirms in the eligibility flow. Labels live in i18n (req.<id>). */
  requirements: string[];
  docs: DocDef[];
}

export const LARGE_HOME_THRESHOLD = 2_500_000;
const BANK3: DocDef = { id: 'bankStatement3', condition: 'salaryNotCapitec' };

export const LOANS: LoanConfig[] = [
  { id: 'personal', icon: 'user', minAmount: 1000, maxAmount: 500000, defaultAmount: 20000, minTerm: 6, maxTerm: 84, defaultTerm: 36, rate: 24, minAge: 18, maxAge: 100,
    requirements: ['saId', 'stableIncome', 'notDebtAdmin'],
    docs: [{ id: 'saId' }, { id: 'salarySlip' }, BANK3] },
  { id: 'vehicle', icon: 'car', minAmount: 20000, maxAmount: 1500000, defaultAmount: 250000, minTerm: 12, maxTerm: 72, defaultTerm: 60, rate: 15, minAge: 18, maxAge: 100,
    requirements: ['validId', 'stableIncome', 'vehicleConditions'],
    docs: [{ id: 'validId' }, { id: 'payslips' }, { id: 'vehicleQuote' }, { id: 'bankStatementsOptional', optional: true }] },
  { id: 'home', icon: 'home', minAmount: 300000, maxAmount: 5000000, defaultAmount: 1000000, minTerm: 60, maxTerm: 360, defaultTerm: 240, rate: 11.75, minAge: 18, maxAge: 60,
    requirements: ['permanentOrSelfEmployed', 'goodCredit', 'notDebtCounselling', 'propertyCosts'],
    docs: [{ id: 'salarySlips3' }, { id: 'bankStatementsStamped' }, { id: 'saId' }, { id: 'offerToPurchase' },
      { id: 'marriageCert', condition: 'married' }, { id: 'assetsLiabilities', condition: 'largeHome' }] },
  { id: 'education', icon: 'graduation', minAmount: 1000, maxAmount: 150000, defaultAmount: 30000, minTerm: 6, maxTerm: 60, defaultTerm: 24, rate: 18, minAge: 18, maxAge: 100,
    requirements: ['saId', 'stableIncome'],
    docs: [{ id: 'saId' }, { id: 'salarySlips3' }, BANK3, { id: 'feeStatement', optional: true }] },
  { id: 'homeImprovement', icon: 'hammer', minAmount: 5000, maxAmount: 300000, defaultAmount: 50000, minTerm: 12, maxTerm: 72, defaultTerm: 36, rate: 18, minAge: 18, maxAge: 100,
    requirements: ['saId', 'permanentEmployed', 'qualifyingImprovement'],
    docs: [{ id: 'saId' }, { id: 'salarySlips3' }, BANK3, { id: 'supportingDocs', optional: true }] },
  { id: 'medical', icon: 'heart', minAmount: 1000, maxAmount: 200000, defaultAmount: 15000, minTerm: 6, maxTerm: 60, defaultTerm: 12, rate: 18, minAge: 18, maxAge: 100,
    requirements: ['saId', 'stableIncome'],
    docs: [{ id: 'saId' }, { id: 'salarySlips3' }, BANK3, { id: 'medicalInvoice' }] },
  { id: 'multiIncome', icon: 'layers', minAmount: 1000, maxAmount: 150000, defaultAmount: 15000, minTerm: 6, maxTerm: 60, defaultTerm: 24, rate: 24, minAge: 18, maxAge: 100,
    requirements: ['saId', 'earns5000For6Months', 'incomeDocumented'],
    docs: [{ id: 'saId' }, { id: 'incomeProof' }] },
];

export const LOAN_MAP = Object.fromEntries(LOANS.map((l) => [l.id, l])) as Record<LoanTypeId, LoanConfig>;

export interface DocContext { salaryIntoCapitec: boolean | null; married: boolean | null; amount: number | null }

/** Documents that apply to this applicant, given the answers in the basics step. */
export function docsFor(config: LoanConfig, ctx: DocContext): DocDef[] {
  return config.docs.filter((d) => {
    if (d.condition === 'salaryNotCapitec') return ctx.salaryIntoCapitec === false;
    if (d.condition === 'married') return ctx.married === true;
    if (d.condition === 'largeHome') return (ctx.amount ?? 0) > LARGE_HOME_THRESHOLD;
    return true;
  });
}
export const asksSalaryQuestion = (c: LoanConfig) => c.docs.some((d) => d.condition === 'salaryNotCapitec');
export const asksMaritalQuestion = (c: LoanConfig) => c.docs.some((d) => d.condition === 'married');
