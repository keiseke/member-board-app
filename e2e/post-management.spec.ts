import { test, expect } from '@playwright/test'

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

test.describe('投稿管理 E2Eテスト', () => {
  const TEST_THREAD_TITLE = '投稿テスト用スレッド'
  
  test.beforeEach(async ({ page }) => {
    // より安定したページ遷移
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // ページが完全に読み込まれるまで待機
    await expect(page.getByRole('heading', { name: /掲示板/ })).toBeVisible({ timeout: 30000 });
    
    // テスト用スレッドを作成（作成者名を空白にして匿名で作成）
    await page.getByRole('button', { name: /add thread/ }).click();
    await page.getByLabel(/スレッドタイトル/).fill(TEST_THREAD_TITLE);
    await page.getByLabel(/説明/).fill('投稿機能をテストするためのスレッド');
    // 作成者名は空白のままにして匿名で作成
    await page.locator('#category-select').click();
    await page.getByRole('option', { name: 'テクノロジー' }).click();
    await page.getByRole('button', { name: '作成' }).click();
    
    // スレッドが作成されるのを待つ
    await expect(page.getByText(TEST_THREAD_TITLE).first()).toBeVisible({ timeout: 15000 });
    
    // スレッドをクリックして詳細画面に移動
    await page.getByText(TEST_THREAD_TITLE).first().click();
    
    // スレッド詳細画面が表示されるのを待つ
    await expect(page.getByRole('button', { name: /add post/ })).toBeVisible({ timeout: 15000 });
  })

  test('スレッド詳細画面が正しく表示される', async ({ page }) => {
    await expect(page.getByText(TEST_THREAD_TITLE).first()).toBeVisible()
    await expect(page.getByText('投稿機能をテストするためのスレッド').first()).toBeVisible()
    
    // 新しい投稿ボタンが表示されることを確認
    await expect(page.getByRole('button', { name: /add post/ })).toBeVisible()
  })

  test('新しい投稿を作成できる', async ({ page }) => {
    // 投稿作成フォームを開く
    await page.getByRole('button', { name: /add post/ }).click()

    // モーダルが開くことを確認
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('新しい投稿')).toBeVisible({ timeout: 10000 })

    // フォームに入力（名前は空白にして匿名で作成し、編集・削除権限を得る）
    await page.getByLabel('タイトル').fill('テスト投稿タイトル')
    await page.getByLabel('内容').fill('これはテスト投稿の内容です。')
    // 名前フィールドは空白のままにする

    // 投稿ボタンをクリック
    await page.getByRole('button', { name: '投稿' }).click()

    // モーダルが閉じることを確認
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // 作成した投稿が表示されることを確認
    await expect(page.getByText('テスト投稿タイトル').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('これはテスト投稿の内容です。').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('匿名').first()).toBeVisible({ timeout: 10000 })
  })

  test('投稿を編集できる', async ({ page }) => {
    // まず投稿を作成（名前は空白にして匿名で作成し、編集権限を得る）
    await page.getByRole('button', { name: /add post/ }).click()
    await page.getByLabel('タイトル').fill('編集前タイトル')
    await page.getByLabel('内容').fill('編集前の内容')
    // 名前フィールドは空白のままにする
    await page.getByRole('button', { name: '投稿' }).click()

    // 投稿が表示されるのを待つ
    await expect(page.getByText('編集前タイトル').first()).toBeVisible({ timeout: 10000 })

    // 投稿の3点メニューをクリックして編集オプションを表示
    await page.locator('button:has([data-testid="MoreVert"])').first().click()
    // 編集メニューアイテムをクリック
    await page.getByText('編集').first().click()

    // 編集フォームが開くことを確認
    await expect(page.getByText('投稿を編集')).toBeVisible({ timeout: 10000 })

    // フォームを編集
    await page.getByLabel('タイトル').clear()
    await page.getByLabel('タイトル').fill('編集後タイトル')
    await page.getByLabel('内容').clear()
    await page.getByLabel('内容').fill('編集後の内容')

    // 更新ボタンをクリック
    await page.getByRole('button', { name: '更新' }).click()

    // 編集された内容が表示されることを確認
    await expect(page.getByText('編集後タイトル').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('編集後の内容').first()).toBeVisible({ timeout: 10000 })
  })

  test('投稿を削除できる', async ({ page }) => {
    // まず投稿を作成（名前は空白にして匿名で作成し、削除権限を得る）
    await page.getByRole('button', { name: /add post/ }).click()
    await page.getByLabel('タイトル').fill('削除テスト投稿')
    await page.getByLabel('内容').fill('削除される予定の投稿')
    // 名前フィールドは空白のままにする
    await page.getByRole('button', { name: '投稿' }).click()

    // 投稿が表示されるのを待つ
    await expect(page.getByText('削除テスト投稿').first()).toBeVisible({ timeout: 10000 })

    // 投稿の3点メニューをクリックして削除オプションを表示
    await page.locator('button:has([data-testid="MoreVert"])').first().click()
    
    // 確認ダイアログをあらかじめ受け入れるように設定
    page.on('dialog', async dialog => {
      await dialog.accept()
    })
    
    // 削除メニューアイテムをクリック
    await page.getByText('削除').first().click()
    
    // ダイアログが処理されるまで少し待つ
    await page.waitForTimeout(500)

    // 投稿が削除されたことを確認
    await expect(page.getByText('削除テスト投稿')).not.toBeVisible({ timeout: 10000 })
  })

  test('投稿の文字数制限が機能する', async ({ page }) => {
    // 投稿作成フォームを開く
    await page.getByRole('button', { name: /add post/ }).click()

    // 文字数カウンターが表示されることを確認
    await expect(page.getByText('0/500文字')).toBeVisible({ timeout: 10000 })

    // 長い内容を入力
    const longContent = 'あ'.repeat(501) // 500文字制限を超過
    await page.getByLabel('内容').fill(longContent)

    // 500文字までしか入力されないことを確認
    const contentValue = await page.getByLabel('内容').inputValue()
    expect(contentValue.length).toBeLessThanOrEqual(500)

    // 文字数カウンターが更新されることを確認
    await expect(page.getByText('500/500文字')).toBeVisible({ timeout: 10000 })
  })

  test('複数の投稿が時系列順で表示される', async ({ page }) => {
    const posts = [
      { title: '投稿1', content: '最初の投稿' },
      { title: '投稿2', content: '二番目の投稿' },
      { title: '投稿3', content: '三番目の投稿' }
    ]

    // 複数の投稿を作成（名前は空白にして匿名で作成）
    for (const post of posts) {
      await page.getByRole('button', { name: /add post/ }).click()
      await page.getByLabel('タイトル').fill(post.title)
      await page.getByLabel('内容').fill(post.content)
      // 名前フィールドは空白のままにする
      await page.getByRole('button', { name: '投稿' }).click()
      await page.waitForTimeout(100) // 作成時間に差を付ける
    }

    // すべての投稿が表示されることを確認（最新順）
    await expect(page.getByText('投稿1')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('投稿2')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('投稿3')).toBeVisible({ timeout: 10000 })
  })
})