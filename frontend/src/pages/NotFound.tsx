import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { buttonVariants } from '@/components/ui/button-variants';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container flex flex-col items-center gap-4 py-24 text-center">
      <Seo title={t('seo.notFound.title')} description={t('seo.notFound.desc')} path="/404" noindex />
      <Compass className="h-12 w-12 text-primary" aria-hidden />
      <h1 className="text-3xl font-extrabold">{t('notFound.title')}</h1>
      <p className="max-w-md text-muted-foreground">{t('notFound.body')}</p>
      <Link to="/" className={buttonVariants()}>{t('notFound.cta')}</Link>
    </div>
  );
}
