// データマイグレーションスクリプト
// my-board-app1 → member_board_dev へのデータコピー

const { MongoClient } = require('mongodb');

// 接続文字列設定
const SOURCE_URI = 'mongodb+srv://borduser:msuKN3RE@cluster0.10p5ytd.mongodb.net/boardapp?retryWrites=true&w=majority&appName=Cluster0';
const TARGET_URI = 'mongodb+srv://boarduser:kV3rWuwMnTrNaH9Y@cluster0.wb1gzlk.mongodb.net/member_board_dev?retryWrites=true&w=majority&appName=Cluster0';

async function migrateData() {
  let sourceClient, targetClient;

  try {
    console.log('🚀 データマイグレーション開始...\n');
    
    // 接続確立
    console.log('📡 データベースに接続中...');
    sourceClient = new MongoClient(SOURCE_URI);
    targetClient = new MongoClient(TARGET_URI);
    
    await sourceClient.connect();
    await targetClient.connect();
    
    console.log('✅ 接続成功\n');

    // データベース取得
    const sourceDb = sourceClient.db('boardapp');
    const targetDb = targetClient.db('member_board_dev');

    // 移行対象コレクション
    const collections = [
      'users',
      'threads', 
      'posts',
      'accounts',
      'sessions',
      'verification_tokens',
      'categories'
    ];

    console.log('📊 移行対象コレクション:', collections.join(', '), '\n');

    // 各コレクションを移行
    for (const collectionName of collections) {
      try {
        console.log(`📁 ${collectionName} の移行開始...`);
        
        // ソースデータ取得
        const sourceCollection = sourceDb.collection(collectionName);
        const documents = await sourceCollection.find({}).toArray();
        
        console.log(`   📄 取得件数: ${documents.length}件`);
        
        if (documents.length > 0) {
          // ターゲットに挿入
          const targetCollection = targetDb.collection(collectionName);
          
          // 既存データをクリア（オプション）
          await targetCollection.deleteMany({});
          
          // データ挿入
          await targetCollection.insertMany(documents);
          console.log(`   ✅ ${collectionName} 移行完了 (${documents.length}件)`);
        } else {
          console.log(`   ⚠️  ${collectionName} は空です`);
        }
        
      } catch (error) {
        console.error(`   ❌ ${collectionName} 移行エラー:`, error.message);
      }
    }

    // インデックスの再作成
    console.log('\n🔍 インデックス再作成中...');
    await createIndexes(targetDb);
    console.log('✅ インデックス再作成完了');

    // 移行結果確認
    console.log('\n📈 移行結果確認...');
    await verifyMigration(targetDb);

    console.log('\n🎉 データマイグレーション完了！');

  } catch (error) {
    console.error('❌ マイグレーション失敗:', error);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
  }
}

// インデックス作成関数
async function createIndexes(db) {
  try {
    // Users
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    // Threads
    await db.collection('threads').createIndex({ category: 1, createdAt: -1 });
    await db.collection('threads').createIndex({ authorId: 1 });
    await db.collection('threads').createIndex({ updatedAt: -1 });
    
    // Posts  
    await db.collection('posts').createIndex({ threadId: 1, createdAt: -1 });
    await db.collection('posts').createIndex({ authorId: 1 });
    
    // NextAuth
    await db.collection('sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
    await db.collection('sessions').createIndex({ sessionToken: 1 }, { unique: true });
    await db.collection('accounts').createIndex({ provider: 1, providerAccountId: 1 }, { unique: true });
    await db.collection('verification_tokens').createIndex({ identifier: 1, token: 1 }, { unique: true });
    await db.collection('verification_tokens').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
    
    console.log('✅ 必要なインデックスを作成しました');
    
  } catch (error) {
    console.error('⚠️  インデックス作成エラー:', error.message);
  }
}

// 移行結果確認関数
async function verifyMigration(db) {
  const collections = ['users', 'threads', 'posts', 'accounts', 'sessions'];
  
  for (const collectionName of collections) {
    try {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`   ${collectionName}: ${count}件`);
    } catch (error) {
      console.log(`   ${collectionName}: 確認エラー`);
    }
  }
}

// 実行
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('\n🔄 次のステップ:');
      console.log('1. 開発環境で動作確認');
      console.log('2. 本番環境のVercel環境変数更新');
      console.log('3. 本番デプロイ実行');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 マイグレーション失敗:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };