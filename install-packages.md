# 会員制掲示板システム - 必要パッケージインストール

## 追加で必要なパッケージ

```bash
# NextAuth v5とその他の認証関連
npm install next-auth@beta bcryptjs crypto-js @next-auth/mongodb-adapter

# フォーム処理とバリデーション
npm install zod react-hook-form @hookform/resolvers

# 日付処理
npm install dayjs

# 型定義
npm install --save-dev @types/bcryptjs @types/crypto-js
```

## 既にインストール済みのパッケージ
- Next.js 15.4.4 ✅
- React 19.1.0 ✅ 
- MUI (Material-UI) 7.2.0 ✅
- MongoDB (Mongoose) 8.17.0 ✅
- Nodemailer 7.0.5 ✅
- TypeScript ✅
- TailwindCSS ✅

## 環境変数設定

`.env.local` ファイルに以下を設定してください：

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/member-board

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# From Email
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Member Board System
```