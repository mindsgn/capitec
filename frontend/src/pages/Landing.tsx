import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Car, ClipboardCheck, Calculator, GraduationCap, Hammer, HeartPulse, Home, Layers, ShieldCheck, User } from 'lucide-react';
import { BlurText } from '@/components/effects/BlurText';
import { ShimmerButton } from '@/components/effects/ShimmerButton';
import { Seo, SITE_URL } from '@/components/Seo';
import { LOANS, type LoanIcon } from '@/lib/loans';
import { useSim } from '@/state/SimulatorContext';

const ICONS: Record<LoanIcon, typeof User> = { user: User, car: Car, home: Home, graduation: GraduationCap, hammer: Hammer, heart: HeartPulse, layers: Layers };
const FAQ_KEYS = ['one', 'two', 'three', 'four'] as const;

export default function Landing() {
  const { t } = useTranslation();
  const { hasProgress } = useSim();
  const reduce = useReducedMotion();

  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: t('brand.name'), url: SITE_URL, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: 'en-ZA', description: t('seo.home.desc'), offers: { '@type': 'Offer', price: '0', priceCurrency: 'ZAR' } },
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
              <a href="#loans" className="rounded-full px-5 py-3 font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{t('landing.browse')}</a>
            </div>
          </div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="rounded-2xl bg-white p-6 text-foreground shadow-2xl">
            <p className="text-sm text-muted-foreground">{t('landing.card.label')}</p>
            <p className="text-4xl font-extrabold text-primary">R 1 112,40<span className="text-base font-semibold text-muted-foreground"> {t('common.perMonth')}</span></p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full w-[38%] rounded-full bg-success" /></div>
            <p className="mt-2 text-sm text-muted-foreground">{t('landing.card.caption')}</p>
          </motion.div>
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

      <section id="loans" className="bg-secondary py-16" aria-labelledby="loans-h">
        <div className="container">
          <h2 id="loans-h" className="text-3xl font-extrabold">{t('landing.loans.title')}</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t('landing.loans.subtitle')}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOANS.map((l) => {
              const Icon = ICONS[l.icon];
              return (
                <li key={l.id}>
                  <Link to={`/simulator?type=${l.id}`} className="group flex h-full flex-col gap-3 rounded-lg border bg-card p-5 transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
                    <span className="text-lg font-bold">{t(`loans.${l.id}.name`)}</span>
                    <span className="flex-1 text-sm text-muted-foreground">{t(`loans.${l.id}.blurb`)}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">{t('landing.loans.try')}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="container py-16" aria-labelledby="faq">
        <h2 id="faq" className="text-3xl font-extrabold">{t('landing.faq')}</h2>
        <div className="mt-6 max-w-3xl divide-y rounded-lg border">
          {FAQ_KEYS.map((k) => (
            <details key={k} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t(`faq.${k}.q`)}</summary>
              <p className="mt-3 text-muted-foreground">{t(`faq.${k}.a`)}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
