import { test, expect } from '@playwright/test';

test('Guest analysis uses installed text model or clearly reports missing checkpoint', async ({ page }) => {
  test.setTimeout(150000);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'MindSense', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /start an analysis/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Understand expressions. Keep context.' })).toBeVisible();
  await page.getByPlaceholder(/Type or paste a text statement/).fill('Thank you for helping me finish this project.');
  const submit = page.getByRole('button', { name: 'Start Analysis', exact: true }).last();
  await expect(submit).toBeDisabled();
  await page.getByRole('checkbox').check();
  const modelStatus = await (await page.request.get('/api/models')).json();
  await submit.click();
  if (modelStatus.data.models.text.installed) {
    await expect(page.getByRole('heading', { name: 'Analysis Output & Classification' })).toBeVisible({ timeout: 120000 });
    await expect(page.getByText('Guest result: not saved to the server.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share Result' })).toHaveCount(0);
  } else {
    await expect(page.getByRole('alert')).toContainText('not installed');
    await expect(page.getByRole('heading', { name: 'Analysis Output & Classification' })).toHaveCount(0);
  }
});

test('Private routes require authentication and mobile analysis fits the viewport', async ({ page }) => {
  await page.goto('/#/insights/journal');
  await expect(page.getByRole('heading', {name:'Your private workspace'})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#/analyze');
  await expect(page.getByRole('heading', {name:'Understand expressions. Keep context.'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Authenticated journal persists after refresh and can be deleted', async ({ page }) => {
  const username = `browser_${Date.now()}`;
  const response = await page.request.post('/api/auth/register', {data:{username,email:`${username}@example.test`,password:'BrowserTest123!',name:'Browser Test'}});
  const account = (await response.json()).data;
  await page.goto('/');
  await page.evaluate(token => localStorage.setItem('mindsense_token',token),account.token);
  await page.goto('/#/insights/journal');
  await page.reload();
  await page.getByPlaceholder(/Cognitive fatigue/).fill('Browser journal verification');
  await page.getByPlaceholder(/Record triggers/).fill('Disposable authored reflection for integration testing.');
  await page.getByRole('button',{name:'Save Reflection Entry'}).click();
  await expect(page.getByText('Browser journal verification',{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByText('Browser journal verification',{exact:true})).toBeVisible();
  page.once('dialog',dialog => dialog.accept());
  await page.getByTitle('Delete reflection').click();
  await expect(page.getByText('Browser journal verification',{exact:true})).toHaveCount(0);
  await page.request.delete('/api/user/account',{headers:{Authorization:`Bearer ${account.token}`}});
});
