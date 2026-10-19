import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { RadioGroup } from './RadioGroup'
import type { RadioOption } from './RadioGroup'

const options: readonly RadioOption[] = [
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'unemployed', label: 'Unemployed', disabled: true },
]

function ControlledRadioGroup() {
  const [value, setValue] = useState('')
  return (
    <RadioGroup
      label="Employment status"
      name="employment"
      options={options}
      value={value}
      onChange={setValue}
    />
  )
}

describe('RadioGroup', () => {
  it('groups the options under a legend with a shared name', async () => {
    const user = userEvent.setup()
    render(<ControlledRadioGroup />)

    expect(screen.getByRole('group', { name: /employment status/i })).toBeInTheDocument()

    const employed = screen.getByRole('radio', { name: 'Employed' })
    const selfEmployed = screen.getByRole('radio', { name: 'Self-employed' })
    expect(employed).toHaveAttribute('name', 'employment')
    expect(selfEmployed).toHaveAttribute('name', 'employment')

    await user.click(selfEmployed)
    expect(selfEmployed).toBeChecked()
    expect(employed).not.toBeChecked()
  })

  it('calls the change handler with the selected value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <RadioGroup
        label="Employment status"
        name="employment"
        options={options}
        value=""
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('radio', { name: 'Employed' }))

    expect(onChange).toHaveBeenCalledWith('employed')
  })

  it('disables individual options', () => {
    render(<ControlledRadioGroup />)

    expect(screen.getByRole('radio', { name: 'Unemployed' })).toBeDisabled()
  })

  it('links a hint and error to the group and marks it required', () => {
    render(
      <RadioGroup
        label="Employment status"
        name="employment"
        options={options}
        value=""
        onChange={() => {}}
        hint="Pick one"
        error="Choose your employment status"
        required
      />,
    )

    const group = screen.getByRole('group')
    const describedBy = group.getAttribute('aria-describedby') ?? ''

    expect(group).toHaveAttribute('aria-required', 'true')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(describedBy).toContain(screen.getByText('Pick one').id)
    expect(describedBy).toContain(screen.getByText('Choose your employment status').id)
    expect(screen.getByText('(required)')).toBeInTheDocument()
  })
})
