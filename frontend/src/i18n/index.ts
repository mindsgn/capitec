import i18n from 'i18next'
import type { Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'

import accessibility from './locales/en/accessibility.json'
import common from './locales/en/common.json'
import expenses from './locales/en/expenses.json'
import help from './locales/en/help.json'
import income from './locales/en/income.json'
import loan from './locales/en/loan.json'
import navigation from './locales/en/navigation.json'
import results from './locales/en/results.json'
import validation from './locales/en/validation.json'
import {
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  FALLBACK_LANGUAGE,
  NAMESPACES,
} from './config'

/**
 * English resources are bundled so translations are available synchronously,
 * before the first render. This keeps the setup simple and reliable and avoids
 * a backend or lazy-loading layer that the application does not need yet.
 */
export const resources = {
  en: {
    common,
    navigation,
    loan,
    income,
    expenses,
    results,
    validation,
    accessibility,
    help,
  },
} satisfies Resource

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE,
    defaultNS: DEFAULT_NAMESPACE,
    // Namespaces are validated by the integrity test, so a missing namespace
    // fails fast instead of silently returning the key.
    ns: [...NAMESPACES],
    interpolation: {
      // React already escapes rendered values.
      escapeValue: false,
    },
    returnNull: false,
    // Resources are bundled, so initialisation can resolve without deferring.
    initAsync: false,
    debug: false,
  })
}

export default i18n
