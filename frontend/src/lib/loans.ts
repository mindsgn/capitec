/**
 * Application journeys: icon, confirmations and documents.
 * Amounts, terms, rates and affordability belong to the lending API.
 */
export const LOAN_TYPES = ['personal', 'vehicle', 'home', 'education', 'homeImprovement', 'medical', 'multiIncome'] as const;
export type LoanTypeId = (typeof LOAN_TYPES)[number];
export type DocCondition = 'salaryNotCapitec' | 'married' | 'largeHome';
export interface DocDef { id: string; condition?: DocCondition; optional?: boolean }
export type LoanIcon = 'user' | 'car' | 'home' | 'graduation' | 'hammer' | 'heart' | 'layers';

export interface LoanConfig {
  id: LoanTypeId;
  icon: LoanIcon;
  /** Opening slider values. The selected lending product clamps them to its own limits. */
  defaultAmount: number;
  defaultTerm: number;
  /** Requirement ids the applicant confirms in the eligibility flow. Labels live in i18n (req.<id>). */
  requirements: string[];
  docs: DocDef[];
}

export const LARGE_HOME_THRESHOLD = 2_500_000;
const BANK3: DocDef = { id: 'bankStatement3', condition: 'salaryNotCapitec' };

export const LOANS: LoanConfig[] = [
  { id: 'personal', icon: 'user', defaultAmount: 20000, defaultTerm: 36,
    requirements: ['saId', 'stableIncome', 'notDebtAdmin'],
    docs: [{ id: 'saId' }, { id: 'salarySlip' }, BANK3] },
  { id: 'vehicle', icon: 'car', defaultAmount: 250000, defaultTerm: 60,
    requirements: ['validId', 'stableIncome', 'vehicleConditions'],
    docs: [{ id: 'validId' }, { id: 'payslips' }, { id: 'vehicleQuote' }, { id: 'bankStatementsOptional', optional: true }] },
  { id: 'home', icon: 'home', defaultAmount: 1000000, defaultTerm: 240,
    requirements: ['permanentOrSelfEmployed', 'goodCredit', 'notDebtCounselling', 'propertyCosts'],
    docs: [{ id: 'salarySlips3' }, { id: 'bankStatementsStamped' }, { id: 'saId' }, { id: 'offerToPurchase' },
      { id: 'marriageCert', condition: 'married' }, { id: 'assetsLiabilities', condition: 'largeHome' }] },
  { id: 'education', icon: 'graduation', defaultAmount: 30000, defaultTerm: 24,
    requirements: ['saId', 'stableIncome'],
    docs: [{ id: 'saId' }, { id: 'salarySlips3' }, BANK3, { id: 'feeStatement', optional: true }] },
  { id: 'homeImprovement', icon: 'hammer', defaultAmount: 50000, defaultTerm: 36,
    requirements: ['saId', 'permanentEmployed', 'qualifyingImprovement'],
    docs: [{ id: 'saId' }, { id: 'salarySlips3' }, BANK3, { id: 'supportingDocs', optional: true }] },
  { id: 'medical', icon: 'heart', defaultAmount: 15000, defaultTerm: 12,
    requirements: ['saId', 'stableIncome'],
    docs: [{ id: 'saId' }, { id: 'salarySlips3' }, BANK3, { id: 'medicalInvoice' }] },
  { id: 'multiIncome', icon: 'layers', defaultAmount: 15000, defaultTerm: 24,
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
