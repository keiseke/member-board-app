# MongoDB Atlas フリープラン本番設定

## 🆓 フリープラン活用方針

### **既存クラスター活用 - 新プロジェクト不要**

```
既存: k's Org - 2025-07-30 (M0 Free Tier)
├── 開発用DB: member_board
└── 本番用DB: member_board_prod ← 新規作成
```

## 📊 フリープラン制限と対策

### **M0 フリープランの制限**
| 項目 | 制限 | 対策 |
|------|------|------|
| ストレージ | 512MB | データ量監視・定期クリーンアップ |
| 接続数 | 100同時接続 | 接続プール最適化 |
| CPU | 共有 | 効率的クエリ設計 |
| バックアップ | なし | 重要データの手動エクスポート |
| 監視 | 基本のみ | アプリケーションレベル監視 |

### **軽量運用での最適化**

```javascript
// 接続設定の最適化
{
  "maxPoolSize": 5,        // フリープラン用に削減
  "minPoolSize": 1,
  "maxIdleTimeMS": 30000,  // 接続を早めに解放
  "serverSelectionTimeoutMS": 5000
}
```

## 🔧 フリープラン用セットアップ

### **Step 1: 既存プロジェクトで本番DB作成**

MongoDB Atlas Console:
```
1. 既存プロジェクト「k's Org - 2025-07-30」にアクセス
2. Clusters → 既存クラスターを選択
3. Collections → Create Database
   - Database Name: member_board_prod
   - Collection Name: users (初期コレクション)
```

### **Step 2: 軽量版データベースセットアップ**

```javascript
// MongoDB Compass または mongosh で実行
use member_board_prod;

// === 必須インデックスのみ作成（フリープラン最適化版） ===

// Users - 必須のみ
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });

// Threads - 基本検索用
db.threads.createIndex({ "category": 1, "createdAt": -1 });
db.threads.createIndex({ "authorId": 1 });

// Posts - スレッド内検索用  
db.posts.createIndex({ "threadId": 1, "createdAt": -1 });
db.posts.createIndex({ "authorId": 1 });

// Audit Logs - TTL付き（ストレージ節約）
db.audit_logs.createIndex({ "timestamp": -1 });
db.audit_logs.createIndex(
  { "timestamp": 1 }, 
  { expireAfterSeconds: 2592000 } // 30日で自動削除
);

// NextAuth用（必須）
db.sessions.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });
db.sessions.createIndex({ "sessionToken": 1 }, { unique: true });
db.accounts.createIndex({ "provider": 1, "providerAccountId": 1 }, { unique: true });
db.verification_tokens.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });

// カテゴリマスタ（軽量版）
db.categories.insertMany([
  { _id: "general", name: "一般", order: 1 },
  { _id: "technology", name: "テクノロジー", order: 2 },
  { _id: "question", name: "質問", order: 3 },
  { _id: "other", name: "その他", order: 99 }
]);

print("✅ フリープラン用セットアップ完了");
```

### **Step 3: 環境変数取得**

MongoDB Atlas Console:
```
1. Clusters → Connect → Connect your application
2. Driver: Node.js
3. 接続文字列をコピー:
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/member_board_prod
```

## ⚡ フリープラン最適化設定

### **アプリケーション側設定**

```typescript
// src/lib/mongodb.ts - フリープラン最適化版
const options = {
  maxPoolSize: 5,           // 接続数制限
  minPoolSize: 1,
  maxIdleTimeMS: 30000,     // 30秒で接続解放
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,      // バッファリング無効
  bufferCommands: false,    // コマンドバッファリング無効
}
```

### **データ量監視**

```typescript
// src/app/api/admin/storage-info/route.ts
export async function GET() {
  const db = await connectToDatabase()
  
  const stats = await db.db().stats()
  const storageUsed = stats.dataSize + stats.indexSize
  const storageLimit = 512 * 1024 * 1024 // 512MB
  const usagePercent = (storageUsed / storageLimit) * 100
  
  return NextResponse.json({
    storageUsed: Math.round(storageUsed / 1024 / 1024), // MB
    storageLimit: 512, // MB
    usagePercent: Math.round(usagePercent),
    warning: usagePercent > 80,
    critical: usagePercent > 95
  })
}
```

### **定期クリーンアップ設定**

```typescript
// より短期間でログクリーンアップ
const RETENTION_DAYS = 30 // フリープラン用に短縮

// 重要でないデータの定期削除
await auditLogger.cleanup(30) // 30日保持
```

## 📈 運用監視

### **ストレージ使用量監視**
```bash
# 定期的に実行
curl https://your-domain.com/api/admin/storage-info
```

### **接続数監視**
```javascript
// MongoDB Compass で確認
db.runCommand({ serverStatus: 1 }).connections
```

## 🚨 制限に達した場合の対策

### **ストレージ不足 (512MB)**
1. 古いデータの削除
2. 不要なインデックスの削除  
3. 画像・ファイルの外部ストレージ移行

### **接続数不足 (100接続)**
1. 接続プール設定の最適化
2. 接続の早期解放
3. 不要な長時間接続の特定・修正

## 💡 フリープラン運用のコツ

### **効率的なデータ設計**
- 必要最小限のフィールド
- 適切なデータ型選択
- 重複データの排除

### **クエリ最適化**
- インデックスを活用したクエリ
- 不要なデータ取得の回避
- 集約パイプラインの効率化

### **監視・アラート**
- ストレージ使用量80%でアラート
- 接続エラー監視
- レスポンス時間監視

---

## ✅ 次のステップ

1. **既存クラスターで本番DB作成** ← 今ここ
2. **接続文字列取得**
3. **環境変数設定**

フリープランでも十分な会員制掲示板を構築できます！軽量運用に最適化された設定で進めましょう。