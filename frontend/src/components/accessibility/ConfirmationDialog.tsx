import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { PrimaryButton } from '../ui/PrimaryButton'
import { SecondaryButton } from '../ui/SecondaryButton'

export interface ConfirmationDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  /** Confirm button label. Defaults to the translated `common:actions.confirm`. */
  confirmLabel?: string
  /** Cancel button label. Defaults to the translated `common:actions.cancel`. */
  cancelLabel?: string
  /** Called only when the user confirms. The parent should then close the dialog. */
  onConfirm: () => void
  /** Called for cancel, Escape, or any dismissal. */
  onCancel: () => void
  /** `danger` styles the confirm action as destructive. */
  tone?: 'default' | 'danger'
  /** Extra content rendered between the description and the actions. */
  children?: ReactNode
}

/**
 * Modal confirmation built on the native `<dialog>` element, so focus
 * trapping, background inertness and modality come from the platform.
 *
 * Escape and the cancel button call `onCancel`; confirm calls `onConfirm`.
 * Nothing happens until the user confirms — the parent keeps its data intact
 * until then. Focus is returned to the element that opened the dialog when it
 * closes.
 */
export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = 'default',
  children,
}: ConfirmationDialogProps) {
  const { t } = useTranslation('common')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const ids = useId()

  const titleId = `${ids}-title`
  const descriptionId = `${ids}-description`
  const resolvedConfirmLabel = confirmLabel ?? t('actions.confirm')
  const resolvedCancelLabel = cancelLabel ?? t('actions.cancel')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null
      if (!dialog.open) {
        dialog.showModal()
      }
      cancelButtonRef.current?.focus()
    } else if (dialog.open) {
      dialog.close()
      previouslyFocused.current?.focus()
      previouslyFocused.current = null
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Keep React in control of closing so `open` stays the source of truth.
        event.preventDefault()
        onCancel()
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl backdrop:bg-black/40 sm:p-6',
      )}
    >
      <h2 id={titleId} className="text-lg font-semibold text-ink">
        {title}
      </h2>
      {description ? (
        <p id={descriptionId} className="mt-2 text-sm text-ink-muted">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <SecondaryButton ref={cancelButtonRef} onClick={onCancel}>
          {resolvedCancelLabel}
        </SecondaryButton>
        <PrimaryButton
          onClick={onConfirm}
          className={tone === 'danger' ? 'bg-danger hover:bg-danger-foreground' : undefined}
        >
          {resolvedConfirmLabel}
        </PrimaryButton>
      </div>
    </dialog>
  )
}
