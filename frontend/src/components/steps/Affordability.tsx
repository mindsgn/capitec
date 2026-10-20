import { useTranslation } from 'react-i18next';
import { Car, GraduationCap, Hammer, HeartPulse, Home, Layers, User } from 'lucide-react';
import { CountUp } from '@/components/effects/CountUp';
import { NumberField } from '@/components/NumberField';
import { StepShell } from '@/components/StepShell';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { LOAN_MAP, LOANS, type LoanIcon } from '@/lib/loans';
import { simulateLoan } from '@/lib/calc';
import { expensesSchema, incomeSchema, loanDetailsSchema, translateIssue, validate } from '@/lib/schemas';
import { cn, formatZAR } from '@/lib/utils';
import { useSim } from '@/state/SimulatorContext';
import type { Flow } from './types';

const ICONS: Record<LoanIcon, typeof User> = { user: User, car: Car, home: Home, graduation: GraduationCap, hammer: Hammer, heart: HeartPulse, layers: Layers };

export function LoanTypeStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state, selectLoanType } = useSim();
  return (
    <StepShell title={t('steps.loanType.title')} description={t('steps.loanType.desc')} onNext={flow.next} nextDisabled={!state.loanType}>
      <div role="radiogroup" aria-label={t('steps.loanType.title')} className="grid gap-3 sm:grid-cols-2">
        {LOANS.map((l) => {
          const Icon = ICONS[l.icon];
          const on = state.loanType === l.id;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => selectLoanType(l.id)}
              className={cn('flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                on ? 'border-primary bg-secondary' : 'border-border hover:border-primary/50')}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
              <span>
                <span className="block font-bold">{t(`loans.${l.id}.name`)}</span>
                <span className="block text-sm text-muted-foreground">{t(`loans.${l.id}.blurb`)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

export function IncomeStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state, update } = useSim();
  const errors = validate(incomeSchema, state.income);
  const set = (k: 'grossIncome' | 'netIncome') => (v: number | null) => update((s) => ({ ...s, income: { ...s.income, [k]: v } }));
  const err = (k: string) => (errors[k] ? translateIssue(t, errors[k]) : undefined);
  return (
    <StepShell title={t('steps.income.title')} description={t('steps.income.desc')} onBack={flow.back} onNext={flow.next} nextDisabled={Object.keys(errors).length > 0}>
      <NumberField id="grossIncome" label={t('fields.grossIncome')} hint={t('fields.grossIncomeHint')} value={state.income.grossIncome} onChange={set('grossIncome')} error={err('grossIncome')} />
      <NumberField id="netIncome" label={t('fields.netIncome')} hint={t('fields.netIncomeHint')} value={state.income.netIncome} onChange={set('netIncome')} error={err('netIncome')} />
    </StepShell>
  );
}

const EXPENSE_KEYS = ['housing', 'transport', 'living', 'other', 'existingDebt'] as const;

export function ExpensesStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state, update } = useSim();
  const errors = validate(expensesSchema, state.expenses);
  return (
    <StepShell title={t('steps.expenses.title')} description={t('steps.expenses.desc')} onBack={flow.back} onNext={flow.next} nextDisabled={Object.keys(errors).length > 0}>
      <div className="grid gap-5 sm:grid-cols-2">
        {EXPENSE_KEYS.map((k) => (
          <NumberField
            key={k}
            id={k}
            label={t(`fields.${k}`)}
            hint={t(`fields.${k}Hint`)}
            value={state.expenses[k]}
            onChange={(v) => update((s) => ({ ...s, expenses: { ...s.expenses, [k]: v } }))}
            error={errors[k] ? translateIssue(t, errors[k]) : undefined}
          />
        ))}
      </div>
    </StepShell>
  );
}

export function LoanDetailsStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state, update } = useSim();
  if (!state.loanType) return null;
  const cfg = LOAN_MAP[state.loanType];
  const { amount, months } = state.loan;
  const errors = validate(loanDetailsSchema(cfg), { amount, months });
  const valid = Object.keys(errors).length === 0;
  const stepAmount = cfg.maxAmount > 1_000_000 ? 10_000 : cfg.maxAmount > 100_000 ? 1_000 : 100;
  const quote = valid ? simulateLoan({ amount: amount!, months: months!, ratePct: cfg.rate }) : null;
  const years = months ? Math.floor(months / 12) : 0;
  const rem = months ? months % 12 : 0;

  return (
    <StepShell title={t('steps.loanDetails.title', { loan: t(`loans.${cfg.id}.name`) })} description={t('steps.loanDetails.desc')} onBack={flow.back} onNext={flow.next} nextDisabled={!valid}>
      <NumberField
        id="amount"
        label={t('fields.amount')}
        hint={t('fields.amountHint', { min: formatZAR(cfg.minAmount), max: formatZAR(cfg.maxAmount) })}
        value={amount}
        onChange={(v) => update((s) => ({ ...s, loan: { ...s.loan, amount: v } }))}
        error={errors.amount ? translateIssue(t, errors.amount) : undefined}
      />
      <Slider
        aria-label={t('fields.amount')}
        min={cfg.minAmount}
        max={cfg.maxAmount}
        step={stepAmount}
        value={[Math.min(cfg.maxAmount, Math.max(cfg.minAmount, amount ?? cfg.minAmount))]}
        onValueChange={([v]) => update((s) => ({ ...s, loan: { ...s.loan, amount: v } }))}
      />
      <div className="space-y-3 pt-2">
        <div className="flex items-baseline justify-between">
          <Label>{t('fields.term')}</Label>
          <span className="font-bold" data-testid="term-label">{t('fields.termValue', { months: months ?? cfg.minTerm })}{months && months >= 12 ? ` (${years}y${rem ? ` ${rem}m` : ''})` : ''}</span>
        </div>
        <Slider
          aria-label={t('fields.term')}
          min={cfg.minTerm}
          max={cfg.maxTerm}
          step={1}
          value={[months ?? cfg.minTerm]}
          onValueChange={([v]) => update((s) => ({ ...s, loan: { ...s.loan, months: v } }))}
        />
        <p className="text-sm text-muted-foreground">{t('fields.termHint', { min: cfg.minTerm, max: cfg.maxTerm })}</p>
      </div>
      <div className="rounded-lg bg-secondary p-4">
        <p className="text-sm text-muted-foreground">{t('steps.loanDetails.preview', { rate: cfg.rate })}</p>
        <p className="text-3xl font-extrabold text-primary" aria-live="polite">
          {quote ? <CountUp value={quote.instalment} format={(n) => formatZAR(n)} /> : '–'}
          <span className="ml-1 text-base font-semibold text-muted-foreground">{t('common.perMonth')}</span>
        </p>
      </div>
    </StepShell>
  );
}
