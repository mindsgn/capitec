/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'motion/react';
import type { RateRequest } from '@/lib/api/contracts';
import { ResultsStep } from '@/components/steps/Results';
import '@/i18n';
import { useSim } from '@/state/SimulatorContext';
import { initialState, type SimState } from '@/lib/state';
import { useLoanApi } from '@/state/loanApiStore';
import { LOAN_PRODUCTS, VALIDATION_RULES } from '@/mocks/loansApi';
import type { Flow } from '@/components/steps/types';

jest.mock('@/state/SimulatorContext', () => ({ useSim: jest.fn() }));

jest.mock('@/lib/api/client', () => {
  const { calculateRate } = jest.requireActual<typeof import('@/mocks/loansApi')>('@/mocks/loansApi');
  return {
    postRate: (body: RateRequest) => Promise.resolve(calculateRate(body)),
    postEligibility: jest.fn(),
    fetchProducts: jest.fn(),
    fetchValidationRules: jest.fn(),
  };
});

const mockUseSim = useSim as unknown as jest.Mock;

function makeFlow(): Flow {
  return { next: jest.fn(), back: jest.fn(), goTo: jest.fn() };
}

function renderStep(state: SimState, flow: Flow) {
  return render(
    <LazyMotion features={domAnimation}>
      <ResultsStep flow={flow} />
    </LazyMotion>,
  );
}

/** Same numbers the e2e suite uses for a comfortably affordable personal loan. */
const affordableState: SimState = {
  ...initialState,
  loanType: 'personal',
  income: { grossIncome: 30000, netIncome: 24000 },
  expenses: { housing: 6000, transport: 500, living: 500, other: 500, existingDebt: 500 },
  loan: { amount: 20000, months: 36 },
};

/** Same numbers the e2e suite uses for an unaffordable loan. */
const unaffordableState: SimState = {
  ...affordableState,
  income: { grossIncome: 8000, netIncome: 6500 },
  expenses: { housing: 6000, transport: 500, living: 500, other: 500, existingDebt: 500 },
};

describe('ResultsStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLoanApi.setState({
      status: 'ready',
      rules: VALIDATION_RULES,
      products: LOAN_PRODUCTS,
      quoteStatus: 'idle',
      quote: null,
      quoteKey: null,
      quoteError: null,
    });
  });

  test('shows the empty state and sends the user back to the start when inputs are missing', () => {
    const flow = makeFlow();
    mockUseSim.mockReturnValue({ state: initialState });
    renderStep(initialState, flow);

    expect(screen.getByText('We need a few more details')).toBeTruthy();
    const back = screen.getByRole('button', { name: 'Go back to the start' });
    (back as HTMLButtonElement).click();
    expect(flow.goTo).toHaveBeenCalledWith(0);
  });

  test('shows a loading skeleton before the fake delay finishes', () => {
    mockUseSim.mockReturnValue({ state: affordableState });
    renderStep(affordableState, makeFlow());

    expect(screen.getByText('Calculating your result')).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
  });

  test('renders the instalment and an affordable verdict once loading finishes', async () => {
    mockUseSim.mockReturnValue({ state: affordableState });
    renderStep(affordableState, makeFlow());

    await waitFor(() => expect(screen.getByTestId('instalment').textContent).toMatch(/669/), { timeout: 3000 });
    const verdict = screen.getByTestId('verdict');
    expect(verdict.getAttribute('data-verdict')).toBe('affordable');
    expect((screen.getByRole('button', { name: 'Continue to eligibility' }) as HTMLButtonElement).disabled).toBe(false);
  });

  test('disables eligibility when the instalment is unaffordable', async () => {
    mockUseSim.mockReturnValue({ state: unaffordableState });
    renderStep(unaffordableState, makeFlow());

    await waitFor(() => expect(screen.getByTestId('verdict').getAttribute('data-verdict')).toBe('unaffordable'), { timeout: 3000 });
    expect((screen.getByRole('button', { name: 'Continue to eligibility' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
