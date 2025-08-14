import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

// Material-UI テーマ
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0',
    },
  },
})

// カスタムレンダーヘルパー
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: typeof theme
}

export const renderWithTheme = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { theme: customTheme = theme, ...renderOptions } = options

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// フォーム送信のヘルパー
export const submitForm = async (form: HTMLFormElement) => {
  const event = new Event('submit', { bubbles: true, cancelable: true })
  form.dispatchEvent(event)
}

// 待機ヘルパー
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms))

// ローカルストレージモック
export const mockLocalStorage = () => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore
    }
  }
}

// API フェッチモック
export const mockFetch = () => {
  const fetchMock = jest.fn()
  global.fetch = fetchMock
  
  return {
    mockResolvedValue: (value: any) => fetchMock.mockResolvedValue({
      ok: true,
      json: async () => value,
      text: async () => JSON.stringify(value),
      status: 200,
    }),
    mockRejectedValue: (error: any) => fetchMock.mockRejectedValue(error),
    mockResponseOnce: (response: any, status = 200) => 
      fetchMock.mockResolvedValueOnce({
        ok: status >= 200 && status < 300,
        json: async () => response,
        text: async () => JSON.stringify(response),
        status,
      }),
    mockErrorOnce: (message: string, status = 500) => 
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: message }),
        text: async () => JSON.stringify({ error: message }),
        status,
      }),
    reset: () => fetchMock.mockReset(),
    calls: () => fetchMock.mock.calls,
  }
}

// コンソールエラー抑制
export const suppressConsoleError = () => {
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalError
  })
}

// 非同期操作の完了を待つ
export const flushPromises = () => new Promise(resolve => setImmediate(resolve))