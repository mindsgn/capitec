import { hasApiProduct } from './api/mapLoan';
import { docsFor, LOAN_MAP } from './loans';
import { AFFORDABILITY_STEPS, type SimState } from './state';

export const eligibilitySteps = (s: SimState): string[] => {
  const cfg = s.loanType ? LOAN_MAP[s.loanType] : null;
  const docs = cfg ? docsFor(cfg, { ...s.elig, amount: s.loan.amount }) : [];
  const decision = hasApiProduct(s.loanType) ? ['decision'] : [];
  return ['basics', ...decision, ...docs.map((d) => `doc:${d.id}`), 'review'];
};

export const sumExpenses = (e: SimState['expenses']) => (e.housing ?? 0) + (e.transport ?? 0) + (e.living ?? 0) + (e.other ?? 0);

/** Position of the current step across both phases, for the overall progress bar. */
export function overallProgress(s: SimState): { index: number; total: number } {
  const aff = AFFORDABILITY_STEPS.length;
  const elig = eligibilitySteps(s).length;
  const index = s.phase === 'affordability' ? s.step : s.phase === 'eligibility' ? aff + s.step : aff + elig;
  return { index, total: aff + elig };
}
