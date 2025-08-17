'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  Container,
  Typography,
  Box,
  Fab,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Button,
} from '@mui/material'
import { Add, AccountCircle, Login, Logout } from '@mui/icons-material'
import ThreadList from '@/components/ThreadList'
import dynamic from 'next/dynamic'

// Dynamic import for ThreadForm - 遅延読み込みで初回読み込み時間を短縮
const ThreadForm = dynamic(() => import('@/components/ThreadForm'), {
  loading: () => <Box sx={{ p: 2, textAlign: 'center' }}>フォームを読み込んでいます...</Box>,
  ssr: false,
})
import { IThread } from '@/models/Thread'

const categories = [
  '全て',
  '一般',
  '政治',
  '経済',
  'テクノロジー',
  'スポーツ',
  'エンターテイメント',
  '趣味',
  '質問',
  'その他',
]

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ec4899',
      light: '#f9a8d4',
      dark: '#be185d',
    },
    secondary: {
      main: '#f3e8ff',
      light: '#fdf2f8',
      dark: '#a855f7',
    },
    background: {
      default: '#fdf2f8',
      paper: '#fce7f3',
    },
  },
})

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [threads, setThreads] = useState<(IThread & { _id: string })[]>([])
  const [filteredThreads, setFilteredThreads] = useState<(IThread & { _id: string })[]>([])
  const [selectedCategory, setSelectedCategory] = useState(0) // 0 = '全て'
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingThread, setEditingThread] = useState<(IThread & { _id: string }) | null>(null)
  const [currentUser, setCurrentUser] = useState('匿名') // TODO: 実際のユーザー管理を実装する場合はここを変更
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [userProfile, setUserProfile] = useState<{ name: string } | null>(null)

  // ユーザープロフィール取得
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile({ name: data.name })
      }
    } catch (err) {
      console.error('プロフィール取得エラー:', err)
    }
  }

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/threads')
      if (response.ok) {
        const data = await response.json()
        setThreads(data)
      } else if (response.status === 401) {
        // 認証が必要な場合は空の配列を設定
        setThreads([])
        console.log('認証が必要です - ログインしてください')
      } else {
        console.error('スレッドの取得に失敗しました:', response.status)
      }
    } catch (error) {
      console.error('スレッドの取得エラー:', error)
      showSnackbar('スレッドの取得に失敗しました', 'error')
    }
  }

  const filterThreadsByCategory = (categoryIndex: number) => {
    if (categoryIndex === 0) {
      // '全て'が選択された場合
      setFilteredThreads(threads)
    } else {
      const selectedCategoryName = categories[categoryIndex]
      const filtered = threads.filter(thread => thread.category === selectedCategoryName)
      setFilteredThreads(filtered)
    }
  }

  useEffect(() => {
    filterThreadsByCategory(selectedCategory)
  }, [threads, selectedCategory])

  useEffect(() => {
    // セッション状態に関係なく、常にスレッドを取得する
    fetchThreads()
    
    // ログインしている場合のみユーザープロフィールを取得
    if (status === 'authenticated') {
      fetchUserProfile()
    }
  }, [status])

  // ページがフォーカスされた時にプロフィールを再取得
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        fetchUserProfile()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [status])

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreateThread = async (data: { title: string; description: string; category: string; creator?: string }) => {
    // ログインしていない場合はログイン画面に遷移
    if (!session) {
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          creator: data.creator || currentUser,
        }),
      })

      if (response.ok) {
        fetchThreads()
        showSnackbar('スレッドを作成しました', 'success')
      } else {
        const error = await response.json()
        showSnackbar(error.error || 'スレッドの作成に失敗しました', 'error')
      }
    } catch (error) {
      showSnackbar('スレッドの作成に失敗しました', 'error')
    }
  }

  const handleUpdateThread = async (data: { title: string; description: string; category: string; creator?: string }) => {
    if (!editingThread) return

    try {
      const response = await fetch(`/api/threads/${editingThread._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchThreads()
        setEditingThread(null)
        showSnackbar('スレッドを更新しました', 'success')
      } else {
        const error = await response.json()
        showSnackbar(error.error || 'スレッドの更新に失敗しました', 'error')
      }
    } catch (error) {
      showSnackbar('スレッドの更新に失敗しました', 'error')
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('このスレッドを削除しますか？関連する投稿も全て削除されます。')) return

    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchThreads()
        showSnackbar('スレッドを削除しました', 'success')
      } else {
        const error = await response.json()
        showSnackbar(error.error || 'スレッドの削除に失敗しました', 'error')
      }
    } catch (error) {
      showSnackbar('スレッドの削除に失敗しました', 'error')
    }
  }

  const handleThreadClick = (threadId: string) => {
    // ログインしていない場合はログイン画面に遷移
    if (!session) {
      router.push('/auth/login')
      return
    }
    router.push(`/thread/${threadId}`)
  }

  const handleCategoryChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedCategory(newValue)
  }

  const handleEditThread = (thread: IThread & { _id: string }) => {
    setEditingThread(thread)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingThread(null)
  }

  const handleSubmitForm = (data: { title: string; description: string; category: string; creator?: string }) => {
    if (editingThread) {
      handleUpdateThread(data)
    } else {
      handleCreateThread(data)
    }
  }

  const handleFabClick = () => {
    // ログインしていない場合はログイン画面に遷移
    if (!session) {
      router.push('/auth/login')
      return
    }
    setIsFormOpen(true)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%)',
        }}
      >
        <AppBar position="static" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#1565c0', fontWeight: 700 }}>
              💬 掲示板
            </Typography>
            {status === 'loading' ? (
              <Typography variant="body2" sx={{ color: '#1565c0' }}>
                読み込み中...
              </Typography>
            ) : session ? (
              <>
                <Typography variant="body2" sx={{ mr: 2, color: '#1565c0' }}>
                  ようこそ、{userProfile?.name || session.user?.name}さん
                </Typography>
                <IconButton
                  color="inherit"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ color: '#1565c0' }}
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                >
                  <MenuItem onClick={() => router.push('/profile')}>
                    プロフィール
                  </MenuItem>
                  <MenuItem onClick={() => signOut()}>
                    <Logout sx={{ mr: 1 }} />
                    ログアウト
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                color="inherit"
                startIcon={<Login />}
                onClick={() => signIn()}
                sx={{ color: '#1565c0' }}
              >
                ログイン
              </Button>
            )}
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                color: '#1565c0',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              💬 掲示板
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                px: 3,
                py: 1,
                display: 'inline-block',
              }}
            >
              スレッドを作成して、みんなで議論しよう！
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Tabs
              value={selectedCategory}
              onChange={handleCategoryChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                '& .MuiTab-root': {
                  fontWeight: 600,
                  '&.Mui-selected': {
                    color: '#1565c0',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#1565c0',
                  height: 3,
                  borderRadius: 1.5,
                },
              }}
            >
              {categories.map((category, index) => (
                <Tab
                  key={category}
                  label={category}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                  }}
                />
              ))}
            </Tabs>
          </Box>

          <ThreadList
            threads={filteredThreads}
            onThreadClick={handleThreadClick}
            onEdit={handleEditThread}
            onDelete={handleDeleteThread}
            currentUser={currentUser}
          />

          <Fab
            color="primary"
            aria-label="add thread"
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              right: 16,
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            }}
            onClick={handleFabClick}
          >
            <Add />
          </Fab>

          <ThreadForm
            open={isFormOpen}
            onClose={handleCloseForm}
            onSubmit={handleSubmitForm}
            editingThread={editingThread}
          />

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  )
}