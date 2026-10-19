import { cn } from '@/lib/utils'

export interface HelpPanelProps {
  /** Heading text. Defaults to a plain-language title. */
  title?: string
  /**
   * Start the expandable details open. The essential disclaimer is always
   * visible and is never hidden behind this control.
   */
  defaultOpen?: boolean
  className?: string
}

/**
 * Explains how the illustrative estimate is produced.
 *
 * The disclaimer that this is not a loan approval is always visible; only the
 * additional detail is collapsed behind an accessible `<details>`/`<summary>`
 * disclosure. The copy describes the factors that affect affordability and the
 * difference between the monthly instalment, total repayment and total
 * borrowing cost, without duplicating the calculation engine or giving advice.
 */
export function HelpPanel({
  title = 'How your estimate is worked out',
  defaultOpen = false,
  className,
}: HelpPanelProps) {
  return (
    <section aria-labelledby="help-panel-title" className={cn('flex flex-col gap-3', className)}>
      <h2 id="help-panel-title" className="text-lg font-semibold text-ink">
        {title}
      </h2>

      <p className="rounded-lg border border-info/30 bg-info-soft p-3 text-sm text-info-foreground">
        This simulator gives an <strong>illustrative estimate only</strong>. It is not a loan
        approval, pre-approval or credit decision, and it is not financial or legal advice. Final
        terms are confirmed by the lender after a full assessment.
      </p>

      <details open={defaultOpen} className="group rounded-lg border border-border bg-surface">
        <summary className="cursor-pointer list-none rounded-lg px-4 py-3 text-sm font-semibold text-brand marker:content-[''] hover:bg-brand-soft">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="transition-transform group-open:rotate-90">
              ▸
            </span>
            What affects the estimate
          </span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4 text-sm text-ink">
          <div>
            <h3 className="font-semibold text-ink">What we look at</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
              <li>Your monthly income and your monthly living expenses.</li>
              <li>Your existing monthly debt repayments.</li>
              <li>The loan amount and the repayment term you choose.</li>
              <li>The interest rate and any fees that apply to the loan.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-ink">Instalment, total repayment and total cost</h3>
            <dl className="mt-2 space-y-2 text-ink-muted">
              <div>
                <dt className="font-medium text-ink">Monthly instalment</dt>
                <dd>What you would pay each month towards the loan.</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Total repayment</dt>
                <dd>Every instalment added together over the full term.</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Total borrowing cost</dt>
                <dd>
                  The total repayment minus the amount you borrowed — in other words, the interest
                  and fees you pay on top.
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-semibold text-ink">Assumptions</h3>
            <p className="mt-2 text-ink-muted">
              The estimate assumes the interest rate and term stay the same for the whole loan and
              that you make every instalment on time. In practice, rates can change and fees vary,
              so your real cost may differ. A lower loan amount, a shorter term or a lower interest
              rate usually lowers the total borrowing cost.
            </p>
          </div>
        </div>
      </details>
    </section>
  )
}
