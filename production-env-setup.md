# 本番環境 環境変数設定ガイド

## 🔐 本番環境必須環境変数一覧

### **1. データベース接続**
```bash
# MongoDB Atlas本番環境接続文字列
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/member_board_prod?retryWrites=true&w=majority"
```

### **2. NextAuth認証設定**
```bash
# 本番環境用ランダム32文字秘密鍵
NEXTAUTH_SECRET="your-random-32-character-secret-here"

# 本番ドメインURL
NEXTAUTH_URL="https://your-domain.com"
```

### **3. セキュリティ設定**
```bash
# CSRF保護用秘密鍵（32文字のランダム文字列）
CSRF_SECRET="your-csrf-secret-32-characters-here"

# Vercel Cron認証トークン
CRON_SECRET="your-cron-secret-token-here"

# レート制限設定
RATE_LIMIT_MAX="5"
RATE_LIMIT_WINDOW="60000"
```

### **4. 本番環境識別**
```bash
# 本番環境フラグ
NODE_ENV="production"

# デバッグモード（本番では false）
DEBUG="false"
```

---

## 🛠️ 環境変数生成ツール

### **秘密鍵の生成**
```bash
# NEXTAUTH_SECRET生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CSRF_SECRET生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CRON_SECRET生成
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 📝 設定手順

### **Step 1: ローカルで環境変数を準備**

1. **プロジェクトルートに `.env.production` ファイルを作成**
```bash
# .env.production
MONGODB_URI="mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/member_board_prod?retryWrites=true&w=majority"
NEXTAUTH_SECRET="[生成した32文字の秘密鍵]"
NEXTAUTH_URL="https://your-domain.vercel.app"  # 後でカスタムドメインに変更
CSRF_SECRET="[生成した32文字の秘密鍵]"
CRON_SECRET="[生成した16文字のトークン]"
NODE_ENV="production"
DEBUG="false"
RATE_LIMIT_MAX="5"
RATE_LIMIT_WINDOW="60000"
```

### **Step 2: Vercelに環境変数を設定**

#### **Vercel CLI使用の場合**
```bash
# Vercelプロジェクトと接続
vercel link

# 環境変数を一括設定
vercel env add MONGODB_URI production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add CSRF_SECRET production
vercel env add CRON_SECRET production
vercel env add NODE_ENV production
vercel env add DEBUG production
vercel env add RATE_LIMIT_MAX production
vercel env add RATE_LIMIT_WINDOW production
```

#### **Vercel Dashboard使用の場合**
1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables**
4. 各環境変数を追加：
   - **Name**: 変数名
   - **Value**: 変数値
   - **Environments**: **Production** を選択

---

## 🔒 セキュリティ設定詳細

### **MongoDB接続文字列の注意点**
```bash
# 正しい形式（データベース名を指定）
mongodb+srv://username:password@cluster.mongodb.net/member_board_prod

# ⚠️ 間違った例（データベース名なし）
mongodb+srv://username:password@cluster.mongodb.net/
```

### **NEXTAUTH_URL設定**
```bash
# 開発時
NEXTAUTH_URL="http://localhost:3000"

# Vercel一時ドメイン
NEXTAUTH_URL="https://your-app.vercel.app"

# カスタムドメイン（推奨）
NEXTAUTH_URL="https://your-domain.com"
```

### **レート制限設定**
```bash
# 本番推奨設定
RATE_LIMIT_MAX="5"        # 5回/分
RATE_LIMIT_WINDOW="60000" # 60秒

# 厳格な設定（高トラフィック時）
RATE_LIMIT_MAX="3"        # 3回/分
RATE_LIMIT_WINDOW="60000" # 60秒
```

---

## ✅ 設定確認チェックリスト

### **必須環境変数チェック**
- [ ] `MONGODB_URI` - 正しいデータベース名を含む
- [ ] `NEXTAUTH_SECRET` - 32文字のランダム文字列
- [ ] `NEXTAUTH_URL` - 本番ドメインURL
- [ ] `CSRF_SECRET` - 32文字のランダム文字列
- [ ] `CRON_SECRET` - Cron認証用トークン
- [ ] `NODE_ENV="production"`

### **セキュリティチェック**
- [ ] すべての秘密鍵がランダム生成されている
- [ ] MongoDB認証情報が正しい
- [ ] 本番ドメインが正しく設定されている
- [ ] レート制限が適切に設定されている

### **接続テスト**
- [ ] MongoDB接続確認
- [ ] NextAuth認証フロー確認
- [ ] CSRF保護動作確認

---

## 🚀 次のステップ

環境変数設定完了後：

1. **Vercelプロジェクト作成・設定**
2. **初回デプロイ実行**
3. **本番環境テスト**
4. **カスタムドメイン設定**
5. **監視・アラート設定**

---

## 🆘 トラブルシューティング

### **よくあるエラー**

#### **MongoDB接続エラー**
```
Error: Authentication failed
```
**対処法**: MongoDB Atlasでユーザー権限とパスワードを確認

#### **NextAuth設定エラー**
```
Error: NEXTAUTH_URL is not set
```
**対処法**: NEXTAUTH_URLが正しく設定されているか確認

#### **CSRF エラー**
```
Error: CSRF token mismatch
```
**対処法**: CSRF_SECRETが設定されているか確認

### **設定値確認コマンド**
```bash
# Vercel環境変数確認
vercel env ls

# ローカル設定確認
cat .env.production
```