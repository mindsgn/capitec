import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Card } from './Card'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders a heading, description and optional action', () => {
    render(
      <EmptyState
        title="No estimate yet"
        description="Update the form to see an estimate."
        action={<button type="button">Update estimate</button>}
      />,
    )

    expect(screen.getByRole('heading', { level: 3, name: 'No estimate yet' })).toBeInTheDocument()
    expect(screen.getByText('Update the form to see an estimate.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update estimate' })).toBeInTheDocument()
  })

  it('honours the requested heading level', () => {
    render(<EmptyState title="Nothing here" headingLevel={2} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Nothing here' })).toBeInTheDocument()
  })
})

describe('Card', () => {
  it('renders a titled section with description, content and footer', () => {
    render(
      <Card title="Your estimate" description="Illustrative only" footer={<span>Footer</span>}>
        <p>Body content</p>
      </Card>,
    )

    const region = screen.getByRole('region', { name: 'Your estimate' })
    expect(region).toBeInTheDocument()
    expect(screen.getByText('Illustrative only')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('renders as an article when requested', () => {
    render(
      <Card as="article" title="Article card">
        <p>Content</p>
      </Card>,
    )

    expect(screen.getByRole('article', { name: 'Article card' })).toBeInTheDocument()
  })
})
