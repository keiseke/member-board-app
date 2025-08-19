// scripts/create-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

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

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('データベースに接続しました');

    const email = 'admin@mkpapa.com';
    const password = 'test1234';
    const name = 'Admin User';

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ このメールアドレスのユーザーは既に存在します');
      return;
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // ユーザーを作成
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerified: true // 管理者は最初から認証済みに設定
    });

    console.log('✅ 管理者ユーザーを作成しました');
    console.log(`  - 名前: ${user.name}`);
    console.log(`  - メール: ${user.email}`);
    console.log(`  - パスワード: ${password}`);
    console.log(`  - メール認証: 完了`);

  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nデータベース接続を閉じました');
  }
}

createAdmin();