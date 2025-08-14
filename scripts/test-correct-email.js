// scripts/test-correct-email.js
const nodemailer = require('nodemailer')

async function testCorrectEmail() {
  console.log('🎯 正しいメールアドレスでテスト\n')
  console.log('=' .repeat(60))

  // 実際に存在するメールアドレスを使用
  const correctConfig = {
    host: 'mkpapa.sakura.ne.jp',
    port: 587,
    secure: false,
    auth: {
      user: 'noreply@mkpapa.com', // 実在するアドレス
      pass: 'Q&#ezF(L6299'
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true,
    logger: true
  }

  console.log('🧪 正しいメールアドレス認証テスト')
  console.log('-'.repeat(50))
  console.log(`ユーザー: ${correctConfig.auth.user}`)
  console.log(`パスワード: ${correctConfig.auth.pass.substring(0, 3)}***`)
  
  try {
    const transporter = nodemailer.createTransport(correctConfig)
    
    console.log('\n📡 SMTP接続テスト中...')
    await transporter.verify()
    
    console.log('✅ SMTP認証成功!')
    
    // テストメール送信
    console.log('\n📧 テストメール送信中...')
    const result = await transporter.sendMail({
      from: {
        name: '掲示板システム',
        address: 'noreply@mkpapa.com'
      },
      to: 'admin@mkpapa.com', // 管理者も同じドメインを想定
      subject: '🎉【成功】メール送信機能テスト完了',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #22c55e; color: white; padding: 20px; text-align: center;">
            <h1>🎉 メール送信機能が動作しました！</h1>
          </div>
          <div style="padding: 30px; background: #f0fdf4;">
            <h2>接続成功</h2>
            <p><strong>動作確認済み機能:</strong></p>
            <ul>
              <li>✅ SMTP接続確立</li>
              <li>✅ STARTTLS暗号化</li>
              <li>✅ SMTP認証</li>
              <li>✅ メール送信</li>
            </ul>
            
            <h3>📧 正しい設定情報</h3>
            <ul>
              <li>SMTP_HOST: mkpapa.sakura.ne.jp</li>
              <li>SMTP_PORT: 587</li>
              <li>SMTP_USER: noreply@mkpapa.com</li>
              <li>暗号化: STARTTLS</li>
            </ul>
            
            <p><strong>送信日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
            <hr>
            <p>これで会員制掲示板のメール機能が使用可能になりました！</p>
          </div>
        </div>
      `,
      text: `
メール送信機能が動作しました！

動作確認済み機能:
✅ SMTP接続確立
✅ STARTTLS暗号化  
✅ SMTP認証
✅ メール送信

正しい設定情報:
- SMTP_HOST: mkpapa.sakura.ne.jp
- SMTP_PORT: 587
- SMTP_USER: noreply@mkpapa.com
- 暗号化: STARTTLS

送信日時: ${new Date().toLocaleString('ja-JP')}

これで会員制掲示板のメール機能が使用可能になりました！
      `.trim()
    })
    
    console.log(`✅ テストメール送信成功!`)
    console.log(`📧 メッセージID: ${result.messageId}`)
    console.log(`📬 受信メールを確認してください`)
    
    return { success: true, messageId: result.messageId, config: correctConfig }
    
  } catch (error) {
    console.error('❌ テスト失敗:', error.message)
    return { success: false, error: error.message }
  }
}

testCorrectEmail()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 問題完全解決!')
      console.log('\n📝 .env.local更新推奨設定:')
      console.log('SMTP_HOST=mkpapa.sakura.ne.jp')
      console.log('SMTP_USER=noreply@mkpapa.com')
      console.log('EMAIL_FROM=noreply@mkpapa.com')
      console.log('EMAIL_ADMIN=admin@mkpapa.com')
      console.log('EMAIL_SUPPORT=support@mkpapa.sakura.ne.jp')
      
    } else {
      console.log('\n❌ まだ問題があります')
      console.log('コントロールパネルでメールアドレス設定を再確認してください')
    }
  })
  .catch(console.error)