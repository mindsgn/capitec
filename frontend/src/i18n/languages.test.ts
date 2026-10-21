import af from './af';
import en from './en';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
  isLanguage,
  languageByCode,
  readStoredLanguage,
  writeStoredLanguage,
} from './languages';

function leafKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix.slice(0, -1)];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => leafKeys(child, `${prefix}${key}.`));
}

describe('languages', () => {
  test('lists English and Afrikaans so another catalog can be registered the same way', () => {
    expect(LANGUAGES.map((language) => language.code)).toEqual(['en', 'af']);
    expect(languageByCode('af')).toMatchObject({ label: 'Afrikaans', htmlLang: 'af', locale: 'af-ZA' });
    expect(languageByCode('zu').code).toBe(DEFAULT_LANGUAGE);
  });

  test('keeps every catalog aligned with English', () => {
    expect(leafKeys(af).sort()).toEqual(leafKeys(en).sort());
  });

  test('falls back to English when storage is empty, invalid, or unavailable', () => {
    expect(readStoredLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
    expect(readStoredLanguage({ getItem: () => null })).toBe('en');
    expect(readStoredLanguage({ getItem: () => 'zu' })).toBe('en');
    expect(readStoredLanguage({ getItem: () => { throw new Error('blocked'); } })).toBe('en');
  });

  test('reads and writes a supported language', () => {
    const data: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => { data[key] = value; },
    };
    expect(writeStoredLanguage('af', storage)).toBe(true);
    expect(data[LANGUAGE_STORAGE_KEY]).toBe('af');
    expect(readStoredLanguage(storage)).toBe('af');
    expect(isLanguage('xh')).toBe(false);
    expect(isLanguage('af')).toBe(true);
  });

  test('survives storage that refuses writes', () => {
    const throwing = { setItem: () => { throw new Error('quota'); } };
    expect(writeStoredLanguage('af', throwing)).toBe(false);
    expect(writeStoredLanguage('en', undefined)).toBe(false);
  });
});
