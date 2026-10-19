import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

export type SkeletonVariant = 'text' | 'rect' | 'circle'

export interface SkeletonProps {
  variant?: SkeletonVariant
  /** Width, applied as an inline style. */
  width?: CSSProperties['width']
  /** Height, applied as an inline style. */
  height?: CSSProperties['height']
  /** Render several stacked text lines. Ignored for non-text variants. */
  lines?: number
  className?: string
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 rounded',
  rect: 'rounded-md',
  circle: 'rounded-full',
}

/**
 * Decorative loading placeholder. Purely presentational shapes are hidden from
 * assistive technology with `aria-hidden`; the containing region should
 * communicate its own loading state (for example `aria-busy`). The pulse
 * animation respects reduced-motion preferences.
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            style={{ width: index === lines - 1 ? '70%' : width, height }}
            className={cn('bg-muted motion-safe:animate-pulse', variantClasses.text)}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={cn('bg-muted motion-safe:animate-pulse', variantClasses[variant], className)}
    />
  )
}
