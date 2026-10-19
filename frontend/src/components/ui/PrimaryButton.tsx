import { Button } from './Button'
import type { ButtonProps } from './Button'

/**
 * Primary, high-emphasis action. Defaults to `type="button"` to avoid
 * accidentally submitting a form; pass `type="submit"` explicitly.
 */
export function PrimaryButton(props: ButtonProps) {
  return <Button variant="primary" {...props} />
}

export type { ButtonProps as PrimaryButtonProps }
