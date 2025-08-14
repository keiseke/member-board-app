import { test, expect } from '@playwright/test'

test.describe('基本テスト', () => {
  test('ページが表示される', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /掲示板/ })).toBeVisible({ timeout: 30000 });
  });
  
  test('スレッド作成フォームが開ける', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /掲示板/ })).toBeVisible({ timeout: 30000 });
    
    await page.getByRole('button', { name: /add thread/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});