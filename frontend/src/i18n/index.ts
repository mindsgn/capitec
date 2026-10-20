import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';

/** English only for now. To add a language, create src/i18n/<code>.ts and register it in `resources`. */
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
