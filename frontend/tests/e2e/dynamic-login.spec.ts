import { test, expect } from '@playwright/test';

test('landing page shows navbar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation')).toBeVisible();
});
