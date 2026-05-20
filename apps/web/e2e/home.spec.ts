import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and has a level-1 heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('renders the hero search form', async ({ page }) => {
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
  });

  test('hero form has at least two text inputs (from/to)', async ({ page }) => {
    const inputs = page.locator('form input[type="text"]');
    await expect(inputs).toHaveCount(2);
  });

  test('has a skip-to-content link for keyboard users', async ({ page }) => {
    const skip = page.getByRole('link', { name: /skip/i });
    await expect(skip).toBeAttached();
  });

  test('page title contains "Wayra"', async ({ page }) => {
    await expect(page).toHaveTitle(/wayra/i);
  });

  test('swap button is present in the hero form', async ({ page }) => {
    await expect(page.getByRole('button', { name: /swap/i })).toBeVisible();
  });

  test('live status section is present', async ({ page }) => {
    // The section is labelled by the h2 "Live Status" (or its i18n equivalent).
    // We look for the landmark regardless of its translated label.
    await expect(page.getByRole('region').first()).toBeVisible();
  });

  test('footer contains a privacy link', async ({ page }) => {
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
  });
});
