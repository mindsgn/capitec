import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FormErrorSummary } from './FormErrorSummary'

describe('FormErrorSummary', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<FormErrorSummary errors={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('summarises each translated error as a link to its control', () => {
    render(
      <FormErrorSummary
        errors={[
          { fieldId: 'loanAmount', key: 'loanAmount.required' },
          { fieldId: 'monthlyIncome', key: 'monthlyIncome.required' },
        ]}
      />,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Enter loan amount.' })).toHaveAttribute(
      'href',
      '#loanAmount',
    )
    expect(screen.getByRole('link', { name: 'Enter monthly income.' })).toHaveAttribute(
      'href',
      '#monthlyIncome',
    )
  })

  it('interpolates currency values into a translated message', () => {
    render(
      <FormErrorSummary
        errors={[{ fieldId: 'loanAmount', key: 'loanAmount.range', values: { min: 5_000, max: 300_000 } }]}
      />,
    )

    // `en-ZA` currency uses non-breaking spaces; normalise before asserting.
    const link = screen.getByRole('link')
    expect((link.textContent ?? '').replace(/[\u00a0\u202f]/g, ' ')).toBe(
      'Loan amount must be between R 5 000 and R 300 000.',
    )
  })

  it('uses a translated default heading and honours an explicit override', () => {
    const { rerender } = render(<FormErrorSummary errors={[{ fieldId: 'loanAmount', key: 'loanAmount.required' }]} />)

    expect(screen.getByText('Please correct the following errors')).toBeInTheDocument()

    rerender(
      <FormErrorSummary
        title="Fix these fields"
        errors={[{ fieldId: 'loanAmount', key: 'loanAmount.required' }]}
      />,
    )

    expect(screen.getByText('Fix these fields')).toBeInTheDocument()
  })

  it('moves focus to the summary when errors first appear and autoFocus is set', () => {
    const { rerender } = render(<FormErrorSummary errors={[]} autoFocus />)

    rerender(
      <FormErrorSummary autoFocus errors={[{ fieldId: 'loanAmount', key: 'loanAmount.required' }]} />,
    )

    expect(screen.getByRole('alert')).toHaveFocus()
  })

  it('focuses the matching control when a summary link is clicked', () => {
    render(
      <>
        <FormErrorSummary errors={[{ fieldId: 'loanAmount', key: 'loanAmount.required' }]} />
        <input id="loanAmount" aria-label="Loan amount" />
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Enter loan amount.' }))

    expect(screen.getByLabelText('Loan amount')).toHaveFocus()
  })

  it('handles a missing target gracefully without throwing', () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(<FormErrorSummary errors={[{ fieldId: 'ghost', key: 'ghost.required' }]} />)

    expect(() =>
      fireEvent.click(screen.getByRole('link', { name: 'ghost.required' })),
    ).not.toThrow()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
