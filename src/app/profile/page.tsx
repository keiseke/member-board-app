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
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material'
// Material-UI Core Icons - using only the most basic icons
import AccountCircle from '@mui/icons-material/AccountCircle'
import Edit from '@mui/icons-material/Edit'
import Check from '@mui/icons-material/Check'
import Close from '@mui/icons-material/Close'
import Logout from '@mui/icons-material/Logout'
import ArrowBack from '@mui/icons-material/ArrowBack'
import Lock from '@mui/icons-material/Lock'
import Delete from '@mui/icons-material/Delete'

// Visibility icons no longer needed - using text buttons instead

// Aliases for existing icons
const EditIcon = Edit
const SaveIcon = Check
const CancelIcon = Close
const LogoutIcon = Logout
const ArrowBackIcon = ArrowBack
const LockIcon = Lock
const DeleteIcon = Delete
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(50, '名前は50文字以内で入力してください'),
  bio: z.string().max(200, '自己紹介は200文字以内で入力してください').optional()
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
  newPassword: z.string().min(6, '新しいパスワードは6文字以上で入力してください'),
  confirmPassword: z.string().min(1, 'パスワード確認を入力してください')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword']
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [profileData, setProfileData] = useState({ name: '', bio: '', avatarUrl: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      bio: ''
    }
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  })

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      
      if (response.ok) {
        const data = await response.json()
        
        const profileInfo = { 
          name: data.name || '', 
          bio: data.bio || '', 
          avatarUrl: data.avatarUrl || '' 
        }
        
        reset({ name: profileInfo.name, bio: profileInfo.bio })
        setProfileData(profileInfo)
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error)
    }
  }

  React.useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session, reset])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('プロフィール保存開始')
      console.log('セッション状態:', session)
      console.log('送信データ:', data)
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      console.log('レスポンス状態:', response.status)
      console.log('レスポンスヘッダー:', response.headers)

      const result = await response.json()
      console.log('レスポンス内容:', result)

      if (!response.ok) {
        throw new Error(result.error || 'プロフィールの更新に失敗しました')
      }
      
      setSuccess('プロフィールを更新しました')
      setProfileData(data)
      setIsEditing(false)
      
      // セッション情報を更新
      await update()
      
      // ダッシュボードに戻る前に少し待つ
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      console.error('プロフィール保存エラー:', err)
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setPasswordLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'パスワードの変更に失敗しました')
      }
      
      setSuccess('パスワードを変更しました')
      setPasswordDialogOpen(false)
      resetPassword()
      setShowPasswords({ current: false, new: false, confirm: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードの変更に失敗しました')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSuccess(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    reset(profileData)
    setError(null)
    setSuccess(null)
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      console.log('アバターファイルが選択されていません')
      return
    }

    try {
      setAvatarUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'アバターのアップロードに失敗しました')
      }

      setSuccess('アバターを更新しました')
      setAvatarFile(null)
      setAvatarPreview(null)
      
      // プロフィール情報を再取得してアバターURLを確実に反映
      await fetchProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アバターのアップロードに失敗しました')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleAvatarDelete = async () => {
    try {
      setAvatarUploading(true)
      setError(null)

      const response = await fetch('/api/user/avatar', {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'アバターの削除に失敗しました')
      }

      setSuccess('アバターを削除しました')
      await fetchProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アバターの削除に失敗しました')
    } finally {
      setAvatarUploading(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
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
            プロフィール
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
            <Box display="flex" alignItems="center" mb={4}>
              <Box position="relative">
                <Avatar 
                  sx={{ width: 80, height: 80, mr: 3, fontSize: '2rem' }} 
                  data-testid="avatar"
                  src={avatarPreview || profileData.avatarUrl || undefined}
                >
                  {(!avatarPreview && !profileData.avatarUrl) ? 
                    (watch('name') || session?.user?.name || 'U').charAt(0) : 
                    null
                  }
                </Avatar>
                <Box position="absolute" bottom={0} right={0} mr={3}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="avatar-upload"
                    type="file"
                    onChange={handleAvatarChange}
                  />
                  <label htmlFor="avatar-upload">
                    <IconButton
                      color="primary"
                      aria-label="upload picture"
                      component="span"
                      size="small"
                      sx={{ 
                        backgroundColor: 'white',
                        boxShadow: 1,
                        '&:hover': { backgroundColor: 'grey.100' }
                      }}
                    >
                      📷
                    </IconButton>
                  </label>
                  {profileData.avatarUrl && (
                    <IconButton
                      color="error"
                      aria-label="delete avatar"
                      size="small"
                      onClick={handleAvatarDelete}
                      disabled={avatarUploading}
                      sx={{ 
                        backgroundColor: 'white',
                        boxShadow: 1,
                        '&:hover': { backgroundColor: 'grey.100' },
                        ml: 1
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
              <Box>
                <Typography variant="h4" component="h1">
                  プロフィール設定
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  アカウント情報を管理できます
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {(avatarFile || avatarPreview) && (
              <Card sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  アバター変更
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <Button
                    variant="contained"
                    onClick={handleAvatarUpload}
                    disabled={avatarUploading}
                    startIcon={avatarUploading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    アップロード
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setAvatarFile(null)
                      setAvatarPreview(null)
                    }}
                    disabled={avatarUploading}
                  >
                    キャンセル
                  </Button>
                </Box>
              </Card>
            )}


            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="名前"
                        fullWidth
                        variant="outlined"
                        disabled={!isEditing}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Controller
                    name="bio"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="自己紹介"
                        fullWidth
                        variant="outlined"
                        disabled={!isEditing}
                        multiline
                        rows={3}
                        error={!!errors.bio}
                        helperText={errors.bio?.message || '200文字以内で入力してください'}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="メールアドレス"
                    fullWidth
                    variant="outlined"
                    value={session?.user?.email || ''}
                    disabled
                    helperText="メールアドレスは変更できません"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="ユーザーID"
                    fullWidth
                    variant="outlined"
                    value={session?.user?.id || ''}
                    disabled
                    helperText="ユーザーIDは変更できません"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="メール認証状態"
                    fullWidth
                    variant="outlined"
                    value={session?.user?.emailVerified ? '認証済み' : '未認証'}
                    disabled
                    helperText="メール認証の状態です"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" gap={2} justifyContent="space-between">
                    <Button
                      variant="outlined"
                      startIcon={<LockIcon />}
                      onClick={() => setPasswordDialogOpen(true)}
                      disabled={isEditing}
                    >
                      パスワード変更
                    </Button>
                    
                    <Box display="flex" gap={2}>
                      {!isEditing ? (
                        <Button
                          variant="contained"
                          startIcon={<EditIcon />}
                          onClick={handleEdit}
                        >
                          編集
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={handleCancel}
                            disabled={loading}
                          >
                            キャンセル
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                            disabled={loading}
                          >
                            保存
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        <Dialog 
          open={passwordDialogOpen} 
          onClose={() => setPasswordDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>パスワード変更</DialogTitle>
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)}>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    {...registerPassword('currentPassword')}
                    label="現在のパスワード"
                    type={showPasswords.current ? 'text' : 'password'}
                    fullWidth
                    variant="outlined"
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <Button
                          size="small"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? '隠す' : '表示'}
                        </Button>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    {...registerPassword('newPassword')}
                    label="新しいパスワード"
                    type={showPasswords.new ? 'text' : 'password'}
                    fullWidth
                    variant="outlined"
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword?.message || '6文字以上で入力してください'}
                    InputProps={{
                      endAdornment: (
                        <Button
                          size="small"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? '隠す' : '表示'}
                        </Button>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    {...registerPassword('confirmPassword')}
                    label="パスワード確認"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    fullWidth
                    variant="outlined"
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <Button
                          size="small"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? '隠す' : '表示'}
                        </Button>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => {
                  setPasswordDialogOpen(false)
                  resetPassword()
                  setShowPasswords({ current: false, new: false, confirm: false })
                  setError(null)
                }}
                disabled={passwordLoading}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={passwordLoading}
                startIcon={passwordLoading ? <CircularProgress size={20} /> : <LockIcon />}
              >
                変更
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </>
  )
}