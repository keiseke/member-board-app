# パッケージインストールコマンド

## 必要なパッケージの一括インストール

```bash
# メイン依存関係
npm install next@15 react@19 react-dom@19
npm install next-auth@beta
npm install mongodb mongoose
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @mui/x-date-pickers
npm install nodemailer
npm install bcryptjs
npm install zod
npm install react-hook-form @hookform/resolvers
npm install dayjs

# 開発依存関係
npm install --save-dev @types/node @types/react @types/react-dom
npm install --save-dev @types/bcryptjs @types/nodemailer
npm install --save-dev typescript
npm install --save-dev eslint eslint-config-next
```

## 個別インストールコマンド（お好みで）

```bash
# フレームワーク
npm install next@15 react@19 react-dom@19

# 認証
npm install next-auth@beta

# データベース
npm install mongodb mongoose

# UI フレームワーク
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/x-date-pickers

# ユーティリティ
npm install nodemailer bcryptjs zod react-hook-form @hookform/resolvers dayjs

# TypeScript関連
npm install --save-dev @types/node @types/react @types/react-dom @types/bcryptjs @types/nodemailer typescript

# 開発ツール
npm install --save-dev eslint eslint-config-next
```