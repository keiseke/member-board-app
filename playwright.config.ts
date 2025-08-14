import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 並列実行を無効にして安定性を向上
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // リトライを1回に設定
  workers: 1, // ワーカー数を1に制限
  timeout: 120 * 1000, // テストタイムアウトを2分に延長
  reporter: [
    ['html'],
    ['line'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off', // 日本語パス問題を回避するため動画記録を無効化
    navigationTimeout: 90000, // ナビゲーションタイムアウトを1.5分に延長
    actionTimeout: 45000, // アクションタイムアウトを45秒に延長
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // CI環境では新しいサーバーを起動
    timeout: 300 * 1000, // タイムアウトを5分に延長
    stdout: 'pipe', 
    stderr: 'pipe',
  },
})