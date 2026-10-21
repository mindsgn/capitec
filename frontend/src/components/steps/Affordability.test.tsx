/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import type { RateRequest } from '@/lib/api/contracts';
import { LoanDetailsStep } from '@/components/steps/Affordability';
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

// Radix sliders measure their thumbs with ResizeObserver, which jsdom does not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= ResizeObserverStub;

const flow: Flow = { next: jest.fn(), back: jest.fn(), goTo: jest.fn() };

const baseState: SimState = { ...initialState, loanType: 'personal', loan: { amount: 20000, months: 36 } };

function renderStep(state: SimState) {
  mockUseSim.mockReturnValue({ state, update: jest.fn() });
  return render(<LoanDetailsStep flow={flow} />);
}

describe('LoanDetailsStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLoanApi.setState({ status: 'ready', rules: VALIDATION_RULES, products: LOAN_PRODUCTS, quoteStatus: 'idle', quote: null, quoteKey: null, quoteError: null });
  });

  test('renders nothing until a loan type is chosen', () => {
    const { container } = renderStep({ ...baseState, loanType: null });
    expect(container.innerHTML).toBe('');
  });

  test('shows the prefilled defaults and a term breakdown in years', async () => {
    renderStep(baseState);
    expect((screen.getByTestId('amount') as HTMLInputElement).value).toBe('20000');
    expect(screen.getByTestId('term-label').textContent).toBe('36 months (3y)');
    await waitFor(() => expect(screen.getByText('Estimated instalment at an indicative 12.5% a year')).toBeTruthy());
    expect((screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  test('keeps Continue disabled and shows the range error for an amount below the minimum', async () => {
    renderStep({ ...baseState, loan: { ...baseState.loan, amount: 100 } });
    const cont = screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;
    expect(cont.disabled).toBe(true);
    // NumberField only surfaces the error once a value is present; waitFor covers the re-render.
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/between R/i));
  });

  test('renders a live instalment preview once the inputs are valid', async () => {
    renderStep(baseState);
    const preview = document.querySelector('p[aria-live="polite"]');
    // CountUp animates from zero to the real figure, so wait for it to settle.
    await waitFor(() => expect(preview?.textContent).toMatch(/R\s?[\d.,\s]+.*per month/), { timeout: 3000 });
  });
});
