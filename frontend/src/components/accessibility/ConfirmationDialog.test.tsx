import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmationDialog } from './ConfirmationDialog'

function Harness({
  onConfirm = () => {},
  onCancel,
}: {
  onConfirm?: () => void
  onCancel?: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Reset
      </button>
      <ConfirmationDialog
        open={open}
        title="Reset the form?"
        description="This cannot be undone."
        confirmLabel="Reset form"
        cancelLabel="Keep my details"
        onConfirm={() => {
          onConfirm()
          setOpen(false)
        }}
        onCancel={() => {
          onCancel?.()
          setOpen(false)
        }}
      />
    </>
  )
}

describe('ConfirmationDialog', () => {
  it('opens modally and moves focus to the cancel action', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)

    expect(container.querySelector('dialog')).not.toHaveAttribute('open')

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('open')
    expect(screen.getByRole('button', { name: 'Keep my details' })).toHaveFocus()
  })

  it('calls onConfirm only when the user confirms', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onConfirm).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Reset form' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel for the cancel action', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<Harness onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await user.click(screen.getByRole('button', { name: 'Keep my details' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('treats an Escape dismissal as a cancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<Harness onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel'))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('returns focus to the element that opened it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const trigger = screen.getByRole('button', { name: 'Reset' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Keep my details' }))

    expect(trigger).toHaveFocus()
  })
})
