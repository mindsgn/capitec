import AxeBuilder from '@axe-core/playwright'
import type { Locator, Page } from '@playwright/test'

import { BORROWERS, estimateFor } from './fixtures/financial-scenarios'
import { expect, test } from './fixtures/test'
import { COPY, LoanForm, RESULT_TEST_IDS } from './helpers/loan-form'

/**
 * E2E-13…15: reload behaviour, responsiveness and accessibility.
 *
 * Scope notes (see `docs/e2e-test-plan.md`):
 * - E2E-17 records language switching as blocked; only English ships, so this
 *   file asserts the English baseline only.
 * - The axe scan below finds automatically detectable WCAG A/AA issues; it is
 *   not a conformance certificate.
 * - The native range input keeps the browser's 8 px track height, so slider
 *   width/operability is asserted instead of a 24 px height. That is a
 *   documented observation for product review, not a test failure.
 */

const VALID_INPUTS = {
  loanAmount: '100000',
  termMonths: 24,
  monthlyIncome: '18000',
  monthlyExpenses: '10000',
  existingDebt: '1500',
} as const

const ORDINARY_EXPECTATION = estimateFor({ loanAmount: 100_000, termMonths: 24 }, BORROWERS.ordinary)

/** Fails with the offending nodes when axe finds a WCAG A/AA violation. */
async function expectNoAxeViolations(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const violations = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes
        .map((node) => node.target.join(' '))
        .join(', ')}`,
  )
  expect(violations, `axe violations in the ${state} state`).toEqual([])
}

/** The page must not scroll sideways at the current viewport. */
async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    documentElement: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }))
  expect(overflow.documentElement, 'page must not scroll horizontally').toBeLessThanOrEqual(1)
  expect(overflow.body, 'body must not scroll horizontally').toBeLessThanOrEqual(1)
}

/** Layout box of a control, asserting it is actually laid out. */
async function layoutBox(control: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await control.boundingBox()
  expect(box, 'the control should be laid out and measurable').not.toBeNull()
  if (!box) {
    throw new Error('unreachable: boundingBox was asserted not to be null')
  }
  return box
}

test.describe('E2E-13: refreshing or leaving the page', () => {
  test('reloads to a clean, empty state that is still fully usable', async ({ page }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.calculate(VALID_INPUTS)
    await form.expectResults(ORDINARY_EXPECTATION)

    await page.reload()
    await expect(form.heading).toBeVisible()

    // The store is in memory only, so a reload starts from the documented
    // defaults: empty fields, the default 24-month term and no estimate.
    await expect(form.amount).toHaveValue('')
    await expect(form.income).toHaveValue('')
    await expect(form.expenses).toHaveValue('')
    await expect(form.debt).toHaveValue('')
    await expect(form.term).toHaveValue('24')
    await expect(form.emptyState).toBeVisible()
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)
    await expect(form.errorSummary).toHaveCount(0)

    // No unhandled error is logged while recovering from the unpersisted state
    // (the diagnostics fixture fails this test if one is).

    // The refreshed page is fully usable again.
    await form.calculate(VALID_INPUTS)
    await form.expectResults(ORDINARY_EXPECTATION)
  })
})

test.describe('E2E-14: usability at a desktop and a mobile viewport', () => {
  test('layout and controls stay usable without horizontal scrolling at this viewport', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    await expectNoHorizontalOverflow(page)

    // Primary controls are laid out on screen at a comfortable size.
    const controls = [
      form.amount,
      form.term,
      form.income,
      form.expenses,
      form.debt,
      form.submitButton,
      form.resetButton,
    ]
    for (const control of controls) {
      await expect(control).toBeVisible()
      const box = await layoutBox(control)
      expect(box.width, 'control width').toBeGreaterThanOrEqual(24)
      expect(box.height, 'control height').toBeGreaterThanOrEqual(24)
    }

    // The range input is full width and operable; only its track height is
    // browser-default (8 px), which is documented for product review.
    await expect(form.slider).toBeVisible()
    expect((await layoutBox(form.slider)).width).toBeGreaterThanOrEqual(24)

    // Labels and hints remain readable rather than clipped or overlapping.
    await expect(page.getByText(COPY.amountHint)).toBeVisible()
    await expect(page.getByText(COPY.rateNote)).toBeVisible()

    // The whole flow works at this viewport, and results do not overflow.
    await form.calculate(VALID_INPUTS)
    await form.expectResults(ORDINARY_EXPECTATION)
    await expectNoHorizontalOverflow(page)

    // The modal fits inside the viewport and can be dismissed.
    await form.openResetDialog()
    const viewport = page.viewportSize()
    expect(viewport).not.toBeNull()
    if (!viewport) {
      throw new Error('unreachable: viewport was asserted not to be null')
    }
    expect((await layoutBox(form.dialog)).width).toBeLessThanOrEqual(viewport.width)
    await form.dialog.getByRole('button', { name: COPY.dialogCancel, exact: true }).click()
    await expect(form.dialog).not.toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('mobile viewport: touch targets, single-column layout and a working flow', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile-specific expectations')

    const form = new LoanForm(page)
    await form.goto()

    const viewport = page.viewportSize()
    expect(viewport).not.toBeNull()
    if (!viewport) {
      throw new Error('unreachable: viewport was asserted not to be null')
    }
    // Pixel 7 project: 412 CSS px wide.
    expect(viewport.width).toBeLessThanOrEqual(480)
    await expectNoHorizontalOverflow(page)

    // Touch targets meet the 44 px guidance this project uses for its form
    // controls, buttons and disclosures.
    const controls = [
      form.amount,
      form.term,
      form.income,
      form.expenses,
      form.debt,
      form.submitButton,
      form.resetButton,
      form.helpSummary,
    ]
    for (const control of controls) {
      const box = await layoutBox(control)
      expect(box.height, 'touch target height').toBeGreaterThanOrEqual(44)
      expect(box.width, 'touch target width').toBeGreaterThanOrEqual(44)
    }

    // Fields stack in one column, left-aligned, instead of being squeezed.
    const amountBox = await layoutBox(form.amount)
    const incomeBox = await layoutBox(form.income)
    expect(incomeBox.y).toBeGreaterThan(amountBox.y)
    expect(incomeBox.x).toBe(amountBox.x)

    // The full flow and the modal work at this size.
    await form.calculate(VALID_INPUTS)
    await form.expectResults(ORDINARY_EXPECTATION)
    await form.openResetDialog()
    expect((await layoutBox(form.dialog)).width).toBeLessThanOrEqual(viewport.width)
    await form.dialog.getByRole('button', { name: COPY.dialogConfirm, exact: true }).click()
    await expect(form.amount).toHaveValue('')
    await expect(form.emptyState).toBeVisible()
  })
})

test.describe('E2E-15: keyboard access and assistive-technology support', () => {
  test('skip link, tab order and visible focus indicators', async ({ page }) => {
    const form = new LoanForm(page)
    await form.goto()

    // The skip link is the first stop and becomes visible when focused.
    await page.keyboard.press('Tab')
    await expect(form.skipLink).toBeFocused()
    await expect(form.skipLink).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()

    // Sequential focus follows the visual order of the form.
    const order: ReadonlyArray<readonly [string, Locator]> = [
      ['loan amount', form.amount],
      ['amount slider', form.slider],
      ['repayment term', form.term],
      ['monthly income', form.income],
      ['monthly expenses', form.expenses],
      ['existing monthly debt', form.debt],
      ['interest rate help', form.interestTooltip],
      ['update estimate', form.submitButton],
      ['reset', form.resetButton],
      ['help disclosure', form.helpSummary],
    ]

    for (const [name, control] of order) {
      await page.keyboard.press('Tab')
      await expect(control, `${name} should receive focus in order`).toBeFocused()

      // Focus is always visible (a solid outline) and matches :focus-visible,
      // so keyboard users can see where they are without relying on colour.
      const indicator = await control.evaluate((element) => ({
        focusVisible: element.matches(':focus-visible'),
        outlineStyle: getComputedStyle(element).outlineStyle,
      }))
      expect(indicator.focusVisible, `${name} should match :focus-visible`).toBe(true)
      expect(indicator.outlineStyle, `${name} should draw a focus outline`).not.toBe('none')
    }
  })

  test('the form can be completed and submitted with the keyboard only', async ({ page }) => {
    const form = new LoanForm(page)
    await form.goto()

    // Enter the form through the skip link, then type into each field.
    await page.keyboard.press('Tab')
    await expect(form.skipLink).toBeFocused()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await expect(form.amount).toBeFocused()
    await page.keyboard.type('100000')

    await page.keyboard.press('Tab')
    await expect(form.slider).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(form.term).toBeFocused()
    // The native select is keyboard-operable: Chromium on macOS keeps a closed
    // select on the popup (arrow keys change the selection once the popup is
    // open), so the interaction asserted here is keyboard typeahead.
    await page.keyboard.type('3')
    await expect(form.term).toHaveValue('36')

    await page.keyboard.press('Tab')
    await expect(form.income).toBeFocused()
    await page.keyboard.type('18000')
    await page.keyboard.press('Tab')
    await page.keyboard.type('10000')
    await page.keyboard.press('Tab')
    await page.keyboard.type('1500')
    await expect(form.debt).toHaveValue('1500')

    // Implicit submission: Enter from a text field submits the form.
    await page.keyboard.press('Enter')

    await form.expectResults(estimateFor({ loanAmount: 100_000, termMonths: 36 }, BORROWERS.ordinary))
    await expect(form.successNotice).toBeVisible()
    await expect(form.errorSummary).toHaveCount(0)
  })

  test('the slider responds to arrow keys and keeps the amount field in sync', async ({ page }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.amount.fill('100000')
    await form.slider.focus()

    // One arrow step is the configured R 1 000 slider step.
    await page.keyboard.press('ArrowRight')
    await expect(form.amount).toHaveValue('101000')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await expect(form.amount).toHaveValue('99000')
    await expect(form.slider).toHaveValue('99000')
    await expect(form.slider).toHaveAttribute('aria-valuetext', /99[^\d]000/)

    // The keyboard-adjusted amount is what gets calculated.
    await form.fill({
      termMonths: 24,
      monthlyIncome: '18000',
      monthlyExpenses: '10000',
      existingDebt: '1500',
    })
    await form.submit()
    await form.expectResults(estimateFor({ loanAmount: 99_000, termMonths: 24 }, BORROWERS.ordinary))
  })

  test('an invalid submit moves focus to the error summary and its links focus the fields', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await expect(form.amount).toBeFocused()
    await page.keyboard.press('Enter')

    // Focus moves to the summary so a keyboard or screen-reader user learns
    // about the errors without hunting for them.
    await expect(form.errorSummary).toBeVisible()
    await expect(form.errorSummary).toBeFocused()
    await expect(form.errorSummary.getByRole('link')).toHaveCount(3)

    // Tabbing reaches the summary links, and activating one focuses its field.
    await page.keyboard.press('Tab')
    const firstLink = form.errorSummary.getByRole('link').first()
    await expect(firstLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(form.amount).toBeFocused()
  })

  test('the reset dialog keeps focus in the modal and restores it on Escape', async ({ page }) => {
    const form = new LoanForm(page)
    await form.goto()
    await form.amount.fill('100000')

    await form.openResetDialog()
    await expect(
      form.dialog.getByRole('button', { name: COPY.dialogCancel, exact: true }),
    ).toBeFocused()

    // Nothing behind the modal is reachable while it is open. Chromium moves
    // focus to its own chrome at the end of the cycle, which is not a page
    // element, so the assertion is that no page control receives focus.
    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press('Tab')
      const focusBehindModal = await form.dialog.evaluate((dialog) => {
        const active = document.activeElement
        return Boolean(active && !dialog.contains(active) && active.closest('main'))
      })
      expect(focusBehindModal, 'focus must not reach the page behind the modal').toBe(false)
    }

    // Escape cancels: the dialog closes, focus returns to the opener and the
    // typed value is untouched.
    await page.keyboard.press('Escape')
    await expect(form.dialog).not.toBeVisible()
    await expect(form.resetButton).toBeFocused()
    await expect(form.amount).toHaveValue('100000')

    // Confirming, by contrast, clears the values and the estimate.
    await page.keyboard.press('Enter')
    await expect(form.dialog).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(
      form.dialog.getByRole('button', { name: COPY.dialogConfirm, exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(form.dialog).not.toBeVisible()
    await expect(form.amount).toHaveValue('')
    await expect(form.emptyState).toBeVisible()
  })

  test('axe-core finds no automatically detectable WCAG A/AA violations in the key states', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()
    await expectNoAxeViolations(page, 'initial page')

    // Validation state: summary, inline messages and invalid controls.
    await form.submit()
    await expect(form.errorSummary).toBeVisible()
    await expectNoAxeViolations(page, 'validation errors')

    // Results state, affordable variant (success notice).
    await form.calculate(VALID_INPUTS)
    await form.expectResults(ORDINARY_EXPECTATION)
    await expect(form.successNotice).toBeVisible()
    await expectNoAxeViolations(page, 'affordable results')

    // Results state, unaffordable variant (warning notice).
    await form.calculate({
      loanAmount: '150000',
      termMonths: 24,
      monthlyIncome: '12000',
      monthlyExpenses: '14000',
      existingDebt: '0',
    })
    await expect(form.warningNotice).toBeVisible()
    await expectNoAxeViolations(page, 'unaffordable results')

    // The help disclosure expanded.
    await form.helpSummary.click()
    await expect(page.getByText('What we look at', { exact: true })).toBeVisible()
    await expectNoAxeViolations(page, 'help panel expanded')

    // The modal dialog.
    await form.openResetDialog()
    await expectNoAxeViolations(page, 'reset dialog')
  })
})
