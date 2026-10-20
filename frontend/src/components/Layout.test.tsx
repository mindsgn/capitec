/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer, Header } from '@/components/Layout';
import { SimulatorProvider } from '@/state/SimulatorContext';

function renderInApp(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <SimulatorProvider>{ui}</SimulatorProvider>
    </MemoryRouter>,
  );
}

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
});

describe('Footer', () => {
  test('shows the same Capitec brand name', () => {
    renderInApp(<Footer />);
    expect(screen.getByText('Capitec')).toBeTruthy();
  });
});
