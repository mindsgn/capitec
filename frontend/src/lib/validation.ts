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
 */

export interface FormError {
  /** Stable id of the control the error belongs to. */
  fieldId: string
  /** Human-readable message shown in the error summary and inline. */
  message: string
}

function currencyAmount(options: {
  label: string
  required?: boolean
  min?: number
  max?: number
  minMessage?: string
  maxMessage?: string
  allowZero?: boolean
}) {
  const {
    label,
    required = false,
    min,
    max,
    minMessage,
    maxMessage,
    allowZero = true,
  } = options

  return z.string().transform((raw, ctx) => {
    const result = parseCurrency(raw)

    if (result.kind === 'empty') {
      if (required) {
        ctx.addIssue({ code: 'custom', message: `Enter ${label.toLowerCase()}.` })
        return z.NEVER
      }
      return null
    }

    if (result.kind === 'invalid') {
      ctx.addIssue({
        code: 'custom',
        message:
          result.reason === 'negative'
            ? `${label} cannot be negative.`
            : `Enter a valid ${label.toLowerCase()}.`,
      })
      return z.NEVER
    }

    const { value } = result

    if (!allowZero && value === 0) {
      ctx.addIssue({ code: 'custom', message: `${label} must be greater than zero.` })
      return z.NEVER
    }

    if (min !== undefined && value < min) {
      ctx.addIssue({
        code: 'custom',
        message: minMessage ?? `${label} must be at least ${min}.`,
      })
      return z.NEVER
    }

    if (max !== undefined && value > max) {
      ctx.addIssue({
        code: 'custom',
        message: maxMessage ?? `${label} must not exceed ${max}.`,
      })
      return z.NEVER
    }

    return value
  })
}

const wholeNumber = (options: {
  label: string
  min?: number
  max?: number
  minMessage?: string
  maxMessage?: string
}) => {
  const { label, min, max, minMessage, maxMessage } = options

  return z.string().transform((raw, ctx) => {
    const trimmed = raw.trim()

    if (trimmed === '') {
      ctx.addIssue({ code: 'custom', message: `Select ${label.toLowerCase()}.` })
      return z.NEVER
    }

    const value = Number(trimmed)

    if (!Number.isInteger(value)) {
      ctx.addIssue({ code: 'custom', message: `Select a valid ${label.toLowerCase()}.` })
      return z.NEVER
    }

    if (min !== undefined && value < min) {
      ctx.addIssue({ code: 'custom', message: minMessage ?? `${label} is too small.` })
      return z.NEVER
    }

    if (max !== undefined && value > max) {
      ctx.addIssue({ code: 'custom', message: maxMessage ?? `${label} is too large.` })
      return z.NEVER
    }

    return value
  })
}

/**
 * Illustrative loan simulator schema. Limits mirror the documented API
 * validation rules (`LoanEligibilitySimulatorEndpoints.md`).
 */
export const loanSimulatorSchema = z.object({
  loanAmount: currencyAmount({
    label: 'Loan amount',
    required: true,
    min: 5_000,
    max: 300_000,
    minMessage: 'Loan amount must be between R5 000 and R300 000.',
    maxMessage: 'Loan amount must be between R5 000 and R300 000.',
  }),
  loanTerm: wholeNumber({
    label: 'Repayment term',
    min: 6,
    max: 60,
    minMessage: 'Loan term must be between 6 and 60 months.',
    maxMessage: 'Loan term must be between 6 and 60 months.',
  }),
  monthlyIncome: currencyAmount({
    label: 'Monthly income',
    required: true,
    min: 5_000,
    minMessage: 'Minimum monthly income of R5 000 required.',
  }),
  monthlyExpenses: currencyAmount({
    label: 'Monthly expenses',
    required: true,
    min: 0,
  }),
  existingDebt: currencyAmount({
    label: 'Existing monthly debt',
    required: false,
    min: 0,
  }),
})

export type LoanSimulatorInput = z.infer<typeof loanSimulatorSchema>

/** The shape before currency strings are parsed into numbers. */
export interface LoanSimulatorFormValues {
  loanAmount: string
  loanTerm: string
  monthlyIncome: string
  monthlyExpenses: string
  existingDebt: string
}

/** The parsed shape handed to the calculation layer: every amount is a number. */
export interface LoanSimulatorValues {
  loanAmount: number
  loanTerm: number
  monthlyIncome: number
  monthlyExpenses: number
  existingDebt: number
}

/**
 * Maps a Zod error onto the `{ fieldId, message }` shape consumed by
 * `FormErrorSummary`. Field ids are the schema keys, which callers use as the
 * DOM ids of their controls so summary links resolve to the right input.
 */
export function toFormErrors(error: z.ZodError): FormError[] {
  return error.issues.map((issue) => ({
    fieldId: issue.path.length > 0 ? issue.path.join('.') : 'form',
    message: issue.message,
  }))
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
