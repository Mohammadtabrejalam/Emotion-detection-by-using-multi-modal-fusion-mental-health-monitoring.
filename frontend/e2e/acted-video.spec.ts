import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';

test('video upload reports an invalid clip without showing a result', async ({ page }) => {
  await page.goto('/#/analyze');
  await page.getByRole('button', { name: 'Video clip', exact: true }).click();
  await page.getByLabel('Video of one speaker').setInputFiles({
    name: 'invalid.mp4', mimeType: 'video/mp4', buffer: Buffer.from('invalid container'),
  });
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Start Analysis', exact: true }).last().click();
  await expect(page.getByRole('alert')).toContainText(/decode|FFmpeg/);
  await expect(page.getByRole('heading', { name: 'Analysis Output & Classification' })).toHaveCount(0);
});

test('a verified acted clip passes through all four real video modes', async ({ page }) => {
  test.skip(!process.env.MINDSENSE_TEST_CLIP, 'Set the path to a verified CREMA-D demo clip and install both models.');
  test.setTimeout(180_000);
  await page.goto('/#/analyze');
  await page.getByRole('button', { name: 'Video clip', exact: true }).click();
  await page.getByLabel('Video of one speaker').setInputFiles(resolve(process.env.MINDSENSE_TEST_CLIP!));
  await page.getByRole('checkbox').check();
  for (const mode of ['midpoint', 'sequence', 'midpoint_transfer', 'transfer']) {
    await page.getByLabel('How to analyse the face and voice').selectOption(mode);
    const response = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/analyze'));
    await page.getByRole('button', { name: 'Start Analysis', exact: true }).last().click();
    const result = await (await response).json();
    expect(result.success, JSON.stringify(result.error)).toBe(true);
    expect(result.data.saved).toBe(false);
    expect(result.data.modalities_used).toEqual(['audio', 'image']);
    expect(result.data.video_summary.requested_frames).toBe(mode.startsWith('midpoint') ? 1 : 3);
    expect(result.data.video_summary.used_fractions).toContain(0.5);
    expect(result.data.video_summary.processing_seconds).toBeGreaterThan(0);
    expect(result.data.model_version).toContain(mode.includes('transfer') ? 'ravdess-head' : 'support-average');
    await expect(page.getByRole('heading', { name: 'Analysis Output & Classification' })).toBeVisible();
    await expect(page.getByText(/Server processing took/)).toBeVisible();
  }
});

test('classroom example opens the preview and downloads both study formats', async ({ page }) => {
  await page.goto('/#/analyze');
  await page.getByRole('button', { name: 'Video clip', exact: true }).click();
  await page.getByText('Classroom example', { exact: true }).click();
  const preview = page.getByLabel('CREMA-D classroom preview');
  await expect(preview).toBeVisible();
  await preview.evaluate(async element => {
    const video = element as HTMLVideoElement;
    video.muted = true;
    await video.play();
  });
  await expect.poll(() => preview.evaluate(element => (element as HTMLVideoElement).ended)).toBe(true);
  for (const [name, extension, signature] of [['Study PDF', 'pdf', '%PDF'], ['Editable study', 'docx', 'PK']]) {
    const downloading = page.waitForEvent('download');
    await page.getByRole('link', { name, exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('MindSense_Acted_Video_Study.' + extension);
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream!) chunks.push(chunk);
    expect(Buffer.concat(chunks).subarray(0, signature.length).toString()).toBe(signature);
  }
});
