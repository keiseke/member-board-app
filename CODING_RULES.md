# コーディングルール

## プロジェクト共通ルール

### 1. TypeScript実行環境

**ルール:**
- Node.jsスクリプトでTypeScriptファイルを使用する場合は`tsx`を使用
- package.jsonのスクリプトコマンドに`tsx`を指定

**理由:**
- TypeScriptファイルはNode.jsで直接実行できない
- `tsx`は`ts-node`よりもモダンで設定が簡単

**実装例:**
```json
{
  "scripts": {
    "test:email": "tsx scripts/test-email.js"
  }
}
```

### 2. フォールバック機能の実装

**ルール:**
- 外部ライブラリ（React、その他UI系）を使用する関数には必ずtry-catch文を実装
- エラー時の代替処理（フォールバック）を用意

**理由:**
- サーバーサイドやテスト環境では一部ライブラリが利用できない場合がある
- ユーザー体験を損なわないため

**実装例:**
```typescript
export function createTemplate() {
  let html: string
  
  try {
    // Reactコンポーネントを使用
    html = render(ReactComponent(props))
  } catch (error) {
    // フォールバック用HTMLテンプレート
    html = `<div>シンプルなHTMLテンプレート</div>`
  }
  
  return { html }
}
```

### 3. データバリデーションの柔軟性

**ルール:**
- 必須フィールドは真に必要な場合のみ設定
- 空値や未定義値に対してデフォルト値を提供
- テストケースでエッジケースを検証

**理由:**
- 実際の使用で想定外の入力が発生する可能性
- システムの堅牢性向上

**実装例:**
```typescript
// Mongooseスキーマ
const schema = new Schema({
  subject: {
    type: String,
    required: false,
    default: '(件名なし)'
  }
})

// 関数内での処理
const finalSubject = options.subject || '(件名なし)'
```

### 4. エラーハンドリング

**ルール:**
- 外部サービス（メール送信、DB操作）には必ずtry-catch文を実装
- エラーログには十分な情報を含める
- ユーザーには適切なエラーメッセージを返す

**実装例:**
```typescript
try {
  const result = await externalService.call()
  return { success: true, data: result }
} catch (error) {
  console.error('外部サービスエラー:', {
    service: 'email',
    error: error.message,
    timestamp: new Date(),
    context: { userId, action }
  })
  
  return { 
    success: false, 
    error: 'サービス利用できません。後でお試しください。' 
  }
}
```

### 5. 依存関係管理

**ルール:**
- 新しいパッケージ追加時は`--legacy-peer-deps`を使用
- package.jsonで明示的にバージョンを指定
- 競合するパッケージは事前に確認

**理由:**
- 依存関係の競合を避ける
- ビルドの安定性確保

**実装例:**
```bash
npm install --save-dev new-package --legacy-peer-deps
```

### 6. テスト実装ガイドライン

**ルール:**
- テストはエッジケースを含む
- 外部依存を最小限に抑える
- モック/スタブを適切に使用

**テストパターン:**
```typescript
describe('メール送信機能', () => {
  test('正常なメール送信', async () => {
    // 正常系テスト
  })
  
  test('空の件名でのメール送信', async () => {
    // エッジケーステスト
  })
  
  test('不正なメールアドレス', async () => {
    // エラーケーステスト
  })
})
```

### 7. 環境変数と設定

**ルール:**
- 環境固有の設定は環境変数で管理
- デフォルト値を必ず設定
- .env.exampleファイルでサンプルを提供

**実装例:**
```typescript
const config = {
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true'
  }
}
```

### 8. ログ出力ルール

**ルール:**
- 重要な処理には適切なログレベルで出力
- 個人情報や機密情報はログに出力しない
- 構造化ログ（JSON形式）を使用

**実装例:**
```typescript
console.log('📧 メール送信成功:', {
  logId: 'xxx',
  to: '***@***.com', // マスク処理
  subject: email.subject,
  timestamp: new Date()
})
```

### 9. ファイル構成ルール

**ルール:**
- 関連機能は同一ディレクトリに配置
- 共通ユーティリティは`/lib`に配置
- テストファイルは`__tests__`ディレクトリに配置

**ディレクトリ構成:**
```
src/
├── lib/           # 共通ライブラリ
├── components/    # UIコンポーネント
├── models/        # データモデル
├── __tests__/     # テストファイル
└── scripts/       # ユーティリティスクリプト
```

### 10. Git運用ルール

**ルール:**
- 機能単位でコミット
- コミットメッセージは日本語で具体的に記述
- 機密情報はコミットしない

**コミットメッセージ例:**
```
feat: メール送信機能にフォールバック処理を追加

- Reactレンダリング失敗時のHTMLテンプレート追加
- テスト環境での動作保証
- エラーハンドリング強化
```

---

## 重要な注意事項

1. **セキュリティ第一**: 個人情報や認証情報の取り扱いは特に慎重に
2. **後方互換性**: 既存機能への影響を常に考慮
3. **パフォーマンス**: 大量データ処理時のメモリ使用量に注意
4. **可読性**: 他の開発者が理解しやすいコードを心がける

このルールは開発効率とコード品質の向上を目的としています。
定期的に見直しを行い、プロジェクトの成長に合わせて更新してください。