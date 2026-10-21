import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Header() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex min-w-0 items-center gap-2 text-xl font-extrabold tracking-tight text-primary">
          <img src="/logo.png" alt="" data-testid="header-logo" className="h-7 w-auto shrink-0 object-contain" />
          <span className="truncate">{t('brand.name')}</span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="container space-y-2 py-8 text-sm">
        <p className="font-semibold">{t('brand.name')}</p>
        <p className="max-w-3xl text-white/75">{t('footer.disclaimer')}</p>
        <p className="text-white/60">{t('footer.brandNote')}</p>
      </div>
    </footer>
  );
}
