import { expect, test } from '@playwright/test';
import { completeAffordability, cont, pdf, pickPersonalLoan } from './helpers';

test.describe('landing page and SEO', () => {
  test('has title, description, canonical, JSON-LD and a working call to action', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Loan Simulator/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/$/);
    await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('link', { name: /start simulation/i }).first().click();
    await expect(page).toHaveURL(/\/simulator/);
  });

  test('a loan card deep links into the simulator and skips loan selection', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /simulate this loan/i }).first().click();
    await expect(page.getByTestId('grossIncome')).toBeVisible();
  });

  test('unknown routes show a not-found state', async ({ page }) => {
    await page.goto('/nope');
    await expect(page.getByRole('heading', { name: /could not find/i })).toBeVisible();
  });
});

test.describe('affordability flow', () => {
  test('continue stays greyed out until required information is valid', async ({ page }) => {
    await page.goto('/simulator');
    await expect(cont(page)).toBeDisabled();
    await page.getByRole('radio', { name: /^personal loan/i }).click();
    await expect(cont(page)).toBeEnabled();
    await cont(page).click();

    await expect(cont(page)).toBeDisabled();
    await page.getByTestId('grossIncome').fill('20000');
    await page.getByTestId('netIncome').fill('25000'); // net above gross is invalid
    await expect(page.getByRole('alert')).toContainText(/net income/i);
    await expect(cont(page)).toBeDisabled();
    await page.getByTestId('netIncome').fill('18000');
    await expect(cont(page)).toBeEnabled();
  });

  test('shows an instalment and a verdict', async ({ page }) => {
    await completeAffordability(page);
    await expect(page.getByTestId('instalment')).toContainText('R');
    await expect(page.getByTestId('verdict')).toHaveAttribute('data-verdict', /affordable|stretch/);
    await expect(page.getByRole('button', { name: /continue to eligibility/i })).toBeEnabled();
  });

  test('blocks eligibility when the loan is not affordable', async ({ page }) => {
    await pickPersonalLoan(page);
    await page.getByTestId('grossIncome').fill('8000');
    await page.getByTestId('netIncome').fill('6500');
    await cont(page).click();
    for (const id of ['housing', 'transport', 'living', 'other', 'existingDebt']) await page.getByTestId(id).fill('1200');
    await cont(page).click();
    await cont(page).click();
    await expect(page.getByTestId('verdict')).toHaveAttribute('data-verdict', 'unaffordable');
    await expect(page.getByRole('button', { name: /continue to eligibility/i })).toBeDisabled();
  });
});

test.describe('persistence', () => {
  test('keeps the step and entered data after a refresh', async ({ page }) => {
    await pickPersonalLoan(page);
    await page.getByTestId('grossIncome').fill('30000');
    await page.reload();
    await expect(page.getByTestId('grossIncome')).toHaveValue('30000');
  });
});

test.describe('eligibility flow', () => {
  test('uploads documents step by step and submits', async ({ page }) => {
    await completeAffordability(page);
    await page.getByRole('button', { name: /continue to eligibility/i }).click();

    // basics
    await expect(cont(page)).toBeDisabled();
    await page.getByTestId('age').fill('30');
    await page.getByTestId('salaryIntoCapitec-yes').click();
    for (const box of await page.getByRole('checkbox').all()) await box.click();
    await expect(cont(page)).toBeEnabled();
    await cont(page).click();

    // two documents (bank statement is not needed when salary is paid into Capitec)
    for (let i = 0; i < 2; i++) {
      await expect(cont(page)).toBeDisabled();
      await page.getByTestId('file-input').setInputFiles(pdf);
      await expect(page.getByTestId('uploaded-file')).toBeVisible();
      await cont(page).click();
    }

    await page.getByRole('button', { name: /submit simulated application/i }).click();
    await expect(page.getByTestId('reference')).toHaveText(/^LS-/);

    await page.reload();
    await expect(page.getByTestId('reference')).toHaveText(/^LS-/); // submitted state survives refresh
  });

  test('adds a bank statement step when salary is not paid into Capitec', async ({ page }) => {
    await completeAffordability(page);
    await page.getByRole('button', { name: /continue to eligibility/i }).click();
    await page.getByTestId('age').fill('30');
    await page.getByTestId('salaryIntoCapitec-no').click();
    for (const box of await page.getByRole('checkbox').all()) await box.click();
    await cont(page).click();
    await page.getByTestId('file-input').setInputFiles(pdf);
    await cont(page).click();
    await page.getByTestId('file-input').setInputFiles(pdf);
    await cont(page).click();
    await expect(page.getByRole('heading', { name: /bank statement with three salary deposits/i })).toBeVisible();
  });

  test('rejects unsupported files with an error toast', async ({ page }) => {
    await completeAffordability(page);
    await page.getByRole('button', { name: /continue to eligibility/i }).click();
    await page.getByTestId('age').fill('30');
    await page.getByTestId('salaryIntoCapitec-yes').click();
    for (const box of await page.getByRole('checkbox').all()) await box.click();
    await cont(page).click();
    await page.getByTestId('file-input').setInputFiles({ name: 'virus.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('x') });
    await expect(page.getByText(/only pdf, jpg or png/i)).toBeVisible();
    await expect(cont(page)).toBeDisabled();
  });
});

test('layout has no horizontal scroll on any viewport', async ({ page }) => {
  for (const path of ['/', '/simulator']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  }
});
