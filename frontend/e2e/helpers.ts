import { expect, type Page } from '@playwright/test';

export const pdf = { name: 'document.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') };
export const cont = (page: Page) => page.getByRole('button', { name: /^continue/i });

export async function pickPersonalLoan(page: Page) {
  await page.goto('/simulator');
  await page.getByRole('radio', { name: /^personal loan/i }).click();
  await cont(page).click();
}

export async function completeAffordability(page: Page) {
  await pickPersonalLoan(page);
  await page.getByTestId('grossIncome').fill('30000');
  await page.getByTestId('netIncome').fill('24000');
  await cont(page).click();
  for (const id of ['housing', 'transport', 'living', 'other', 'existingDebt']) await page.getByTestId(id).fill(id === 'housing' ? '6000' : '500');
  await cont(page).click();
  await expect(page.getByTestId('amount')).toHaveValue('20000'); // default amount prefilled
  await cont(page).click();
  await expect(page.getByTestId('verdict')).toBeVisible(); // waits for the loading skeleton to finish
}
