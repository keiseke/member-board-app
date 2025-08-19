# 📊 データベース移行・セットアップガイド

## 🎯 目的
既存の開発データ（my-board-app1）を新しい開発環境（member_board_dev）にコピーし、本番環境（member_board_prod）をセットアップします。

## 📝 新しいデータベース構成

### **開発環境**
- **プロジェクト**: `member_board_dev`
- **データベース名**: `member_board_dev`  
- **接続文字列**: `mongodb+srv://boarduser:kV3rWuwMnTrNaH9Y@cluster0.wb1gzlk.mongodb.net/member_board_dev`

### **本番環境**
- **プロジェクト**: `member_board_prod`
- **データベース名**: `member_board_prod`
- **接続文字列**: `mongodb+srv://boarduser:kV3rWuwMnTrNaH9Y@cluster0.g3hhvh7.mongodb.net/member_board_prod`

---

## 🚀 実行手順

### **Step 1: 開発環境データ移行**

既存データを新しい開発環境にコピーします。

```bash
# データ移行実行
node scripts/migrate-data.js
```

**実行内容:**
- `my-board-app1` → `member_board_dev` へデータコピー
- インデックス再作成
- データ整合性確認

### **Step 2: 開発環境動作確認**

```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000
```

**確認項目:**
- ✅ ログイン可能
- ✅ 既存スレッド・投稿が表示
- ✅ 新規投稿・スレッド作成
- ✅ ユーザープロフィール確認

### **Step 3: 本番データベースセットアップ**

本番環境の初期化を実行します。

```bash
# 本番DB初期化
node scripts/setup-production-db.js
```

**セットアップ内容:**
- 本番用インデックス作成
- カテゴリマスタ投入
- システム設定投入
- TTLインデックス設定

### **Step 4: Vercel環境変数更新**

**Vercel Dashboard** → **Settings** → **Environment Variables**

```bash
# 本番環境変数を更新
MONGODB_URI = mongodb+srv://boarduser:kV3rWuwMnTrNaH9Y@cluster0.g3hhvh7.mongodb.net/member_board_prod?retryWrites=true&w=majority&appName=Cluster0

# その他の環境変数（既存）
NEXTAUTH_SECRET = a9ed37b090b610ac36de48500a166ebb48e8...
NEXTAUTH_URL = https://[Vercelから取得した本番URL]
CSRF_SECRET = 80e050c2456c649a68db2e114daed239...
CRON_SECRET = ddc5f504563a1353cb3576268117b4b0
NODE_ENV = production
DEBUG = false
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 60000
```

### **Step 5: 本番デプロイ実行**

変更をGitHubにプッシュしてVercelで自動デプロイ：

```bash
git add .
git commit -m "Update database configuration for production deployment"
git push origin master
```

### **Step 6: 本番環境動作確認**

本番URLでアプリケーションの動作確認：

**確認項目:**
- ✅ アプリケーション起動
- ✅ 新規ユーザー登録
- ✅ ログイン・ログアウト
- ✅ スレッド・投稿CRUD
- ✅ セキュリティ機能

---

## 📊 データベース構造

### **移行対象コレクション**
- `users` - ユーザー情報
- `threads` - スレッド情報
- `posts` - 投稿情報
- `accounts` - NextAuth アカウント
- `sessions` - NextAuth セッション
- `verification_tokens` - NextAuth 認証トークン
- `categories` - カテゴリマスタ

### **新規作成コレクション（本番のみ）**
- `audit_logs` - 監査ログ（90日TTL）
- `system_config` - システム設定

---

## ⚠️ 注意事項

### **データ移行時**
- 既存の開発データが新しい環境にコピーされます
- ユーザーパスワード等の機密情報も含まれます
- 移行前にバックアップの取得を推奨

### **本番環境**
- 本番環境は初期状態（データなし）でセットアップされます
- 本番運用開始後は開発環境とデータが分離されます
- セキュリティ設定（TTL、監査ログ等）が適用されます

### **接続情報管理**
- 接続文字列には認証情報が含まれます
- `.env.local` ファイルはGitにコミットしないでください
- 本番の接続情報はVercel環境変数でのみ管理

---

## 🆘 トラブルシューティング

### **移行エラー**
```bash
# 接続エラーの場合
- ユーザー名・パスワードを確認
- ネットワークアクセス設定を確認
- データベース名の確認

# データエラーの場合  
- 元データの整合性を確認
- 重複データの確認
- インデックス競合の確認
```

### **本番セットアップエラー**
```bash
# 権限エラーの場合
- MongoDB Atlas でユーザー権限を確認
- データベースアクセス権限を確認

# インデックスエラーの場合
- 既存インデックスとの競合を確認
- インデックス名の重複を確認
```

---

## ✅ チェックリスト

### **移行前**
- [ ] 既存データのバックアップ取得
- [ ] 新しいMongoDB環境の接続確認
- [ ] 移行スクリプトの動作確認

### **移行後**  
- [ ] 開発環境での動作確認
- [ ] データ整合性の確認
- [ ] ユーザー認証の確認

### **本番セットアップ後**
- [ ] 本番データベース初期化確認
- [ ] Vercel環境変数更新
- [ ] 本番デプロイ成功確認
- [ ] 本番環境動作確認

---

## 🔄 今後の運用

### **開発環境**
- ローカル開発時は `member_board_dev` を使用
- テストデータの追加・変更は自由に実施
- 定期的なデータクリーンアップを検討

### **本番環境**
- 本番データは `member_board_prod` で管理
- データ変更は慎重に実施
- 定期バックアップの設定を推奨
- 監査ログによる操作履歴管理