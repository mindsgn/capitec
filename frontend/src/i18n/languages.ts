import { z } from 'zod';
import af from './af';
import en from './en';

/**
 * UI languages. To add isiZulu or isiXhosa, create src/i18n/zu.ts or xh.ts
 * with the same keys as en.ts, then add a row here and a catalog below.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', htmlLang: 'en', locale: 'en-ZA' },
  { code: 'af', label: 'Afrikaans', htmlLang: 'af', locale: 'af-ZA' },
  { code: 'zu', label: 'Zuu', htmlLang: 'zu', locale: 'zu-ZA' },
] as const;

export type Language = (typeof LANGUAGES)[number];
export type LanguageCode = Language['code'];

const LANGUAGE_CODES = LANGUAGES.map((language) => language.code) as [LanguageCode, ...LanguageCode[]];

export const languageSchema = z.enum(LANGUAGE_CODES);

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LANGUAGE_STORAGE_KEY = 'loan-simulator:lang';

const translations = { en, af } satisfies Record<LanguageCode, typeof en>;

export const resources = {
  en: { translation: translations.en },
  af: { translation: translations.af },
};

type Reader = Pick<Storage, 'getItem'>;
type Writer = Pick<Storage, 'setItem'>;

function browserStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function isLanguage(value: unknown): value is LanguageCode {
  return languageSchema.safeParse(value).success;
}

export function languageByCode(code: string | undefined): Language {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}

/** Stored choice, or English when nothing valid is saved. */
export function readStoredLanguage(storage: Reader | undefined = browserStorage()): LanguageCode {
  if (!storage) return DEFAULT_LANGUAGE;
  try {
    const raw = storage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(raw) ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function writeStoredLanguage(code: LanguageCode, storage: Writer | undefined = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(LANGUAGE_STORAGE_KEY, code);
    return true;
  } catch {
    return false;
  }
}
