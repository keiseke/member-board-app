// src/app/dashboard/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material'
import {
  Add as AddIcon,
  AccountCircle,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'

const postSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(200, 'タイトルは200文字以内で入力してください'),
  content: z.string().min(1, '内容を入力してください').max(5000, '内容は5000文字以内で入力してください')
})

type PostFormData = z.infer<typeof postSchema>

interface Post {
  _id: string
  title: string
  content: string
  author: string
  authorName: string
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [open, setOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema)
  })

  // 投稿一覧取得
  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`)
      const data = await response.json()
      
      if (response.ok) {
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
      } else {
        setError(data.error || '投稿の取得に失敗しました')
      }
    } catch (err) {
      setError('サーバーエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPosts(page)
    }
  }, [status, page])

  // 投稿作成・更新
  const onSubmit = async (data: PostFormData) => {
    try {
      const url = editingPost ? `/api/posts/${editingPost._id}` : '/api/posts'
      const method = editingPost ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        setOpen(false)
        setEditingPost(null)
        reset()
        fetchPosts(page)
      } else {
        setError(result.error || '投稿の保存に失敗しました')
      }
    } catch (err) {
      setError('サーバーエラーが発生しました')
    }
  }

  // 投稿削除
  const handleDelete = async (postId: string) => {
    if (!confirm('この投稿を削除しますか？')) return

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPosts(page)
      } else {
        const result = await response.json()
        setError(result.error || '投稿の削除に失敗しました')
      }
    } catch (err) {
      setError('サーバーエラーが発生しました')
    }
  }

  // 編集開始
  const handleEdit = (post: Post) => {
    setEditingPost(post)
    setValue('title', post.title)
    setValue('content', post.content)
    setOpen(true)
  }

  // 新規投稿
  const handleNewPost = () => {
    setEditingPost(null)
    reset()
    setOpen(true)
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            会員制掲示板
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

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            ようこそ、{session?.user?.name}さん
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {posts.map((post) => (
                <Grid item xs={12} md={6} key={post._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {post.content.length > 100 
                          ? `${post.content.substring(0, 100)}...` 
                          : post.content}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={post.authorName}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(post.createdAt).format('YYYY/MM/DD HH:mm')}
                        </Typography>
                      </Box>
                    </CardContent>
                    {post.author === session?.user?.id && (
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(post)}
                        >
                          編集
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(post._id)}
                        >
                          削除
                        </Button>
                      </CardActions>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}

        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleNewPost}
        >
          <AddIcon />
        </Fab>

        {/* 投稿作成・編集ダイアログ */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingPost ? '投稿を編集' : '新しい投稿'}
          </DialogTitle>
          <DialogContent>
            <TextField
              {...register('title')}
              autoFocus
              margin="dense"
              label="タイトル"
              fullWidth
              variant="outlined"
              error={!!errors.title}
              helperText={errors.title?.message}
              sx={{ mb: 2 }}
            />
            <TextField
              {...register('content')}
              margin="dense"
              label="内容"
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              error={!!errors.content}
              helperText={errors.content?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>キャンセル</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained">
              {editingPost ? '更新' : '投稿'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  )
}