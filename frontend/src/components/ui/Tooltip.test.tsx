import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  it('gives the trigger an accessible name and opens on focus', async () => {
    const user = userEvent.setup()
    render(<Tooltip content="The yearly cost of borrowing." />)

    const trigger = screen.getByRole('button', { name: 'The yearly cost of borrowing.' })
    expect(trigger).toBeInTheDocument()

    await user.tab()
    expect(trigger).toHaveFocus()

    const tooltipId = trigger.getAttribute('aria-describedby')
    expect(tooltipId).toBeTruthy()
    expect(document.getElementById(tooltipId as string)).toHaveTextContent(
      'The yearly cost of borrowing.',
    )
  })

  it('closes on Escape while keeping focus on the trigger', async () => {
    const user = userEvent.setup()
    render(<Tooltip content="More information" label="Help about rates" />)

    const trigger = screen.getByRole('button', { name: 'Help about rates' })
    await user.tab()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes when focus leaves the trigger', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Tooltip content="Help about rates" label="Help about rates" />
        <button type="button">Next</button>
      </>,
    )

    await user.tab()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.tab()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('opens on activation for pointer and touch users', async () => {
    const user = userEvent.setup()
    render(<Tooltip content="Help about rates" label="Help about rates" />)

    const trigger = screen.getByRole('button', { name: 'Help about rates' })
    await user.click(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
