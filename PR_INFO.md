# プルリクエスト作成情報

## GitHubでの手順

1. **リポジトリにアクセス**: https://github.com/keiseke/member-board-app
2. **「Compare & pull request」** または **「Pull requests」→「New pull request」**
3. 以下の情報を入力：

---

## タイトル
```
会員制掲示板アプリケーション - 認証・プロフィール機能実装
```

## 説明文（本文）
```markdown
# 会員制掲示板アプリケーション - 認証・プロフィール機能実装

## 📋 概要
Next.js を基盤とした包括的な会員制掲示板アプリケーションを実装しました。ユーザー認証、プロフィール管理、掲示板機能を含む完全なWebアプリケーションです。

## ✨ 主要機能

### 🔐 認証システム
- NextAuth.js による多重認証（パスワード + Google OAuth）
- React Email によるメール認証システム
- bcrypt によるセキュアなパスワード管理

### 👤 プロフィール管理
- リアルタイムバリデーション付きプロフィール編集
- Base64 ストレージによるアバターアップロード
- セッション同期機能

### 💬 掲示板システム
- カテゴリ別スレッド管理
- 投稿作成・編集システム
- 条件付き認証（ログアウト時は閲覧のみ）

### 🎨 UI/UX
- Material-UI によるレスポンシブデザイン
- 統一されたテーマとグラデーション
- 直感的なユーザーインターフェース

## 🛠 技術スタック
- **フロントエンド**: Next.js 14, TypeScript, Material-UI
- **バックエンド**: Next.js API Routes, NextAuth.js
- **データベース**: MongoDB Atlas + Mongoose
- **メール**: React Email + Resend
- **テスト**: Jest + Playwright

## 📁 主要な変更
- 認証システムの完全実装
- プロフィール管理機能の追加
- アバターアップロード機能
- ダッシュボードの統合
- 条件付き認証フローの実装

## 🔍 レビューポイント
- [ ] セキュリティ（パスワードハッシュ、JWT処理）
- [ ] パフォーマンス（DBクエリ最適化、画像処理）
- [ ] ユーザビリティ（エラーメッセージ、ローディング状態）
- [ ] コード品質（型定義、エラーハンドリング）

## 📱 動作確認手順
1. 環境設定 (`npm install` → 環境変数設定 → `npm run dev`)
2. ユーザー登録 → メール認証 → ログイン
3. プロフィール編集 → アバターアップロード
4. スレッド作成 → 投稿作成
5. ログアウト状態での条件付きアクセステスト

## 🧪 テスト実行
```bash
npm run test        # ユニットテスト
npm run test:e2e    # E2Eテスト
npm run type-check  # 型チェック
npm run lint        # Lint
```

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## ブランチ情報
- **ブランチ名**: `feature/member-borad`
- **ベースブランチ**: `main` (存在しない場合は `master`)
- **コミット**: b2d010e