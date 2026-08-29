import { test, expect } from '@playwright/test';

test.describe('Developer Portal Security & Isolation E2E Tests', () => {
  test('Unauthenticated user cannot access developer dashboard via URL manipulation', async ({ page }) => {
    // Attempt direct URL access to developer dashboard
    await page.goto('/#/developer/dashboard');

    // System MUST render Developer Authentication login form or access warning
    await expect(page.getByText(/Developer Authentication/i).or(page.getByText(/Sign In/i))).toBeVisible();
    await expect(page.getByText(/Developer System Telemetry/i)).not.toBeVisible();
  });

  test('Public header does not render Developer Portal links for normal users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Developer Portal/i })).not.toBeVisible();
  });
});
