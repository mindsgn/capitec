import { useId } from 'react'

export interface UseFieldIdsOptions {
  /** Explicit control id. Falls back to a generated, sanitised React id. */
  id?: string
  hasHint?: boolean
  hasError?: boolean
}

export interface FieldIds {
  /** Id applied to the control (also the `htmlFor` target of the label). */
  controlId: string
  /** Id of the hint paragraph, if a hint is present. */
  hintId?: string
  /** Id of the error paragraph, if an error is present. */
  errorId?: string
  /** Space-separated `aria-describedby` value assembling hint + error ids. */
  describedBy?: string
}

/**
 * Produces stable, unique ids for a form control and links its hint/error
 * text through `aria-describedby`. React's `useId` guarantees an id that is
 * unique per component instance and stable across renders, so labels, hints
 * and errors always resolve to the correct control.
 */
export function useFieldIds({ id, hasHint = false, hasError = false }: UseFieldIdsOptions = {}): FieldIds {
  const reactId = useId()
  const generated = `field-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`
  const controlId = id ?? generated

  const hintId = hasHint ? `${controlId}-hint` : undefined
  const errorId = hasError ? `${controlId}-error` : undefined

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return { controlId, hintId, errorId, describedBy }
}
