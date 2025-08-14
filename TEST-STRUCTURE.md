# テストファイル配置設計

## ディレクトリ構造

```
my-board-app/
├── src/
│   ├── components/
│   │   ├── __tests__/          # コンポーネントテスト
│   │   │   ├── PostForm.test.tsx
│   │   │   ├── PostList.test.tsx
│   │   │   ├── ThreadForm.test.tsx
│   │   │   └── ThreadList.test.tsx
│   │   ├── PostForm.tsx
│   │   ├── PostList.tsx
│   │   ├── ThreadForm.tsx
│   │   └── ThreadList.tsx
│   └── app/
│       └── api/
│           ├── posts/
│           │   ├── __tests__/   # APIテスト
│           │   │   └── route.test.ts
│           │   └── route.ts
│           └── threads/
│               ├── __tests__/   # APIテスト
│               │   └── route.test.ts
│               └── route.ts
├── e2e/                        # E2Eテスト
│   ├── board-app.spec.ts       # メイン機能テスト
│   └── post-management.spec.ts # 投稿管理テスト
├── jest.config.js              # Jest設定
├── jest.setup.js               # Jest初期化
└── playwright.config.ts        # Playwright設定
```

## テストカテゴリ

### 1. 単体テスト (Jest + Testing Library)
- **場所**: `src/**/__tests__/`
- **対象**: コンポーネント、APIルート、ユーティリティ関数
- **実行**: `npm run test`

### 2. E2Eテスト (Playwright)
- **場所**: `e2e/`
- **対象**: ユーザージャーニー全体
- **実行**: `npm run test:e2e`

## テスト命名規則

### ファイル名
- 単体テスト: `ComponentName.test.tsx` or `functionName.test.ts`
- E2Eテスト: `feature-name.spec.ts`

### テストケース名
- 日本語で機能を明確に記述
- 例: `should render all posts correctly`

## カバレッジ目標

- **Statements**: 70%以上
- **Branches**: 70%以上
- **Functions**: 70%以上
- **Lines**: 70%以上

## テスト実行コマンド

```bash
# 単体テスト
npm run test              # 一回実行
npm run test:watch        # ファイル変更監視
npm run test:coverage     # カバレッジ付き実行

# E2Eテスト  
npm run test:e2e         # ヘッドレス実行
npm run test:e2e:ui      # UI付き実行
npm run test:e2e:report  # HTMLレポート生成

# 全テスト
npm run test:all         # 単体+E2E全実行
npm run test:ci          # CI用実行
```

## モックと設定

### Jest設定 (`jest.config.js`)
- Next.jsプロジェクト用設定
- JSdom環境でReactコンポーネントテスト
- カバレッジ閾値設定

### Playwright設定 (`playwright.config.ts`)
- 複数ブラウザ対応 (Chrome, Firefox, Safari)
- スクリーンショット・動画記録
- 開発サーバー自動起動

## テストデータ管理

### モックデータ
- テスト用の固定データを使用
- 実際のAPIレスポンスに近い構造
- 各テストで独立したデータセット

### データクリーンアップ
- E2Eテスト後の自動クリーンアップ
- 開発環境での一時データ管理