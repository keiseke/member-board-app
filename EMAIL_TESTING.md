# 📧 メール送信機能 テストガイド

このドキュメントでは、実装したメール送信機能の包括的なテスト方法について説明します。

## 🎯 **テストの概要**

### **テストカテゴリ**

1. **📧 包括的機能テスト** - SMTP接続、テンプレート、送信、ログの総合テスト
2. **🎨 テンプレート詳細テスト** - React Email、多言語、境界値テスト
3. **🏋️ ストレステスト** - エラーハンドリング、パフォーマンス、負荷テスト
4. **🗄️ ログ機能テスト** - MongoDB連携、統計、クリーンアップテスト
5. **🖼️ プレビュー機能テスト** - API、HTML検証、アクセシビリティテスト
6. **⚙️ 環境確認テスト** - React Email環境、設定確認

## 🚀 **テスト実行方法**

### **1. 統合テストスイート（推奨）**

```bash
# 全テストを一度に実行
npm run test:email:master

# 詳細ログ付き実行
npm run test:email:master:verbose

# 高速実行（待機時間なし）
npm run test:email:master:fast
```

### **2. 個別テスト実行**

```bash
# 包括的機能テスト
npm run test:email:comprehensive

# テンプレート詳細テスト
npm run test:email:templates

# ストレステスト  
npm run test:email:stress

# ログ機能テスト
npm run test:email:logging

# プレビュー機能テスト
npm run test:email:preview

# 環境確認テスト
npm run test:react-email
```

### **3. 既存の基本テスト**

```bash
# 基本的なメール送信テスト
npm run test:email:send

# SMTP接続テスト
npm run test:email:smtp

# 環境変数確認
npm run test:email:env

# 全基本テスト
npm run test:email:all
```

## ⚙️ **テスト前の準備**

### **1. 環境変数設定**

```bash
# .env.local に以下を設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# テスト用メールアドレス（推奨）
TEST_EMAIL=your-test-email@gmail.com

# MongoDB接続（ログテスト用）
MONGODB_URI=mongodb://localhost:27017/your-database
```

### **2. 開発サーバー起動（プレビューテスト用）**

```bash
# プレビューAPIテストには開発サーバーが必要
npm run dev
```

## 📊 **テスト結果の確認**

### **1. コンソール出力**

各テストは詳細な進行状況とリアルタイム結果を表示：

```
🧪 [14:30:15] 包括的機能テスト開始...
✅ [14:30:16] SMTP接続成功
🧪 [14:30:17] ウェルカムメールテンプレート: 5/5 チェック通過
✅ [14:30:18] メール送信成功 (MessageID: <abc123@smtp.gmail.com>)
📊 テスト結果サマリー
=====================================
✅ 成功: 15/16
❌ 失敗: 1/16  
📈 成功率: 93.8%
```

### **2. レポートファイル**

詳細なJSON形式レポートが `test-results/` に生成：

```
test-results/
├── email-master-report.json      # 統合テスト結果
├── email-comprehensive-report.json
├── template-validation-report.json
├── email-stress-report.json
├── email-logging-report.json
├── email-preview-report.json
├── email-previews/               # HTMLプレビューファイル
└── api-previews/                 # APIプレビューファイル
```

### **3. プレビューファイル**

生成されたメールテンプレートを視覚的に確認：

```bash
# プレビューファイルをブラウザで開く
open test-results/email-previews/welcome-email.html
open test-results/api-previews/verification-email.html
```

## 🎯 **各テストの詳細**

### **📧 包括的機能テスト**

```bash
npm run test:email:comprehensive
```

**テスト内容:**
- SMTP接続テスト
- 全メールテンプレート生成検証
- 実際のメール送信テスト（基本、ウェルカム、認証、日本語）
- エラーハンドリングテスト
- MongoDB ログ作成確認

**期待される結果:**
- SMTP接続成功
- テンプレート生成成功
- メール送信成功（実際にメール受信）
- ログデータベース作成

### **🎨 テンプレート詳細テスト**

```bash
npm run test:email:templates
```

**テスト内容:**
- HTML構造検証
- 件名・本文長さチェック
- 必須要素存在確認
- 多言語ユーザー名テスト
- XSSセキュリティテスト
- レスポンシブデザイン確認

**期待される結果:**
- 全テンプレートHTML生成成功
- セキュリティ要件満足
- プレビューファイル生成

### **🏋️ ストレステスト**

```bash
npm run test:email:stress
```

**テスト内容:**
- 接続耐性テスト（間違ったポート/ホスト/認証）
- エラーシナリオテスト（無効メールアドレス、巨大メール）
- パフォーマンステスト（テンプレート生成速度）
- 同時実行テスト（5/10/20件同時処理）

**期待される結果:**
- エラー処理の正常動作
- パフォーマンス基準クリア
- 同時実行での安定性

### **🗄️ ログ機能テスト**

```bash
npm run test:email:logging
```

**テスト内容:**
- MongoDB接続確認
- EmailLogモデルCRUD操作
- 配信統計機能テスト
- ログクリーンアップ機能
- メール送信とログ連携確認

**期待される結果:**
- データベース操作成功
- 統計データ正確性
- クリーンアップ機能動作

### **🖼️ プレビュー機能テスト**

```bash
npm run test:email:preview
```

**テスト内容:**
- プレビューAPI動作確認
- HTML妥当性検証
- アクセシビリティチェック
- セキュリティテスト（XSS対策）
- エラーハンドリング確認

**期待される結果:**
- API正常レスポンス
- 有効なHTML生成
- アクセシビリティ基準満足

## 🐛 **トラブルシューティング**

### **よくある問題と解決方法**

#### **1. SMTP接続エラー**

```
❌ SMTP接続失敗: Authentication failed
```

**解決方法:**
- Gmailアプリパスワードの確認
- 2段階認証の有効化確認
- 環境変数の再確認

#### **2. MongoDB接続エラー**

```
❌ MongoDB接続失敗: connection refused
```

**解決方法:**
- MongoDBサーバーの起動確認
- `MONGODB_URI` 環境変数確認
- ネットワーク接続確認

#### **3. テンプレート生成エラー**

```
❌ React Email レンダリングエラー
```

**解決方法:**
- React Email依存関係の確認: `npm install react-email @react-email/components`
- Node.jsバージョン確認（16以上推奨）
- TypeScript設定確認

#### **4. プレビューAPI接続失敗**

```
❌ プレビューAPI接続エラー: ECONNREFUSED
```

**解決方法:**
- 開発サーバーの起動確認: `npm run dev`
- ポート3000の使用状況確認
- ファイアウォール設定確認

### **テスト実行時の注意事項**

#### **メール送信制限**
- **Gmail**: 1日500通、1分間100通
- テスト用メールアドレスの使用推奨
- 送信間隔の調整（スクリプト内で実装済み）

#### **データベース影響**
- テストデータの自動クリーンアップ実装済み
- 本番データベースでの実行注意
- バックアップ推奨

#### **パフォーマンス**
- 全テスト実行時間: 約5-10分
- 個別テスト: 1-3分
- ネットワーク状況により変動

## 📈 **継続的テスト**

### **CI/CD統合例**

```yaml
# .github/workflows/email-tests.yml
name: Email Function Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run email tests
        run: npm run test:email:master:fast
        env:
          SMTP_HOST: ${{ secrets.SMTP_HOST }}
          SMTP_USER: ${{ secrets.SMTP_USER }}
          SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
```

### **定期テスト推奨**

```bash
# crontabに追加（毎日午前3時実行）
0 3 * * * cd /path/to/project && npm run test:email:master:fast > /var/log/email-tests.log 2>&1
```

## 📋 **テストチェックリスト**

### **デプロイ前チェック**

- [ ] 環境変数設定完了
- [ ] SMTP接続成功
- [ ] 全テンプレート生成成功
- [ ] 実際のメール送信・受信確認
- [ ] ログ機能正常動作
- [ ] プレビューAPI動作確認
- [ ] エラーハンドリング確認
- [ ] パフォーマンス基準クリア

### **本番運用チェック**

- [ ] 送信制限設定確認
- [ ] ログローテーション設定
- [ ] 監視・アラート設定
- [ ] バックアップ設定
- [ ] セキュリティ監査実施

---

## 💡 **ベストプラクティス**

1. **定期的なテスト実行** - 週1回の自動テスト
2. **段階的デプロイ** - テスト環境→ステージング→本番
3. **監視とログ** - 送信率、エラー率の監視
4. **ユーザーフィードバック** - メール到達性の確認
5. **継続的改善** - テスト結果に基づく最適化

このテストスイートにより、メール送信機能の品質と信頼性を継続的に保証できます。