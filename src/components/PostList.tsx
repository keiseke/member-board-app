'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  CardActions,
} from '@mui/material';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import { IPostWithId } from '@/models/Post';

interface PostListProps {
  posts: IPostWithId[];
  onEdit: (post: IPostWithId) => void;
  onDelete: (id: string) => void;
}

const PostList: React.FC<PostListProps> = ({ posts, onEdit, onDelete }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {posts.length === 0 ? (
        <Typography variant="body1" color="text.secondary" textAlign="center">
          投稿がありません
        </Typography>
      ) : (
        posts.map((post: IPostWithId) => (
          <Card 
            key={post._id} 
            sx={{ 
              minWidth: 275,
              backgroundColor: 'rgba(252, 231, 243, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 168, 212, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(249, 168, 212, 0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(236, 72, 153, 0.15)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                {post.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {post.content}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(post.createdAt).toLocaleString('ja-JP')}
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton
                size="small"
                onClick={() => onEdit(post)}
                color="primary"
              >
                <Edit />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDelete(post._id)}
                color="error"
              >
                <Delete />
              </IconButton>
            </CardActions>
          </Card>
        ))
      )}
    </Box>
  );
};

export default PostList;