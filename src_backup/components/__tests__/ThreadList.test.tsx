import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThreadList from '../ThreadList'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { IThread } from '@/models/Thread'

const theme = createTheme()

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

describe('ThreadList', () => {
  const mockOnThreadClick = jest.fn()
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  const mockThreads: (IThread & { _id: string })[] = [
    {
      _id: '1',
      title: 'テストスレッド1',
      description: 'これはテストスレッド1の説明です',
      category: 'テクノロジー',
      creator: '匿名',
      postCount: 5,
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
      updatedAt: new Date('2025-01-01T10:00:00.000Z'),
    },
    {
      _id: '2',
      title: 'テストスレッド2',
      description: 'これはテストスレッド2の説明です',
      category: '一般',
      creator: 'ユーザー2',
      postCount: 3,
      createdAt: new Date('2025-01-02T09:00:00.000Z'),
      updatedAt: new Date('2025-01-02T09:00:00.000Z'),
    }
  ]

  const defaultProps = {
    threads: mockThreads,
    onThreadClick: mockOnThreadClick,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    currentUser: '匿名',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('スレッド一覧の表示', () => {
    it('should render all threads correctly', () => {
      renderWithTheme(<ThreadList {...defaultProps} />)
      
      expect(screen.getByText('テストスレッド1')).toBeInTheDocument()
      expect(screen.getByText('テストスレッド2')).toBeInTheDocument()
      expect(screen.getByText('これはテストスレッド1の説明です')).toBeInTheDocument()
      expect(screen.getByText('これはテストスレッド2の説明です')).toBeInTheDocument()
    })

    it('should display category chips', () => {
      renderWithTheme(<ThreadList {...defaultProps} />)
      
      expect(screen.getByText('テクノロジー')).toBeInTheDocument()
      expect(screen.getByText('一般')).toBeInTheDocument()
    })

    it('should display post counts', () => {
      renderWithTheme(<ThreadList {...defaultProps} />)
      
      expect(screen.getByText('5件')).toBeInTheDocument()
      expect(screen.getByText('3件')).toBeInTheDocument()
    })

    it('should format dates correctly', () => {
      renderWithTheme(<ThreadList {...defaultProps} />)
      
      expect(screen.getByText(/1月1日/)).toBeInTheDocument()
      expect(screen.getByText(/1月2日/)).toBeInTheDocument()
    })
  })

  describe('空のスレッド一覧', () => {
    it('should display empty message when no threads', () => {
      renderWithTheme(<ThreadList threads={[]} onThreadClick={mockOnThreadClick} onEdit={mockOnEdit} onDelete={mockOnDelete} currentUser="匿名" />)
      
      expect(screen.getByText('まだスレッドがありません')).toBeInTheDocument()
    })
  })

  describe('ユーザーインタラクション', () => {
    it('should call onThreadClick when thread is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ThreadList {...defaultProps} />)
      
      await user.click(screen.getByText('テストスレッド1'))
      
      expect(mockOnThreadClick).toHaveBeenCalledWith('1')
    })

    it('should show menu button for creator', () => {
      renderWithTheme(<ThreadList {...defaultProps} />)
      
      // 匿名ユーザーが作成したスレッドのメニューボタンが表示される
      const moreButtons = screen.getAllByTestId('MoreVertIcon')
      
      expect(moreButtons).toHaveLength(1) // 匿名が作成したスレッドのみ
    })
  })
})