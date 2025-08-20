# Vercel環境変数設定ガイド

## 必須のメール設定

### 1. Gmail OAuth2設定（推奨）
```
# Gmail OAuth2認証
GMAIL_USER=your-email@gmail.com
GMAIL_OAUTH_CLIENT_ID=your-client-id
GMAIL_OAUTH_CLIENT_SECRET=your-client-secret  
GMAIL_OAUTH_REFRESH_TOKEN=your-refresh-token
GMAIL_OAUTH_ACCESS_TOKEN=your-access-token

# SMTP設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# 送信者情報
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=会員制掲示板
EMAIL_ADMIN=admin@yourdomain.com
EMAIL_SUPPORT=support@yourdomain.com
```

### 2. Gmail アプリパスワード設定（簡単設定）
```
# SMTP基本設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# 送信者情報
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=会員制掲示板
EMAIL_ADMIN=admin@yourdomain.com
EMAIL_SUPPORT=support@yourdomain.com
```

### 3. その他のメール設定
```
# アプリケーション設定
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# MongoDB
MONGODB_URI=your-mongodb-connection-string

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app

# Google OAuth (ソーシャルログイン用)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Gmail設定手順

### アプリパスワードの取得（推奨）
1. Googleアカウントの2段階認証を有効にする
2. Googleアカウント > セキュリティ > アプリパスワード
3. 「メール」を選択してパスワードを生成
4. 生成されたパスワードを `SMTP_PASSWORD` に設定

### OAuth2設定（上級者向け）
1. Google Cloud Consoleでプロジェクト作成
2. Gmail APIを有効化
3. OAuth2認証情報を作成
4. Refresh Tokenを取得

## トラブルシューティング用API

### 1. メール設定診断
```
GET /api/test-email
```

### 2. テストメール送信
```
POST /api/test-email
{
  "testEmail": "your-test@email.com"
}
```

### 3. メールログ確認
```
GET /api/admin/email-logs?limit=10&status=failed
```

## よくある問題と解決策

### 1. 「Invalid login」エラー
- 2段階認証が有効になっている場合はアプリパスワードを使用
- `SMTP_USER` と `GMAIL_USER` が一致していることを確認

### 2. 「Connection timeout」エラー
- Vercelのファイアウォール制限の可能性
- 外部SMTPサービス（SendGrid、Mailgun）の利用を検討

### 3. 「Insufficient permissions」エラー
- Gmail APIのスコープ設定を確認
- OAuth2の refresh token が有効であることを確認

### 4. メールが届かない
- スパムフォルダを確認
- 送信者ドメインの認証設定（SPF、DKIM）
- メール配信業者のブロックリスト確認