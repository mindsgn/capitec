import { CircleHelp } from 'lucide-react'
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export interface TooltipProps {
  /** The tooltip text. Also used as the trigger's accessible name. */
  content: ReactNode
  /** Accessible name for the trigger button. Defaults to the content when it is a string. */
  label?: string
  /** Optional custom trigger content. Defaults to a help icon. */
  children?: ReactNode
  className?: string
}

/**
 * Lightweight tooltip for explaining a term. The trigger is a real focusable
 * `<button>` with an accessible name (`aria-label`) and the bubble is linked
 * with `aria-describedby`, so it can be read by assistive technology. It opens
 * on hover, focus or activation, and closes on blur, pointer leave or Escape.
 *
 * Tooltips should supplement, never replace, essential information.
 */
export function Tooltip({ content, label, children, className }: TooltipProps) {
  const { t } = useTranslation('accessibility')
  const [open, setOpen] = useState(false)
  const tooltipId = useId()

  const accessibleName = label ?? (typeof content === 'string' ? content : t('tooltip.moreInfo'))

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={accessibleName}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        onClick={() => setOpen(true)}
        className="inline-flex size-5 items-center justify-center rounded-full text-ink-muted hover:text-brand"
      >
        {children ?? <CircleHelp aria-hidden="true" className="size-4" />}
      </button>
      {open ? (
        <span
          role="tooltip"
          id={tooltipId}
          className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-xs -translate-x-1/2 rounded-md bg-ink px-3 py-2 text-left text-xs font-normal text-white shadow-lg"
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}
