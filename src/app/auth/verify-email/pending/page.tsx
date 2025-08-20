'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
  Link
} from '@mui/material'
// Icons replaced with text for build compatibility
// import { Email, CheckCircle, Refresh as RefreshIcon } from '@mui/icons-material'

function VerifyEmailPendingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (!email) {
      router.push('/auth/register')
      return
    }
  }, [email, router])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleResendEmail = async () => {
    if (!email || countdown > 0) return

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setResendSuccess(true)
        setCountdown(60) // 60秒間再送信を無効化
        setTimeout(() => setResendSuccess(false), 5000)
      } else {
        setResendError(data.error || '認証メールの再送信に失敗しました')
      }
    } catch (error) {
      setResendError('ネットワークエラーが発生しました')
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Box sx={{ fontSize: 60, color: 'primary.main', mb: 2, textAlign: 'center' }}>
            📧
          </Box>
          
          <Typography component="h1" variant="h4" gutterBottom align="center">
            メール認証が必要です
          </Typography>

          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            <strong>{email}</strong> 宛に認証メールを送信しました。
            メール内のリンクをクリックして、アカウントの認証を完了してください。
          </Typography>

          <Alert severity="info" sx={{ width: '100%', mb: 3 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                <span style={{ fontSize: 16, marginRight: 8, verticalAlign: 'middle' }}>✓</span>
                メールが届かない場合は、以下をご確認ください：
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>迷惑メールフォルダをご確認ください</li>
                <li>メールアドレスが正しく入力されているかご確認ください</li>
                <li>数分後に再度ご確認ください</li>
              </ul>
            </Box>
          </Alert>

          {resendSuccess && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              認証メールを再送信しました！
            </Alert>
          )}

          {resendError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {resendError}
            </Alert>
          )}

          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              startIcon={isResending ? <CircularProgress size={20} /> : '🔄'}
              sx={{ mb: 2 }}
            >
              {isResending ? '送信中...' : 
               countdown > 0 ? `再送信 (${countdown}秒後)` : 
               '認証メールを再送信'}
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              認証完了後、ログインできるようになります
            </Typography>

            <Link 
              href="/auth/login" 
              variant="body2"
              sx={{ display: 'block', mb: 1 }}
            >
              ログインページに戻る
            </Link>
            
            <Link 
              href="/auth/register" 
              variant="body2"
              sx={{ display: 'block' }}
            >
              別のメールアドレスで登録する
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default function VerifyEmailPendingPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">読み込み中...</Typography>
          </Paper>
        </Box>
      </Container>
    }>
      <VerifyEmailPendingContent />
    </Suspense>
  )
}
