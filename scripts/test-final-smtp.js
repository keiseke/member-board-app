// scripts/test-final-smtp.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function finalSMTPTest() {
  console.log('🎯 最終SMTP接続テスト\n')
  console.log('=' .repeat(60))

  // 最新の環境変数を確認
  console.log('🔍 最新環境変数:')
  console.log(`HOST: ${process.env.SMTP_HOST}`)
  console.log(`PORT: ${process.env.SMTP_PORT}`)
  console.log(`USER: ${process.env.SMTP_USER}`)
  console.log(`PASS: ${process.env.SMTP_PASSWORD?.substring(0, 3)}***`)
  console.log(`PASS Length: ${process.env.SMTP_PASSWORD?.length}`)
  
  // 直接設定でテスト
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true,
    logger: true
  }
  
  console.log('\n🧪 STARTTLS接続テスト (587)')
  console.log('-'.repeat(40))
  
  try {
    const transporter = nodemailer.createTransport(config)
    
    // 接続テスト
    console.log('📡 接続確認中...')
    await transporter.verify()
    
    console.log('✅ SMTP接続成功!')
    
    // テストメール送信
    console.log('\n📧 テストメール送信中...')
    const result = await transporter.sendMail({
      from: {
        name: '掲示板システム',
        address: process.env.EMAIL_FROM
      },
      to: process.env.EMAIL_ADMIN,
      subject: '【成功】SMTP接続テスト完了',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ec4899; color: white; padding: 20px; text-align: center;">
            <h1>🎉 SMTP接続成功！</h1>
          </div>
          <div style="padding: 30px; background: #fdf2f8;">
            <h2>メール送信機能が正常に動作しています</h2>
            <p><strong>接続情報:</strong></p>
            <ul>
              <li>ホスト: ${config.host}</li>
              <li>ポート: ${config.port}</li>
              <li>暗号化: STARTTLS</li>
              <li>認証: SMTP-AUTH</li>
            </ul>
            <p><strong>送信日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
            <hr>
            <p>これで会員制掲示板のメール機能が使用可能になりました！</p>
          </div>
        </div>
      `,
      text: `
SMTP接続成功！

メール送信機能が正常に動作しています。

接続情報:
- ホスト: ${config.host}
- ポート: ${config.port}
- 暗号化: STARTTLS
- 認証: SMTP-AUTH

送信日時: ${new Date().toLocaleString('ja-JP')}

これで会員制掲示板のメール機能が使用可能になりました！
      `.trim()
    })
    
    console.log(`✅ テストメール送信成功!`)
    console.log(`📧 メッセージID: ${result.messageId}`)
    console.log(`📬 ${process.env.EMAIL_ADMIN} を確認してください`)
    
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('❌ テスト失敗:', error.message)
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 認証エラーのトラブルシューティング:')
      console.log('1. パスワードの確認')
      console.log('2. Webメールでの再ログインテスト')
      console.log('3. メールアドレスの有効性確認')
    }
    
    return { success: false, error: error.message }
  }
}

finalSMTPTest()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 すべてのメール機能の準備完了!')
      console.log('✅ SMTP接続: 動作確認済み')
      console.log('✅ メール送信: 動作確認済み')  
      console.log('✅ 会員制掲示板: メール機能利用可能')
    } else {
      console.log('\n❌ まだ問題が残っています')
      console.log('📞 さくらインターネットサポートへの問い合わせを継続してください')
    }
  })
  .catch(console.error)