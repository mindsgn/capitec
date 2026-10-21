import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { ArrowRight, ClipboardCheck, Calculator, ShieldCheck } from 'lucide-react';
import { BlurText } from '@/components/effects/BlurText';
import { ShimmerButton } from '@/components/effects/ShimmerButton';
import { Seo } from '@/components/Seo';
import { languageByCode } from '@/i18n/languages';
import { SITE_URL } from '@/lib/site';
import { useSim } from '@/state/SimulatorContext';

const FAQ_KEYS = ['one', 'two', 'three', 'four'] as const;

export default function Landing() {
  const { t, i18n } = useTranslation();
  const { hasProgress } = useSim();
  const reduce = useReducedMotion();

  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: t('brand.name'), url: SITE_URL, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: languageByCode(i18n.resolvedLanguage ?? i18n.language).locale, description: t('seo.home.desc'), offers: { '@type': 'Offer', price: '0', priceCurrency: 'ZAR' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ_KEYS.map((k) => ({ '@type': 'Question', name: t(`faq.${k}.q`), acceptedAnswer: { '@type': 'Answer', text: t(`faq.${k}.a`) } })) },
  ];

  return (
    <>
      <Seo title={t('seo.home.title')} description={t('seo.home.desc')} path="/" jsonLd={jsonLd} />

      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div aria-hidden className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
        <div className="container relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl"><BlurText text={t('landing.title')} /></h1>
            <p className="max-w-xl text-lg text-white/85">{t('landing.subtitle')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <ShimmerButton to="/simulator">{hasProgress ? t('landing.resume') : t('landing.cta')}<ArrowRight className="h-5 w-5" aria-hidden /></ShimmerButton>
            </div>
          </div>
          <m.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="rounded-2xl bg-white p-6 text-foreground shadow-2xl">
            <p className="text-sm text-muted-foreground">{t('landing.card.label')}</p>
            <p className="text-4xl font-extrabold text-primary">R 669,07<span className="text-base font-semibold text-muted-foreground"> {t('common.perMonth')}</span></p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full w-[38%] rounded-full bg-success" /></div>
            <p className="mt-2 text-sm text-muted-foreground">{t('landing.card.caption')}</p>
          </m.div>
        </div>
      </section>

      <section className="container py-16" aria-labelledby="how">
        <h2 id="how" className="text-3xl font-extrabold">{t('landing.how.title')}</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {([['calc', Calculator], ['check', ShieldCheck], ['docs', ClipboardCheck]] as const).map(([k, Icon], i) => (
            <li key={k} className="rounded-lg border p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground"><Icon className="h-5 w-5" aria-hidden /></span>
                <span className="text-sm font-semibold text-muted-foreground">{t('landing.how.step', { n: i + 1 })}</span>
              </div>
              <h3 className="text-xl font-bold">{t(`landing.how.${k}.title`)}</h3>
              <p className="mt-2 text-muted-foreground">{t(`landing.how.${k}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

    </>
  );
}
