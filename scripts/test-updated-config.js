// scripts/test-updated-config.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function testUpdatedConfig() {
  console.log('🔄 更新設定テスト\n')
  console.log('=' .repeat(60))
  
  // 複数のホスト名パターンをテスト
  const hostPatterns = [
    'www3110.sakura.ne.jp', // 更新された設定
    'mkpapa.sakura.ne.jp',  // 元の設定
    'mkpapa.com'            // カスタムドメイン
  ]
  
  console.log('🔍 環境変数確認:')
  console.log(`SMTP_USER: ${process.env.SMTP_USER}`)
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD?.substring(0, 3)}***`)
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`)
  
  for (const host of hostPatterns) {
    console.log(`\n🧪 ホストテスト: ${host}`)
    console.log('-'.repeat(50))
    
    const config = {
      host: host,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: false, // ログ簡略化
      connectionTimeout: 10000
    }
    
    try {
      const transporter = nodemailer.createTransport(config)
      console.log('  📡 接続テスト中...')
      await transporter.verify()
      
      console.log(`  ✅ ${host}: 接続・認証成功!`)
      
      // 成功した場合はテストメール送信
      console.log('  📧 テストメール送信中...')
      const result = await transporter.sendMail({
        from: {
          name: '掲示板システム',
          address: process.env.SMTP_USER
        },
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: '🎉【成功】SMTP設定完了通知',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
              <h1>🎉 SMTP設定成功!</h1>
            </div>
            <div style="padding: 30px; background: #f0fdf4;">
              <h2>動作確認完了</h2>
              <p><strong>成功した設定:</strong></p>
              <ul>
                <li>ホスト: ${host}</li>
                <li>ポート: 587</li>
                <li>ユーザー: ${process.env.SMTP_USER}</li>
                <li>暗号化: STARTTLS</li>
              </ul>
              <p><strong>送信日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
              <hr>
              <p>会員制掲示板のメール機能が正常に動作します！</p>
            </div>
          </div>
        `,
        text: `SMTP設定成功!\n\n成功した設定:\n- ホスト: ${host}\n- ポート: 587\n- ユーザー: ${process.env.SMTP_USER}\n- 暗号化: STARTTLS\n\n送信日時: ${new Date().toLocaleString('ja-JP')}\n\n会員制掲示板のメール機能が正常に動作します！`
      })
      
      console.log(`  ✅ テストメール送信成功: ${result.messageId}`)
      return { success: true, host: host, config: config }
      
    } catch (error) {
      if (error.message.includes('ETIMEDOUT')) {
        console.log(`  ❌ ${host}: 接続タイムアウト`)
      } else if (error.message.includes('authentication failed')) {
        console.log(`  ❌ ${host}: 認証失敗`)
      } else if (error.message.includes('ENOTFOUND')) {
        console.log(`  ❌ ${host}: ホストが見つかりません`)
      } else {
        console.log(`  ❌ ${host}: ${error.message}`)
      }
    }
  }
  
  console.log('\n❌ 全てのホストパターンで失敗しました')
  return { success: false }
}

testUpdatedConfig()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 メール機能が完全に動作しています!')
      console.log(`✅ 推奨ホスト: ${result.host}`)
      console.log('\n📝 最終的な.env.local設定を確認してください')
    } else {
      console.log('\n📞 さくらインターネットサポートへの問い合わせが必要です')
      console.log('問題: SMTP接続またはサーバー設定に関する問題')
    }
  })
  .catch(console.error)