/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { LoanDetailsStep } from '@/components/steps/Affordability';
import '@/i18n';
import { useSim } from '@/state/SimulatorContext';
import { initialState, type SimState } from '@/lib/state';
import type { Flow } from '@/components/steps/types';

jest.mock('@/state/SimulatorContext', () => ({ useSim: jest.fn() }));

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
  beforeEach(() => jest.clearAllMocks());

  test('renders nothing until a loan type is chosen', () => {
    const { container } = renderStep({ ...baseState, loanType: null });
    expect(container.innerHTML).toBe('');
  });

  test('shows the prefilled defaults and a term breakdown in years', () => {
    renderStep(baseState);
    expect((screen.getByTestId('amount') as HTMLInputElement).value).toBe('20000');
    expect(screen.getByTestId('term-label').textContent).toBe('36 months (3y)');
    expect(screen.getByText('Estimated instalment at an indicative 24% a year')).toBeTruthy();
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
