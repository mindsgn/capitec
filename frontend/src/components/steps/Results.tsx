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
import { affordabilityScoreOf, budgetVerdict, debtToIncomeRatio, disposableIncome, maxQualifyingAmount, type BudgetVerdict } from '@/lib/api/affordability';
import { mapRateRequest, PRODUCT_BY_LOAN, productForLoan, rateRequestKey } from '@/lib/api/mapLoan';
import { sumExpenses } from '@/lib/flow';
import { useFakeLoading } from '@/lib/hooks';
import { LOAN_MAP } from '@/lib/loans';
import { cn, formatZAR } from '@/lib/utils';
import { useSim } from '@/state/SimulatorContext';
import { useLoanApi } from '@/state/loanApiStore';
import type { Flow } from './types';

const VERDICT_UI: Record<BudgetVerdict, { icon: typeof CheckCircle2; box: string }> = {
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

function VerdictNotice({ verdict }: { verdict: BudgetVerdict }) {
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

function UsageSummary({ verdict, disposable, usage, remaining }: { verdict: BudgetVerdict; disposable: number; usage: number; remaining: number }) {
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

function MaxLoanNote({ verdict, max, months }: { verdict: BudgetVerdict; max: number; months: number | null }) {
  const { t } = useTranslation();
  if (verdict === 'affordable') return null;
  return (
    <p className="rounded-lg bg-secondary p-4 text-sm">
      {max > 0 ? t('results.maxLoan', { amount: formatZAR(max), months }) : t('results.maxLoanNone')}
    </p>
  );
}

function hasInputs(state: { loanType: string | null; income: { grossIncome: number | null; netIncome: number | null }; loan: { amount: number | null; months: number | null }; expenses: Record<string, number | null> }) {
  const { grossIncome, netIncome } = state.income;
  const { amount, months } = state.loan;
  if (!state.loanType || grossIncome == null || netIncome == null || amount == null || months == null) return false;
  return !Object.values(state.expenses).some((value) => value == null);
}

export function ResultsStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state } = useSim();
  const loading = useFakeLoading(800);
  const runQuote = useLoanApi((s) => s.runQuote);
  const loadReference = useLoanApi((s) => s.loadReference);
  const quote = useLoanApi((s) => s.quote);
  const quoteKey = useLoanApi((s) => s.quoteKey);
  const quoteStatus = useLoanApi((s) => s.quoteStatus);
  const quoteError = useLoanApi((s) => s.quoteError);
  const products = useLoanApi((s) => s.products);
  const referenceStatus = useLoanApi((s) => s.status);
  const ready = hasInputs(state);
  const priced = ready ? mapRateRequest(state) : null;
  const key = priced ? rateRequestKey(priced) : null;
  const product = state.loanType && products ? productForLoan(state.loanType, products) : null;
  const quoted = quote != null && quoteStatus === 'ready' && quoteKey === key ? quote : null;

  useEffect(() => { void loadReference(); }, [loadReference]);

  useEffect(() => {
    if (!state.loanType || state.loan.amount == null || state.loan.months == null) return;
    void runQuote({
      loanAmount: state.loan.amount,
      loanTerm: state.loan.months,
      creditScore: state.elig.creditScore ?? 650,
      loanType: PRODUCT_BY_LOAN[state.loanType].productId,
    });
  }, [state.loanType, state.loan.amount, state.loan.months, state.elig.creditScore, runQuote]);

  const cfg = state.loanType ? LOAN_MAP[state.loanType] : null;

  const result = useMemo(() => {
    const { netIncome } = state.income;
    const { amount, months } = state.loan;
    if (!quoted || !product || netIncome == null || amount == null || months == null) return null;
    const expenses = sumExpenses(state.expenses);
    const disposable = disposableIncome(netIncome, expenses);
    const dti = debtToIncomeRatio(state.expenses.existingDebt ?? 0, netIncome);
    const score = affordabilityScoreOf(disposable, netIncome, dti);
    const max = maxQualifyingAmount(disposable, months, product);
    const verdict = budgetVerdict({
      disposable,
      monthlyPayment: quoted.monthlyPayment,
      requestedAmount: amount,
      maxAmount: max,
      score,
    });
    const usage = disposable > 0 ? quoted.monthlyPayment / disposable : Infinity;
    return {
      payment: quoted.monthlyPayment,
      total: quoted.totalRepayment,
      interest: quoted.totalInterest,
      rate: quoted.interestRate,
      verdict,
      disposable,
      usage,
      remaining: Math.round((disposable - quoted.monthlyPayment) * 100) / 100,
      dti,
      max,
    };
  }, [quoted, product, state.income, state.loan, state.expenses]);

  useEffect(() => {
    if (loading || !result) return;
    if (result.verdict === 'unaffordable') toast.error(t('toast.notAffordable'), { id: 'verdict' });
    else if (result.verdict === 'affordable') toast.success(t('toast.affordable'), { id: 'verdict' });
    else toast.warning(t('toast.stretch'), { id: 'verdict' });
  }, [loading, result, t]);

  if (!cfg || !ready) return <ResultsEmptyState flow={flow} />;

  const failed = quoteStatus === 'error' || referenceStatus === 'error' || (referenceStatus === 'ready' && products != null && !product);
  if (!loading && failed) {
    const retry = () => {
      void loadReference();
      if (state.loanType && state.loan.amount != null && state.loan.months != null) {
        void runQuote({
          loanAmount: state.loan.amount,
          loanTerm: state.loan.months,
          creditScore: state.elig.creditScore ?? 650,
          loanType: PRODUCT_BY_LOAN[state.loanType].productId,
        });
      }
    };
    return (
      <StepShell title={t('results.title')} description={t('results.desc', { loan: t(`loans.${cfg.id}.name`).toLowerCase() })} onBack={flow.back} onNext={retry} nextLabel={t('flow.retry')}>
        <p role="alert" className="text-sm font-medium text-accent">{quoteError || t('results.quoteError')}</p>
      </StepShell>
    );
  }

  if (loading || !result) return <ResultsLoadingState />;

  const { months } = state.loan;

  return (
    <StepShell
      title={t('results.title')}
      description={t('results.desc', { loan: t(`loans.${cfg.id}.name`).toLowerCase() })}
      onBack={flow.back}
      onNext={flow.next}
      nextLabel={t('results.continue')}
      nextVariant="accent"
      nextDisabled={result.verdict === 'unaffordable'}
    >
      <div className="rounded-lg bg-navy p-6 text-white">
        <p className="text-sm text-white/70">{t('results.instalment')}</p>
        <p className="text-4xl font-extrabold sm:text-5xl" data-testid="instalment"><CountUp value={result.payment} format={(n) => formatZAR(n, true)} /></p>
        <p className="mt-1 text-sm text-white/70">{t('results.basis', { months, rate: result.rate })}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label={t('results.total')} value={formatZAR(result.total, true)} />
        <Stat label={t('results.interest')} value={formatZAR(result.interest, true)} />
        <Stat label={t('results.rate')} value={`${result.rate}%`} />
        <Stat label={t('results.dti')} value={`${result.dti}%`} />
      </dl>

      <VerdictNotice verdict={result.verdict} />
      <UsageSummary verdict={result.verdict} disposable={result.disposable} usage={result.usage} remaining={result.remaining} />
      <MaxLoanNote verdict={result.verdict} max={result.max} months={months} />
      <p className="text-xs text-muted-foreground">{t('results.indicative')}</p>
    </StepShell>
  );
}
