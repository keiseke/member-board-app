// MongoDB Atlas 本番環境セットアップスクリプト
// 接続後にMongoDB Compass または mongosh で実行

// データベース作成
use member_board_prod;

// ===== USERS コレクション =====
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "emailVerified": 1 });
db.users.createIndex({ "lastLoginAt": -1 });
db.users.createIndex({ "role": 1 });

// ===== THREADS コレクション =====
db.threads.createIndex({ "category": 1, "createdAt": -1 });
db.threads.createIndex({ "authorId": 1 });
db.threads.createIndex({ "isArchived": 1 });
db.threads.createIndex({ "isPinned": 1, "createdAt": -1 });
db.threads.createIndex({ "updatedAt": -1 });

// Text search index for thread titles and content
db.threads.createIndex({
  "title": "text",
  "description": "text"
}, {
  weights: {
    "title": 10,
    "description": 1
  },
  name: "thread_text_search"
});

// ===== POSTS コレクション =====
db.posts.createIndex({ "threadId": 1, "createdAt": -1 });
db.posts.createIndex({ "authorId": 1 });
db.posts.createIndex({ "createdAt": -1 });
db.posts.createIndex({ "isDeleted": 1 });

// Text search index for posts
db.posts.createIndex({
  "content": "text"
}, {
  name: "post_content_search"
});

// ===== AUDIT_LOGS コレクション =====
db.audit_logs.createIndex({ "timestamp": -1 });
db.audit_logs.createIndex({ "action": 1, "timestamp": -1 });
db.audit_logs.createIndex({ "userId": 1, "timestamp": -1 });
db.audit_logs.createIndex({ "severity": 1, "timestamp": -1 });
db.audit_logs.createIndex({ "success": 1, "timestamp": -1 });
db.audit_logs.createIndex({ "ip": 1, "timestamp": -1 });

// TTL インデックス - 90日後自動削除
db.audit_logs.createIndex(
  { "timestamp": 1 },
  { 
    expireAfterSeconds: 7776000,  // 90 days = 90 * 24 * 60 * 60
    name: "audit_logs_ttl"
  }
);

// ===== EMAIL_LOGS コレクション（メール送信履歴） =====
db.email_logs.createIndex({ "sentAt": -1 });
db.email_logs.createIndex({ "userId": 1, "sentAt": -1 });
db.email_logs.createIndex({ "type": 1, "sentAt": -1 });
db.email_logs.createIndex({ "success": 1 });

// TTL インデックス - 30日後自動削除
db.email_logs.createIndex(
  { "sentAt": 1 },
  { 
    expireAfterSeconds: 2592000,  // 30 days
    name: "email_logs_ttl"
  }
);

// ===== セッションコレクション（NextAuth用） =====
db.sessions.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });
db.sessions.createIndex({ "sessionToken": 1 }, { unique: true });
db.sessions.createIndex({ "userId": 1 });

db.accounts.createIndex({ "userId": 1 });
db.accounts.createIndex({ "provider": 1, "providerAccountId": 1 }, { unique: true });

db.users.createIndex({ "email": 1 }, { unique: true });

db.verification_tokens.createIndex({ "identifier": 1, "token": 1 }, { unique: true });
db.verification_tokens.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });

// ===== 初期データ投入 =====

// カテゴリマスタデータ
db.categories.insertMany([
  { _id: "general", name: "一般", description: "一般的な話題", order: 1, isActive: true },
  { _id: "politics", name: "政治", description: "政治関連の議論", order: 2, isActive: true },
  { _id: "economy", name: "経済", description: "経済・ビジネス関連", order: 3, isActive: true },
  { _id: "technology", name: "テクノロジー", description: "技術・IT関連", order: 4, isActive: true },
  { _id: "sports", name: "スポーツ", description: "スポーツ全般", order: 5, isActive: true },
  { _id: "entertainment", name: "エンターテイメント", description: "映画・音楽・ゲーム等", order: 6, isActive: true },
  { _id: "hobby", name: "趣味", description: "趣味・レジャー", order: 7, isActive: true },
  { _id: "question", name: "質問", description: "質問・相談", order: 8, isActive: true },
  { _id: "other", name: "その他", description: "その他の話題", order: 99, isActive: true }
]);

db.categories.createIndex({ "order": 1 });
db.categories.createIndex({ "isActive": 1, "order": 1 });

// システム設定
db.system_config.insertOne({
  _id: "site_settings",
  siteName: "Member Board",
  siteDescription: "会員制掲示板システム",
  maintenanceMode: false,
  registrationEnabled: true,
  maxPostLength: 1000,
  maxThreadsPerUser: 10,
  rateLimits: {
    posts: { windowMs: 60000, maxRequests: 5 },
    threads: { windowMs: 300000, maxRequests: 2 },
    auth: { windowMs: 900000, maxRequests: 5 }
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// インデックス作成完了確認
print("=== インデックス作成状況確認 ===");

print("Users collection indexes:");
printjson(db.users.getIndexes());

print("Threads collection indexes:");
printjson(db.threads.getIndexes());

print("Posts collection indexes:");
printjson(db.posts.getIndexes());

print("Audit_logs collection indexes:");
printjson(db.audit_logs.getIndexes());

print("=== セットアップ完了 ===");
print("データベース: member_board_prod");
print("作成されたコレクション:", db.getCollectionNames());

// パフォーマンステスト用のサンプルデータ（オプション）
/*
print("=== サンプルデータ投入（オプション） ===");

// サンプルユーザー
db.users.insertOne({
  _id: new ObjectId(),
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date()
});

// サンプルスレッド
db.threads.insertOne({
  _id: new ObjectId(),
  title: "Welcome Thread",
  description: "掲示板へようこそ！",
  category: "general",
  authorId: db.users.findOne()._id,
  isPinned: true,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("サンプルデータ投入完了");
*/