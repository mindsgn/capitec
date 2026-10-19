import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SkipLink } from './SkipLink'

describe('SkipLink', () => {
  it('is an anchor to the main content that is visually hidden until focused', () => {
    render(<SkipLink />)

    const link = screen.getByRole('link', { name: 'Skip to main content' })
    expect(link).toHaveAttribute('href', '#main-content')
    expect(link).toHaveClass('sr-only')
  })

  it('supports a custom target and label', () => {
    render(
      <SkipLink targetId="results" className="custom">
        Skip to results
      </SkipLink>,
    )

    const link = screen.getByRole('link', { name: 'Skip to results' })
    expect(link).toHaveAttribute('href', '#results')
    expect(link).toHaveClass('custom')
  })
})
