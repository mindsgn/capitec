import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, languageByCode, readStoredLanguage, resources } from './languages';

function applyDocumentLanguage(code: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = languageByCode(code).htmlLang;
}

const initial = readStoredLanguage();

i18n.on('languageChanged', applyDocumentLanguage);

void i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
}).then(() => {
  applyDocumentLanguage(i18n.resolvedLanguage ?? initial);
});

export default i18n;
