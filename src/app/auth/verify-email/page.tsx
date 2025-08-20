'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('認証トークンが見つかりません')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'メール認証が完了しました')
          // 3秒後にログインページにリダイレクト
          setTimeout(() => {
            router.push('/auth/login?message=email_verified')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'メール認証に失敗しました')
        }
      } catch (error) {
        console.error('メール認証エラー:', error)
        setStatus('error')
        setMessage('サーバーエラーが発生しました')
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            メールアドレス認証
          </h1>

          <div className="bg-white p-8 rounded-lg shadow-md">
            {status === 'loading' && (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-gray-600">認証処理中...</p>
              </div>
            )}

            {status === 'success' && (
              <div>
                <div className="text-green-600 text-5xl mb-4">✅</div>
                <h2 className="text-xl font-semibold text-green-600 mb-4">
                  認証完了
                </h2>
                <p className="text-gray-700 mb-6">{message}</p>
                <p className="text-sm text-gray-500 mb-4">
                  3秒後に自動でログインページに移動します...
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 transition-colors"
                >
                  今すぐログインする
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div>
                <div className="text-red-600 text-5xl mb-4">❌</div>
                <h2 className="text-xl font-semibold text-red-600 mb-4">
                  認証失敗
                </h2>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="space-y-3">
                  <Link
                    href="/auth/register"
                    className="block bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 transition-colors text-center"
                  >
                    再度登録する
                  </Link>
                  <Link
                    href="/auth/login"
                    className="block bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors text-center"
                  >
                    ログインページに戻る
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-pink-600 text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              読み込み中...
            </h2>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}