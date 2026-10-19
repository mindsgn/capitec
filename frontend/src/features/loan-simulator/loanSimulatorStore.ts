import { create } from 'zustand'

import { calculateLoanEstimate } from '@/lib/loan'
import type { LoanEstimate } from '@/lib/loan'
import { validateLoanSimulator } from '@/lib/validation'
import type { FormError, LoanSimulatorFormValues } from '@/lib/validation'

/** Illustrative rate used only to demonstrate the estimate flow. */
export const ILLUSTRATIVE_INTEREST_RATE = 12.5

const EMPTY_VALUES: LoanSimulatorFormValues = {
  loanAmount: '',
  loanTerm: '24',
  monthlyIncome: '',
  monthlyExpenses: '',
  existingDebt: '',
}

export interface LoanSimulatorStore {
  values: LoanSimulatorFormValues
  errors: FormError[]
  estimate: LoanEstimate | null
  setValue: (field: keyof LoanSimulatorFormValues, value: string) => void
  /** Validates and, when valid, calculates an estimate and announces it. */
  submit: () => void
  /** Clears every field, error and result. */
  reset: () => void
}

/**
 * Small zustand store for the simulator. Business logic (parsing, validation,
 * calculation) stays in `@/lib`; the store only coordinates it and keeps the
 * form values as editable strings so partial input is never lost.
 */
export const useLoanSimulatorStore = create<LoanSimulatorStore>((set, get) => ({
  values: { ...EMPTY_VALUES },
  errors: [],
  estimate: null,

  setValue: (field, value) =>
    set((state) => ({
      values: { ...state.values, [field]: value },
    })),

  submit: () => {
    const result = validateLoanSimulator(get().values)

    if (!result.success) {
      set({ errors: result.errors, estimate: null })
      return
    }

    const estimate = calculateLoanEstimate({
      loanAmount: result.data.loanAmount,
      annualInterestRate: ILLUSTRATIVE_INTEREST_RATE,
      termMonths: result.data.loanTerm,
      monthlyIncome: result.data.monthlyIncome,
      monthlyExpenses: result.data.monthlyExpenses,
      existingDebt: result.data.existingDebt,
    })

    set({
      errors: [],
      estimate,
    })
  },

  reset: () => set({ values: { ...EMPTY_VALUES }, errors: [], estimate: null }),
}))
