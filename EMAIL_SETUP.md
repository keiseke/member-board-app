# 📧 メール送信機能 セットアップガイド

このガイドでは、Next.jsアプリにメール送信機能を設定する方法を説明します。

## 🚀 **実装済み機能**

### ✅ **メールテンプレート**
- **ユーザー登録確認メール** - 新規登録時の認証メール
- **パスワードリセットメール** - パスワード変更用のリンク
- **ウェルカムメール** - 認証完了時の歓迎メール
- **システム通知メール** - 管理者からのお知らせ

### ✅ **技術スタック**
- **React Email** - 美しいHTMLメールテンプレート
- **Nodemailer** - メール送信エンジン
- **Gmail/OAuth2対応** - 安全な認証方式
- **配信ログ** - MongoDB による送信履歴管理
- **一括送信** - バッチ処理対応

## ⚙️ **Gmail設定**

### 1. Gmailアプリパスワード方式（簡単）

```bash
# .env.local に追加
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Googleアプリパスワード

EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name
EMAIL_SUPPORT=support@yourdomain.com
```

**Googleアプリパスワードの取得方法：**
1. Googleアカウント設定 → セキュリティ
2. 2段階認証を有効化
3. アプリパスワード を生成
4. 生成された16桁パスワードを `SMTP_PASSWORD` に設定

### 2. Gmail OAuth2方式（推奨・より安全）

```bash
# .env.local に追加
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# OAuth2設定
GMAIL_OAUTH_CLIENT_ID=your-google-client-id
GMAIL_OAUTH_CLIENT_SECRET=your-google-client-secret
GMAIL_OAUTH_REFRESH_TOKEN=your-refresh-token
GMAIL_OAUTH_ACCESS_TOKEN=your-access-token
GMAIL_USER=your-email@gmail.com
```

**OAuth2設定手順：**
1. Google Cloud Console で プロジェクト作成
2. Gmail API を有効化
3. OAuth2 認証情報を作成
4. トークンを取得（Googleのドキュメント参照）

## 📨 **メール送信の使い方**

### 基本的なメール送信

```typescript
import { sendEmail } from '@/lib/email/client'

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'テストメール',
  html: '<h1>こんにちは</h1>',
  type: 'system_notice'
})

if (result.success) {
  console.log('送信成功:', result.messageId)
} else {
  console.error('送信失敗:', result.error)
}
```

### 専用関数の使用

```typescript
import { 
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail 
} from '@/lib/email/client'

// 認証メール送信
await sendVerificationEmail(email, name, verificationToken)

// パスワードリセットメール送信
await sendPasswordResetEmail(email, name, resetToken)

// ウェルカムメール送信
await sendWelcomeEmail(email, name)
```

### 一括送信

```typescript
import { sendBulkEmail } from '@/lib/email/client'

const recipients = ['user1@example.com', 'user2@example.com']
const results = await sendBulkEmail(
  recipients,
  '重要なお知らせ',
  '<h1>お知らせ内容</h1>',
  {
    type: 'system_notice',
    batchSize: 10,  // 10件ずつ送信
    delay: 1000     // 1秒間隔
  }
)
```

## 🎨 **カスタムテンプレート作成**

### React Emailコンポーネント

```tsx
// src/components/email/CustomEmail.tsx
import {
  Body,
  Button,
  Container,
  Heading,
  Html,
  Text,
} from '@react-email/components'

interface CustomEmailProps {
  userName: string
  actionUrl: string
}

export const CustomEmail = ({ userName, actionUrl }: CustomEmailProps) => (
  <Html>
    <Body style={main}>
      <Container>
        <Heading>こんにちは、{userName}さん</Heading>
        <Text>カスタムメッセージ</Text>
        <Button href={actionUrl} style={button}>
          アクションボタン
        </Button>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#ffffff' }
const button = { backgroundColor: '#ec4899', color: '#ffffff' }
```

### テンプレート関数の追加

```typescript
// src/lib/email/templates.ts に追加
import { render } from '@react-email/render'
import CustomEmail from '@/components/email/CustomEmail'

export function createCustomEmail(userName: string, actionUrl: string) {
  const html = render(
    CustomEmail({ userName, actionUrl })
  )
  
  return {
    subject: 'カスタムメール',
    html,
    text: `こんにちは、${userName}さん\\n\\nアクション: ${actionUrl}`
  }
}
```

## 📊 **配信ログと統計**

### 配信統計の確認

```typescript
// API: GET /api/admin/email-stats?days=30
const response = await fetch('/api/admin/email-stats?days=30')
const stats = await response.json()

console.log('配信統計:', stats.stats)
console.log('失敗メール:', stats.recentFailures)
console.log('日別統計:', stats.dailyStats)
```

### 手動でのログ確認

```typescript
import { EmailLog } from '@/models/EmailLog'

// 最近の送信履歴
const recentLogs = await EmailLog.find()
  .sort({ createdAt: -1 })
  .limit(20)

// 失敗したメール
const failedEmails = await EmailLog.find({ status: 'failed' })

// 配信統計
const stats = await EmailLog.getDeliveryStats()
```

## 🔧 **他のSMTPプロバイダー設定**

### SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Mailgun

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

### AWS SES

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-access-key
SMTP_PASSWORD=your-ses-secret-key
```

## 🧪 **テスト方法**

### 接続テスト

```typescript
import { testEmailConnection } from '@/lib/email/client'

const result = await testEmailConnection()
if (result.success) {
  console.log('SMTP接続成功')
} else {
  console.error('SMTP接続失敗:', result.message)
}
```

### 開発環境でのテスト

```bash
# テスト用スクリプト実行
npm run test:email:send
npm run test:email:templates
npm run test:email:all
```

## ⚠️ **注意事項**

### セキュリティ
- **アプリパスワードを安全に保管**してください
- **OAuth2方式を推奨**します
- **環境変数**に機密情報を保存し、gitにコミットしないでください

### 配信制限
- **Gmail**: 1日500通、1分間100通の制限
- **他プロバイダー**: 各社の制限を確認
- **一括送信時は間隔を空ける**ことを推奨

### 開発時の注意
- **テスト環境では本当のメールアドレスに送信しない**
- **開発用のメールキャッチャー**（MailHog等）の使用を推奨

## 🔗 **参考リンク**

- [React Email Documentation](https://react.email/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Google OAuth2 Setup](https://developers.google.com/gmail/imap/oauth2)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## 🆘 **トラブルシューティング**

### よくある問題

1. **「authentication failed」エラー**
   - アプリパスワードが正しく設定されているか確認
   - 2段階認証が有効になっているか確認

2. **「connection timeout」エラー**  
   - ファイアウォール/プロキシ設定を確認
   - SMTP_HOST, SMTP_PORT が正しいか確認

3. **テンプレートが正しく表示されない**
   - React Emailコンポーネントの構文を確認
   - インポートパスが正しいか確認

4. **配信ログが作成されない**
   - MongoDB接続を確認
   - EmailLogモデルがインポートされているか確認