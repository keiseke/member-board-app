'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { Forum, AccessTime, Person, MoreVert, Edit, Delete } from '@mui/icons-material';
import { IThread } from '@/models/Thread';

interface ThreadListProps {
  threads: (IThread & { _id: string })[];
  onThreadClick: (threadId: string) => void;
  onEdit?: (thread: IThread & { _id: string }) => void;
  onDelete?: (threadId: string) => void;
  currentUser?: string;
}

const ThreadList: React.FC<ThreadListProps> = ({ 
  threads, 
  onThreadClick, 
  onEdit, 
  onDelete, 
  currentUser = '匿名' 
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedThread, setSelectedThread] = React.useState<(IThread & { _id: string }) | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, thread: IThread & { _id: string }) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedThread(thread);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedThread(null);
  };

  const handleEdit = () => {
    if (selectedThread && onEdit) {
      onEdit(selectedThread);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedThread && onDelete) {
      onDelete(selectedThread._id);
    }
    handleMenuClose();
  };

  const canEditThread = (thread: IThread & { _id: string }) => {
    return thread.creator?.toString() === currentUser;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {threads.length === 0 ? (
        <Card sx={{ 
          backgroundColor: 'rgba(252, 231, 243, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(249, 168, 212, 0.3)',
        }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              まだスレッドがありません
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              最初のスレッドを作成してみましょう！
            </Typography>
          </CardContent>
        </Card>
      ) : (
        threads.map((thread) => (
          <Card
            key={thread._id}
            sx={{
              cursor: 'pointer',
              backgroundColor: 'rgba(252, 231, 243, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 168, 212, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(249, 168, 212, 0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(236, 72, 153, 0.15)',
              },
            }}
            onClick={() => onThreadClick(thread._id)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1 }}>
                <Box sx={{ 
                  flex: 1, 
                  minWidth: 0, // これによりテキストが適切に切り詰められる
                }}>
                  <Typography variant="h6" component="h2" sx={{ 
                    fontWeight: 600,
                    color: '#1565c0',
                    mb: 1,
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
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      color: '#1565c0',
                      fontWeight: 500,
                      flexShrink: 0, // Chipも縮小しない
                    }}
                  />
                  {canEditThread(thread) && (onEdit || onDelete) && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, thread)}
                      data-testid="thread-menu-button"
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
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {thread.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Forum fontSize="small" />
                  <Typography variant="caption">
                    {thread.postCount}件
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Person fontSize="small" />
                  <Typography variant="caption">
                    {thread.creator}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime fontSize="small" />
                  <Typography variant="caption">
                    {formatDate(thread.updatedAt)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit} data-testid="edit-thread-menu-item">
            <Edit fontSize="small" sx={{ mr: 1 }} data-testid="EditIcon" />
            編集
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }} data-testid="delete-thread-menu-item">
            <Delete fontSize="small" sx={{ mr: 1 }} data-testid="DeleteIcon" />
            削除
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ThreadList;