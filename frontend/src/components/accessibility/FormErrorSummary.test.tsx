import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FormErrorSummary } from './FormErrorSummary'

describe('FormErrorSummary', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<FormErrorSummary errors={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('summarises each error as a link to its control', () => {
    render(
      <FormErrorSummary
        errors={[
          { fieldId: 'loanAmount', message: 'Enter the loan amount.' },
          { fieldId: 'monthlyIncome', message: 'Enter your monthly income.' },
        ]}
      />,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Enter the loan amount.' })).toHaveAttribute(
      'href',
      '#loanAmount',
    )
  })

  it('moves focus to the summary when errors first appear and autoFocus is set', () => {
    const { rerender } = render(<FormErrorSummary errors={[]} autoFocus />)

    rerender(
      <FormErrorSummary
        autoFocus
        errors={[{ fieldId: 'loanAmount', message: 'Enter the loan amount.' }]}
      />,
    )

    expect(screen.getByRole('alert')).toHaveFocus()
  })

  it('focuses the matching control when a summary link is clicked', () => {
    render(
      <>
        <FormErrorSummary errors={[{ fieldId: 'loanAmount', message: 'Enter the loan amount.' }]} />
        <input id="loanAmount" aria-label="Loan amount" />
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Enter the loan amount.' }))

    expect(screen.getByLabelText('Loan amount')).toHaveFocus()
  })

  it('handles a missing target gracefully without throwing', () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(<FormErrorSummary errors={[{ fieldId: 'ghost', message: 'Unknown field.' }]} />)

    expect(() =>
      fireEvent.click(screen.getByRole('link', { name: 'Unknown field.' })),
    ).not.toThrow()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
