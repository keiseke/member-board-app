'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Container,
  Typography,
  Box,
  Fab,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Add, ArrowBack, Forum, MoreVert, Edit, Delete, AccountCircle, ExitToApp as LogoutIcon } from '@mui/icons-material';
import { signOut } from 'next-auth/react';
import PostForm from '@/components/PostForm';
import ThreadForm from '@/components/ThreadForm';

interface Thread {
  _id: string;
  title: string;
  description: string;
  category: string;
  creator: string;
  creatorName: string;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  threadId: string;
  author: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}


export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;
  const { data: session, status } = useSession();
  const permissions = usePermissions();

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isThreadFormOpen, setIsThreadFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [postMenuAnchorEl, setPostMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [headerMenuAnchorEl, setHeaderMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/threads/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data);
      }
    } catch (error) {
      showSnackbar('スレッドの取得に失敗しました', 'error');
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/threads/${threadId}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      showSnackbar('投稿の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (threadId) {
      fetchThread();
      fetchPosts();
    }
  }, [threadId]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreatePost = async (data: { title: string; content: string; author?: string }) => {
    try {
      const response = await fetch(`/api/threads/${threadId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          author: session?.user?.id,
          authorName: session?.user?.name || '匿名',
        }),
      });

      if (response.ok) {
        fetchPosts();
        fetchThread(); // スレッドの投稿数を更新
        showSnackbar('投稿を作成しました', 'success');
      } else {
        const error = await response.json();
        showSnackbar(error.error || '投稿の作成に失敗しました', 'error');
      }
    } catch (error) {
      showSnackbar('投稿の作成に失敗しました', 'error');
    }
  };

  const handleUpdateThread = async (data: { title: string; description: string; category: string; creator?: string }) => {
    if (!thread) return;

    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchThread();
        setIsThreadFormOpen(false);
        showSnackbar('スレッドを更新しました', 'success');
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'スレッドの更新に失敗しました', 'error');
      }
    } catch (error) {
      showSnackbar('スレッドの更新に失敗しました', 'error');
    }
  };

  const handleDeleteThread = async () => {
    if (!confirm('このスレッドを削除しますか？関連する投稿も全て削除されます。')) return;

    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSnackbar('スレッドを削除しました', 'success');
        router.push('/');
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'スレッドの削除に失敗しました', 'error');
      }
    } catch (error) {
      showSnackbar('スレッドの削除に失敗しました', 'error');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setIsThreadFormOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    handleDeleteThread();
    handleMenuClose();
  };

  const canEditThread = () => {
    return thread ? permissions.canEdit(thread.creator) : false;
  };

  const handleUpdatePost = async (data: { title: string; content: string; author?: string }) => {
    if (!editingPost) return;

    try {
      const response = await fetch(`/api/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchPosts();
        setEditingPost(null);
        showSnackbar('投稿を更新しました', 'success');
      } else {
        const error = await response.json();
        showSnackbar(error.error || '投稿の更新に失敗しました', 'error');
      }
    } catch (error) {
      showSnackbar('投稿の更新に失敗しました', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('この投稿を削除しますか？')) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPosts();
        fetchThread(); // スレッドの投稿数を更新
        showSnackbar('投稿を削除しました', 'success');
      } else {
        const error = await response.json();
        showSnackbar(error.error || '投稿の削除に失敗しました', 'error');
      }
    } catch (error) {
      showSnackbar('投稿の削除に失敗しました', 'error');
    }
  };

  const handlePostMenuClick = (event: React.MouseEvent<HTMLElement>, post: IPost & { _id: string }) => {
    event.stopPropagation();
    setPostMenuAnchorEl(event.currentTarget);
    setSelectedPost(post);
  };

  const handlePostMenuClose = () => {
    setPostMenuAnchorEl(null);
    setSelectedPost(null);
  };

  const handleEditPost = () => {
    if (selectedPost) {
      setEditingPost(selectedPost);
      setIsFormOpen(true);
    }
    handlePostMenuClose();
  };

  const handleDeletePostFromMenu = () => {
    if (selectedPost) {
      handleDeletePost(selectedPost._id);
    }
    handlePostMenuClose();
  };

  const canEditPost = (post: Post) => {
    return permissions.canEdit(post.author);
  };

  const handleClosePostForm = () => {
    setIsFormOpen(false);
    setEditingPost(null);
  };

  const handleSubmitPostForm = (data: { title: string; content: string; author?: string }) => {
    if (editingPost) {
      handleUpdatePost(data);
    } else {
      handleCreatePost(data);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleHeaderMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setHeaderMenuAnchorEl(event.currentTarget);
  };

  const handleHeaderMenuClose = () => {
    setHeaderMenuAnchorEl(null);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!thread) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">スレッドが見つかりません</Alert>
      </Container>
    );
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
            onClick={handleHeaderMenuClick}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={headerMenuAnchorEl}
            open={Boolean(headerMenuAnchorEl)}
            onClose={handleHeaderMenuClose}
          >
            <MenuItem onClick={() => signOut()}>
              <LogoutIcon sx={{ mr: 1 }} />
              ログアウト
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/')}
            sx={{ mb: 2, color: '#ec4899' }}
          >
            スレッド一覧に戻る
          </Button>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <Box sx={{ 
                  flex: 1, 
                  minWidth: 0, // これによりテキストが適切に切り詰められる
                }}>
                  <Typography variant="h4" component="h1" sx={{ 
                    fontWeight: 600, 
                    color: '#1565c0',
                    wordBreak: 'break-word', // 長い単語も適切に改行
                    overflowWrap: 'break-word',
                  }}>
                    {thread.title}
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  flexShrink: 0, // このボックスは縮小しない
                }}>
                  <Chip
                    label={thread.category}
                    sx={{
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      color: '#1565c0',
                      fontWeight: 500,
                      flexShrink: 0, // Chipも縮小しない
                    }}
                  />
                  {canEditThread() && (
                    <IconButton
                      size="small"
                      onClick={handleMenuClick}
                      sx={{ 
                        color: '#1565c0',
                        flexShrink: 0, // ボタンも縮小しない
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                </Box>
              </Box>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {thread.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Forum fontSize="small" />
                  <Typography variant="body2">
                    {thread.postCount}件の投稿
                  </Typography>
                </Box>
                <Typography variant="body2">
                  作成者: {thread.creatorName}
                </Typography>
                <Typography variant="body2">
                  作成日: {formatDate(thread.createdAt)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {posts.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  まだ投稿がありません
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  最初の投稿をしてみましょう！
                </Typography>
              </CardContent>
            </Card>
          ) : (
            posts.map((post, index) => (
              <Card key={post._id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1 }}>
                    <Box sx={{ 
                      flex: 1, 
                      minWidth: 0, // これによりテキストが適切に切り詰められる
                    }}>
                      <Typography variant="h6" component="h3" sx={{ 
                        fontWeight: 600, 
                        color: '#1565c0',
                        wordBreak: 'break-word', // 長い単語も適切に改行
                        overflowWrap: 'break-word',
                      }}>
                        {index + 1}. {post.title}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      flexShrink: 0, // このボックスは縮小しない
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{
                        flexShrink: 0, // 作成者名も縮小しない
                        whiteSpace: 'nowrap', // 作成者名の改行を防ぐ
                      }}>
                        {post.authorName}
                      </Typography>
                      {canEditPost(post) && (
                        <IconButton
                          size="small"
                          onClick={(e) => handlePostMenuClick(e, post)}
                          data-testid="post-menu-button"
                          sx={{ 
                            color: '#1565c0',
                            flexShrink: 0, // ボタンも縮小しない
                          }}
                        >
                          <MoreVert fontSize="small" data-testid="MoreVert" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(post.createdAt)}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>

        <Fab
          color="primary"
          aria-label="add post"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setIsFormOpen(true)}
        >
          <Add />
        </Fab>

        <PostForm
          open={isFormOpen}
          onClose={handleClosePostForm}
          onSubmit={handleSubmitPostForm}
          editingPost={editingPost}
          showAuthor={true}
          titleOptional={true}
        />

        <ThreadForm
          open={isThreadFormOpen}
          onClose={() => setIsThreadFormOpen(false)}
          onSubmit={handleUpdateThread}
          editingThread={thread}
        />

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditClick}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            編集
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            削除
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={postMenuAnchorEl}
          open={Boolean(postMenuAnchorEl)}
          onClose={handlePostMenuClose}
        >
          <MenuItem onClick={handleEditPost}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            編集
          </MenuItem>
          <MenuItem onClick={handleDeletePostFromMenu} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            削除
          </MenuItem>
        </Menu>

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
    </>
  );
}