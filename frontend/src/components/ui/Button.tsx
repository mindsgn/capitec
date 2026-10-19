import { LoaderCircle } from 'lucide-react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary'

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  children: ReactNode
  /** Explicitly set `type="submit"`; every other action defaults to `button`. */
  type?: 'button' | 'submit' | 'reset'
  /** Swaps the label for a spinner and blocks duplicate activation. */
  loading?: boolean
  /** Text announced to assistive technology while loading. Defaults to the translated `common:states.loading`. */
  loadingLabel?: string
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong active:bg-brand-strong',
  secondary: 'border border-brand bg-surface text-brand hover:bg-brand-soft active:bg-brand-soft',
}

const baseClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-base font-semibold ' +
  'transition-colors select-none disabled:cursor-not-allowed'

/**
 * Shared native `<button>` implementation behind `PrimaryButton` and
 * `SecondaryButton`. Defaults to `type="button"` so non-submit actions never
 * accidentally submit a form, and disables itself while loading to prevent
 * duplicate submissions.
 */
export function Button({
  variant = 'primary',
  loading = false,
  loadingLabel,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const { t } = useTranslation('common')
  const isDisabled = disabled || loading
  const resolvedLoadingLabel = loadingLabel ?? t('states.loading')

  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        baseClasses,
        variantClasses[variant],
        variant === 'primary' && 'disabled:bg-brand disabled:opacity-60',
        variant === 'secondary' && 'disabled:border-brand disabled:opacity-60',
        className,
      )}
    >
      {loading ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
          <span>{children}</span>
          <span className="sr-only">, {resolvedLoadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
