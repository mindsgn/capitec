import { z } from 'zod'

import { parseCurrency } from './currency'

/**
 * Validation lives in the schema layer, not in the presentational field
 * components. The loan simulator form stores currency amounts as editable
 * strings (so partial input is preserved while typing) and this schema:
 *
 * - parses those strings with `parseCurrency`,
 * - rejects empty, invalid, negative, non-finite and out-of-range values,
 * - converts valid strings into numbers for the calculation layer.
 *
 * Rules stay independent of presentation: an issue carries a stable code (the
 * last segment of a translation key) plus the numeric bounds it mentions, and
 * the UI translates it at render time with `translateFormError`. That keeps
 * messages correct when the active language changes after a submit.
 */

export type LoanSimulatorFieldId =
  | 'loanAmount'
  | 'loanTerm'
  | 'monthlyIncome'
  | 'monthlyExpenses'
  | 'existingDebt'

export type ValidationErrorCode =
  | 'required'
  | 'invalid'
  | 'negative'
  | 'range'
  | 'min'
  | 'positive'

export interface FormErrorValues {
  min?: number
  max?: number
  /** How a bound should be rendered: rand amounts vs plain counts. */
  format?: 'currency' | 'number'
}

export interface FormError {
  /** Stable id of the control the error belongs to. */
  fieldId: string
  /** Translation key within the `validation` namespace. */
  key: string
  /** Values used for interpolation in translation. */
  values?: FormErrorValues
}

function extractValues(params: Record<string, unknown> | undefined): FormErrorValues | undefined {
  if (!params) return undefined
  const values: FormErrorValues = {}
  if (typeof params.min === 'number') {
    values.min = params.min
  }
  if (typeof params.max === 'number') {
    values.max = params.max
  }
  if (params.format === 'currency' || params.format === 'number') {
    values.format = params.format
  }
  return Object.keys(values).length > 0 ? values : undefined
}

/**
 * Records a schema issue carrying a stable `ValidationErrorCode` (plus any
 * bounds it mentions) instead of a sentence, so the UI can translate it later.
 */
function addIssue(
  ctx: z.RefinementCtx,
  code: ValidationErrorCode,
  params?: Record<string, unknown>,
): never {
  ctx.addIssue(params ? { code: 'custom', message: code, params } : { code: 'custom', message: code })
  return z.NEVER
}

function currencyAmount(options: {
  required?: boolean
  min?: number
  max?: number
  allowZero?: boolean
}) {
  const { required = false, min, max, allowZero = true } = options

  return z.string().transform((raw, ctx) => {
    const result = parseCurrency(raw)

    if (result.kind === 'empty') {
      if (required) {
        return addIssue(ctx, 'required')
      }
      return null
    }

    if (result.kind === 'invalid') {
      return addIssue(ctx, result.reason === 'negative' ? 'negative' : 'invalid')
    }

    const { value } = result

    if (!allowZero && value === 0) {
      return addIssue(ctx, 'positive')
    }

    if (min !== undefined && value < min) {
      return max !== undefined
        ? addIssue(ctx, 'range', { min, max, format: 'currency' })
        : addIssue(ctx, 'min', { min, format: 'currency' })
    }

    if (max !== undefined && value > max) {
      return addIssue(ctx, 'range', { min, max, format: 'currency' })
    }

    return value
  })
}

const wholeNumber = (options: { min?: number; max?: number }) => {
  const { min, max } = options

  return z.string().transform((raw, ctx) => {
    const trimmed = raw.trim()

    if (trimmed === '') {
      return addIssue(ctx, 'required')
    }

    const value = Number(trimmed)

    if (!Number.isInteger(value)) {
      return addIssue(ctx, 'invalid')
    }

    if (min !== undefined && value < min) {
      return addIssue(ctx, 'range', { min, max, format: 'number' })
    }

    if (max !== undefined && value > max) {
      return addIssue(ctx, 'range', { min, max, format: 'number' })
    }

    return value
  })
}

/**
 * Illustrative loan simulator schema. Limits mirror the documented API
 * validation rules (`LoanEligibilitySimulatorEndpoints.md`).
 */
export const LOAN_SIMULATOR_LIMITS = {
  amount: { min: 5_000, max: 300_000 },
  term: { min: 6, max: 60 },
  income: { min: 5_000 },
} as const

export const loanSimulatorSchema = z.object({
  loanAmount: currencyAmount({
    required: true,
    min: LOAN_SIMULATOR_LIMITS.amount.min,
    max: LOAN_SIMULATOR_LIMITS.amount.max,
  }),
  loanTerm: wholeNumber({
    min: LOAN_SIMULATOR_LIMITS.term.min,
    max: LOAN_SIMULATOR_LIMITS.term.max,
  }),
  monthlyIncome: currencyAmount({
    required: true,
    min: LOAN_SIMULATOR_LIMITS.income.min,
  }),
  monthlyExpenses: currencyAmount({
    required: true,
    min: 0,
  }),
  existingDebt: currencyAmount({
    required: false,
    min: 0,
  }),
})

export type LoanSimulatorInput = z.infer<typeof loanSimulatorSchema>

/** The shape before currency strings are parsed into numbers. */
export type LoanSimulatorFormValues = Record<LoanSimulatorFieldId, string>

/** The parsed shape handed to the calculation layer: every field is a number. */
export type LoanSimulatorValues = Record<LoanSimulatorFieldId, number>

/**
 * Maps a Zod error onto the `{ fieldId, key, values }` shape consumed by the
 * i18n-aware UI. Field ids are the schema keys, which callers use as the DOM
 * ids of their controls so summary links resolve to the right input.
 */
export function toFormErrors(error: z.ZodError): FormError[] {
  return error.issues.map((issue) => {
    const rawFieldId = issue.path.length > 0 ? String(issue.path[0]) : 'form'
    const fieldId = rawFieldId === '' ? 'form' : rawFieldId
    const params = 'params' in issue ? issue.params : undefined
    return {
      fieldId,
      key: `${fieldId}.${issue.message}`,
      values: extractValues(params),
    }
  })
}

/**
 * Validates raw form values and returns either the parsed values or a list of
 * field errors. Intended to be called on submit and by field-level validation.
 */
export function validateLoanSimulator(values: LoanSimulatorFormValues):
  | { success: true; data: LoanSimulatorValues }
  | { success: false; errors: FormError[] } {
  const result = loanSimulatorSchema.safeParse(values)

  if (!result.success) {
    return { success: false, errors: toFormErrors(result.error) }
  }

  // Required fields cannot be `null` when validation succeeds (an empty value
  // adds an issue and returns `z.NEVER`), so the `?? 0` fallbacks are only a
  // type-safe safety net for the optional debt field.
  const parsed = result.data
  return {
    success: true,
    data: {
      loanAmount: parsed.loanAmount ?? 0,
      loanTerm: parsed.loanTerm,
      monthlyIncome: parsed.monthlyIncome ?? 0,
      monthlyExpenses: parsed.monthlyExpenses ?? 0,
      existingDebt: parsed.existingDebt ?? 0,
    },
  }
}
