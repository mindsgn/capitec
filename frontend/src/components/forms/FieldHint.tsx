import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { hintClasses } from './fieldStyles'

export interface FieldHintProps {
  /** Stable id used by the control's `aria-describedby`. */
  id?: string
  children: ReactNode
  className?: string
}

/**
 * Short helper text for a field. The id is wired into the control through
 * `aria-describedby`, and the text uses readable muted contrast rather than a
 * colour-only cue.
 */
export function FieldHint({ id, children, className }: FieldHintProps) {
  return (
    <p id={id} className={cn(hintClasses, className)}>
      {children}
    </p>
  )
}
