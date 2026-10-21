import { ChevronDown, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES, writeStoredLanguage, type LanguageCode } from '@/i18n/languages';

function selectedLanguage(code: string | undefined): LanguageCode {
  return isLanguage(code) ? code : DEFAULT_LANGUAGE;
}

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = selectedLanguage(i18n.resolvedLanguage ?? i18n.language);

  function onChange(value: string) {
    if (!isLanguage(value) || value === current) return;
    void i18n.changeLanguage(value).then(
      () => {
        writeStoredLanguage(value);
      },
      () => {
        // Keep the previous language selected when the change does not apply.
      },
    );
  }

  return (
    <div className="relative shrink-0">
      <label htmlFor="language-switcher" className="sr-only">{t('nav.language')}</label>
      <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden />
      <select
        id="language-switcher"
        data-testid="language-switcher"
        value={current}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-full border border-input bg-background py-1 pl-9 pr-8 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code} lang={language.htmlLang}>
            {language.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}
