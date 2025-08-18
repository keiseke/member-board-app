'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
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
import AccountCircle from '@mui/icons-material/AccountCircle'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import LogoutIcon from '@mui/icons-material/ExitToApp'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const postSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100, 'タイトルは100文字以内で入力してください'),
  content: z.string().min(1, '内容を入力してください').max(2000, '内容は2000文字以内で入力してください'),
  category: z.string().min(1, 'カテゴリーを選択してください')
})

type PostFormData = z.infer<typeof postSchema>

interface Post {
  _id: string
  title: string
  content: string
  category: string
  author: string
  authorName: string
  createdAt: string
  updatedAt: string
}

const categories = [
  '雑談',
  '質問',
  '告知',
  '技術',
  'ニュース',
  'その他'
]

export default function EditPostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema)
  })

  const contentValue = watch('content', '')

  // 投稿データを取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}`)
        const data = await response.json()
        
        if (response.ok) {
          setPost(data)
          setValue('title', data.title)
          setValue('content', data.content)
          setValue('category', data.category)
        } else {
          setError(data.error || '投稿の取得に失敗しました')
        }
      } catch (err) {
        setError('サーバーエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPost()
    }
  }, [postId, setValue])

  const onSubmit = async (data: PostFormData) => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError(result.error || '投稿の更新に失敗しました')
      }
    } catch (err) {
      setError('サーバーエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  // 投稿が見つからない場合
  if (!post) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          投稿が見つかりません
        </Alert>
      </Container>
    )
  }

  // 投稿者でない場合の権限チェック
  if (post.author !== session?.user?.id) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          この投稿を編集する権限がありません
        </Alert>
      </Container>
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
            投稿を編集
          </Typography>
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => signOut()}>
              <LogoutIcon sx={{ mr: 1 }} />
              ログアウト
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              投稿を編集
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              投稿者: {post.authorName}
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
                    defaultValue={post.category}
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
                    disabled={saving}
                    size="large"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saving}
                    size="large"
                  >
                    更新する
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