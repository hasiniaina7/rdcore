import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile navigation goes from login to success flow scaffold', async ({ page }) => {
  await page.goto('/?key=test_dynamic_keys');
  await expect(page.getByRole('navigation', { name: /Navigation principale/i })).toBeVisible();
  await page.getByRole('link', { name: 'Succès' }).click();
  await expect(page.getByTestId('usage-form')).toBeVisible();
  await expect(page.getByRole('button', { name: 'success.refresh' })).toBeVisible();
});
