# データベース仕様書

## 1. データベース概要

### 1.1 基本情報
- **データベース種類**: MongoDB
- **ODM/ORM**: Mongoose 8.17.0
- **接続**: MongoDB Atlas または Local MongoDB
- **文字エンコーディング**: UTF-8

### 1.2 設計方針
- **NoSQL**: ドキュメント指向データベース
- **スキーマ**: Mongooseスキーマによる型定義
- **関連**: ObjectIdによる参照関係
- **インデックス**: パフォーマンス最適化

## 2. コレクション定義

### 2.1 Threadsコレクション

#### 基本情報
- **コレクション名**: `threads`
- **説明**: 掲示板のスレッド情報を格納
- **モデルファイル**: `src/models/Thread.ts`

#### スキーマ構造
```typescript
interface IThread extends Document {
  title: string;
  description: string;
  category: string;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  postCount: number;
}
```

#### フィールド詳細

| フィールド名 | 型 | 必須 | デフォルト値 | 制約 | 説明 |
|------------|----|----|---------|------|------|
| `_id` | ObjectId | ✓ | 自動生成 | 一意 | MongoDB自動生成ID |
| `title` | String | ✓ | - | maxlength: 100, trim | スレッドタイトル |
| `description` | String | ✓ | - | maxlength: 300, trim | スレッド説明 |
| `category` | String | ✓ | - | maxlength: 50, trim | カテゴリー |
| `creator` | String | ✓ | "匿名" | maxlength: 50 | 作成者名 |
| `postCount` | Number | - | 0 | - | 投稿数（カウンタ） |
| `createdAt` | Date | ✓ | 自動生成 | - | 作成日時 |
| `updatedAt` | Date | ✓ | 自動生成 | - | 更新日時 |

#### インデックス
- **主キー**: `_id`（自動作成）
- **複合インデックス候補**:
  - `{ category: 1, updatedAt: -1 }` - カテゴリー別最新順
  - `{ updatedAt: -1 }` - 更新日時降順

#### サンプルドキュメント
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "title": "Next.jsについて語ろう",
  "description": "Next.jsの最新機能や開発のコツについて議論する場所です",
  "category": "テクノロジー",
  "creator": "開発者A",
  "postCount": 15,
  "createdAt": ISODate("2024-01-01T09:00:00.000Z"),
  "updatedAt": ISODate("2024-01-02T14:30:00.000Z")
}
```

### 2.2 Postsコレクション

#### 基本情報
- **コレクション名**: `posts`
- **説明**: スレッド内の投稿情報を格納
- **モデルファイル**: `src/models/Post.ts`

#### スキーマ構造
```typescript
interface IPost {
  title: string;
  content: string;
  threadId: mongoose.Types.ObjectId;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IPostDocument extends IPost, Document {}
```

#### フィールド詳細

| フィールド名 | 型 | 必須 | デフォルト値 | 制約 | 説明 |
|------------|----|----|---------|------|------|
| `_id` | ObjectId | ✓ | 自動生成 | 一意 | MongoDB自動生成ID |
| `title` | String | ✓ | - | maxlength: 100 | 投稿タイトル |
| `content` | String | ✓ | - | maxlength: 500 | 投稿内容 |
| `threadId` | ObjectId | ✓ | - | ref: 'Thread' | 所属スレッドID |
| `author` | String | ✓ | "匿名" | maxlength: 50 | 投稿者名 |
| `createdAt` | Date | ✓ | 自動生成 | - | 作成日時 |
| `updatedAt` | Date | ✓ | 自動生成 | - | 更新日時 |

#### インデックス
- **主キー**: `_id`（自動作成）
- **推奨インデックス**:
  - `{ threadId: 1, createdAt: 1 }` - スレッド内投稿の時系列表示
  - `{ createdAt: -1 }` - 全体の新着投稿表示

#### サンプルドキュメント
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "title": "App Routerの利点",
  "content": "Next.js 13のApp Routerを使ってみた感想ですが、サーバーコンポーネントとの組み合わせが素晴らしいです。特にデータフェッチングが...",
  "threadId": ObjectId("507f1f77bcf86cd799439011"),
  "author": "フロントエンド太郎",
  "createdAt": ISODate("2024-01-01T10:15:00.000Z"),
  "updatedAt": ISODate("2024-01-01T10:15:00.000Z")
}
```

## 3. データ関連

### 3.1 リレーション設計

#### Threads → Posts（1対多）
- **親**: Threads コレクション
- **子**: Posts コレクション  
- **関連フィールド**: `posts.threadId` → `threads._id`
- **関連方式**: 参照関係（Reference）

#### 関連図
```
Threads (1) ←→ (N) Posts
     ↑              ↓
   _id         threadId
```

### 3.2 データ整合性

#### カスケード操作
- **スレッド削除時**: 関連する投稿も削除
- **実装場所**: `src/app/api/threads/[id]/route.ts:94`
- **処理**: `Post.deleteMany({ threadId: id })`

#### カウンタ更新
- **投稿作成時**: `threads.postCount` +1
- **投稿削除時**: `threads.postCount` -1
- **実装**: `$inc` オペレーターを使用

### 3.3 データ検証

#### Mongooseスキーマレベル
- **文字数制限**: スキーマの `maxlength` 設定
- **必須項目**: `required: true` 設定
- **データ型**: TypeScriptとMongooseの型定義

#### アプリケーションレベル
- **トリム処理**: `trim: true` 設定
- **デフォルト値**: `default` 設定
- **カスタム検証**: 必要に応じてカスタムバリデータ

## 4. パフォーマンス最適化

### 4.1 インデックス戦略

#### 現在のインデックス
- **Threads**: なし（追加推奨）
- **Posts**: なし（追加推奨）

#### 推奨インデックス
```javascript
// Threadsコレクション
db.threads.createIndex({ "updatedAt": -1 })
db.threads.createIndex({ "category": 1, "updatedAt": -1 })

// Postsコレクション  
db.posts.createIndex({ "threadId": 1, "createdAt": 1 })
db.posts.createIndex({ "createdAt": -1 })
```

### 4.2 クエリ最適化

#### 効率的なソート
```javascript
// スレッド一覧（更新日時降順）
Thread.find({}).sort({ updatedAt: -1 })

// スレッド内投稿（作成日時昇順）
Post.find({ threadId: id }).sort({ createdAt: 1 })
```

#### 必要データのみ取得
```javascript
// 必要に応じてselect()で特定フィールドのみ取得
Thread.find({}).select('title category postCount updatedAt')
```

### 4.3 接続管理

#### コネクションプーリング
- **実装**: `src/lib/dbConnect.ts`
- **キャッシュ**: グローバル変数でのコネクション再利用
- **設定**: `bufferCommands: false`

## 5. セキュリティ

### 5.1 データ保護

#### 入力検証
- **Mongooseバリデーション**: スキーマレベルでの検証
- **アプリケーション層**: API Routes での追加検証
- **文字数制限**: XSS攻撃の軽減

#### NoSQLインジェクション対策
- **Mongoose**: 自動的にクエリのサニタイゼーション
- **型安全性**: TypeScriptによる型チェック

### 5.2 アクセス制御

#### 現在の実装
- **認証**: なし（匿名ベース）
- **認可**: 作成者名による簡易チェック

#### 将来の拡張
- **ユーザー認証**: JWTトークンベース
- **ロールベース**: 管理者・一般ユーザーの権限分離

## 6. バックアップ・運用

### 6.1 データバックアップ

#### 推奨設定
- **自動バックアップ**: MongoDB Atlasの自動バックアップ機能
- **頻度**: 日次バックアップ
- **保持期間**: 30日間

### 6.2 監視

#### メトリクス
- **接続数**: アクティブコネクション数
- **応答時間**: クエリ実行時間
- **エラー率**: データベースエラーの発生頻度

#### ログ
- **スロークエリ**: 実行時間の長いクエリ
- **エラーログ**: 接続エラー、クエリエラー

### 6.3 スケーリング

#### 垂直スケーリング
- **CPU・メモリ**: インスタンス仕様の向上
- **ストレージ**: データ容量の拡張

#### 水平スケーリング
- **リードレプリカ**: 読み取り専用レプリカの追加
- **シャーディング**: 大規模データの分散

## 7. データマイグレーション

### 7.1 スキーマ変更

#### フィールド追加
```javascript
// 新しいフィールドをデフォルト値付きで追加
db.threads.updateMany(
  { newField: { $exists: false } },
  { $set: { newField: defaultValue } }
)
```

#### フィールド削除
```javascript
// 不要フィールドの削除
db.threads.updateMany(
  {},
  { $unset: { oldField: 1 } }
)
```

### 7.2 データクリーニング

#### 重複データの処理
```javascript
// 重複データの特定と処理
db.posts.aggregate([
  {
    $group: {
      _id: { threadId: "$threadId", title: "$title", content: "$content" },
      count: { $sum: 1 },
      docs: { $push: "$_id" }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
])
```

## 8. テストデータ

### 8.1 開発用データ

#### サンプルスレッド
```javascript
// テスト用スレッドデータ
const sampleThreads = [
  {
    title: "プログラミング入門",
    description: "プログラミングを始める人向けの質問・相談スレッド",
    category: "質問",
    creator: "管理人",
    postCount: 0
  },
  // ...
]
```

#### サンプル投稿
```javascript
// テスト用投稿データ  
const samplePosts = [
  {
    title: "JavaScript基礎",
    content: "JavaScriptの基礎について教えてください。",
    threadId: ObjectId("..."),
    author: "初心者A"
  },
  // ...
]
```

### 8.2 パフォーマンステスト用データ

#### 大量データ生成
```javascript
// 負荷テスト用のデータ生成スクリプト
const generateTestData = async (threadCount, postsPerThread) => {
  // スレッド作成
  for (let i = 0; i < threadCount; i++) {
    const thread = await Thread.create({ /* データ */ });
    
    // 各スレッドに投稿作成
    for (let j = 0; j < postsPerThread; j++) {
      await Post.create({ threadId: thread._id, /* データ */ });
    }
  }
}
```

## 9. トラブルシューティング

### 9.1 接続問題

#### よくある問題
- **環境変数**: `MONGODB_URI` の設定ミス
- **ネットワーク**: Atlas接続時のIP制限
- **認証**: 認証情報の間違い

#### 解決方法
```javascript
// 接続テスト用のスクリプト
const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('接続成功');
  } catch (error) {
    console.error('接続エラー:', error);
  }
}
```

### 9.2 パフォーマンス問題

#### 症状
- **スロークエリ**: レスポンスが遅い
- **メモリ使用量**: 大量のメモリ消費

#### 対処法
- **インデックス追加**: 適切なインデックスの設定
- **クエリ最適化**: N+1問題の回避
- **データ量制限**: ページネーションの実装