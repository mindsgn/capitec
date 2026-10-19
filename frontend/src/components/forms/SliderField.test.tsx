import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SliderField } from './SliderField'

/** Normalises the non-breaking spaces `Intl` emits so assertions stay readable. */
const plain = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ')

describe('SliderField', () => {
  it('associates the label with the range input and exposes the value text', () => {
    render(<SliderField label="Amount" value={150000} onChange={() => {}} min={5000} max={300000} step={1000} />)

    const slider = screen.getByLabelText('Amount') as HTMLInputElement
    expect(slider.value).toBe('150000')
    expect(plain(slider.getAttribute('aria-valuetext') ?? '')).toBe('150 000')
  })

  it('reports a numeric value when moved', () => {
    const onChange = vi.fn()
    render(<SliderField label="Amount" value={150000} onChange={onChange} min={5000} max={300000} />)

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '200000' } })

    expect(onChange).toHaveBeenCalledWith(200000)
  })

  it('clamps an out-of-range value to the bounds so it can never leave the range', () => {
    render(<SliderField label="Amount" value={999999} onChange={() => {}} min={5000} max={300000} />)

    expect((screen.getByLabelText('Amount') as HTMLInputElement).value).toBe('300000')
  })

  it('falls back to the minimum for a non-finite value', () => {
    render(<SliderField label="Amount" value={Number.NaN} onChange={() => {}} min={5000} max={300000} />)

    expect((screen.getByLabelText('Amount') as HTMLInputElement).value).toBe('5000')
  })

  it('formats a currency value for display without forcing cents', () => {
    render(
      <SliderField label="Amount" value={150000} onChange={() => {}} min={5000} max={300000} format="currency" />,
    )

    const slider = screen.getByLabelText('Amount')
    expect(plain(slider.getAttribute('aria-valuetext') ?? '')).toBe('R 150 000')
  })

  it('marks the slider invalid and links the error when one is supplied', () => {
    render(<SliderField label="Amount" value={150000} onChange={() => {}} error="Amount is out of range" />)

    const slider = screen.getByLabelText('Amount')
    expect(slider).toHaveAttribute('aria-invalid', 'true')
    expect(slider.getAttribute('aria-describedby')).toContain(
      screen.getByText('Amount is out of range').id,
    )
  })
})
