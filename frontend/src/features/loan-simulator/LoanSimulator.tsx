import { CircleHelp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { ConfirmationDialog } from '@/components/accessibility/ConfirmationDialog'
import { FormErrorSummary } from '@/components/accessibility/FormErrorSummary'
import { HelpPanel } from '@/components/accessibility/HelpPanel'
import { LiveRegion } from '@/components/accessibility/LiveRegion'
import { SkipLink } from '@/components/accessibility/SkipLink'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { SelectField } from '@/components/forms/SelectField'
import type { SelectOption } from '@/components/forms/SelectField'
import { SliderField } from '@/components/forms/SliderField'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { InfoBanner } from '@/components/ui/InfoBanner'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { SecondaryButton } from '@/components/ui/SecondaryButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatZAR, toCurrencyValue } from '@/lib/currency'
import type { LoanSimulatorFormValues } from '@/lib/validation'
import { LOAN_SIMULATOR_LIMITS } from '@/lib/validation'
import { translateFormError } from '@/i18n/formErrors'

import { ILLUSTRATIVE_INTEREST_RATE, useLoanSimulatorStore } from './loanSimulatorStore'

const TERM_VALUES = [6, 12, 24, 36, 48, 60] as const

// Derived from the schema limits so the slider, the hint and validation never drift.
const SLIDER_MIN = LOAN_SIMULATOR_LIMITS.amount.min
const SLIDER_MAX = LOAN_SIMULATOR_LIMITS.amount.max
const SLIDER_STEP = 1_000

const ERROR_SUMMARY_ID = 'loan-simulator-errors'

/**
 * Minimal integration example for the shared components.
 *
 * It shows how the field primitives, error summary, live region, help panel,
 * confirmation dialog and skip link are wired together around a zustand store.
 * Validation, parsing and calculation live in `@/lib`; the components only deal
 * with presentation and accessibility.
 */
export function LoanSimulator() {
  const { t, i18n } = useTranslation([
    'navigation',
    'loan',
    'income',
    'expenses',
    'results',
    'common',
  ])
  const { t: tValidation } = useTranslation('validation')

  const values = useLoanSimulatorStore((state) => state.values)
  const errors = useLoanSimulatorStore((state) => state.errors)
  const estimate = useLoanSimulatorStore((state) => state.estimate)
  const setValue = useLoanSimulatorStore((state) => state.setValue)
  const submit = useLoanSimulatorStore((state) => state.submit)
  const reset = useLoanSimulatorStore((state) => state.reset)

  const [isResetOpen, setIsResetOpen] = useState(false)

  useEffect(() => {
    const title = t('navigation:appName')
    document.title = title
  }, [t, i18n.language])

  const errorFor = (fieldId: keyof LoanSimulatorFormValues) => {
    const error = errors.find((e) => e.fieldId === fieldId)
    if (!error) return undefined
    return translateFormError(error, tValidation)
  }

  const announcement = useMemo(() => {
    if (!estimate) return ''
    return t('results:announcement', {
      instalment: formatZAR(estimate.monthlyRepayment, { cents: false }),
      term: Number(values.loanTerm),
      total: formatZAR(estimate.totalRepayment, { cents: false }),
    })
  }, [estimate, values.loanTerm, t])

  const termOptions: readonly SelectOption[] = useMemo(
    () => TERM_VALUES.map((value) => ({ value: String(value), label: t('loan:fields.term.months', { count: value }) })),
    [t],
  )

  const sliderValue = toCurrencyValue(values.loanAmount) ?? SLIDER_MIN

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const handleConfirmReset = () => {
    reset()
    setIsResetOpen(false)
  }

  return (
    <div className="min-h-svh bg-page">
      <SkipLink />

      <header className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          <h1 className="text-2xl font-bold text-brand sm:text-3xl">{t('navigation:appName')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{t('navigation:pageDescription')}</p>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6"
      >
        <InfoBanner heading={t('results:disclaimer.heading')}>
          {t('results:disclaimer.body')}
        </InfoBanner>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card
            as="section"
            title={t('loan:form.title')}
            description={t('loan:form.description')}
          >
            <form noValidate onSubmit={handleSubmit} aria-describedby={errors.length > 0 ? ERROR_SUMMARY_ID : undefined}>
              <FormErrorSummary id={ERROR_SUMMARY_ID} errors={errors} autoFocus className="mb-5" />

              <div className="flex flex-col gap-5">
                <CurrencyInput
                  id="loanAmount"
                  label={t('loan:fields.amount.label')}
                  value={values.loanAmount}
                  onChange={(value) => setValue('loanAmount', value)}
                  error={errorFor('loanAmount')}
                  hint={t('loan:fields.amount.hint', {
                    min: formatZAR(LOAN_SIMULATOR_LIMITS.amount.min, { cents: false }),
                    max: formatZAR(LOAN_SIMULATOR_LIMITS.amount.max, { cents: false }),
                  })}
                  inputMode="decimal"
                  placeholder={t('loan:fields.amount.placeholder')}
                />

                <SliderField
                  id="loanAmountSlider"
                  label={t('loan:fields.amount.sliderLabel')}
                  value={sliderValue}
                  onChange={(value) => setValue('loanAmount', String(value))}
                  min={SLIDER_MIN}
                  max={SLIDER_MAX}
                  step={SLIDER_STEP}
                  format="currency"
                  hint={t('loan:fields.amount.sliderHint')}
                />

                <SelectField
                  id="loanTerm"
                  label={t('loan:fields.term.label')}
                  value={values.loanTerm}
                  onChange={(event) => setValue('loanTerm', event.target.value)}
                  options={termOptions}
                  error={errorFor('loanTerm')}
                  hint={t('loan:fields.term.hint')}
                />

                <CurrencyInput
                  id="monthlyIncome"
                  label={t('income:label')}
                  value={values.monthlyIncome}
                  onChange={(value) => setValue('monthlyIncome', value)}
                  error={errorFor('monthlyIncome')}
                  hint={t('income:hint')}
                  inputMode="decimal"
                  placeholder={t('income:placeholder')}
                />

                <CurrencyInput
                  id="monthlyExpenses"
                  label={t('expenses:fields.expenses.label')}
                  value={values.monthlyExpenses}
                  onChange={(value) => setValue('monthlyExpenses', value)}
                  error={errorFor('monthlyExpenses')}
                  hint={t('expenses:fields.expenses.hint')}
                  inputMode="decimal"
                  placeholder={t('expenses:fields.expenses.placeholder')}
                />

                <CurrencyInput
                  id="existingDebt"
                  label={t('expenses:fields.debt.label')}
                  value={values.existingDebt}
                  onChange={(value) => setValue('existingDebt', value)}
                  error={errorFor('existingDebt')}
                  optional
                  hint={t('expenses:fields.debt.hint')}
                  inputMode="decimal"
                  placeholder={t('expenses:fields.debt.placeholder')}
                />

                <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <span>
                    <Trans
                      i18nKey="loan:interestRate.note"
                      values={{ rate: ILLUSTRATIVE_INTEREST_RATE }}
                      components={{ strong: <strong className="font-semibold text-ink" /> }}
                    />
                  </span>
                  <Tooltip
                    label={t('loan:interestRate.tooltipLabel')}
                    content={t('loan:interestRate.tooltipContent')}
                  >
                    <CircleHelp aria-hidden="true" className="size-4" />
                  </Tooltip>
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton type="submit">{t('common:actions.updateEstimate')}</PrimaryButton>
                <SecondaryButton onClick={() => setIsResetOpen(true)}>{t('common:actions.reset')}</SecondaryButton>
              </div>
            </form>
          </Card>

          <div className="flex flex-col gap-6">
            <Card as="section" title={t('results:title')}>
              {estimate ? (
                <div className="flex flex-col gap-4">
                  {/*
                    Each value carries a stable data-testid: `<dt>/<dd>` pairs
                    expose no accessible name, so e2e tests cannot target a
                    value through roles without falling back to DOM structure.
                    Labels use `text-ink` because `text-ink-muted` on the
                    brand-soft tiles fell below the WCAG AA contrast ratio.
                  */}
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-brand-soft p-3">
                      <dt className="text-sm text-ink">{t('results:monthlyInstalment')}</dt>
                      <dd data-testid="result-monthly-instalment" className="text-xl font-bold text-ink tabular-nums">
                        {formatZAR(estimate.monthlyRepayment)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-brand-soft p-3">
                      <dt className="text-sm text-ink">{t('results:borrowingCost')}</dt>
                      <dd data-testid="result-borrowing-cost" className="text-xl font-bold text-ink tabular-nums">
                        {formatZAR(estimate.totalBorrowingCost)}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <dt className="text-sm text-ink">{t('results:totalRepayment')}</dt>
                      <dd data-testid="result-total-repayment" className="text-lg font-semibold text-ink tabular-nums">
                        {formatZAR(estimate.totalRepayment)}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <dt className="text-sm text-ink">{t('results:remainingIncome')}</dt>
                      <dd data-testid="result-remaining-income" className="text-lg font-semibold text-ink tabular-nums">
                        {formatZAR(estimate.remainingIncome)}
                      </dd>
                    </div>
                  </dl>

                  {estimate.remainingIncome < 0 ? (
                    <Alert variant="warning" heading={t('results:unaffordable.heading')}>
                      {t('results:unaffordable.body', {
                        shortfall: formatZAR(Math.abs(estimate.remainingIncome)),
                      })}
                    </Alert>
                  ) : (
                    <Alert variant="success" heading={t('results:affordable.heading')}>
                      {t('results:affordable.body', { remaining: formatZAR(estimate.remainingIncome) })}
                    </Alert>
                  )}
                </div>
              ) : (
                <EmptyState
                  title={t('results:empty.title')}
                  description={t('results:empty.description', { action: t('common:actions.updateEstimate') })}
                />
              )}
            </Card>

            <HelpPanel />
          </div>
        </div>
      </main>

      <LiveRegion message={announcement} mode="polite" />

      <ConfirmationDialog
        open={isResetOpen}
        title={t('loan:resetDialog.title')}
        description={t('loan:resetDialog.description')}
        confirmLabel={t('loan:resetDialog.confirm')}
        cancelLabel={t('loan:resetDialog.cancel')}
        tone="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetOpen(false)}
      />
    </div>
  )
}
