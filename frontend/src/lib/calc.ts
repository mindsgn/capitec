/**
 * Indicative affordability maths. Fee constants follow the shape of South African
 * unsecured-credit fee caps but are SIMPLIFIED, edit them here to match your product rules.
 */
export const VAT_RATE = 0.15;
export const MONTHLY_SERVICE_FEE = 69; // excl. VAT
export const INITIATION_BASE = 1050; // excl. VAT
export const INITIATION_PCT = 0.1; // of amount above R1 000
export const INITIATION_CAP = 6037.5; // excl. VAT
/** A loan counts as "affordable" when the instalment uses at most this share of disposable income. */
export const AFFORDABLE_SHARE = 0.7;

export type Verdict = 'affordable' | 'stretch' | 'unaffordable';

const round2 = (n: number) => Math.round(n * 100) / 100;
const monthlyRate = (annualPct: number) => annualPct / 100 / 12;

export function initiationFee(amount: number): number {
  const raw = INITIATION_BASE + INITIATION_PCT * Math.max(0, amount - 1000);
  return round2(Math.min(raw, INITIATION_CAP) * (1 + VAT_RATE));
}

export const serviceFee = () => round2(MONTHLY_SERVICE_FEE * (1 + VAT_RATE));

export function pmt(principal: number, annualPct: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0;
  const r = monthlyRate(annualPct);
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function principalFromPmt(payment: number, annualPct: number, months: number): number {
  if (months <= 0 || payment <= 0) return 0;
  const r = monthlyRate(annualPct);
  return r === 0 ? payment * months : (payment * (1 - Math.pow(1 + r, -months))) / r;
}

export interface LoanQuote {
  initiation: number;
  serviceFee: number;
  baseInstalment: number;
  instalment: number;
  totalRepayable: number;
  totalInterest: number;
  totalFees: number;
}

/** The initiation fee is financed (added to the principal); the service fee is billed monthly. */
export function simulateLoan(p: { amount: number; months: number; ratePct: number }): LoanQuote {
  const initiation = initiationFee(p.amount);
  const sf = serviceFee();
  const principal = p.amount + initiation;
  const base = pmt(principal, p.ratePct, p.months);
  const instalment = round2(base + sf);
  return {
    initiation,
    serviceFee: sf,
    baseInstalment: round2(base),
    instalment,
    totalRepayable: round2(instalment * p.months),
    totalInterest: round2(base * p.months - principal),
    totalFees: round2(initiation + sf * p.months),
  };
}

export interface Assessment {
  disposable: number;
  remaining: number;
  /** (existing debt + new instalment) / gross income */
  dti: number;
  /** instalment / disposable income */
  usage: number;
  verdict: Verdict;
}

export function assess(p: { grossIncome: number; netIncome: number; expenses: number; existingDebt: number; instalment: number }): Assessment {
  const disposable = round2(p.netIncome - p.expenses - p.existingDebt);
  const remaining = round2(disposable - p.instalment);
  const dti = p.grossIncome > 0 ? (p.existingDebt + p.instalment) / p.grossIncome : 1;
  const usage = disposable > 0 ? p.instalment / disposable : Infinity;
  let verdict: Verdict;
  if (disposable <= 0 || remaining < 0) verdict = 'unaffordable';
  else if (p.instalment <= AFFORDABLE_SHARE * disposable) verdict = 'affordable';
  else verdict = 'stretch';
  return { disposable, remaining, dti, usage, verdict };
}

/** Largest loan amount whose instalment stays within the affordable share. Returns 0 if none fits. */
export function maxAffordableAmount(p: { disposable: number; months: number; ratePct: number; minAmount: number; maxAmount: number }): number {
  const cap = AFFORDABLE_SHARE * p.disposable - serviceFee();
  if (cap <= 0) return 0;
  const principal = principalFromPmt(cap, p.ratePct, p.months);
  let amount = principal;
  for (let i = 0; i < 4; i++) amount = principal - initiationFee(amount);
  amount = Math.min(p.maxAmount, Math.floor(amount / 100) * 100);
  return amount < p.minAmount ? 0 : amount;
}
