// 既存MongoDB Atlasクラスター確認スクリプト
// クラスター「k's Org - 2025-07-30」の本番対応確認

const { MongoClient } = require('mongodb');

async function checkExistingCluster() {
  console.log('🔍 既存MongoDB Atlasクラスター確認...\n');
  console.log('クラスター名: k\'s Org - 2025-07-30\n');
  
  // 接続文字列（実際の値に置き換えてください）
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/';
  
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  環境変数 MONGODB_URI が設定されていません。');
    console.log('   既存クラスターの接続文字列を確認してください。\n');
    return;
  }
  
  let client;
  
  try {
    // 1. 基本接続確認
    console.log('1. 接続確認...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ 既存クラスターに接続成功\n');
    
    // 2. クラスター情報取得
    console.log('2. クラスター情報確認...');
    const admin = client.db().admin();
    const serverStatus = await admin.command({ serverStatus: 1 });
    const buildInfo = await admin.command({ buildInfo: 1 });
    
    console.log(`✅ MongoDB バージョン: ${buildInfo.version}`);
    console.log(`✅ ホスト: ${serverStatus.host}`);
    console.log(`✅ アップタイム: ${Math.floor(serverStatus.uptime / 3600)}時間`);
    
    // 3. 既存データベース確認
    console.log('\n3. 既存データベース確認...');
    const databases = await admin.listDatabases();
    
    console.log('📁 既存データベース:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // 4. 本番データベース存在確認
    const prodDbExists = databases.databases.some(db => db.name === 'member_board_prod');
    console.log(`\n📊 本番データベース (member_board_prod): ${prodDbExists ? '存在' : '未作成'}`);
    
    // 5. 現在のメンバーボードDBがある場合の確認
    const devDbExists = databases.databases.some(db => db.name === 'member_board' || db.name.includes('member'));
    if (devDbExists) {
      console.log('📋 開発用データベースが存在します。データ移行を検討してください。');
    }
    
    // 6. 本番データベースの詳細確認
    if (prodDbExists) {
      await checkProductionDatabase(client);
    } else {
      console.log('\n🔨 本番データベースセットアップが必要です。');
      console.log('   mongodb-production-setup.js を実行してください。');
    }
    
    // 7. クラスター性能確認
    await checkClusterPerformance(client);
    
  } catch (error) {
    console.error('❌ クラスター確認エラー:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 認証エラーの対処法:');
      console.log('   1. Database Access でユーザー権限を確認');
      console.log('   2. 本番用ユーザーが作成されているか確認');
      console.log('   3. パスワードが正しいか確認');
    }
    
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function checkProductionDatabase(client) {
  console.log('\n4. 本番データベース詳細確認...');
  
  const db = client.db('member_board_prod');
  
  try {
    // コレクション確認
    const collections = await db.listCollections().toArray();
    console.log(`✅ コレクション数: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('📂 既存コレクション:');
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`   - ${collection.name}: ${count}件`);
      }
      
      // インデックス確認
      console.log('\n📈 インデックス確認:');
      for (const collection of collections) {
        const indexes = await db.collection(collection.name).indexes();
        console.log(`   - ${collection.name}: ${indexes.length}個のインデックス`);
      }
    }
    
  } catch (error) {
    console.log('⚠️  本番データベース確認中にエラー:', error.message);
  }
}

async function checkClusterPerformance(client) {
  console.log('\n5. クラスター性能確認...');
  
  const startTime = Date.now();
  
  try {
    // 簡単な性能テスト
    await client.db().admin().ping();
    const pingTime = Date.now() - startTime;
    
    console.log(`✅ Ping応答時間: ${pingTime}ms`);
    
    if (pingTime > 500) {
      console.log('⚠️  応答時間が遅いです。リージョンまたはネットワークを確認してください。');
    } else if (pingTime > 200) {
      console.log('💡 応答時間は許容範囲ですが、最適化の余地があります。');
    } else {
      console.log('✨ 優秀な応答時間です！');
    }
    
  } catch (error) {
    console.log('❌ 性能テストエラー:', error.message);
  }
}

// 本番環境推奨設定の確認
function checkProductionRecommendations() {
  console.log('\n📋 本番環境推奨設定チェック:');
  
  const checks = [
    {
      item: 'クラスターTier',
      current: 'M0/M2/M5 (要確認)',
      recommended: 'M10以上',
      status: '要確認'
    },
    {
      item: 'バックアップ',
      current: '要確認', 
      recommended: 'Continuous Backup有効',
      status: '要確認'
    },
    {
      item: 'レプリケーション',
      current: '要確認',
      recommended: '3ノード以上',
      status: '要確認'
    },
    {
      item: 'ネットワーク制限',
      current: '要確認',
      recommended: 'IP制限またはPrivate Endpoint',
      status: '要確認'
    }
  ];
  
  checks.forEach(check => {
    console.log(`   ${check.item}: ${check.current} → ${check.recommended} (${check.status})`);
  });
  
  console.log('\n💡 MongoDB Atlas コンソールで以下を確認してください:');
  console.log('   1. Clusters → クラスター詳細 → Configuration');
  console.log('   2. Backup → バックアップ設定');
  console.log('   3. Network Access → IP Whitelist');
  console.log('   4. Database Access → ユーザー権限');
}

// 実行
if (require.main === module) {
  checkExistingCluster()
    .then(() => {
      checkProductionRecommendations();
      console.log('\n🎯 次のステップ:');
      console.log('   1. 上記の推奨設定を確認・調整');
      console.log('   2. 本番データベースが未作成の場合はセットアップ実行');
      console.log('   3. 環境変数の設定に進む');
    })
    .catch(console.error);
}

module.exports = { checkExistingCluster };