const { MongoClient, ObjectId } = require('mongodb');

async function fixAvatarSchema() {
  const uri = 'mongodb+srv://borduser:msuKN3RE@cluster0.10p5ytd.mongodb.net/boardapp?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('MongoDBに接続しました');

    const db = client.db();
    const users = db.collection('users');

    // 特定のユーザーに直接avatarUrlを追加
    const targetUserId = '689ea45e4d3c2f52d8143b6b';
    const testData = 'data:image/jpeg;base64,TEST_DATA';

    console.log('ユーザーに直接avatarUrlを設定中...');
    const result = await users.updateOne(
      { _id: new ObjectId(targetUserId) },
      { $set: { avatarUrl: testData } }
    );

    console.log('更新結果:', result);

    // 確認
    const updatedUser = await users.findOne({ _id: new ObjectId(targetUserId) });
    console.log('更新後のユーザー:', {
      id: updatedUser._id,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl ? 'データあり' : 'データなし',
      avatarUrlLength: updatedUser.avatarUrl?.length
    });

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await client.close();
    console.log('MongoDBとの接続を閉じました');
  }
}

fixAvatarSchema();