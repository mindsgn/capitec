import { CircleHelp } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

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

import { ILLUSTRATIVE_INTEREST_RATE, useLoanSimulatorStore } from './loanSimulatorStore'

const TERM_OPTIONS: readonly SelectOption[] = [
  { value: '6', label: '6 months' },
  { value: '12', label: '12 months' },
  { value: '24', label: '24 months' },
  { value: '36', label: '36 months' },
  { value: '48', label: '48 months' },
  { value: '60', label: '60 months' },
]

const SLIDER_MIN = 5_000
const SLIDER_MAX = 300_000
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
  const values = useLoanSimulatorStore((state) => state.values)
  const errors = useLoanSimulatorStore((state) => state.errors)
  const estimate = useLoanSimulatorStore((state) => state.estimate)
  const announcement = useLoanSimulatorStore((state) => state.announcement)
  const setValue = useLoanSimulatorStore((state) => state.setValue)
  const submit = useLoanSimulatorStore((state) => state.submit)
  const reset = useLoanSimulatorStore((state) => state.reset)

  const [isResetOpen, setIsResetOpen] = useState(false)

  const errorFor = (fieldId: keyof LoanSimulatorFormValues) =>
    errors.find((error) => error.fieldId === fieldId)?.message

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
          <h1 className="text-2xl font-bold text-brand sm:text-3xl">Loan eligibility simulator</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Estimate a proposed repayment from your income, expenses and the amount you would like
            to borrow. This is a demonstration page for the shared UI components.
          </p>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6"
      >
        <InfoBanner heading="Illustrative estimate only">
          Figures are estimates for guidance. They are not a loan approval or a credit decision.
        </InfoBanner>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card
            as="section"
            title="Your details"
            description="Amounts are in South African rand (ZAR)."
          >
            <form noValidate onSubmit={handleSubmit} aria-describedby={errors.length > 0 ? ERROR_SUMMARY_ID : undefined}>
              <FormErrorSummary id={ERROR_SUMMARY_ID} errors={errors} autoFocus className="mb-5" />

              <div className="flex flex-col gap-5">
                <CurrencyInput
                  id="loanAmount"
                  label="Loan amount"
                  value={values.loanAmount}
                  onChange={(value) => setValue('loanAmount', value)}
                  error={errorFor('loanAmount')}
                  hint="Choose an amount between R5 000 and R300 000."
                  inputMode="decimal"
                  placeholder="150000"
                />

                <SliderField
                  id="loanAmountSlider"
                  label="Adjust the loan amount"
                  value={sliderValue}
                  onChange={(value) => setValue('loanAmount', String(value))}
                  min={SLIDER_MIN}
                  max={SLIDER_MAX}
                  step={SLIDER_STEP}
                  format="currency"
                  hint="Drag to set the amount. The field above updates to match."
                />

                <SelectField
                  id="loanTerm"
                  label="Repayment term"
                  value={values.loanTerm}
                  onChange={(event) => setValue('loanTerm', event.target.value)}
                  options={TERM_OPTIONS}
                  error={errorFor('loanTerm')}
                  hint="The number of months over which you would repay the loan."
                />

                <CurrencyInput
                  id="monthlyIncome"
                  label="Monthly income"
                  value={values.monthlyIncome}
                  onChange={(value) => setValue('monthlyIncome', value)}
                  error={errorFor('monthlyIncome')}
                  hint="Your income before deductions, each month."
                  inputMode="decimal"
                  placeholder="25000"
                />

                <CurrencyInput
                  id="monthlyExpenses"
                  label="Monthly expenses"
                  value={values.monthlyExpenses}
                  onChange={(value) => setValue('monthlyExpenses', value)}
                  error={errorFor('monthlyExpenses')}
                  hint="Your usual living costs each month."
                  inputMode="decimal"
                  placeholder="15000"
                />

                <CurrencyInput
                  id="existingDebt"
                  label="Existing monthly debt"
                  value={values.existingDebt}
                  onChange={(value) => setValue('existingDebt', value)}
                  error={errorFor('existingDebt')}
                  optional
                  hint="Repayments on other loans or credit, if any."
                  inputMode="decimal"
                  placeholder="0"
                />

                <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <span>
                    Uses a fixed illustrative interest rate of{' '}
                    <strong className="font-semibold text-ink">
                      {ILLUSTRATIVE_INTEREST_RATE}% per year
                    </strong>
                    .
                  </span>
                  <Tooltip
                    label="What the interest rate means"
                    content="The interest rate is the yearly cost of borrowing. The estimate keeps it fixed for the whole term."
                  >
                    <CircleHelp aria-hidden="true" className="size-4" />
                  </Tooltip>
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton type="submit">Update estimate</PrimaryButton>
                <SecondaryButton onClick={() => setIsResetOpen(true)}>Reset</SecondaryButton>
              </div>
            </form>
          </Card>

          <div className="flex flex-col gap-6">
            <Card as="section" title="Your estimate">
              {estimate ? (
                <div className="flex flex-col gap-4">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-brand-soft p-3">
                      <dt className="text-sm text-ink-muted">Monthly instalment</dt>
                      <dd className="text-xl font-bold text-ink tabular-nums">
                        {formatZAR(estimate.monthlyRepayment)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-brand-soft p-3">
                      <dt className="text-sm text-ink-muted">Total borrowing cost</dt>
                      <dd className="text-xl font-bold text-ink tabular-nums">
                        {formatZAR(estimate.totalBorrowingCost)}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <dt className="text-sm text-ink-muted">Total repayment</dt>
                      <dd className="text-lg font-semibold text-ink tabular-nums">
                        {formatZAR(estimate.totalRepayment)}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <dt className="text-sm text-ink-muted">Income left each month</dt>
                      <dd className="text-lg font-semibold text-ink tabular-nums">
                        {formatZAR(estimate.remainingIncome)}
                      </dd>
                    </div>
                  </dl>

                  {estimate.remainingIncome < 0 ? (
                    <Alert variant="warning" heading="This repayment may not be affordable">
                      After your expenses, existing debt and this instalment, the estimate leaves you
                      short by {formatZAR(Math.abs(estimate.remainingIncome))} a month. Consider a
                      smaller amount or a longer term.
                    </Alert>
                  ) : (
                    <Alert variant="success" heading="This repayment looks manageable">
                      Based on the figures you entered, you would have{' '}
                      {formatZAR(estimate.remainingIncome)} left each month.
                    </Alert>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No estimate yet"
                  description="Fill in your details and choose “Update estimate” to see an illustrative monthly instalment."
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
        title="Reset the form?"
        description="This clears every value and removes the current estimate. It cannot be undone."
        confirmLabel="Reset form"
        cancelLabel="Keep my details"
        tone="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetOpen(false)}
      />
    </div>
  )
}
