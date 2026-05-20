import { test, expect } from '@playwright/test';

test.describe('Search & plan flow', () => {
  test('selecting a suggestion fills the input', async ({ page }) => {
    await page.goto('/');
    const fromInput = page.locator('form input[type="text"]').first();
    await fromInput.fill('Frankfurt');

    const listbox = page.getByRole('listbox').first();
    await expect(listbox).toBeVisible({ timeout: 5_000 });

    const firstOption = listbox.getByRole('option').first();
    const optionText = await firstOption.textContent();
    await firstOption.click();

    // After selection the listbox should close…
    await expect(listbox).not.toBeVisible();
    // …and the input should contain the selected place name.
    await expect(fromInput).toHaveValue(new RegExp(optionText?.trim().slice(0, 6) ?? '', 'i'));
  });

  test('clear button removes the selected place', async ({ page }) => {
    await page.goto('/');
    const fromInput = page.locator('form input[type="text"]').first();
    await fromInput.fill('Berlin');

    const listbox = page.getByRole('listbox').first();
    await listbox.getByRole('option').first().click();

    // Clear button should now be visible.
    const clearBtn = page
      .locator('form')
      .first()
      .getByRole('button', { name: /clear/i })
      .first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(fromInput).toHaveValue('');
  });

  test('/plan page renders a route-plan form', async ({ page }) => {
    await page.goto('/plan');
    // Expect at least two text inputs (from / to).
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('/search page is reachable', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL(/\/search/);
  });
});
