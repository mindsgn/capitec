import { getI18n } from 'react-i18next'
import { describe, expect, it } from 'vitest'

import i18n, { resources } from './index'
import {
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  FALLBACK_LANGUAGE,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
} from './config'

describe('i18n configuration', () => {
  it('initialises one i18next instance and hands it to react-i18next', () => {
    expect(i18n.isInitialized).toBe(true)
    expect(getI18n()).toBe(i18n)
  })

  it('starts in the default language with a reliable fallback', () => {
    expect(DEFAULT_LANGUAGE).toBe('en')
    expect(FALLBACK_LANGUAGE).toBe('en')
    expect(i18n.language).toBe(DEFAULT_LANGUAGE)
    expect(i18n.options.fallbackLng).toEqual([FALLBACK_LANGUAGE])
    expect(SUPPORTED_LANGUAGES).toContain(DEFAULT_LANGUAGE)
  })

  it('registers every supported namespace as the default one', () => {
    expect(i18n.options.defaultNS).toBe(DEFAULT_NAMESPACE)
    expect(new Set(i18n.options.ns as string[])).toEqual(new Set(NAMESPACES))
  })

  it('ships resources for every namespace of every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const bundles = resources[language as keyof typeof resources]
      expect(bundles).toBeDefined()
      for (const namespace of NAMESPACES) {
        expect(Object.keys(bundles ?? {})).toContain(namespace)
      }
    }
  })

  it('resolves a representative key from every namespace', () => {
    const samples: Array<[string, string]> = [
      ['common', 'actions.updateEstimate'],
      ['navigation', 'appName'],
      ['loan', 'form.title'],
      ['income', 'label'],
      ['expenses', 'fields.debt.label'],
      ['results', 'title'],
      ['validation', 'loanAmount.required'],
      ['accessibility', 'skipLink'],
      ['help', 'summary'],
    ]

    for (const [namespace, key] of samples) {
      expect(i18n.t(key, { ns: namespace })).not.toBe(key)
      expect(i18n.t(key, { ns: namespace }).length).toBeGreaterThan(0)
    }
  })

  it('keeps interpolation React-safe by not double-escaping', () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false)
  })

  it('disables verbose debug logging', () => {
    expect(i18n.options.debug).toBeFalsy()
  })

  it('falls back to English when a key is missing from the active language', async () => {
    i18n.addResource('zz', 'loan', 'form.title', 'Only in the pseudo language')
    await i18n.changeLanguage('zz')

    // Present in `zz` → uses `zz`.
    expect(i18n.t('form.title', { ns: 'loan' })).toBe('Only in the pseudo language')
    // Missing in `zz` → falls back to English.
    expect(i18n.t('form.description', { ns: 'loan' })).toBe('Amounts are in South African rand (ZAR).')

    await i18n.changeLanguage(DEFAULT_LANGUAGE)
    i18n.removeResourceBundle('zz', 'loan')
  })
})
