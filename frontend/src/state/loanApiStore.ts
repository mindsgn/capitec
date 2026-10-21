import { create } from 'zustand';
import { fetchProducts, fetchValidationRules, postEligibility, postRate } from '@/lib/api/client';
import type { EligibilityRequest, EligibilityResponse, LoanProduct, RateRequest, RateResponse, ValidationRules } from '@/lib/api/contracts';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LoanApiState {
  status: LoadStatus;
  products: LoanProduct[] | null;
  rules: ValidationRules | null;
  decisionStatus: LoadStatus;
  decisionError: string | null;
  eligibility: EligibilityResponse | null;
  rate: RateResponse | null;
  loadReference: () => Promise<void>;
  runDecision: (eligibility: EligibilityRequest, rate: RateRequest) => Promise<void>;
  clearDecision: () => void;
}

let decisionSeq = 0;

export const useLoanApi = create<LoanApiState>((set, get) => ({
  status: 'idle',
  products: null,
  rules: null,
  decisionStatus: 'idle',
  decisionError: null,
  eligibility: null,
  rate: null,
  loadReference: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'ready') return;
    set({ status: 'loading' });
    try {
      const [products, rules] = await Promise.all([fetchProducts(), fetchValidationRules()]);
      set({ status: 'ready', products: products.products, rules });
    } catch {
      set({ status: 'error', products: null, rules: null });
    }
  },
  runDecision: async (eligibilityBody, rateBody) => {
    const seq = ++decisionSeq;
    set({ decisionStatus: 'loading', decisionError: null });
    try {
      const eligibility = await postEligibility(eligibilityBody);
      if (seq !== decisionSeq) return;
      const rate = await postRate(rateBody);
      if (seq !== decisionSeq) return;
      set({ decisionStatus: 'ready', eligibility, rate, decisionError: null });
    } catch (err) {
      if (seq !== decisionSeq) return;
      set({
        decisionStatus: 'error',
        eligibility: null,
        rate: null,
        decisionError: err instanceof Error ? err.message : 'Request failed',
      });
    }
  },
  clearDecision: () => {
    decisionSeq += 1;
    set({ decisionStatus: 'idle', decisionError: null, eligibility: null, rate: null });
  },
}));
