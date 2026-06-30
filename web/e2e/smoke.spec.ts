import { test, expect } from '@playwright/test';

test.describe('ASCENDX web smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
    await expect(page.getByLabel(/correo/i)).toBeVisible();
  });

  test('pricing page renders', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/pro/i).first()).toBeVisible();
  });

  test('home redirects or shows brand', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/ascendx/i);
  });
});
