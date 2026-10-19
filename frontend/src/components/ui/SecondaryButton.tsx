import { Button } from './Button'
import type { ButtonProps } from './Button'

/**
 * Secondary action with equal keyboard access and a clear focus ring, styled
 * to remain distinguishable without competing with the primary action.
 */
export function SecondaryButton(props: ButtonProps) {
  return <Button variant="secondary" {...props} />
}

export type { ButtonProps as SecondaryButtonProps }
