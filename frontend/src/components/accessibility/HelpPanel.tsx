import { Trans, useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export interface HelpPanelProps {
  /** Heading text. Defaults to the translated plain-language title. */
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
  title,
  defaultOpen = false,
  className,
}: HelpPanelProps) {
  const { t } = useTranslation('help')
  const heading = title ?? t('title')

  return (
    <section aria-labelledby="help-panel-title" className={cn('flex flex-col gap-3', className)}>
      <h2 id="help-panel-title" className="text-lg font-semibold text-ink">
        {heading}
      </h2>

      <p className="rounded-lg border border-info/30 bg-info-soft p-3 text-sm text-info-foreground">
        <Trans
          i18nKey="disclaimer"
          ns="help"
          components={{ strong: <strong /> }}
        />
      </p>

      <details open={defaultOpen} className="group rounded-lg border border-border bg-surface">
        <summary className="cursor-pointer list-none rounded-lg px-4 py-3 text-sm font-semibold text-brand marker:content-[''] hover:bg-brand-soft">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="transition-transform group-open:rotate-90">
              ▸
            </span>
            {t('summary')}
          </span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4 text-sm text-ink">
          <div>
            <h3 className="font-semibold text-ink">{t('whatWeLookAt.title')}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
              <li>{t('whatWeLookAt.item1')}</li>
              <li>{t('whatWeLookAt.item2')}</li>
              <li>{t('whatWeLookAt.item3')}</li>
              <li>{t('whatWeLookAt.item4')}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-ink">{t('definitions.title')}</h3>
            <dl className="mt-2 space-y-2 text-ink-muted">
              <div>
                <dt className="font-medium text-ink">{t('definitions.instalment')}</dt>
                <dd>{t('definitions.instalmentDescription')}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">{t('definitions.totalRepayment')}</dt>
                <dd>{t('definitions.totalRepaymentDescription')}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">{t('definitions.borrowingCost')}</dt>
                <dd>{t('definitions.borrowingCostDescription')}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-semibold text-ink">{t('assumptions.title')}</h3>
            <p className="mt-2 text-ink-muted">{t('assumptions.body')}</p>
          </div>
        </div>
      </details>
    </section>
  )
}
