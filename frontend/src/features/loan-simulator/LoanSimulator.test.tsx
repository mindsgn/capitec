import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLoanSimulatorStore } from './loanSimulatorStore'
import { LoanSimulator } from './LoanSimulator'

beforeEach(() => {
  useLoanSimulatorStore.getState().reset()
})

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Loan amount'), '100000')
  await user.selectOptions(screen.getByLabelText('Repayment term'), '24')
  await user.type(screen.getByLabelText('Monthly income'), '50000')
  await user.type(screen.getByLabelText('Monthly expenses'), '10000')
  await user.type(screen.getByLabelText(/existing monthly debt/i), '5000')
}

describe('LoanSimulator integration', () => {
  it('offers a skip link and a focusable main landmark', () => {
    render(<LoanSimulator />)

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('shows an error summary, keeps empty input empty, and focuses the summary on invalid submit', async () => {
    const user = userEvent.setup()
    render(<LoanSimulator />)

    await user.click(screen.getByRole('button', { name: 'Update estimate' }))

    const summary = screen.getByRole('alert')
    expect(summary).toHaveFocus()
    expect(within(summary).getByText('Please correct the following errors')).toBeInTheDocument()
    expect(within(summary).getByText('Enter loan amount.')).toBeInTheDocument()
    expect(screen.getByLabelText('Loan amount')).toHaveValue('')
  })

  it('links a summary entry to its field', async () => {
    const user = userEvent.setup()
    render(<LoanSimulator />)

    await user.click(screen.getByRole('button', { name: 'Update estimate' }))
    fireEvent.click(screen.getByRole('link', { name: 'Enter loan amount.' }))

    expect(screen.getByLabelText('Loan amount')).toHaveFocus()
  })

  it('keeps the loan amount field and the slider in sync', () => {
    render(<LoanSimulator />)

    fireEvent.change(screen.getByLabelText('Adjust the loan amount'), {
      target: { value: '200000' },
    })

    expect(screen.getByLabelText('Loan amount')).toHaveValue('200000')
  })

  it('calculates and announces an estimate after a valid submit', async () => {
    const user = userEvent.setup()
    render(<LoanSimulator />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Update estimate' }))

    const estimateRegion = screen.getByRole('region', { name: 'Your estimate' })
    expect(within(estimateRegion).getByText('Monthly instalment')).toBeInTheDocument()
    expect(within(estimateRegion).getByText('Total borrowing cost')).toBeInTheDocument()
    expect(screen.getByText(/Estimated monthly instalment/)).toBeInTheDocument()
  })

  it('warns when the repayment would leave the user short', async () => {
    const user = userEvent.setup()
    render(<LoanSimulator />)

    await fillValidForm(user)
    await user.type(screen.getByLabelText('Monthly expenses'), '100000')
    await user.click(screen.getByRole('button', { name: 'Update estimate' }))

    expect(screen.getByText(/may not be affordable/i)).toBeInTheDocument()
  })

  it('resets the form only after the user confirms in the dialog', async () => {
    const user = userEvent.setup()
    render(<LoanSimulator />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Update estimate' }))
    expect(
      within(screen.getByRole('region', { name: 'Your estimate' })).getByText('Monthly instalment'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset form' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Loan amount')).toHaveValue('')
    expect(screen.getByText('No estimate yet')).toBeInTheDocument()
  })

  it('keeps the entered values when the reset is cancelled', async () => {
    const user = userEvent.setup()
    render(<LoanSimulator />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await user.click(screen.getByRole('button', { name: 'Keep my details' }))

    expect(screen.getByLabelText('Loan amount')).toHaveValue('100000')
  })

  it('renders translated copy: interpolated bounds, plural options and rich text', () => {
    render(<LoanSimulator />)

    // Bounds are formatted as en-ZA rand at render, never baked into resources.
    expect(
      screen.getByText('Choose an amount between R 5 000 and R 300 000.'),
    ).toBeInTheDocument()

    // Term options come from the pluralised `loan:fields.term.months` key.
    const term = screen.getByLabelText('Repayment term')
    expect(within(term).getByRole('option', { name: '6 months' })).toBeInTheDocument()
    expect(within(term).getByRole('option', { name: '60 months' })).toBeInTheDocument()

    // `<Trans>` keeps the <strong> markup in the resource while interpolating the rate.
    expect(screen.getByText('12.5% per year')).toBeInTheDocument()

    expect(document.title).toBe('Loan eligibility simulator')
  })
})
