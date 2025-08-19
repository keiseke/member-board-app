import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostList from '../PostList'
import { renderWithTheme } from '../../../__tests__/helpers/testUtils.helper'
import { createMockPosts } from '../../../__tests__/helpers/testData.helper'
import { IPost } from '@/models/Post'

describe('PostList', () => {
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  const mockPosts: (IPost & { _id: string })[] = [
    {
      _id: '1',
      title: 'テスト投稿1',
      content: 'これはテスト投稿1の内容です',
      author: '匿名',
      threadId: 'thread1',
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
      updatedAt: new Date('2025-01-01T10:00:00.000Z'),
    },
    {
      _id: '2', 
      title: 'テスト投稿2',
      content: 'これはテスト投稿2の内容です',
      author: 'ユーザー2',
      threadId: 'thread1',
      createdAt: new Date('2025-01-01T09:00:00.000Z'),
      updatedAt: new Date('2025-01-01T09:00:00.000Z'),
    }
  ]

  const defaultProps = {
    posts: mockPosts,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('投稿一覧の表示', () => {
    it('should render all posts correctly', () => {
      renderWithTheme(<PostList {...defaultProps} />)
      
      expect(screen.getByText('テスト投稿1')).toBeInTheDocument()
      expect(screen.getByText('テスト投稿2')).toBeInTheDocument()
      expect(screen.getByText('これはテスト投稿1の内容です')).toBeInTheDocument()
      expect(screen.getByText('これはテスト投稿2の内容です')).toBeInTheDocument()
    })

    it('should display formatted creation dates', () => {
      const posts = createMockPosts(2)
      renderWithTheme(<PostList posts={posts} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
      
      // 日本語形式の日付が表示されることを確認
      const dateElements = screen.getAllByText(/2025/)
      expect(dateElements.length).toBeGreaterThan(0)
    })

    it('should render edit and delete buttons for each post', () => {
      renderWithTheme(<PostList {...defaultProps} />)
      
      const editButtons = screen.getAllByTestId('EditIcon')
      const deleteButtons = screen.getAllByTestId('DeleteIcon')
      
      expect(editButtons).toHaveLength(2)
      expect(deleteButtons).toHaveLength(2)
    })
  })

  describe('空の投稿一覧', () => {
    it('should display empty message when no posts', () => {
      renderWithTheme(<PostList posts={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
      
      expect(screen.getByText('投稿がありません')).toBeInTheDocument()
    })
  })

  describe('ユーザーインタラクション', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PostList {...defaultProps} />)
      
      const editButtons = screen.getAllByTestId('EditIcon')
      await user.click(editButtons[0])
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockPosts[0])
      expect(mockOnEdit).toHaveBeenCalledTimes(1)
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PostList {...defaultProps} />)
      
      const deleteButtons = screen.getAllByTestId('DeleteIcon')
      await user.click(deleteButtons[0])
      
      expect(mockOnDelete).toHaveBeenCalledWith('1')
      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })
  })
})