// scripts/check-user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// ユーザーモデルの定義
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String, select: false },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });
const User = mongoose.model('User', UserSchema);

async function checkUser() {
  try {
    console.log('データベースに接続中...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('データベースに接続しました');

    const email = 'admin@mkpapa.com';
    console.log(`\nユーザー情報を確認中: ${email}`);

    // ユーザーを検索（パスワードも取得）
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ ユーザーが見つかりません');
      console.log('\n解決策:');
      console.log('1. ユーザー登録を行ってください');
      console.log('2. または、正しいメールアドレスを確認してください');
    } else {
      console.log('✅ ユーザーが見つかりました');
      console.log('ユーザー情報:');
      console.log(`  - 名前: ${user.name}`);
      console.log(`  - メール: ${user.email}`);
      console.log(`  - メール認証済み: ${user.emailVerified ? '✅ 済み' : '❌ 未完了'}`);
      console.log(`  - 作成日: ${user.createdAt}`);
      console.log(`  - パスワード設定: ${user.password ? '✅ あり' : '❌ なし'}`);

      // パスワードの検証
      if (user.password) {
        const testPassword = 'test1234';
        const passwordsMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`  - パスワード "${testPassword}" の一致: ${passwordsMatch ? '✅ 一致' : '❌ 不一致'}`);
      }

      if (!user.emailVerified) {
        console.log('\n❌ メール認証が完了していません');
        console.log('解決策:');
        console.log('1. メール認証を完了させる');
        console.log('2. または、管理者がemailVerifiedをtrueに設定する');
      }
    }

  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nデータベース接続を閉じました');
  }
}

checkUser();