'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { IPost } from '@/models/Post';

interface PostFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; author?: string }) => void;
  editingPost?: (IPost & { _id: string }) | null;
  showAuthor?: boolean;
  titleOptional?: boolean;
}

const PostForm: React.FC<PostFormProps> = ({
  open,
  onClose,
  onSubmit,
  editingPost,
  showAuthor = false,
  titleOptional = false,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [contentLength, setContentLength] = useState(0);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setContent(editingPost.content);
      setAuthor(editingPost.author?.toString() || '');
      setContentLength(editingPost.content.length);
    } else {
      setTitle('');
      setContent('');
      setAuthor('');
      setContentLength(0);
    }
  }, [editingPost, open]);

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= 500) {
      setContent(newContent);
      setContentLength(newContent.length);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = titleOptional ? content.trim() : (title.trim() && content.trim());
    if (isValid) {
      onSubmit({ 
        title: title.trim() || '無題', 
        content: content.trim(),
        author: author.trim() || '匿名'
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setAuthor('');
    setContentLength(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {editingPost ? '投稿を編集' : '新しい投稿'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              label={titleOptional ? "タイトル（省略可）" : "タイトル"}
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={!titleOptional}
            />
            {showAuthor && (
              <TextField
                label="名前（匿名の場合は空欄）"
                fullWidth
                variant="outlined"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                inputProps={{ maxLength: 50 }}
              />
            )}
            <Box>
              <TextField
                label="内容"
                fullWidth
                variant="outlined"
                multiline
                rows={4}
                value={content}
                onChange={handleContentChange}
                required
                helperText={
                  <Typography variant="caption" color={contentLength > 500 ? 'error' : 'text.secondary'}>
                    {contentLength}/500文字
                  </Typography>
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={titleOptional ? (!content.trim() || contentLength > 500) : (!title.trim() || !content.trim() || contentLength > 500)}
          >
            {editingPost ? '更新' : '投稿'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PostForm;