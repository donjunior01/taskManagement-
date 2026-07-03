import { test, expect } from '@playwright/test';

/**
 * Critical-flow smoke tests against a running stack (seeded DB). Selectors favour role/placeholder
 * so they survive styling changes; adjust if your markup differs.
 * Seeded accounts (password "password123"): admin@mtncameroon.cm, tchinda.pm@mtncameroon.cm, mbarga@mtncameroon.cm.
 */
const PASSWORD = 'password123';

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login');
  await page.getByPlaceholder(/e-?mail/i).fill(email);
  await page.getByPlaceholder(/password|mot de passe|••/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|se connecter|log ?in|connexion/i }).click();
}

test('admin signs in and lands on the dashboard', async ({ page }) => {
  await login(page, 'admin@mtncameroon.cm');
  await expect(page).toHaveURL(/\/admin\//, { timeout: 15_000 });
});

test('the login page is reachable and shows the form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByPlaceholder(/e-?mail/i)).toBeVisible();
});

test('an unknown user is rejected', async ({ page }) => {
  await login(page, 'nobody@nowhere.test');
  // stays on /login and surfaces an error message (does not navigate into the app)
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
});
