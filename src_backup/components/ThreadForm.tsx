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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

interface ThreadFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; category: string; creator?: string }) => void;
  editingThread?: { _id: string; title: string; description: string; category: string; creator: string } | null;
  defaultCreator?: string;
}

const categories = [
  '一般',
  '政治',
  '経済',
  'テクノロジー',
  'スポーツ',
  'エンターテイメント',
  '趣味',
  '質問',
  'その他',
];

const ThreadForm: React.FC<ThreadFormProps> = ({ open, onClose, onSubmit, editingThread, defaultCreator }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [creator, setCreator] = useState('');

  useEffect(() => {
    if (editingThread) {
      setTitle(editingThread.title);
      setDescription(editingThread.description);
      setCategory(editingThread.category);
      setCreator(editingThread.creator);
    } else if (open) {
      // 新規作成時は初期値を設定
      setTitle('');
      setDescription('');
      setCategory('');
      setCreator(defaultCreator || '');
    } else if (!open) {
      // フォームを閉じるときは全てクリア
      setTitle('');
      setDescription('');
      setCategory('');
      setCreator('');
    }
  }, [open, editingThread, defaultCreator]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim() && category) {
      onSubmit({ 
        title: title.trim(), 
        description: description.trim(), 
        category,
        creator: creator.trim() || '匿名'
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editingThread ? 'スレッドを編集' : '新しいスレッドを作成'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              label="スレッドタイトル"
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              inputProps={{ maxLength: 100 }}
              helperText={`${title.length}/100文字`}
            />
            <TextField
              label="説明"
              variant="outlined"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              inputProps={{ maxLength: 300 }}
              helperText={`${description.length}/300文字`}
            />
            <TextField
              label="作成者名"
              variant="outlined"
              value={creator}
              InputProps={{
                readOnly: true,
              }}
              inputProps={{ maxLength: 50 }}
              helperText="ログインユーザー名が自動で設定されます。"
            />
            <FormControl required>
              <InputLabel id="category-select-label">カテゴリー</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                data-testid="category-select"
                value={category}
                label="カテゴリー"
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!title.trim() || !description.trim() || !category}
          >
            {editingThread ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ThreadForm;