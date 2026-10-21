/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer, Header } from '@/components/Layout';
import i18n from '@/i18n';
import { LANGUAGE_STORAGE_KEY } from '@/i18n/languages';
import { SimulatorProvider } from '@/state/SimulatorContext';

function renderInApp(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <SimulatorProvider>{ui}</SimulatorProvider>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  window.localStorage.clear();
  await i18n.changeLanguage('en');
});

describe('Header', () => {
  test('renders the logo image from the public folder', () => {
    const { getByTestId } = renderInApp(<Header />);
    const logo = getByTestId('header-logo');
    expect(logo.getAttribute('src')).toBe('/logo.png');
    // Decorative: the visible brand name next to it carries the meaning.
    expect(logo.getAttribute('alt')).toBe('');
  });

  test('links home with the Capitec brand name', () => {
    renderInApp(<Header />);
    const homeLink = screen.getByRole('link', { name: 'Capitec' });
    expect(homeLink.getAttribute('href')).toBe('/');
    expect(homeLink.contains(screen.getByTestId('header-logo'))).toBe(true);
  });

  test('switches the interface to Afrikaans and remembers the choice', async () => {
    renderInApp(<Header />);
    const select = screen.getByLabelText('Language') as HTMLSelectElement;
    expect(select.value).toBe('en');
    expect(screen.getByRole('option', { name: 'Afrikaans' })).toBeTruthy();

    fireEvent.change(select, { target: { value: 'af' } });

    await waitFor(() => expect(screen.getByLabelText('Taal')).toBeTruthy());
    expect((screen.getByTestId('language-switcher') as HTMLSelectElement).value).toBe('af');
    expect(document.documentElement.lang).toBe('af');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('af');
  });
});

describe('Footer', () => {
  test('shows the same Capitec brand name', () => {
    renderInApp(<Footer />);
    expect(screen.getByText('Capitec')).toBeTruthy();
  });
});
