import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test.beforeAll(async () => mkdir('artifacts/2026-08-12-ply-smile', { recursive: true }));

test('desktop loads the supplied PLY pair only after scan intent', async ({ page }) => {
  const plyRequests = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.ply')) plyRequests.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const scanScene = page.getByRole('button', { name: 'Tarama Ağız içi 3D tarama' });
  await expect(scanScene).toBeVisible();
  expect(plyRequests).toHaveLength(0);
  await scanScene.click();
  await page.getByRole('button', { name: /Taramayı başlat/i }).click();
  await expect.poll(() => plyRequests.length, { timeout: 60_000 }).toBe(2);
  await expect(page.getByText(/Tarama tamamlandı/i)).toBeVisible({ timeout: 90_000 });
});

test('smile example uses the supplied matched before and after images', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: /3 Gülüş Tasarımı Gülüş tasarı/i }).click();
  await expect(page.locator('img[src*="digital-clinic/example-before.jpg"]').first()).toBeVisible();
  await expect(page.locator('img[src*="digital-clinic/example-after.jpg"]').first()).toBeVisible();
  await page.screenshot({ path: 'artifacts/2026-08-12-ply-smile/desktop-smile.png', fullPage: true });
});

test('mobile uses the lightweight fallback and remains keyboard-safe', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 2 });
  });
  const plyRequests = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.ply')) plyRequests.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /2 Tarama/i }).click();
  const start = page.getByRole('button', { name: /Taramayı başlat/i });
  await start.focus();
  await expect(start).toBeFocused();
  await start.press('Enter');
  await expect(page.getByText(/Tarama tamamlandı/i)).toBeVisible({ timeout: 60_000 });
  expect(plyRequests).toHaveLength(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'artifacts/2026-08-12-ply-smile/mobile-scan.png', fullPage: true });
});
