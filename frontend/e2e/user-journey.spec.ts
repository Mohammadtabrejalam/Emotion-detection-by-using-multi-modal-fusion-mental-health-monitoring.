import { test, expect } from '@playwright/test';

test.describe('MindSense End-to-End User Journey', () => {
  test('Complete navigation, text analysis, and data rights workflow', async ({ page }) => {
    // 1. Visit Home Page
    await page.goto('/');
    await expect(page).toHaveTitle(/MindSense/i);
    await expect(page.getByRole('heading', { name: 'MindSense', exact: true })).toBeVisible();
    await expect(page.getByText(/Understanding emotional expression through multimodal signals/i)).toBeVisible();

    // 2. Click "Start an Analysis" CTA
    const startCta = page.getByRole('button', { name: /start an analysis/i }).first();
    await startCta.click();

    // 3. Verify Live Analysis Studio Loaded
    await expect(page.getByText(/Affective Analysis Laboratory/i)).toBeVisible();

    // 4. Enable Advanced Configuration -> Rule-Based Simulation & Execute Analysis
    const advConfig = page.getByRole('button', { name: /Advanced Configuration/i });
    await advConfig.click();
    
    const demoCheck = page.getByRole('checkbox', { name: /Rule-Based Simulation Mode/i });
    await demoCheck.check();

    const textArea = page.getByPlaceholder(/Type or paste a text statement/i);
    await textArea.fill('I am feeling calm, focused, and accomplished after completing our research protocol.');
    
    const analyzeBtn = page.getByRole('main').getByRole('button', { name: 'Start Analysis' });
    await analyzeBtn.click();

    // 5. Verify Results Displayed
    await expect(page.getByText(/Analysis Output & Classification/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Detected Dominant Emotion/i)).toBeVisible();

    // 6. Navigate to Settings & Data Rights
    await page.goto('/#/settings');
    await expect(page.getByText(/System Settings & Data Subject Rights/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /download my data/i })).toBeVisible();

    // 7. Verify Developer Portal Isolation (Unauthenticated Direct Link Attempt)
    await page.goto('/#/developer/dashboard');
    // Developer portal login screen or access denial must render
    await expect(page.getByText(/Developer Authentication/i).or(page.getByText(/Sign In/i))).toBeVisible();
  });
});
