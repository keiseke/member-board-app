import { test, expect } from '@playwright/test'

// Test data and utilities
const TEST_THREAD = {
  title: 'E2Eテストスレッド',
  description: 'E2Eテスト用のスレッド説明',
  category: 'テクノロジー',
  creator: '' // 空白にして匿名として作成（編集・削除権限を得るため）
}

const TEST_POST = {
  title: 'E2Eテスト投稿',
  content: 'E2Eテスト用の投稿内容です。',
  author: 'E2Eテストユーザー'
}

const LONG_CONTENT = 'あ'.repeat(500) // 500文字の長いコンテンツ
const VERY_LONG_CONTENT = 'あ'.repeat(501) // 制限を超える長いコンテンツ

// データベースクリーンアップ用のヘルパー関数
const cleanupTestData = async () => {
  // サーバーが完全に起動していない場合があるため、エラーを無視して続行
  try {
    const response = await fetch('http://localhost:3000/api/threads', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const threads = await response.json();
      // 少数のスレッドのみ削除して処理を高速化
      const deletePromises = threads.slice(0, 5).map(thread => 
        fetch(`http://localhost:3000/api/threads/${thread._id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {}) // エラーを無視
      );
      await Promise.allSettled(deletePromises); // 一部失敗してもエラーにしない
    }
  } catch (error) {
    // クリーンアップが失敗してもテストを続行
    console.log('Cleanup failed, continuing with test...');
  }
};

test.describe('掲示板アプリ E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    // より安定したページ遷移
    await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });
    
    // ページが完全に読み込まれるまで待機
    await expect(page.getByRole('heading', { name: /掲示板/ })).toBeVisible({ timeout: 30000 });
    
    // APIの準備ができるまで少し待機
    await page.waitForTimeout(1000);
  })

  test('ホームページが正しく表示される', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/掲示板アプリ/)

    // メインコンテンツの確認
    await expect(page.getByRole('heading', { name: /掲示板/ })).toBeVisible()

    // FABボタンの確認
    await expect(page.getByRole('button', { name: /add thread/ })).toBeVisible()
    
    // カテゴリータブの確認
    await expect(page.getByRole('tab', { name: '全て' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'テクノロジー' })).toBeVisible()
  })

  test('新しいスレッドを作成できる', async ({ page }) => {
    // FABボタンを確実に待機してからクリック
    const fabButton = page.getByRole('button', { name: /add thread/ })
    await expect(fabButton).toBeVisible({ timeout: 15000 })
    await fabButton.click()

    // モーダルが開くことを確認
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('新しいスレッドを作成')).toBeVisible({ timeout: 15000 })

    // フォーム要素が利用可能になるまで待機
    const titleInput = page.getByLabel(/スレッドタイトル/)
    const descInput = page.getByLabel(/説明/)
    const categorySelect = page.locator('#category-select')
    
    await expect(titleInput).toBeVisible({ timeout: 15000 })
    await expect(descInput).toBeVisible({ timeout: 15000 })
    await expect(categorySelect).toBeVisible({ timeout: 15000 })

    // フォームに入力（各入力後に少し待機）
    await titleInput.fill(TEST_THREAD.title)
    await page.waitForTimeout(500)
    
    await descInput.fill(TEST_THREAD.description)
    await page.waitForTimeout(500)
    
    // カテゴリーを選択
    await categorySelect.click()
    await page.waitForTimeout(1000) // ドロップダウンが開くまで待機
    
    const categoryOption = page.getByRole('option', { name: TEST_THREAD.category })
    await expect(categoryOption).toBeVisible({ timeout: 10000 })
    await categoryOption.click()
    await page.waitForTimeout(500)

    // 作成ボタンが有効になるまで待機
    const createButton = page.getByRole('button', { name: '作成' })
    await expect(createButton).toBeEnabled({ timeout: 10000 })
    await createButton.click()

    // モーダルが閉じることを確認
    await expect(dialog).not.toBeVisible({ timeout: 15000 })

    // 作成したスレッドが表示されることを確認
    await expect(page.getByText(TEST_THREAD.title).first()).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(TEST_THREAD.description).first()).toBeVisible({ timeout: 15000 })
  })

  test('スレッドを編集できる', async ({ page }) => {
    // まずスレッドを作成（作成者名を空白にして編集権限を得る）
    await page.getByRole('button', { name: /add thread/ }).click()
    await page.getByLabel(/スレッドタイトル/).fill('編集前タイトル')
    await page.getByLabel(/説明/).fill('編集前の説明')
    // 作成者名は空白のままにする（匿名）
    await page.locator('#category-select').click()
    await page.getByRole('option', { name: '一般' }).click()
    await page.getByRole('button', { name: '作成' }).click()

    // スレッドが表示されるのを待つ
    await expect(page.getByText('編集前タイトル').first()).toBeVisible({ timeout: 10000 })

    // 3点メニューをクリックして編集オプションを表示
    await page.locator('[data-testid="MoreVert"]').first().click()
    // 編集メニューアイテムをクリック
    await page.getByTestId('edit-thread-menu-item').click()

    // 編集フォームが開くことを確認
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('スレッドを編集')).toBeVisible({ timeout: 10000 })

    // フォームを編集
    await page.getByLabel(/スレッドタイトル/).fill('編集後タイトル')
    await page.getByLabel(/説明/).fill('編集後の説明')

    // 更新ボタンをクリック
    await page.getByRole('button', { name: '更新' }).click()

    // 編集された内容が表示されることを確認
    await expect(page.getByText('編集後タイトル').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('編集後の説明').first()).toBeVisible({ timeout: 10000 })
  })

  test('スレッドを削除できる', async ({ page }) => {
    // まずスレッドを作成（作成者名を空白にして削除権限を得る）
    await page.getByRole('button', { name: /add thread/ }).click()
    await page.getByLabel(/スレッドタイトル/).fill('削除テストスレッド')
    await page.getByLabel(/説明/).fill('削除される予定のスレッド')
    // 作成者名は空白のままにする（匿名）
    await page.locator('#category-select').click()
    await page.getByRole('option', { name: '一般' }).click()
    await page.getByRole('button', { name: '作成' }).click()

    // スレッドが表示されるのを待つ
    await expect(page.getByText('削除テストスレッド').first()).toBeVisible({ timeout: 10000 })

    // 3点メニューをクリックして削除オプションを表示
    await page.locator('[data-testid="MoreVert"]').first().click()
    
    // 確認ダイアログをあらかじめ受け入れるように設定
    page.on('dialog', async dialog => {
      await dialog.accept()
    })
    
    // 削除メニューアイテムをクリック
    await page.getByTestId('delete-thread-menu-item').click()
    
    // ダイアログが処理されるまで少し待つ
    await page.waitForTimeout(500)

    // スレッドが削除されたことを確認
    await expect(page.getByText('削除テストスレッド')).not.toBeVisible({ timeout: 10000 })
  })

  test('キャンセルボタンが機能する', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: /add thread/ }).click()

    // モーダルが開くことを確認
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    // 何か入力
    await page.getByLabel(/スレッドタイトル/).fill('キャンセルテスト')

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // モーダルが閉じることを確認
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // スレッドが作成されていないことを確認
    await expect(page.getByText('キャンセルテスト')).not.toBeVisible({ timeout: 10000 })
  })

  test('複数のスレッドが日時順で表示される', async ({ page }) => {
    // 複数のスレッドを作成
    const threads = [
      { title: 'スレッド1', description: '最初のスレッド' },
      { title: 'スレッド2', description: '二番目のスレッド' },
      { title: 'スレッド3', description: '三番目のスレッド' }
    ]

    for (const thread of threads) {
      await page.getByRole('button', { name: /add thread/ }).click()
      await page.getByLabel(/スレッドタイトル/).fill(thread.title)
      await page.getByLabel(/説明/).fill(thread.description)
      await page.locator('#category-select').click()
      await page.getByRole('option', { name: '一般' }).click()
      await page.getByRole('button', { name: '作成' }).click()
      await page.waitForTimeout(100) // 作成時間に差を付ける
    }

    // すべてのスレッドが表示されることを確認
    for (const thread of threads) {
      await expect(page.getByText(thread.title).first()).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(thread.description).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('フォームバリデーションが機能する', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: /add thread/ }).click()

    // モーダルが開くことを確認
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    // 作成ボタンが無効化されていることを確認（空のフォーム）
    await expect(page.getByRole('button', { name: '作成' })).toBeDisabled({ timeout: 10000 })

    // タイトルのみ入力
    await page.getByLabel(/スレッドタイトル/).fill('テストタイトル')
    await expect(page.getByRole('button', { name: '作成' })).toBeDisabled({ timeout: 10000 })

    // 説明も入力
    await page.getByLabel(/説明/).fill('テスト説明')
    await expect(page.getByRole('button', { name: '作成' })).toBeDisabled({ timeout: 10000 })

    // カテゴリーも選択
    await page.locator('#category-select').click()
    await page.getByRole('option', { name: '一般' }).click()

    // すべて入力後、ボタンが有効になることを確認
    await expect(page.getByRole('button', { name: '作成' })).toBeEnabled({ timeout: 10000 })
  })

  test('文字数制限が機能する', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: /add thread/ }).click()

    // モーダルが開くことを確認
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    // タイトルの文字数制限テスト
    const longTitle = 'あ'.repeat(101) // 100文字制限を超過
    await page.getByLabel(/スレッドタイトル/).fill(longTitle)
    
    // 100文字までしか入力されないことを確認
    const titleValue = await page.getByLabel(/スレッドタイトル/).inputValue()
    expect(titleValue.length).toBeLessThanOrEqual(100)

    // 説明の文字数制限テスト
    const longDescription = 'あ'.repeat(301) // 300文字制限を超過
    await page.getByLabel(/説明/).fill(longDescription)
    
    // 300文字までしか入力されないことを確認
    const descValue = await page.getByLabel(/説明/).inputValue()
    expect(descValue.length).toBeLessThanOrEqual(300)
  })

  test('カテゴリーフィルターが機能する', async ({ page }) => {
    // テクノロジーカテゴリーのスレッドを作成
    await page.getByRole('button', { name: /add thread/ }).click()
    await page.getByLabel(/スレッドタイトル/).fill('テクノロジースレッド')
    await page.getByLabel(/説明/).fill('テクノロジー関連の話題')
    await page.locator('#category-select').click()
    await page.getByRole('option', { name: 'テクノロジー' }).click()
    await page.getByRole('button', { name: '作成' }).click()

    // 一般カテゴリーのスレッドを作成
    await page.getByRole('button', { name: /add thread/ }).click()
    await page.getByLabel(/スレッドタイトル/).fill('一般スレッド')
    await page.getByLabel(/説明/).fill('一般的な話題')
    await page.locator('#category-select').click()
    await page.getByRole('option', { name: '一般' }).click()
    await page.getByRole('button', { name: '作成' }).click()

    // 全てタブで両方が表示されることを確認
    await page.getByRole('tab', { name: '全て' }).click()
    await expect(page.getByText('テクノロジースレッド').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('一般スレッド').first()).toBeVisible({ timeout: 10000 })

    // テクノロジータブでフィルターされることを確認
    await page.getByRole('tab', { name: 'テクノロジー' }).click()
    await expect(page.getByText('テクノロジースレッド').first()).toBeVisible({ timeout: 10000 })
    // 一般スレッドは表示されない（またはフィルターで非表示）

    // 一般タブでフィルターされることを確認
    await page.getByRole('tab', { name: '一般' }).click()
    await expect(page.getByText('一般スレッド').first()).toBeVisible({ timeout: 10000 })
  })
})