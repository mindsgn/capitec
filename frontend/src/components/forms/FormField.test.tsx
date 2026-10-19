import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FormField } from './FormField'

describe('FormField', () => {
  it('associates the label with the control and wires the hint and error through aria-describedby', () => {
    render(
      <FormField label="Email address" hint="We never share it" error="Enter an email address">
        <input type="email" />
      </FormField>,
    )

    const input = screen.getByLabelText('Email address')
    const describedBy = input.getAttribute('aria-describedby')
    const hint = screen.getByText('We never share it')
    const error = screen.getByText('Enter an email address')

    expect(describedBy).toContain(hint.id)
    expect(describedBy).toContain(error.id)
  })

  it('marks the control required for assistive technology as well as visually', () => {
    render(
      <FormField label="Amount" required>
        <input />
      </FormField>,
    )

    const input = screen.getByLabelText(/amount/i)
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(screen.getByText('(required)')).toBeInTheDocument()
  })

  it('flags the control invalid only when an error is present', () => {
    const { rerender } = render(
      <FormField label="Amount">
        <input />
      </FormField>,
    )

    expect(screen.getByLabelText('Amount')).not.toHaveAttribute('aria-invalid')

    rerender(
      <FormField label="Amount" error="Amount is required">
        <input />
      </FormField>,
    )

    expect(screen.getByLabelText('Amount')).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not clobber a describedby value already set on the control', () => {
    render(
      <>
        <p id="external-help">External help</p>
        <FormField label="Amount" hint="Inline hint">
          <input aria-describedby="external-help" />
        </FormField>
      </>,
    )

    const describedBy = screen.getByLabelText('Amount').getAttribute('aria-describedby') ?? ''
    expect(describedBy).toContain('external-help')
    expect(describedBy).toContain(screen.getByText('Inline hint').id)
  })

  it('uses an explicit id so error summary links can resolve to the control', () => {
    render(
      <FormField label="Amount" id="loanAmount">
        <input />
      </FormField>,
    )

    expect(screen.getByLabelText('Amount')).toHaveAttribute('id', 'loanAmount')
  })
})
