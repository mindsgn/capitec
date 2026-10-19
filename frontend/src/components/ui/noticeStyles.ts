import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ComponentType } from 'react'

export type NoticeVariant = 'info' | 'success' | 'warning' | 'error'

export interface NoticeStyle {
  container: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  /**
   * Key within the `accessibility` namespace for the visually hidden word
   * ensuring meaning is not conveyed by colour alone.
   */
  srLabelKey: string
}

/** Shared visual + semantic mapping for `Alert` and `InfoBanner`. */
export const noticeStyles: Record<NoticeVariant, NoticeStyle> = {
  info: {
    container: 'border-info/40 bg-info-soft text-info-foreground',
    icon: Info,
    srLabelKey: 'notice.info',
  },
  success: {
    container: 'border-success/40 bg-success-soft text-success-foreground',
    icon: CircleCheck,
    srLabelKey: 'notice.success',
  },
  warning: {
    container: 'border-warning/40 bg-warning-soft text-warning-foreground',
    icon: TriangleAlert,
    srLabelKey: 'notice.warning',
  },
  error: {
    container: 'border-danger/40 bg-danger-soft text-danger-foreground',
    icon: CircleAlert,
    srLabelKey: 'notice.error',
  },
}
