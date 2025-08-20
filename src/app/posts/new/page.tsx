'use client'

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem
} from '@mui/material'
// Icons replaced with text for build compatibility
// import AccountCircle from '@mui/icons-material/AccountCircle'
// import Check from '@mui/icons-material/Check'
// import Close from '@mui/icons-material/Close'
// import Logout from '@mui/icons-material/Logout'
// import ArrowBack from '@mui/icons-material/ArrowBack'

const SaveIcon = () => '✓'
const CancelIcon = () => '✖'
const LogoutIcon = () => '🚪'
const ArrowBackIcon = () => '←'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const postSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100, 'タイトルは100文字以内で入力してください'),
  content: z.string().min(1, '内容を入力してください').max(2000, '内容は2000文字以内で入力してください'),
  category: z.string().min(1, 'カテゴリーを選択してください')
})

type PostFormData = z.infer<typeof postSchema>

const categories = [
  '雑談',
  '質問',
  '告知',
  '技術',
  'ニュース',
  'その他'
]

export default function NewPostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema)
  })

  const contentValue = watch('content', '')

  const onSubmit = async (data: PostFormData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError(result.error || '投稿の作成に失敗しました')
      }
    } catch (err) {
      setError('サーバーエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            新しい投稿
          </Typography>
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            👤
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => signOut()}>
              <span style={{ marginRight: 8 }}><LogoutIcon /></span>
              ログアウト
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              新しい投稿を作成
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              投稿者: {session?.user?.name}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  {...register('title')}
                  label="タイトル"
                  fullWidth
                  variant="outlined"
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  placeholder="投稿のタイトルを入力してください"
                />

                <FormControl fullWidth error={!!errors.category}>
                  <InputLabel>カテゴリー</InputLabel>
                  <Select
                    {...register('category')}
                    label="カテゴリー"
                    defaultValue=""
                  >
                    {categories.map((category) => (
                      <SelectMenuItem key={category} value={category}>
                        {category}
                      </SelectMenuItem>
                    ))}
                  </Select>
                  {errors.category && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.category.message}
                    </Typography>
                  )}
                </FormControl>

                <Box>
                  <TextField
                    {...register('content')}
                    label="内容"
                    fullWidth
                    multiline
                    rows={12}
                    variant="outlined"
                    error={!!errors.content}
                    helperText={errors.content?.message}
                    placeholder="投稿の内容を入力してください"
                  />
                  <Typography 
                    variant="caption" 
                    color={contentValue.length > 1800 ? 'error' : 'text.secondary'}
                    sx={{ float: 'right', mt: 0.5 }}
                  >
                    {contentValue.length} / 2000文字
                  </Typography>
                </Box>

                <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                    size="large"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={loading}
                    size="large"
                  >
                    投稿する
                  </Button>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </>
  )
}