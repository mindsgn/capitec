import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Alert } from './Alert'
import { InfoBanner } from './InfoBanner'

describe('Alert', () => {
  it('uses a status role for non-urgent info messages', () => {
    render(<Alert variant="info">Your estimate is ready.</Alert>)

    expect(screen.getByRole('status')).toHaveTextContent('Your estimate is ready.')
  })

  it('uses an alert role for urgent warning and error messages', () => {
    const { rerender } = render(<Alert variant="warning">Check your details.</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(<Alert variant="error">Something went wrong.</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('adds a visually hidden variant word so meaning is never colour-only', () => {
    render(<Alert variant="success">Saved.</Alert>)

    expect(screen.getByText('Success:')).toBeInTheDocument()
  })

  it('allows the role to be overridden', () => {
    render(
      <Alert variant="warning" role="status">
        Gentle reminder.
      </Alert>,
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders a dismiss button only when a handler is supplied', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    const { rerender } = render(<Alert>Message</Alert>)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<Alert onDismiss={onDismiss}>Message</Alert>)
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('InfoBanner', () => {
  it('defaults to a note role so a static banner is not re-announced', () => {
    render(<InfoBanner heading="Illustrative only">Not a loan approval.</InfoBanner>)

    expect(screen.getByRole('note')).toHaveTextContent('Not a loan approval.')
  })
})
