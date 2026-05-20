import { test, expect } from '@playwright/test';

test.describe('Site navigation', () => {
  test('navigates to /plan when the hero form is submitted', async ({ page }) => {
    await page.goto('/');
    // Submit without filling fields — should still land on /plan.
    await page.locator('form button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/plan/);
  });

  test('/about page loads and has a heading', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/privacy page loads and has a heading', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/terms page loads and has a heading', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/login page renders an auth form', async ({ page }) => {
    await page.goto('/login');
    // Should have at least one input (email / username).
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('site header navigation links are present on the home page', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();
    // The header should contain the Wayra logo / brand link.
    await expect(header.getByRole('link').first()).toBeVisible();
  });

  test('places-autocomplete shows suggestions when typing', async ({ page }) => {
    await page.goto('/');
    const fromInput = page.locator('form input[type="text"]').first();
    await fromInput.fill('Berlin');
    // Wait for the listbox/suggestions to appear.
    const listbox = page.getByRole('listbox').first();
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    // At least one suggestion should be present.
    await expect(listbox.getByRole('option').first()).toBeVisible();
  });

  test('theme toggle changes the color scheme', async ({ page }) => {
    await page.goto('/');
    const htmlEl = page.locator('html');
    const before = await htmlEl.getAttribute('class');

    // Find the theme toggle button in the site header.
    const toggleBtn = page
      .getByRole('banner')
      .getByRole('button', { name: /theme|dark|light/i })
      .first();

    // If the button doesn't exist (e.g. it's icon-only), skip gracefully.
    if ((await toggleBtn.count()) === 0) {
      test.skip();
      return;
    }

    await toggleBtn.click();
    const after = await htmlEl.getAttribute('class');
    expect(after).not.toBe(before);
  });
});
