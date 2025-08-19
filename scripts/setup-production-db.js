// 本番データベースセットアップスクリプト
// member_board_prod環境の初期化

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://boarduser:kV3rWuwMnTrNaH9Y@cluster0.g3hhvh7.mongodb.net/member_board_prod?retryWrites=true&w=majority&appName=Cluster0';

async function setupProductionDatabase() {
  let client;

  try {
    console.log('🏗️  本番データベースセットアップ開始...\n');
    
    // 接続
    console.log('📡 本番データベースに接続中...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ 接続成功\n');

    const db = client.db('member_board_prod');

    // インデックス作成
    console.log('🔍 本番環境インデックス作成中...');
    await createProductionIndexes(db);
    console.log('✅ インデックス作成完了\n');

    // 初期データ投入
    console.log('📊 初期データ投入中...');
    await insertInitialData(db);
    console.log('✅ 初期データ投入完了\n');

    // 設定確認
    console.log('🔧 設定確認中...');
    await verifySetup(db);

    console.log('\n🎉 本番データベースセットアップ完了！');

  } catch (error) {
    console.error('❌ セットアップ失敗:', error);
  } finally {
    if (client) await client.close();
  }
}

// 本番環境用インデックス作成
async function createProductionIndexes(db) {
  try {
    // Users - 基本インデックス
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: -1 });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ emailVerified: 1 });

    // Threads - パフォーマンス重視
    await db.collection('threads').createIndex({ category: 1, createdAt: -1 });
    await db.collection('threads').createIndex({ authorId: 1 });
    await db.collection('threads').createIndex({ updatedAt: -1 });
    await db.collection('threads').createIndex({ isPinned: 1, createdAt: -1 });
    await db.collection('threads').createIndex({ isArchived: 1 });

    // Posts - 高頻度クエリ用
    await db.collection('posts').createIndex({ threadId: 1, createdAt: -1 });
    await db.collection('posts').createIndex({ authorId: 1 });
    await db.collection('posts').createIndex({ createdAt: -1 });

    // Text search indexes
    await db.collection('threads').createIndex(
      { title: 'text', description: 'text' },
      { weights: { title: 10, description: 1 }, name: 'thread_text_search' }
    );
    
    await db.collection('posts').createIndex(
      { content: 'text' },
      { name: 'post_content_search' }
    );

    // NextAuth関連（必須）
    await db.collection('sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
    await db.collection('sessions').createIndex({ sessionToken: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ userId: 1 });
    
    await db.collection('accounts').createIndex({ userId: 1 });
    await db.collection('accounts').createIndex({ provider: 1, providerAccountId: 1 }, { unique: true });
    
    await db.collection('verification_tokens').createIndex({ identifier: 1, token: 1 }, { unique: true });
    await db.collection('verification_tokens').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });

    // 監査ログ - TTL付き
    await db.collection('audit_logs').createIndex({ timestamp: -1 });
    await db.collection('audit_logs').createIndex({ action: 1, timestamp: -1 });
    await db.collection('audit_logs').createIndex({ userId: 1, timestamp: -1 });
    await db.collection('audit_logs').createIndex(
      { timestamp: 1 }, 
      { expireAfterSeconds: 7776000, name: 'audit_logs_ttl' } // 90日保持
    );

    console.log('✅ 本番環境インデックス作成完了');

  } catch (error) {
    console.error('⚠️  インデックス作成エラー:', error.message);
  }
}

// 初期データ投入
async function insertInitialData(db) {
  try {
    // カテゴリマスタ
    const categories = [
      { _id: 'general', name: '一般', description: '一般的な話題', order: 1, isActive: true },
      { _id: 'politics', name: '政治', description: '政治関連の議論', order: 2, isActive: true },
      { _id: 'economy', name: '経済', description: '経済・ビジネス関連', order: 3, isActive: true },
      { _id: 'technology', name: 'テクノロジー', description: '技術・IT関連', order: 4, isActive: true },
      { _id: 'sports', name: 'スポーツ', description: 'スポーツ全般', order: 5, isActive: true },
      { _id: 'entertainment', name: 'エンターテイメント', description: '映画・音楽・ゲーム等', order: 6, isActive: true },
      { _id: 'hobby', name: '趣味', description: '趣味・レジャー', order: 7, isActive: true },
      { _id: 'question', name: '質問', description: '質問・相談', order: 8, isActive: true },
      { _id: 'other', name: 'その他', description: 'その他の話題', order: 99, isActive: true }
    ];

    await db.collection('categories').insertMany(categories);
    console.log('✅ カテゴリマスタ投入完了');

    // システム設定
    const systemConfig = {
      _id: 'site_settings',
      siteName: 'Member Board',
      siteDescription: '会員制掲示板システム',
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
    };

    await db.collection('system_config').insertOne(systemConfig);
    console.log('✅ システム設定投入完了');

    // インデックス作成
    await db.collection('categories').createIndex({ order: 1 });
    await db.collection('categories').createIndex({ isActive: 1, order: 1 });

  } catch (error) {
    console.error('⚠️  初期データ投入エラー:', error.message);
  }
}

// セットアップ確認
async function verifySetup(db) {
  try {
    // コレクション確認
    const collections = await db.listCollections().toArray();
    console.log(`📂 作成されたコレクション数: ${collections.length}`);
    
    // データ確認
    const categoriesCount = await db.collection('categories').countDocuments();
    const systemConfigCount = await db.collection('system_config').countDocuments();
    
    console.log(`✅ カテゴリ: ${categoriesCount}件`);
    console.log(`✅ システム設定: ${systemConfigCount}件`);

    // インデックス確認（サンプル）
    const usersIndexes = await db.collection('users').indexes();
    console.log(`🔍 usersインデックス数: ${usersIndexes.length}`);

  } catch (error) {
    console.error('⚠️  セットアップ確認エラー:', error.message);
  }
}

// 実行
if (require.main === module) {
  setupProductionDatabase()
    .then(() => {
      console.log('\n🔄 次のステップ:');
      console.log('1. Vercel環境変数を本番用に更新');
      console.log('2. 本番デプロイ実行');
      console.log('3. 本番環境動作確認');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 セットアップ失敗:', error);
      process.exit(1);
    });
}

module.exports = { setupProductionDatabase };