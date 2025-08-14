import { test, expect } from '@playwright/test'

// モックAPIを使用するテスト用のヘルパー関数
const useMockAPI = async () => {
  // モックデータでテスト用スレッドをリセット
  await fetch('http://localhost:3000/api/test-threads', { method: 'DELETE' });
}

test.describe('モックデータテスト', () => {
  test.beforeEach(async ({ page }) => {
    await useMockAPI();
    
    // ページの基本ロードをテスト
    await page.goto('/', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /掲示板/ })).toBeVisible({ timeout: 15000 });
  });

  test('ホームページが正しく表示される', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/掲示板アプリ/);

    // メインコンテンツの確認
    await expect(page.getByRole('heading', { name: /掲示板/ })).toBeVisible();

    // FABボタンの確認
    await expect(page.getByRole('button', { name: /add thread/ })).toBeVisible();
    
    // カテゴリータブの確認
    await expect(page.getByRole('tab', { name: '全て' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'テクノロジー' })).toBeVisible();
  });

  test('スレッド作成フォームが開ける', async ({ page }) => {
    // FABボタンをクリックしてスレッドフォームを開く
    await page.getByRole('button', { name: /add thread/ }).click();

    // モーダルが開くことを確認
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('新しいスレッドを作成')).toBeVisible();

    // フォームフィールドが表示されることを確認
    await expect(page.getByLabel(/スレッドタイトル/)).toBeVisible();
    await expect(page.getByLabel(/説明/)).toBeVisible();
  });

  test('フォームキャンセルが機能する', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: /add thread/ }).click();

    // モーダルが開くことを確認
    await expect(page.getByRole('dialog')).toBeVisible();

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // モーダルが閉じることを確認
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('フォームバリデーションが機能する', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: /add thread/ }).click();

    // 作成ボタンが無効化されていることを確認（空のフォーム）
    await expect(page.getByRole('button', { name: '作成' })).toBeDisabled();

    // タイトルのみ入力
    await page.getByLabel(/スレッドタイトル/).fill('テストタイトル');
    await expect(page.getByRole('button', { name: '作成' })).toBeDisabled();

    // 説明も入力
    await page.getByLabel(/説明/).fill('テスト説明');
    await expect(page.getByRole('button', { name: '作成' })).toBeDisabled();

    // カテゴリーも選択
    await page.locator('#category-select').click();
    await page.getByRole('option', { name: '一般' }).click();

    // すべて入力後、ボタンが有効になることを確認
    await expect(page.getByRole('button', { name: '作成' })).toBeEnabled();
  });
});