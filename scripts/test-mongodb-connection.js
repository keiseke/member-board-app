// MongoDB Atlas 接続テストスクリプト
// 本番環境セットアップ後の接続確認用

const { MongoClient } = require('mongodb');

async function testMongoDBConnection() {
  // 本番環境の接続文字列（実際の値に置き換えてください）
  const MONGODB_URI = 'mongodb+srv://member_board_prod:<password>@cluster.mongodb.net/member_board_prod';
  
  console.log('🗄️  MongoDB Atlas 接続テスト開始...\n');
  
  let client;
  
  try {
    // 接続テスト
    console.log('1. データベースに接続中...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ 接続成功\n');
    
    // データベース確認
    console.log('2. データベース確認...');
    const db = client.db('member_board_prod');
    const admin = client.db().admin();
    
    // Ping テスト
    await admin.ping();
    console.log('✅ Ping成功');
    
    // データベース情報取得
    const dbStats = await db.stats();
    console.log(`✅ データベース: ${dbStats.db}`);
    console.log(`   コレクション数: ${dbStats.collections}`);
    console.log(`   データサイズ: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    // コレクション一覧
    const collections = await db.listCollections().toArray();
    console.log(`   コレクション: [${collections.map(c => c.name).join(', ')}]\n`);
    
    // インデックス確認
    console.log('3. インデックス確認...');
    for (const collection of collections) {
      const indexes = await db.collection(collection.name).indexes();
      console.log(`   ${collection.name}: ${indexes.length}個のインデックス`);
    }
    console.log('✅ インデックス確認完了\n');
    
    // パフォーマンステスト
    console.log('4. パフォーマンステスト...');
    const startTime = Date.now();
    
    // 軽いクエリテスト
    await db.collection('users').findOne();
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ クエリ応答時間: ${responseTime}ms`);
    
    if (responseTime > 1000) {
      console.warn('⚠️  応答時間が1秒を超えています。ネットワークまたはインデックスを確認してください。');
    }
    
    // 書き込みテスト
    const testDoc = {
      _id: 'connection_test',
      message: 'Connection test successful',
      timestamp: new Date()
    };
    
    await db.collection('_connection_test').insertOne(testDoc);
    await db.collection('_connection_test').deleteOne({ _id: 'connection_test' });
    console.log('✅ 読み書きテスト成功\n');
    
    console.log('🎉 MongoDB Atlas接続テスト完了 - すべて正常です！');
    
  } catch (error) {
    console.error('❌ 接続テストエラー:', error.message);
    
    // エラー種別による対処法提示
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 対処法:');
      console.log('   - ユーザー名・パスワードを確認してください');
      console.log('   - データベースユーザーの権限を確認してください');
    } else if (error.message.includes('connection')) {
      console.log('\n💡 対処法:');
      console.log('   - ネットワークアクセス設定を確認してください');
      console.log('   - IPアドレスがホワイトリストに登録されているか確認してください');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 対処法:');
      console.log('   - ネットワーク接続を確認してください');
      console.log('   - MongoDB Atlasクラスタが起動しているか確認してください');
    }
    
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 データベース接続を閉じました');
    }
  }
}

// パフォーマンス監視用の詳細テスト
async function performanceTest() {
  console.log('\n📊 パフォーマンステスト詳細...');
  
  const tests = [
    { name: '単純検索', iterations: 10 },
    { name: 'インデックス検索', iterations: 100 },
    { name: '複合クエリ', iterations: 50 }
  ];
  
  for (const test of tests) {
    const times = [];
    
    for (let i = 0; i < test.iterations; i++) {
      const start = Date.now();
      // ここでテストクエリを実行
      // await db.collection('test').findOne({ /* query */ });
      const end = Date.now();
      times.push(end - start);
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
    
    console.log(`   ${test.name}: 平均 ${avg.toFixed(2)}ms, P95 ${p95}ms`);
  }
}

// 実行
if (require.main === module) {
  testMongoDBConnection()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('テスト実行エラー:', error);
      process.exit(1);
    });
}

module.exports = { testMongoDBConnection };