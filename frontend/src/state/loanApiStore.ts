import { create } from 'zustand';
import { fetchProducts, fetchValidationRules, postEligibility, postRate } from '@/lib/api/client';
import { rateRequestKey } from '@/lib/api/mapLoan';
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
  quoteStatus: LoadStatus;
  quoteError: string | null;
  quote: RateResponse | null;
  quoteKey: string | null;
  loadReference: () => Promise<void>;
  runDecision: (eligibility: EligibilityRequest, rate: RateRequest) => Promise<void>;
  runQuote: (body: RateRequest) => Promise<void>;
  clearDecision: () => void;
}

let decisionSeq = 0;
let quoteSeq = 0;

export const useLoanApi = create<LoanApiState>((set, get) => ({
  status: 'idle',
  products: null,
  rules: null,
  decisionStatus: 'idle',
  decisionError: null,
  eligibility: null,
  rate: null,
  quoteStatus: 'idle',
  quoteError: null,
  quote: null,
  quoteKey: null,
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
  runQuote: async (body) => {
    const key = rateRequestKey(body);
    if (get().quoteKey === key && get().quoteStatus === 'ready') return;
    const seq = ++quoteSeq;
    set({ quoteStatus: 'loading', quoteError: null });
    try {
      const quote = await postRate(body);
      if (seq !== quoteSeq) return;
      set({ quoteStatus: 'ready', quote, quoteKey: key, quoteError: null });
    } catch (err) {
      if (seq !== quoteSeq) return;
      set({
        quoteStatus: 'error',
        quote: null,
        quoteKey: null,
        quoteError: err instanceof Error ? err.message : 'Request failed',
      });
    }
  },
  clearDecision: () => {
    decisionSeq += 1;
    quoteSeq += 1;
    set({
      decisionStatus: 'idle',
      decisionError: null,
      eligibility: null,
      rate: null,
      quoteStatus: 'idle',
      quoteError: null,
      quote: null,
      quoteKey: null,
    });
  },
}));
