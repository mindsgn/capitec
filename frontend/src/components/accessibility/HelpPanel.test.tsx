import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { HelpPanel } from './HelpPanel'

describe('HelpPanel', () => {
  it('always shows the disclaimer outside the disclosure', () => {
    render(<HelpPanel />)

    expect(screen.getByText(/not a loan approval/i)).toBeInTheDocument()
  })

  it('collapses the extra detail behind an accessible disclosure by default', () => {
    const { container } = render(<HelpPanel />)

    expect(container.querySelector('details')).not.toHaveAttribute('open')
  })

  it('lets users expand the extra detail', async () => {
    const user = userEvent.setup()
    const { container } = render(<HelpPanel />)

    await user.click(screen.getByText('What affects the estimate'))

    expect(container.querySelector('details')).toHaveAttribute('open')
  })

  it('supports starting open and a custom heading', () => {
    const { container } = render(<HelpPanel title="About this estimate" defaultOpen />)

    expect(screen.getByRole('heading', { name: 'About this estimate' })).toBeInTheDocument()
    expect(container.querySelector('details')).toHaveAttribute('open')
  })
})
