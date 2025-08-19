// e2e/auth/auth.spec.ts
import { test, expect } from '@playwright/test'
import { connectDB } from '../../src/lib/mongodb'
import { User } from '../../src/models/User'
import bcrypt from 'bcryptjs'

// テストユーザーのデータベース操作用のヘルパー
const clearTestUsers = async () => {
  try {
    await connectDB()
    await User.deleteMany({ email: { $regex: /test.*@example\.com/ } })
  } catch (error) {
    console.log('Database clear error (may be expected):', error)
  }
}

const createVerifiedTestUser = async (email: string, password: string, name: string = 'Test User') => {
  await connectDB()
  const hashedPassword = await bcrypt.hash(password, 12)
  await User.create({
    name,
    email,
    password: hashedPassword,
    emailVerified: true
  })
}

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async () => {
    await clearTestUsers()
  })

  test.afterEach(async () => {
    await clearTestUsers()
  })

  test.describe('User Registration Flow', () => {
    test('新規ユーザー登録が成功する', async ({ page }) => {
      await page.goto('/auth/register')

      // フォームに入力
      await page.fill('[name="name"]', 'Test User')
      await page.fill('[name="email"]', 'test-register@example.com')
      await page.fill('[name="password"]', 'password123')
      await page.fill('[name="confirmPassword"]', 'password123')

      // 登録ボタンをクリック
      await page.click('button[type="submit"]')

      // 成功メッセージの確認
      await expect(page.locator('text=登録完了しました')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=認証メールを送信しました')).toBeVisible()

      // データベースにユーザーが作成されたことを確認
      await connectDB()
      const user = await User.findOne({ email: 'test-register@example.com' })
      expect(user).toBeTruthy()
      expect(user?.emailVerified).toBe(false)
    })

    test('既存のメールアドレスで登録しようとするとエラー', async ({ page }) => {
      // 既存ユーザーを作成
      await createVerifiedTestUser('existing@example.com', 'password123')

      await page.goto('/auth/register')

      await page.fill('[name="name"]', 'New User')
      await page.fill('[name="email"]', 'existing@example.com')
      await page.fill('[name="password"]', 'password456')
      await page.fill('[name="confirmPassword"]', 'password456')

      await page.click('button[type="submit"]')

      // エラーメッセージの確認
      await expect(page.locator('text=このメールアドレスは既に登録されています')).toBeVisible()
    })

    test('パスワード確認が一致しない場合エラー', async ({ page }) => {
      await page.goto('/auth/register')

      await page.fill('[name="name"]', 'Test User')
      await page.fill('[name="email"]', 'test@example.com')
      await page.fill('[name="password"]', 'password123')
      await page.fill('[name="confirmPassword"]', 'password456')

      await page.click('button[type="submit"]')

      // バリデーションエラーの確認
      await expect(page.locator('text=パスワードが一致しません')).toBeVisible()
    })
  })

  test.describe('Login Flow', () => {
    test('正しい認証情報でログイン成功', async ({ page }) => {
      // 認証済みテストユーザーを作成
      await createVerifiedTestUser('test-login@example.com', 'password123', 'Test User')

      await page.goto('/auth/login')

      // ログインフォームに入力
      await page.fill('[name="email"]', 'test-login@example.com')
      await page.fill('[name="password"]', 'password123')

      await page.click('button[type="submit"]')

      // ダッシュボードにリダイレクトされることを確認
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
      
      // ユーザーがログインしていることを確認（ナビゲーションなど）
      await expect(page.locator('text=Test User')).toBeVisible()
    })

    test('間違ったパスワードでログイン失敗', async ({ page }) => {
      await createVerifiedTestUser('test-login-fail@example.com', 'password123')

      await page.goto('/auth/login')

      await page.fill('[name="email"]', 'test-login-fail@example.com')
      await page.fill('[name="password"]', 'wrongpassword')

      await page.click('button[type="submit"]')

      // エラーメッセージの確認
      await expect(page.locator('text=メールアドレスまたはパスワードが正しくありません')).toBeVisible()
      
      // ログインページに留まることを確認
      await expect(page).toHaveURL('/auth/login')
    })

    test('存在しないメールアドレスでログイン失敗', async ({ page }) => {
      await page.goto('/auth/login')

      await page.fill('[name="email"]', 'nonexistent@example.com')
      await page.fill('[name="password"]', 'password123')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=メールアドレスまたはパスワードが正しくありません')).toBeVisible()
      await expect(page).toHaveURL('/auth/login')
    })
  })

  test.describe('Session Management', () => {
    test('ログイン後にセッションが維持される', async ({ page }) => {
      await createVerifiedTestUser('test-session@example.com', 'password123', 'Session User')

      // ログイン
      await page.goto('/auth/login')
      await page.fill('[name="email"]', 'test-session@example.com')
      await page.fill('[name="password"]', 'password123')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard')

      // ページをリロードしてもログイン状態が維持されることを確認
      await page.reload()
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('text=Session User')).toBeVisible()

      // 別のページに移動してもログイン状態が維持される
      await page.goto('/')
      await page.goto('/dashboard')
      await expect(page.locator('text=Session User')).toBeVisible()
    })

    test('未認証ユーザーは保護されたページにアクセスできない', async ({ page }) => {
      // ログインせずにダッシュボードにアクセス
      await page.goto('/dashboard')

      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })

  test.describe('Logout Flow', () => {
    test('ログアウトが正常に動作する', async ({ page }) => {
      await createVerifiedTestUser('test-logout@example.com', 'password123', 'Logout User')

      // ログイン
      await page.goto('/auth/login')
      await page.fill('[name="email"]', 'test-logout@example.com')
      await page.fill('[name="password"]', 'password123')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard')

      // ログアウトボタンをクリック
      await page.click('button:has-text("ログアウト")')

      // トップページまたはログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/(auth\/login)?$/)

      // 再度ダッシュボードにアクセスしようとするとログインページにリダイレクト
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })

  test.describe('Email Verification Flow', () => {
    test('メール認証リンクが正常に動作する', async ({ page }) => {
      // 未認証ユーザーを作成
      await connectDB()
      const hashedPassword = await bcrypt.hash('password123', 12)
      const verificationToken = 'test-verification-token'
      await User.create({
        name: 'Unverified User',
        email: 'test-verify@example.com',
        password: hashedPassword,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })

      // 認証ページにアクセス
      await page.goto(`/auth/verify-email?token=${verificationToken}`)

      // 認証成功メッセージの確認
      await expect(page.locator('text=認証完了')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=メール認証が完了しました')).toBeVisible()

      // 自動リダイレクトまたは手動でログインページに移動
      await page.waitForTimeout(4000) // 自動リダイレクトを待つ
      
      // ログインページで認証完了メッセージが表示される
      if (page.url().includes('/auth/login')) {
        await expect(page.locator('text=メール認証が完了しました')).toBeVisible()
      }

      // データベースでユーザーが認証済みになったことを確認
      const user = await User.findOne({ email: 'test-verify@example.com' })
      expect(user?.emailVerified).toBe(true)
    })

    test('無効な認証トークンでエラーが表示される', async ({ page }) => {
      await page.goto('/auth/verify-email?token=invalid-token')

      await expect(page.locator('text=認証失敗')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=無効または期限切れ')).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test('登録フォームのバリデーションが動作する', async ({ page }) => {
      await page.goto('/auth/register')

      // 空のフォームで送信
      await page.click('button[type="submit"]')

      // バリデーションエラーの確認
      await expect(page.locator('text=名前を入力してください')).toBeVisible()
      await expect(page.locator('text=メールアドレスを入力してください')).toBeVisible()
      await expect(page.locator('text=パスワードを入力してください')).toBeVisible()
    })

    test('ログインフォームのバリデーションが動作する', async ({ page }) => {
      await page.goto('/auth/login')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=正しいメールアドレスを入力してください')).toBeVisible()
      await expect(page.locator('text=パスワードは6文字以上で入力してください')).toBeVisible()
    })
  })
})