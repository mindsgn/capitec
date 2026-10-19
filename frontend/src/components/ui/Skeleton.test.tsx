import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('hides decorative shapes from assistive technology', () => {
    const { container } = render(<Skeleton width={120} height={16} />)

    const skeleton = container.firstElementChild as HTMLElement
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders the requested number of text lines', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />)

    expect(container.querySelectorAll('div[aria-hidden="true"] > div')).toHaveLength(3)
  })

  it('renders a single element for the rect and circle variants', () => {
    const { container, rerender } = render(<Skeleton variant="circle" width={40} height={40} />)

    expect(container.childElementCount).toBe(1)

    rerender(<Skeleton variant="rect" width="100%" height={80} />)
    expect(container.childElementCount).toBe(1)
  })
})
