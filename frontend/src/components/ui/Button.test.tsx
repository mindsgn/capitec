import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'
import { PrimaryButton } from './PrimaryButton'
import { SecondaryButton } from './SecondaryButton'

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  it('can opt in to type="submit"', () => {
    render(<Button type="submit">Calculate</Button>)

    expect(screen.getByRole('button', { name: 'Calculate' })).toHaveAttribute('type', 'submit')
  })

  it('calls the click handler', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disables itself and flags busy while loading to block duplicate activation', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button loading loadingLabel="Calculating" onClick={onClick}>
        Calculate
      </Button>,
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText(', Calculating')).toBeInTheDocument()

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('forwards a ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Save</Button>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})

describe('PrimaryButton and SecondaryButton', () => {
  it('render as accessible buttons with their labels', () => {
    render(
      <>
        <PrimaryButton>Update estimate</PrimaryButton>
        <SecondaryButton>Reset</SecondaryButton>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Update estimate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })
})
