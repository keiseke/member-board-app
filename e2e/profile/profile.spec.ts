import { test, expect } from '@playwright/test'

test.describe('プロフィール機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用ユーザーでログイン
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('プロフィールページにアクセスできる', async ({ page }) => {
    await page.goto('/profile')
    
    // ページタイトルの確認
    await expect(page.locator('h1')).toContainText('プロフィール設定')
    
    // アバターの表示確認
    await expect(page.locator('[data-testid="avatar"]')).toBeVisible()
    
    // フォームフィールドの存在確認
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('textarea[name="bio"]')).toBeVisible()
    await expect(page.locator('input[value*="@"]')).toBeVisible() // メールアドレス
  })

  test('プロフィール情報を表示する', async ({ page }) => {
    await page.goto('/profile')
    
    // 名前フィールドに値が入っている
    const nameInput = page.locator('input[name="name"]')
    await expect(nameInput).not.toHaveValue('')
    
    // メールアドレスフィールドが無効化されている
    const emailInput = page.locator('input[value*="@"]')
    await expect(emailInput).toBeDisabled()
  })

  test('プロフィールを編集できる', async ({ page }) => {
    await page.goto('/profile')
    
    // 編集ボタンをクリック
    await page.click('button:has-text("編集")')
    
    // フィールドが有効になる
    await expect(page.locator('input[name="name"]')).toBeEnabled()
    await expect(page.locator('textarea[name="bio"]')).toBeEnabled()
    
    // 値を変更
    await page.fill('input[name="name"]', 'テストユーザー更新')
    await page.fill('textarea[name="bio"]', 'これは更新されたテスト自己紹介です。')
    
    // 保存ボタンをクリック
    await page.click('button:has-text("保存")')
    
    // 成功メッセージの確認
    await expect(page.locator('.MuiAlert-message')).toContainText('プロフィールを更新しました')
    
    // フィールドが再び無効になる
    await expect(page.locator('input[name="name"]')).toBeDisabled()
    await expect(page.locator('textarea[name="bio"]')).toBeDisabled()
  })

  test('編集をキャンセルできる', async ({ page }) => {
    await page.goto('/profile')
    
    // 現在の値を取得
    const originalName = await page.locator('input[name="name"]').inputValue()
    
    // 編集モードに入る
    await page.click('button:has-text("編集")')
    
    // 値を変更
    await page.fill('input[name="name"]', '変更されたテスト名')
    
    // キャンセルボタンをクリック
    await page.click('button:has-text("キャンセル")')
    
    // 元の値に戻る
    await expect(page.locator('input[name="name"]')).toHaveValue(originalName)
    
    // フィールドが無効になる
    await expect(page.locator('input[name="name"]')).toBeDisabled()
  })

  test('名前の文字数制限をチェックする', async ({ page }) => {
    await page.goto('/profile')
    
    // 編集モードに入る
    await page.click('button:has-text("編集")')
    
    // 51文字の名前を入力
    const longName = 'あ'.repeat(51)
    await page.fill('input[name="name"]', longName)
    
    // 保存ボタンをクリック
    await page.click('button:has-text("保存")')
    
    // エラーメッセージの確認
    await expect(page.locator('text=名前は50文字以内で入力してください')).toBeVisible()
  })

  test('自己紹介の文字数制限をチェックする', async ({ page }) => {
    await page.goto('/profile')
    
    // 編集モードに入る
    await page.click('button:has-text("編集")')
    
    // 201文字の自己紹介を入力
    const longBio = 'あ'.repeat(201)
    await page.fill('textarea[name="bio"]', longBio)
    
    // 保存ボタンをクリック
    await page.click('button:has-text("保存")')
    
    // エラーメッセージの確認
    await expect(page.locator('text=自己紹介は200文字以内で入力してください')).toBeVisible()
  })

  test('パスワード変更ダイアログを開ける', async ({ page }) => {
    await page.goto('/profile')
    
    // パスワード変更ボタンをクリック
    await page.click('button:has-text("パスワード変更")')
    
    // ダイアログが開く
    await expect(page.locator('h2:has-text("パスワード変更")')).toBeVisible()
    
    // パスワードフィールドの確認
    await expect(page.locator('input[name="currentPassword"]')).toBeVisible()
    await expect(page.locator('input[name="newPassword"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('パスワード変更をキャンセルできる', async ({ page }) => {
    await page.goto('/profile')
    
    // パスワード変更ダイアログを開く
    await page.click('button:has-text("パスワード変更")')
    
    // 値を入力
    await page.fill('input[name="currentPassword"]', 'current123')
    await page.fill('input[name="newPassword"]', 'new123456')
    
    // キャンセルボタンをクリック
    await page.click('button:has-text("キャンセル")')
    
    // ダイアログが閉じる
    await expect(page.locator('h2:has-text("パスワード変更")')).not.toBeVisible()
  })

  test('パスワード表示切り替えが動作する', async ({ page }) => {
    await page.goto('/profile')
    
    // パスワード変更ダイアログを開く
    await page.click('button:has-text("パスワード変更")')
    
    // 現在のパスワードフィールドの確認
    const currentPasswordInput = page.locator('input[name="currentPassword"]')
    await expect(currentPasswordInput).toHaveAttribute('type', 'password')
    
    // 表示切り替えボタンをクリック
    await page.click('input[name="currentPassword"] + div button')
    
    // type属性がtextに変わる
    await expect(currentPasswordInput).toHaveAttribute('type', 'text')
  })

  test('パスワード確認の一致チェック', async ({ page }) => {
    await page.goto('/profile')
    
    // パスワード変更ダイアログを開く
    await page.click('button:has-text("パスワード変更")')
    
    // 異なるパスワードを入力
    await page.fill('input[name="currentPassword"]', 'current123')
    await page.fill('input[name="newPassword"]', 'new123456')
    await page.fill('input[name="confirmPassword"]', 'different123')
    
    // 変更ボタンをクリック
    await page.click('button:has-text("変更")')
    
    // エラーメッセージの確認
    await expect(page.locator('text=パスワードが一致しません')).toBeVisible()
  })

  test('短いパスワードでエラーが出る', async ({ page }) => {
    await page.goto('/profile')
    
    // パスワード変更ダイアログを開く
    await page.click('button:has-text("パスワード変更")')
    
    // 短いパスワードを入力
    await page.fill('input[name="currentPassword"]', 'current123')
    await page.fill('input[name="newPassword"]', '12345')
    await page.fill('input[name="confirmPassword"]', '12345')
    
    // 変更ボタンをクリック
    await page.click('button:has-text("変更")')
    
    // エラーメッセージの確認
    await expect(page.locator('text=新しいパスワードは6文字以上で入力してください')).toBeVisible()
  })
})

test.describe('未認証アクセス', () => {
  test('未ログイン時はプロフィールページにアクセスできない', async ({ page }) => {
    await page.goto('/profile')
    
    // ログインページにリダイレクト
    await page.waitForURL('/auth/login')
    await expect(page).toHaveURL('/auth/login')
  })
})