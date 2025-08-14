// scripts/test-direct-auth.js
const nodemailer = require('nodemailer')

console.log('🔍 直接パスワードテスト\n')

// 環境変数を使わず直接パスワードを指定
const directConfig = {
  host: 'mkpapa.sakura.ne.jp',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@mkpapa.com',
    pass: 'Q&#ezF(L6299' // 直接指定
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
}

async function testDirectAuth() {
  console.log('🧪 直接パスワード認証テスト')
  console.log('-'.repeat(40))
  console.log(`ユーザー: ${directConfig.auth.user}`)
  console.log(`パスワード: ${directConfig.auth.pass.substring(0, 3)}***`)
  
  try {
    const transporter = nodemailer.createTransport(directConfig)
    await transporter.verify()
    
    console.log('✅ 直接パスワード認証: 成功!')
    
    // テストメール送信
    const result = await transporter.sendMail({
      from: 'noreply@mkpapa.com',
      to: 'admin@mkpapa.com', // 直接指定
      subject: '【成功】SMTP認証テスト完了',
      html: `
        <h2>🎉 SMTP認証成功!</h2>
        <p>メール送信機能が正常に動作しています。</p>
        <p>送信日時: ${new Date().toLocaleString('ja-JP')}</p>
      `,
      text: `SMTP認証成功!\n\nメール送信機能が正常に動作しています。\n送信日時: ${new Date().toLocaleString('ja-JP')}`
    })
    
    console.log(`✅ テストメール送信成功: ${result.messageId}`)
    return true
    
  } catch (error) {
    console.error('❌ 認証失敗:', error.message)
    return false
  }
}

testDirectAuth()
  .then((success) => {
    if (success) {
      console.log('\n🎉 問題解決! 環境変数の問題でした')
      console.log('💡 .env.local の設定を見直してください')
    } else {
      console.log('\n❌ パスワード自体に問題があります')
      console.log('📞 さくらサポートに問い合わせが必要です')
    }
  })
  .catch(console.error)