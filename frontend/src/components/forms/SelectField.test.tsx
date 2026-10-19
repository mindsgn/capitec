import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SelectField } from './SelectField'
import type { SelectOption } from './SelectField'

const options: readonly SelectOption[] = [
  { value: '6', label: '6 months' },
  { value: '24', label: '24 months' },
  { value: '60', label: '60 months', disabled: true },
]

function ControlledSelect() {
  const [value, setValue] = useState('6')
  return (
    <SelectField
      label="Repayment term"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      options={options}
    />
  )
}

describe('SelectField', () => {
  it('renders the options and associates the label with the select', async () => {
    const user = userEvent.setup()
    render(<ControlledSelect />)

    const select = screen.getByLabelText('Repayment term')
    expect(screen.getByRole('option', { name: '24 months' })).toBeInTheDocument()

    await user.selectOptions(select, '24')
    expect(select).toHaveValue('24')
  })

  it('renders a disabled option as unselectable', () => {
    render(<ControlledSelect />)

    expect(screen.getByRole('option', { name: '60 months' })).toBeDisabled()
  })

  it('links the error message and marks the select invalid', () => {
    render(
      <SelectField
        label="Repayment term"
        value=""
        onChange={() => {}}
        options={options}
        error="Select a repayment term"
      />,
    )

    const select = screen.getByLabelText('Repayment term')
    const error = screen.getByText('Select a repayment term')

    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select.getAttribute('aria-describedby')).toContain(error.id)
  })

  it('shows a placeholder option for unselected values', () => {
    render(
      <SelectField
        label="Repayment term"
        value=""
        onChange={() => {}}
        options={options}
        placeholder="Choose a term"
      />,
    )

    expect(screen.getByRole('option', { name: 'Choose a term' })).toBeInTheDocument()
  })

  it('forwards a change to the caller', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SelectField label="Repayment term" value="6" onChange={onChange} options={options} />,
    )

    await user.selectOptions(screen.getByLabelText('Repayment term'), '24')

    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
