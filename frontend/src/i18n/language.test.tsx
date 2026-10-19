import { act, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import i18n from './index'
import { Alert } from '@/components/ui/Alert'
import { FormErrorSummary } from '@/components/accessibility/FormErrorSummary'
import { SkipLink } from '@/components/accessibility/SkipLink'

/**
 * A deliberately partial second language. Only English ships with the
 * application, so this pseudo-language exists purely to prove the wiring:
 * switching the language updates visible text and accessible names in place,
 * missing keys fall back to English, and currency stays `en-ZA`/`ZAR`.
 */
const PSEUDO_LANGUAGE = 'af'

const PSEUDO_RESOURCES = {
  accessibility: {
    skipLink: 'Gaan na die hoofinhoud',
    errorSummary: { title: 'Korrigeer die volgende foute' },
  },
  common: {
    actions: { dismiss: 'Verwyder die waarskuwing' },
  },
  validation: {
    loanAmount: { required: 'Voer die leningsbedrag in.' },
  },
} as const

beforeAll(() => {
  i18n.addResourceBundle(
    PSEUDO_LANGUAGE,
    'accessibility',
    PSEUDO_RESOURCES.accessibility,
    true,
    true,
  )
  i18n.addResourceBundle(PSEUDO_LANGUAGE, 'common', PSEUDO_RESOURCES.common, true, true)
  i18n.addResourceBundle(PSEUDO_LANGUAGE, 'validation', PSEUDO_RESOURCES.validation, true, true)
})

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en')
  })
})

afterAll(() => {
  i18n.removeResourceBundle(PSEUDO_LANGUAGE, 'accessibility')
  i18n.removeResourceBundle(PSEUDO_LANGUAGE, 'common')
  i18n.removeResourceBundle(PSEUDO_LANGUAGE, 'validation')
})

async function changeLanguage(language: string) {
  await act(async () => {
    await i18n.changeLanguage(language)
  })
}

describe('language switching', () => {
  it('renders the default language first', () => {
    render(<SkipLink />)

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument()
  })

  it('updates visible text in place without remounting the component', async () => {
    const { container } = render(<SkipLink />)
    const before = container.querySelector('a')

    await changeLanguage(PSEUDO_LANGUAGE)
    expect(screen.getByRole('link', { name: 'Gaan na die hoofinhoud' })).toBeInTheDocument()

    await changeLanguage('en')
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument()

    expect(container.querySelector('a')).toBe(before)
  })

  it('updates accessible names used by controls', async () => {
    render(<Alert onDismiss={() => {}}>Something happened</Alert>)

    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()

    await changeLanguage(PSEUDO_LANGUAGE)

    expect(
      screen.getByRole('button', { name: 'Verwyder die waarskuwing' }),
    ).toBeInTheDocument()
  })

  it('retranslates validation messages after a language change', async () => {
    const errors = [
      { fieldId: 'loanAmount', key: 'loanAmount.required' },
      { fieldId: 'loanTerm', key: 'loanTerm.range', values: { min: 6, max: 60, format: 'number' } },
    ] as const

    render(<FormErrorSummary errors={errors} />)

    expect(screen.getByText('Please correct the following errors')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Enter loan amount.' })).toBeInTheDocument()

    await changeLanguage(PSEUDO_LANGUAGE)

    expect(screen.getByText('Korrigeer die volgende foute')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voer die leningsbedrag in.' })).toBeInTheDocument()

    // `loanTerm.range` is not translated yet, so it falls back to English and
    // still formats the bounds as South African rand.
    const fallbackLink = screen.getAllByRole('link')[1]
    expect((fallbackLink?.textContent ?? '').replace(/[\u00a0\u202f]/g, ' ')).toBe(
      'Loan term must be between 6 and 60 months.',
    )
  })

  it('keeps currency formatting independent of the interface language', async () => {
    const errors = [
      { fieldId: 'loanAmount', key: 'loanAmount.range', values: { min: 5_000, max: 300_000 } },
    ] as const

    render(<FormErrorSummary errors={errors} />)
    await changeLanguage(PSEUDO_LANGUAGE)

    const link = screen.getByRole('link')
    expect((link.textContent ?? '').replace(/[\u00a0\u202f]/g, ' ')).toBe(
      'Loan amount must be between R 5 000 and R 300 000.',
    )
  })
})
