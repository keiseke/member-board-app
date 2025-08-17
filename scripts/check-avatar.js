const { MongoClient } = require('mongodb');

async function checkAvatar() {
  const uri = 'mongodb+srv://borduser:msuKN3RE@cluster0.10p5ytd.mongodb.net/boardapp?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('MongoDBに接続しました');

    const db = client.db();
    const users = db.collection('users');

    // 全ユーザーのavatarUrl情報を取得
    const allUsers = await users.find({}, { 
      projection: { 
        name: 1, 
        email: 1, 
        avatarUrl: 1 
      } 
    }).toArray();

    console.log('=== 全ユーザーのアバター情報 ===');
    allUsers.forEach((user, index) => {
      console.log(`\nユーザー ${index + 1}:`);
      console.log(`ID: ${user._id}`);
      console.log(`名前: ${user.name}`);
      console.log(`メール: ${user.email}`);
      console.log(`avatarUrlフィールド存在: ${user.hasOwnProperty('avatarUrl')}`);
      console.log(`avatarUrl値: ${user.avatarUrl || 'なし'}`);
      if (user.avatarUrl) {
        console.log(`avatarUrl長さ: ${user.avatarUrl.length}`);
        console.log(`Base64形式: ${user.avatarUrl.startsWith('data:')}`);
        console.log(`先頭50文字: ${user.avatarUrl.substring(0, 50)}`);
      }
    });

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await client.close();
    console.log('\nMongoDBとの接続を閉じました');
  }
}

checkAvatar();