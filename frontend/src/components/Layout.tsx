import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button-variants';
import { useSim } from '@/state/SimulatorContext';

export function Header() {
  const { t } = useTranslation();
  const { hasProgress } = useSim();
  const link = ({ isActive }: { isActive: boolean }) => cn('hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-secondary sm:inline-block', isActive && 'text-primary');
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-primary">
          <img src="/logo.png" alt="" data-testid="header-logo" className="h-7 w-auto object-contain" />
          {t('brand.name')}
        </Link>
        <nav aria-label={t('nav.label')} className="flex items-center gap-1">
        </nav>
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
