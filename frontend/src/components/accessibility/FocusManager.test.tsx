import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FocusManager } from './FocusManager'

describe('FocusManager', () => {
  it('does not steal focus on initial render', () => {
    const { container } = render(
      <FocusManager focusKey="step-1" heading="Step one">
        <p>First step</p>
      </FocusManager>,
    )

    expect(container.firstChild).not.toHaveFocus()
  })

  it('moves focus to the region when the focus key changes', () => {
    const { container, rerender } = render(
      <FocusManager focusKey="step-1" heading="Step one">
        <p>First step</p>
      </FocusManager>,
    )

    rerender(
      <FocusManager focusKey="step-2" heading="Step two">
        <p>Second step</p>
      </FocusManager>,
    )

    expect(container.firstChild).toHaveFocus()
    expect(screen.getByRole('heading', { name: 'Step two' })).toBeInTheDocument()
  })

  it('does not move focus when disabled', () => {
    const { container, rerender } = render(
      <FocusManager focusKey="step-1" enabled={false}>
        <p>First step</p>
      </FocusManager>,
    )

    rerender(
      <FocusManager focusKey="step-2" enabled={false}>
        <p>Second step</p>
      </FocusManager>,
    )

    expect(container.firstChild).not.toHaveFocus()
  })
})
