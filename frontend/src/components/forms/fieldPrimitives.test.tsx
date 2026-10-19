import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FieldError } from './FieldError'
import { FieldHint } from './FieldHint'
import { FieldLabel } from './FieldLabel'

describe('FieldLabel', () => {
  it('renders a label associated with a control through htmlFor', () => {
    render(
      <>
        <FieldLabel htmlFor="amount">Amount</FieldLabel>
        <input id="amount" />
      </>,
    )

    expect(screen.getByLabelText('Amount')).toBeInTheDocument()
  })

  it('marks required fields with a visible indicator and hidden text', () => {
    render(<FieldLabel required>Amount</FieldLabel>)

    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('(required)')).toBeInTheDocument()
  })

  it('marks optional fields without a required indicator', () => {
    render(<FieldLabel optional>Debt</FieldLabel>)

    expect(screen.getByText('(optional)')).toBeInTheDocument()
    expect(screen.queryByText('(required)')).not.toBeInTheDocument()
  })
})

describe('FieldHint', () => {
  it('exposes the supplied id so a control can reference it', () => {
    render(<FieldHint id="amount-hint">Between R5 000 and R300 000.</FieldHint>)

    expect(screen.getByText('Between R5 000 and R300 000.')).toHaveAttribute('id', 'amount-hint')
  })
})

describe('FieldError', () => {
  it('adds a visually hidden "Error:" prefix so it is not colour-only', () => {
    render(<FieldError>Enter an amount.</FieldError>)

    expect(screen.getByText('Error:')).toBeInTheDocument()
    expect(screen.getByText('Enter an amount.')).toBeInTheDocument()
  })

  it('only announces assertively when asked', () => {
    const { rerender } = render(<FieldError id="e">Enter an amount.</FieldError>)
    expect(screen.getByText('Enter an amount.').closest('p')).not.toHaveAttribute('role')

    rerender(
      <FieldError id="e" announce>
        Enter an amount.
      </FieldError>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount.')
  })
})
