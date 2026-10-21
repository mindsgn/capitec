import { expect, test } from '@playwright/test';
import { completeAffordability, cont, fillPersonalBasics, passDecision, pdf, pickPersonalLoan } from './helpers';

test.describe('landing page and SEO', () => {
  test('has title, description, canonical, JSON-LD and a working call to action', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Loan Simulator/);
    await expect(page.locator('meta[name="description"]').first()).toHaveAttribute('content', /.{40,}/); // index.html ships a static description and Helmet adds its own, so scope to the first
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/$/);
    await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('link', { name: /start simulation/i }).first().click();
    await expect(page).toHaveURL(/\/simulator/);
  });

  test('header shows the Capitec logo and brand name', async ({ page }) => {
    await page.goto('/');
    const logo = page.getByTestId('header-logo');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', '/logo.png');
    expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0); // the asset resolves, no 404
    await expect(page.locator('header').getByRole('link', { name: 'Capitec' })).toHaveAttribute('href', '/');
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

test.describe('loan details step', () => {
  test('shows the term breakdown and updates it live from the slider', async ({ page }) => {
    await pickPersonalLoan(page);
    await page.getByTestId('grossIncome').fill('30000');
    await page.getByTestId('netIncome').fill('24000');
    await cont(page).click();
    for (const id of ['housing', 'transport', 'living', 'other', 'existingDebt']) await page.getByTestId(id).fill('500');
    await cont(page).click();

    // personal loan defaults: R20 000 over 36 months
    await expect(page.getByTestId('term-label')).toHaveText('36 months (3y)');
    await expect(page.getByText(/estimated instalment at an indicative 24% a year/i)).toBeVisible();

    // nudge the term forward one month with the keyboard and watch the breakdown follow
    const termSlider = page.getByRole('slider', { name: 'Repayment term' });
    await termSlider.focus();
    await termSlider.press('ArrowRight');
    await expect(page.getByTestId('term-label')).toHaveText('37 months (3y 1m)');
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

    // basics, then the simulated eligibility decision
    await expect(cont(page)).toBeDisabled();
    await fillPersonalBasics(page);
    await expect(cont(page)).toBeEnabled();
    await cont(page).click();
    await passDecision(page);

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
    await fillPersonalBasics(page, { salary: 'no' });
    // wait for each document step to render before uploading, otherwise the input
    // of the previous step is still mounted and receives the file
    await cont(page).click();
    await passDecision(page);
    await expect(page.getByRole('heading', { name: /south african id/i })).toBeVisible();
    await page.getByTestId('file-input').setInputFiles(pdf);
    await expect(page.getByTestId('uploaded-file')).toBeVisible();
    await cont(page).click();
    await expect(page.getByRole('heading', { name: /latest salary slip/i })).toBeVisible();
    await page.getByTestId('file-input').setInputFiles(pdf);
    await expect(page.getByTestId('uploaded-file')).toBeVisible();
    await cont(page).click();
    await expect(page.getByRole('heading', { name: /bank statement with three salary deposits/i })).toBeVisible();
  });

  test('rejects unsupported files with an error toast', async ({ page }) => {
    await completeAffordability(page);
    await page.getByRole('button', { name: /continue to eligibility/i }).click();
    await fillPersonalBasics(page);
    await cont(page).click();
    await passDecision(page);
    await page.getByTestId('file-input').setInputFiles({ name: 'virus.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('x') });
    await expect(page.getByText(/only pdf, jpg or png/i)).toBeVisible();
    await expect(cont(page)).toBeDisabled();
  });

  test('shows the simulated eligibility result before documents', async ({ page }) => {
    await completeAffordability(page);
    await page.getByRole('button', { name: /continue to eligibility/i }).click();
    await fillPersonalBasics(page);
    await cont(page).click();

    await expect(page.getByTestId('eligibility-decision')).toHaveAttribute('data-eligible', 'true');
    await expect(page.getByTestId('approval-likelihood')).toHaveText('85%');
    await expect(page.getByTestId('api-instalment')).toContainText('669,07');
    await cont(page).click();

    for (let i = 0; i < 2; i++) {
      await expect(cont(page)).toBeDisabled();
      await page.getByTestId('file-input').setInputFiles(pdf);
      await expect(page.getByTestId('uploaded-file')).toBeVisible();
      await cont(page).click();
    }
    await page.getByRole('button', { name: /submit simulated application/i }).click();
    await expect(page.getByTestId('reference')).toHaveText(/^LS-/);
  });

  test('blocks continue when the applicant is unemployed', async ({ page }) => {
    await completeAffordability(page);
    await page.getByRole('button', { name: /continue to eligibility/i }).click();
    await fillPersonalBasics(page, { status: 'unemployed' });
    await cont(page).click();
    await expect(page.getByTestId('eligibility-decision')).toHaveAttribute('data-eligible', 'false');
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
