import { test, expect, _electron } from '@playwright/test';
import path from 'path';
import fs from 'fs';

let electronApp: Awaited<ReturnType<typeof _electron.launch>>;
let mainPage: Awaited<ReturnType<typeof electronApp.firstWindow>>;

test.beforeEach(async () => {
  let entryPath = '.';
  const distPath = path.join(process.cwd(), 'dist-electron', 'Main.js');

  if (fs.existsSync(distPath)) {
    entryPath = distPath;
  }

  console.log('Launching Electron from =>', entryPath); // <--- add a debug log

  electronApp = await _electron.launch({
    args: [entryPath],
    env: { NODE_ENV: 'development' },
  });

  mainPage = await electronApp.firstWindow();
});

test.afterEach(async () => {
  await electronApp.close();
});


test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
