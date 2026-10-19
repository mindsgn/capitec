import type { ReactNode } from 'react'

import { Alert } from './Alert'
import type { NoticeVariant } from './noticeStyles'

export interface InfoBannerProps {
  /** Optional heading rendered in bold above the message. */
  heading?: ReactNode
  children: ReactNode
  /**
   * Semantic treatment. Defaults to `info`. Use `warning`/`error` for more
   * serious messages; see `Alert` for the role mapping.
   */
  variant?: NoticeVariant
  /**
   * ARIA role override. Defaults to `note` so a static, always-present banner
   * is not announced on every render.
   */
  role?: 'alert' | 'status' | 'note'
  className?: string
}

/**
 * Static informational banner (for example a persistent disclaimer). Uses
 * `role="note"` by default so it is discoverable to assistive technology
 * without being re-announced like a live region. Composes `Alert` for a
 * consistent look and the shared non-colour cues.
 */
export function InfoBanner({ role = 'note', ...props }: InfoBannerProps) {
  return <Alert role={role} {...props} />
}
