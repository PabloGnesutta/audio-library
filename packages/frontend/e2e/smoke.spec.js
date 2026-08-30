import { test, expect } from '@playwright/test';

// Scoped to the Login page only: it's the one route that renders with no
// backend call at all (router only hits the API for meta.requiresAuth
// routes). No form submission here either -- that would be a real network
// call against the real dev database. See playwright.config.js and
// CLAUDE.md for why authenticated flows aren't covered yet.

test('login page renders the login form by default', async ({ page }) => {
  await page.goto('login');

  await expect(page.locator('.logo')).toContainText('AudioLibrary');
  await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();
  await expect(page.locator('#login-email')).toBeVisible();
  await expect(page.locator('#login-password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
});

test('switching to signup shows the signup form', async ({ page }) => {
  await page.goto('login');

  await page.getByText('Create one!').click();

  await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
  await expect(page.locator('#signup-email')).toBeVisible();
  await expect(page.locator('#signup-password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'SIGNUP' })).toBeVisible();
});

test('visual snapshot of the login page for manual review', async ({ page }) => {
  await page.goto('login');
  await page.screenshot({ path: 'e2e/screenshots/login.png', fullPage: true });
});
