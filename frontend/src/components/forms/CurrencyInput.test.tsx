import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { CurrencyInput } from './CurrencyInput'
import type { CurrencyInputProps } from './CurrencyInput'

function ControlledCurrencyInput(props: Partial<CurrencyInputProps>) {
  const [value, setValue] = useState('')
  return (
    <CurrencyInput
      label="Loan amount"
      value={value}
      onChange={setValue}
      {...props}
    />
  )
}

describe('CurrencyInput', () => {
  it('keeps the raw text the user types and never forces grouping separators', async () => {
    const user = userEvent.setup()
    render(<ControlledCurrencyInput />)

    const input = screen.getByLabelText('Loan amount')
    await user.type(input, '150000')

    expect(input).toHaveValue('150000')
  })

  it('stays empty when nothing is entered rather than showing zero', () => {
    render(<ControlledCurrencyInput />)

    expect(screen.getByLabelText('Loan amount')).toHaveValue('')
  })

  it('reports each change upward as a string', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencyInput label="Loan amount" value="" onChange={onChange} />)

    await user.type(screen.getByLabelText('Loan amount'), '250')

    expect(onChange).toHaveBeenCalledWith('2')
  })

  it('announces unparseable input as invalid', async () => {
    const user = userEvent.setup()
    render(<ControlledCurrencyInput />)

    const input = screen.getByLabelText('Loan amount')
    await user.type(input, 'abc')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(
      screen.getByText('Enter a valid rand amount, for example 150000 or 150000,50.'),
    ).toBeInTheDocument()
  })

  it('surfaces its own range error when a minimum is supplied', async () => {
    const user = userEvent.setup()
    render(<ControlledCurrencyInput min={5000} />)

    await user.type(screen.getByLabelText('Loan amount'), '100')

    expect(screen.getByText(/Amount must be at least/)).toBeInTheDocument()
  })

  it('lets an explicit error override the internal message', async () => {
    const user = userEvent.setup()
    render(<ControlledCurrencyInput error="Loan amount is required" />)

    const input = screen.getByLabelText('Loan amount')
    await user.type(input, 'abc')

    expect(screen.getByText('Loan amount is required')).toBeInTheDocument()
    expect(
      screen.queryByText('Enter a valid rand amount, for example 150000 or 150000,50.'),
    ).not.toBeInTheDocument()
  })

  it('links a hint and error to the control and marks it required', () => {
    render(
      <CurrencyInput
        label="Monthly income"
        value=""
        onChange={() => {}}
        hint="Before deductions"
        error="Enter your income"
        required
      />,
    )

    const input = screen.getByLabelText(/monthly income/i)
    const describedBy = input.getAttribute('aria-describedby') ?? ''

    expect(describedBy).toContain(screen.getByText('Before deductions').id)
    expect(describedBy).toContain(screen.getByText('Enter your income').id)
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(screen.getByText('(required)')).toBeInTheDocument()
  })
})
