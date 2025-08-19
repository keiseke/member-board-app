// src/components/providers/ThemeProvider.tsx
'use client'

import React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { pink, grey } from '@mui/material/colors'

// カスタムテーマ
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: pink[500],
      light: pink[300],
      dark: pink[700],
      contrastText: '#fff'
    },
    secondary: {
      main: grey[600],
      light: grey[400],
      dark: grey[800],
      contrastText: '#fff'
    },
    background: {
      default: '#fdf2f8', // 薄いピンク背景
      paper: '#ffffff'
    },
    text: {
      primary: grey[900],
      secondary: grey[600]
    },
    error: {
      main: '#f44336'
    },
    warning: {
      main: '#ff9800'
    },
    success: {
      main: '#4caf50'
    }
  },
  typography: {
    fontFamily: [
      'Hiragino Kaku Gothic ProN',
      'Hiragino Sans',
      'Meiryo',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '2rem',
      fontWeight: 600
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 24px',
          fontSize: '1rem'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8
          }
        }
      }
    }
  }
})

interface Props {
  children: React.ReactNode
}

export default function CustomThemeProvider({ children }: Props) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}