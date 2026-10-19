/**
 * Shared Tailwind class strings for form controls. Keeping them here means the
 * text input, select, currency input and slider all render with consistent
 * spacing, focus rings and invalid styling.
 */

export const controlBaseClasses =
  'w-full min-h-11 rounded-md border border-input bg-surface px-3 py-2 text-base text-ink shadow-sm ' +
  'transition-colors placeholder:text-ink-muted/70 ' +
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-muted ' +
  'aria-[invalid=true]:border-danger'

export const labelClasses = 'block text-sm font-medium text-ink'

export const hintClasses = 'mt-1.5 text-sm text-ink-muted'

export const errorClasses = 'mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger-foreground'
