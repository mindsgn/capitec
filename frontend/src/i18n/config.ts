/**
 * Central i18n configuration shared by the runtime and the integrity tests.
 *
 * Feature-based namespaces keep translations small and reviewable. Add a new
 * namespace here (and a matching `locales/<lang>/<namespace>.json` file) before
 * using it in a component.
 */
export const SUPPORTED_LANGUAGES = ['en'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/** Language used when the application starts. */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

/** Language used when a key is missing from the active language. */
export const FALLBACK_LANGUAGE: SupportedLanguage = 'en'

/** Namespace used when a translation call does not name one explicitly. */
export const DEFAULT_NAMESPACE = 'common'

/** Every namespace that ships with the application. */
export const NAMESPACES = [
  'common',
  'navigation',
  'loan',
  'income',
  'expenses',
  'results',
  'validation',
  'accessibility',
  'help',
] as const

export type Namespace = (typeof NAMESPACES)[number]

/**
 * Currency formatting is intentionally decoupled from the interface language:
 * the product prices everything in South African rand, so amounts always format
 * with the `en-ZA` conventions regardless of the language the UI is shown in.
 */
export const CURRENCY_LOCALE = 'en-ZA'
