import { expect, type Locator, type Page, test } from '@playwright/test';

const TYPE_DELAY = 160;
const pdf = { mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 demo') };

test.use({
  storageState: { cookies: [], origins: [] },
});

test('walkthrough', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForTimeout(2200);

  await switchLanguage(page, 'af', 1800);
  await switchLanguage(page, 'zu', 1800);
  await switchLanguage(page, 'en', 900);

  await smoothScroll(page, 520);
  await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
  await page.waitForTimeout(2200);
  await smoothScroll(page, -520);
  await page.waitForTimeout(700);

  await page.getByRole('link', { name: /start simulation/i }).click();
  await expect(page.getByRole('heading', { name: /which loan do you want/i })).toBeVisible();
  await page.waitForTimeout(1400);
  await smoothScroll(page, 380);
  await page.waitForTimeout(1600);
  await smoothScroll(page, -380);
  await page.waitForTimeout(600);

  const personal = page.getByRole('radio', { name: /^personal loan/i });
  await personal.hover();
  await page.waitForTimeout(700);
  await personal.click();
  await page.waitForTimeout(1100);
  await goOn(page);

  await expect(page.getByRole('heading', { name: /monthly income/i })).toBeVisible();
  await page.waitForTimeout(800);
  await typeNumber(page, 'grossIncome', '30000');
  await typeNumber(page, 'netIncome', '24000');
  await goOn(page);

  await expect(page.getByRole('heading', { name: /monthly expenses/i })).toBeVisible();
  await page.waitForTimeout(800);
  await typeNumber(page, 'housing', '6000');
  await typeNumber(page, 'transport', '800');
  await typeNumber(page, 'living', '3500');
  await typeNumber(page, 'other', '400');
  await typeNumber(page, 'existingDebt', '500');
  await goOn(page);

  await expect(page.getByRole('heading', { name: /your personal loan/i })).toBeVisible();
  await expect(page.getByTestId('amount')).toHaveValue('20000');
  await page.waitForTimeout(1200);
  await nudgeSlider(page, 'Loan amount', 12);
  await page.waitForTimeout(1400);
  await nudgeSlider(page, 'Repayment term', 8);
  await expect(page.getByText(/estimated instalment at an indicative/i)).toBeVisible();
  await page.waitForTimeout(1800);
  await goOn(page);

  await expect(page.getByTestId('verdict')).toBeVisible();
  await reveal(page.getByTestId('verdict'));
  await expect(page.getByRole('button', { name: /continue to eligibility/i })).toBeEnabled();
  await page.waitForTimeout(3200);
  await page.getByRole('button', { name: /continue to eligibility/i }).click();
  await page.waitForTimeout(1200);

  await expect(page.getByRole('heading', { name: /basic requirements/i })).toBeVisible();
  await page.waitForTimeout(800);
  await typeNumber(page, 'age', '35');
  await choose(page, 'employmentStatus', 'employed');
  await typeNumber(page, 'employmentDuration', '24');
  await typeNumber(page, 'creditScore', '650');
  await choose(page, 'loanPurpose', 'debt_consolidation');

  const salary = page.getByTestId('salaryIntoCapitec-yes');
  await reveal(salary);
  await page.waitForTimeout(500);
  await salary.click();
  await page.waitForTimeout(800);

  for (const name of [/south african id/i, /stable income/i, /debt administration/i]) {
    const box = page.getByRole('checkbox', { name });
    await reveal(box);
    await page.waitForTimeout(450);
    await box.click();
    await page.waitForTimeout(700);
  }
  await goOn(page);

  await expect(page.getByTestId('eligibility-decision')).toHaveAttribute('data-eligible', 'true');
  await reveal(page.getByTestId('approval-likelihood'));
  await page.waitForTimeout(2200);
  await scrollSchedule(page);
  await page.waitForTimeout(1400);
  await goOn(page);

  await upload(page, /south african id/i, 'south-african-id.pdf');
  await upload(page, /latest salary slip/i, 'salary-slip.pdf');

  await expect(page.getByRole('heading', { name: /review and submit/i })).toBeVisible();
  await page.waitForTimeout(2600);
  const submit = page.getByRole('button', { name: /submit simulated application/i });
  await reveal(submit);
  await page.waitForTimeout(700);
  await submit.click();

  await expect(page.getByTestId('reference')).toHaveText(/^LS-/);
  await page.waitForTimeout(3500);
});

async function switchLanguage(page: Page, code: string, pause: number) {
  const language = page.getByTestId('language-switcher');
  await language.hover();
  await page.waitForTimeout(400);
  await language.selectOption(code);
  await expect(page.locator('html')).toHaveAttribute('lang', code);
  await page.waitForTimeout(pause);
}

async function typeNumber(page: Page, testId: string, value: string) {
  const field = page.getByTestId(testId);
  await reveal(field);
  await field.click();
  await page.waitForTimeout(280);
  await field.fill('');
  await field.pressSequentially(value, { delay: TYPE_DELAY });
  await page.waitForTimeout(550);
}

async function choose(page: Page, testId: string, value: string) {
  const field = page.getByTestId(testId);
  await reveal(field);
  await field.focus();
  await page.waitForTimeout(700);
  await field.selectOption(value);
  await page.waitForTimeout(900);
}

async function nudgeSlider(page: Page, name: string, steps: number) {
  const slider = page.getByRole('slider', { name });
  await reveal(slider);
  await slider.focus();
  await page.waitForTimeout(400);
  for (let i = 0; i < steps; i++) {
    await slider.press('ArrowRight');
    await page.waitForTimeout(180);
  }
}

async function goOn(page: Page) {
  const button = page.getByRole('button', { name: /^continue/i });
  await reveal(button);
  await page.waitForTimeout(650);
  await button.click();
  await page.waitForTimeout(1100);
}

async function upload(page: Page, heading: RegExp, name: string) {
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  await page.waitForTimeout(900);
  await page.getByTestId('file-input').setInputFiles({ ...pdf, name });
  await expect(page.getByTestId('uploaded-file')).toBeVisible();
  await page.waitForTimeout(1600);
  await goOn(page);
}

async function smoothScroll(page: Page, delta: number) {
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, delta / steps);
    await page.waitForTimeout(35);
  }
}

async function reveal(locator: Locator) {
  await locator.evaluate((el) => new Promise<void>((resolve) => {
    const rect = el.getBoundingClientRect();
    const start = window.scrollY;
    const target = Math.max(0, start + rect.top - 160);
    if (Math.abs(target - start) < 28) {
      resolve();
      return;
    }
    const duration = 700;
    const t0 = performance.now();
    function frame(now: number) {
      const p = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, start + (target - start) * (1 - (1 - p) ** 3));
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  }));
}

async function scrollSchedule(page: Page) {
  const schedule = page.getByRole('table', { name: /payment schedule/i });
  await reveal(schedule);
  await page.waitForTimeout(600);
  await schedule.evaluate((table) => new Promise<void>((resolve) => {
    const el = table.parentElement;
    if (!el) {
      resolve();
      return;
    }
    const target = Math.min(220, el.scrollHeight);
    const duration = 1600;
    const t0 = performance.now();
    function frame(now: number) {
      const p = Math.min(1, (now - t0) / duration);
      el.scrollTop = target * (1 - (1 - p) ** 3);
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  }));
}
