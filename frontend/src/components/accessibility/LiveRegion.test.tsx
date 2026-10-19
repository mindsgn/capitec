import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LiveRegion } from './LiveRegion'

describe('LiveRegion', () => {
  it('announces politely by default', () => {
    render(<LiveRegion message="Estimate updated." />)

    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('aria-atomic', 'true')
    expect(region).toHaveTextContent('Estimate updated.')
  })

  it('can be assertive when a message is urgent', () => {
    render(<LiveRegion message="Something went wrong." mode="assertive" />)

    const region = screen.getByRole('alert')
    expect(region).toHaveAttribute('aria-live', 'assertive')
  })

  it('is visually hidden by default and can be shown', () => {
    const { rerender } = render(<LiveRegion message="Hidden" />)
    expect(screen.getByRole('status')).toHaveClass('sr-only')

    rerender(<LiveRegion message="Shown" visible />)
    expect(screen.getByRole('status')).not.toHaveClass('sr-only')
  })

  it('updates its text when the message changes', () => {
    const { rerender } = render(<LiveRegion message="First estimate." />)

    rerender(<LiveRegion message="Second estimate." />)

    expect(screen.getByRole('status')).toHaveTextContent('Second estimate.')
  })

  it('keeps the same DOM text node when the message is unchanged', () => {
    const { rerender } = render(<LiveRegion message="Same estimate." />)
    const region = screen.getByRole('status')
    const textNode = region.firstChild

    rerender(<LiveRegion message="Same estimate." />)

    expect(screen.getByRole('status').firstChild).toBe(textNode)
  })
})
