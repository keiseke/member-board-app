# Testing Guide

このドキュメントでは、認証機能のテスト実行方法と構成について説明します。

## テスト構成

### 1. ユニットテスト (Jest + Testing Library)
- **登録API**: `src/app/api/auth/register/route.test.ts`
- **メール認証API**: `src/app/api/auth/verify-email/route.test.ts` 
- **認証ロジック**: `__tests__/auth/auth.test.ts`
- **フォームコンポーネント**: `__tests__/components/auth-forms.test.tsx`

### 2. E2Eテスト (Playwright)
- **認証フロー全体**: `e2e/auth/auth.spec.ts`

## テスト実行コマンド

### ユニットテストの実行

```bash
# 全てのユニットテストを実行
npm run test

# 監視モードでテスト実行
npm run test:watch

# カバレッジ付きでテスト実行
npm run test:coverage

# 特定のテストファイルのみ実行
npm run test register.test.ts
```

### E2Eテストの実行

```bash
# E2Eテストの実行（開発サーバー自動起動）
npm run test:e2e

# ヘッドレスモードでE2Eテスト実行
npm run test:e2e:headed

# 特定のブラウザでE2Eテスト実行
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:safari

# E2Eテストのデバッグモード
npm run test:e2e:debug

# レポート付きE2Eテスト実行
npm run test:e2e:report
```

### 全テストの実行

```bash
# ユニット + E2Eテスト
npm run test:all

# CI環境用（カバレッジ + レポート）
npm run test:ci
```

## テストシナリオ

### 📝 ユーザー登録テスト
- ✅ 正常な登録フロー
- ✅ バリデーションエラー (メール形式、パスワード長、必須項目)
- ✅ 重複メールアドレスエラー
- ✅ パスワードハッシュ化の確認
- ✅ 認証トークン生成の確認

### 🔐 ログインテスト  
- ✅ 正しい認証情報でのログイン成功
- ✅ 間違ったパスワードでのログイン失敗
- ✅ 存在しないメールアドレスでのログイン失敗
- ✅ 未認証ユーザーのログイン拒否
- ✅ バリデーションエラーの表示

### 📧 メール認証テスト
- ✅ 有効なトークンでの認証成功
- ✅ 無効/期限切れトークンでのエラー
- ✅ 認証状態のデータベース更新確認
- ✅ 認証後のリダイレクト

### 🎯 セッション管理テスト
- ✅ ログイン後のセッション維持
- ✅ ページリロード後のセッション維持
- ✅ 未認証ユーザーの保護ページアクセス制限
- ✅ ログアウト機能

### 🎨 フロントエンドテスト
- ✅ フォームレンダリング
- ✅ ユーザー入力とバリデーション
- ✅ エラーメッセージ表示
- ✅ 成功メッセージ表示

## テスト環境の設定

### データベース
- **メモリDB**: MongoDB Memory Server を使用
- **自動クリーンアップ**: 各テスト前後でデータベースをクリア
- **分離**: テスト間でのデータ競合を防止

### モック
- **NextAuth.js**: 認証プロバイダーのモック
- **Next.js Router**: ルーティング機能のモック 
- **Email Service**: メール送信機能のモック
- **Fetch API**: HTTP リクエストのモック

### 環境変数
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key-for-testing-only
SMTP_HOST=localhost
SMTP_PORT=587
```

## カバレッジ目標

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70, 
    lines: 70,
    statements: 70
  }
}
```

## トラブルシューティング

### よくある問題

1. **MongoDB接続エラー**
   ```bash
   # MongoDB Memory Serverの再インストール
   npm install --save-dev mongodb-memory-server --legacy-peer-deps
   ```

2. **E2Eテスト失敗**
   ```bash
   # Playwrightブラウザのインストール
   npm run playwright:install
   ```

3. **タイムアウトエラー**
   - `playwright.config.ts`でタイムアウト時間を調整
   - `jest.config.js`でテストタイムアウトを延長

### デバッグ方法

```bash
# Jestデバッグモード
npm run test -- --verbose --no-cache

# Playwrightデバッグモード  
npm run test:e2e:debug

# 特定のテストのみデバッグ
npm run test -- --testNamePattern="ログイン成功"
```

## CI/CD統合

GitHub Actionsでの自動テスト実行:

```yaml
- name: Run Tests
  run: npm run test:ci
  env:
    NODE_ENV: test
    NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

## テスト追加時のガイドライン

1. **ファイル命名規則**: `*.test.ts` または `*.spec.ts`
2. **テスト構造**: Arrange → Act → Assert
3. **モック使用**: 外部依存を適切にモック
4. **データクリーンアップ**: テスト後のクリーンアップを確実に実行
5. **エラーハンドリング**: 異常系のテストも含める

## テスト実行の推奨フロー

```bash
# 1. 開発中のクイックテスト
npm run test:watch

# 2. プルリクエスト前のフルテスト
npm run test:all

# 3. 本番デプロイ前のCI検証
npm run test:ci
```