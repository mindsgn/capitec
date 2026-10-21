import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { boundsForLoan, PRODUCT_BY_LOAN } from '@/lib/api/mapLoan';
import { LOAN_MAP, type LoanTypeId } from '@/lib/loans';
import { initialState, type SimState } from '@/lib/state';
import { clearState, loadState, saveState } from '@/lib/storage';
import { useLoanApi } from '@/state/loanApiStore';

interface Ctx {
  state: SimState;
  update: (fn: (s: SimState) => SimState) => void;
  selectLoanType: (id: LoanTypeId) => void;
  reset: () => void;
  hasProgress: boolean;
}

const SimContext = createContext<Ctx | null>(null);

export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const [boot] = useState(() => loadState());
  const [state, setState] = useState<SimState>(boot.state);

  useEffect(() => {
    if (boot.error) toast.error(i18n.t('toast.restoreFailed'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { saveState(state); }, [state]);

  const update = useCallback((fn: (s: SimState) => SimState) => setState(fn), []);

  const selectLoanType = useCallback((id: LoanTypeId) => {
    const c = LOAN_MAP[id];
    const api = useLoanApi.getState();
    let amount = c.defaultAmount;
    let months = c.defaultTerm;
    if (api.products) {
      const limits = boundsForLoan(id, api.products);
      if (limits) {
        amount = Math.min(limits.maxAmount, Math.max(limits.minAmount, amount));
        months = Math.min(limits.maxTerm, Math.max(limits.minTerm, months));
      }
    }
    api.clearDecision();
    setState((s) => s.loanType === id ? s : {
      ...s,
      loanType: id,
      loan: { amount, months },
      elig: { ...initialState.elig, loanPurpose: PRODUCT_BY_LOAN[id]?.purpose ?? null },
      submission: null,
    });
  }, []);

  const reset = useCallback(() => { clearState(); useLoanApi.getState().clearDecision(); setState(initialState); }, []);

  const value = useMemo<Ctx>(() => ({
    state, update, selectLoanType, reset,
    hasProgress: state.loanType !== null || state.phase !== 'affordability',
  }), [state, update, selectLoanType, reset]);

  return <SimContext.Provider value={value}>{children}</SimContext.Provider>;
}

export function useSim(): Ctx {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error('useSim must be used inside <SimulatorProvider>');
  return ctx;
}
