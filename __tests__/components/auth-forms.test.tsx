// __tests__/components/auth-forms.test.tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from 'next-auth/react'
import LoginPage from '@/app/auth/login/page'
import RegisterPage from '@/app/auth/register/page'
import '@testing-library/jest-dom'

// Next.js router のモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn()
  })
}))

// NextAuth のモック
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children
}))

const mockSignIn = require('next-auth/react').signIn as jest.MockedFunction<any>

// テストヘルパー関数
const renderWithSession = (component: React.ReactElement) => {
  return render(
    <SessionProvider session={null}>
      {component}
    </SessionProvider>
  )
}

describe('Authentication Forms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // fetch のモック
    global.fetch = jest.fn()
  })

  describe('LoginPage', () => {
    it('ログインフォームが正しくレンダリングされる', () => {
      renderWithSession(<LoginPage />)
      
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument()
      expect(screen.getByText(/アカウントをお持ちでない方/i)).toBeInTheDocument()
      expect(screen.getByText(/パスワードを忘れた方/i)).toBeInTheDocument()
    })

    it('有効な入力でログインが実行される', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ error: null })
      
      renderWithSession(<LoginPage />)
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.type(screen.getByLabelText(/パスワード/i), 'password123')
      await user.click(screen.getByRole('button', { name: /ログイン/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false
        })
      })
    })

    it('無効なメールアドレスでバリデーションエラーが表示される', async () => {
      const user = userEvent.setup()
      
      renderWithSession(<LoginPage />)
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'invalid-email')
      await user.click(screen.getByRole('button', { name: /ログイン/i }))

      await waitFor(() => {
        expect(screen.getByText(/正しいメールアドレスを入力してください/i)).toBeInTheDocument()
      })
    })

    it('短いパスワードでバリデーションエラーが表示される', async () => {
      const user = userEvent.setup()
      
      renderWithSession(<LoginPage />)
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.type(screen.getByLabelText(/パスワード/i), '123')
      await user.click(screen.getByRole('button', { name: /ログイン/i }))

      await waitFor(() => {
        expect(screen.getByText(/パスワードは6文字以上で入力してください/i)).toBeInTheDocument()
      })
    })

    it('ログインエラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' })
      
      renderWithSession(<LoginPage />)
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.type(screen.getByLabelText(/パスワード/i), 'password123')
      await user.click(screen.getByRole('button', { name: /ログイン/i }))

      await waitFor(() => {
        expect(screen.getByText(/メールアドレスまたはパスワードが正しくありません/i)).toBeInTheDocument()
      })
    })

    it('メール認証完了メッセージが表示される', () => {
      // useSearchParams のモックを更新
      const mockUseSearchParams = require('next/navigation').useSearchParams as jest.MockedFunction<any>
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((key) => key === 'message' ? 'email_verified' : null)
      })

      renderWithSession(<LoginPage />)
      
      expect(screen.getByText(/メール認証が完了しました/i)).toBeInTheDocument()
    })
  })

  describe('RegisterPage', () => {
    it('登録フォームが正しくレンダリングされる', () => {
      renderWithSession(<RegisterPage />)
      
      expect(screen.getByLabelText(/名前/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
      expect(screen.getAllByLabelText(/パスワード/i)).toHaveLength(2) // パスワードと確認パスワード
      expect(screen.getByRole('button', { name: /登録/i })).toBeInTheDocument()
      expect(screen.getByText(/既にアカウントをお持ちの方/i)).toBeInTheDocument()
    })

    it('有効な入力で登録が実行される', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ 
          message: '登録完了しました。認証メールを送信しましたので、メールをご確認ください。',
          userId: 'test-user-id'
        })
      } as Response)
      
      renderWithSession(<RegisterPage />)
      
      await user.type(screen.getByLabelText(/名前/i), 'Test User')
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.type(screen.getAllByLabelText(/パスワード/i)[0], 'password123')
      await user.type(screen.getByLabelText(/パスワード確認/i), 'password123')
      await user.click(screen.getByRole('button', { name: /登録/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          })
        })
      })
    })

    it('パスワード確認が一致しない場合エラーが表示される', async () => {
      const user = userEvent.setup()
      
      renderWithSession(<RegisterPage />)
      
      await user.type(screen.getByLabelText(/名前/i), 'Test User')
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.type(screen.getAllByLabelText(/パスワード/i)[0], 'password123')
      await user.type(screen.getByLabelText(/パスワード確認/i), 'password456')
      await user.click(screen.getByRole('button', { name: /登録/i }))

      await waitFor(() => {
        expect(screen.getByText(/パスワードが一致しません/i)).toBeInTheDocument()
      })
    })

    it('既存のメールアドレスでエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ 
          error: 'このメールアドレスは既に登録されています'
        })
      } as Response)
      
      renderWithSession(<RegisterPage />)
      
      await user.type(screen.getByLabelText(/名前/i), 'Test User')
      await user.type(screen.getByLabelText(/メールアドレス/i), 'existing@example.com')
      await user.type(screen.getAllByLabelText(/パスワード/i)[0], 'password123')
      await user.type(screen.getByLabelText(/パスワード確認/i), 'password123')
      await user.click(screen.getByRole('button', { name: /登録/i }))

      await waitFor(() => {
        expect(screen.getByText(/このメールアドレスは既に登録されています/i)).toBeInTheDocument()
      })
    })

    it('必須フィールドが空の場合バリデーションエラーが表示される', async () => {
      const user = userEvent.setup()
      
      renderWithSession(<RegisterPage />)
      
      // 空のフォームで送信
      await user.click(screen.getByRole('button', { name: /登録/i }))

      await waitFor(() => {
        expect(screen.getByText(/名前を入力してください/i)).toBeInTheDocument()
        expect(screen.getByText(/正しいメールアドレスを入力してください/i)).toBeInTheDocument()
        expect(screen.getByText(/パスワードは6文字以上で入力してください/i)).toBeInTheDocument()
      })
    })
  })
})