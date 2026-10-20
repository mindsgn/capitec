import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { CountUp } from '@/components/effects/CountUp';
import { StepShell } from '@/components/StepShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { assess, maxAffordableAmount, simulateLoan, type Verdict } from '@/lib/calc';
import { sumExpenses } from '@/lib/flow';
import { useFakeLoading } from '@/lib/hooks';
import { LOAN_MAP } from '@/lib/loans';
import { cn, formatZAR } from '@/lib/utils';
import { useSim } from '@/state/SimulatorContext';
import type { Flow } from './types';

const VERDICT_UI: Record<Verdict, { icon: typeof CheckCircle2; box: string }> = {
  affordable: { icon: CheckCircle2, box: 'border-success/40 bg-success/10 text-success' },
  stretch: { icon: AlertTriangle, box: 'border-warning/40 bg-warning/10 text-warning' },
  unaffordable: { icon: XCircle, box: 'border-accent/40 bg-accent/10 text-accent' },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-lg font-bold">{value}</dd>
    </div>
  );
}

function ResultsEmptyState({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  return (
    <StepShell title={t('results.emptyTitle')} description={t('results.emptyBody')}>
      <Button onClick={() => flow.goTo(0)}>{t('results.emptyAction')}</Button>
    </StepShell>
  );
}

function ResultsLoadingState() {
  const { t } = useTranslation();
  return (
    <StepShell title={t('results.loading')} showHint={false}>
      <div aria-busy="true" role="status" className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        <Skeleton className="h-24 w-full" />
      </div>
    </StepShell>
  );
}

function VerdictNotice({ verdict }: { verdict: Verdict }) {
  const { t } = useTranslation();
  const ui = VERDICT_UI[verdict];
  const Icon = ui.icon;
  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', ui.box)} role="status" data-testid="verdict" data-verdict={verdict}>
      <Icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
      <div className="space-y-1">
        <p className="font-bold">{t(`results.verdict.${verdict}.title`)}</p>
        <p className="text-sm text-foreground">{t(`results.verdict.${verdict}.body`)}</p>
      </div>
    </div>
  );
}

function UsageSummary({ verdict, disposable, usage, remaining }: { verdict: Verdict; disposable: number; usage: number; remaining: number }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const pct = disposable > 0 ? Math.min(100, Math.round(usage * 100)) : 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t('results.disposable')}</span>
        <span className="font-bold">{formatZAR(disposable)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={t('results.usageLabel', { pct })}>
        <m.div
          className={cn('h-full rounded-full', verdict === 'affordable' ? 'bg-success' : verdict === 'stretch' ? 'bg-warning' : 'bg-accent')}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      <p className="text-sm text-muted-foreground">{t('results.remaining', { remaining: formatZAR(remaining) })}</p>
    </div>
  );
}

function MaxLoanNote({ verdict, max, months }: { verdict: Verdict; max: number; months: number | null }) {
  const { t } = useTranslation();
  if (verdict === 'affordable') return null;
  return (
    <p className="rounded-lg bg-secondary p-4 text-sm">
      {max > 0 ? t('results.maxLoan', { amount: formatZAR(max), months }) : t('results.maxLoanNone')}
    </p>
  );
}

export function ResultsStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state } = useSim();
  const loading = useFakeLoading(800);

  const cfg = state.loanType ? LOAN_MAP[state.loanType] : null;

  const result = useMemo(() => {
    const { grossIncome, netIncome } = state.income;
    const { amount, months } = state.loan;
    const e = state.expenses;
    if (!cfg || grossIncome == null || netIncome == null || amount == null || months == null) return null;
    if (Object.values(e).some((v) => v == null)) return null;
    const quote = simulateLoan({ amount, months, ratePct: cfg.rate });
    const a = assess({ grossIncome, netIncome, expenses: sumExpenses(e), existingDebt: e.existingDebt ?? 0, instalment: quote.instalment });
    const max = maxAffordableAmount({ disposable: a.disposable, months, ratePct: cfg.rate, minAmount: cfg.minAmount, maxAmount: cfg.maxAmount });
    return { quote, a, max };
  }, [cfg, state.income, state.loan, state.expenses]);

  useEffect(() => {
    if (loading || !result) return;
    if (result.a.verdict === 'unaffordable') toast.error(t('toast.notAffordable'), { id: 'verdict' });
    else if (result.a.verdict === 'affordable') toast.success(t('toast.affordable'), { id: 'verdict' });
    else toast.warning(t('toast.stretch'), { id: 'verdict' });
  }, [loading, result, t]);

  if (!cfg || !result) return <ResultsEmptyState flow={flow} />;
  if (loading) return <ResultsLoadingState />;

  const { quote, a, max } = result;
  const { months } = state.loan;

  return (
    <StepShell
      title={t('results.title')}
      description={t('results.desc', { loan: t(`loans.${cfg.id}.name`).toLowerCase() })}
      onBack={flow.back}
      onNext={flow.next}
      nextLabel={t('results.continue')}
      nextVariant="accent"
      nextDisabled={a.verdict === 'unaffordable'}
    >
      <div className="rounded-lg bg-navy p-6 text-white">
        <p className="text-sm text-white/70">{t('results.instalment')}</p>
        <p className="text-4xl font-extrabold sm:text-5xl" data-testid="instalment"><CountUp value={quote.instalment} format={(n) => formatZAR(n, true)} /></p>
        <p className="mt-1 text-sm text-white/70">{t('results.basis', { months, rate: cfg.rate })}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label={t('results.total')} value={formatZAR(quote.totalRepayable)} />
        <Stat label={t('results.interest')} value={formatZAR(quote.totalInterest)} />
        <Stat label={t('results.fees')} value={formatZAR(quote.totalFees)} />
        <Stat label={t('results.dti')} value={`${Math.round(a.dti * 100)}%`} />
      </dl>

      <VerdictNotice verdict={a.verdict} />
      <UsageSummary verdict={a.verdict} disposable={a.disposable} usage={a.usage} remaining={a.remaining} />
      <MaxLoanNote verdict={a.verdict} max={max} months={months} />
      <p className="text-xs text-muted-foreground">{t('results.indicative')}</p>
    </StepShell>
  );
}
