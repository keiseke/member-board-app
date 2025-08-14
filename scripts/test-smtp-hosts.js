// scripts/test-smtp-hosts.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function testMultipleSMTPHosts() {
  console.log('🔍 複数SMTPホストテスト開始\n')
  console.log('=' .repeat(60))

  // テストするSMTPホストパターン
  const smtpHosts = [
    'mkpapa.com',
    'mail.mkpapa.com', 
    'mkpapa.sakura.ne.jp',
    'www.mkpapa.com',
    // さくらインターネット標準パターン追加
    'mail.sakura.ne.jp',
    'mail1.sakura.ne.jp',
    'mail2.sakura.ne.jp',
    'mail3.sakura.ne.jp',
    'mail4.sakura.ne.jp',
    'mail5.sakura.ne.jp'
  ]

  // ポート設定パターン
  const portConfigs = [
    { port: 587, secure: false, name: 'STARTTLS (587)' },
    { port: 465, secure: true, name: 'SSL/TLS (465)' },
    { port: 25, secure: false, name: 'Plain (25)' }
  ]

  let successfulConfigs = []

  for (const host of smtpHosts) {
    console.log(`\n🧪 テスト対象ホスト: ${host}`)
    console.log('-'.repeat(40))

    for (const portConfig of portConfigs) {
      const config = {
        host: host,
        port: portConfig.port,
        secure: portConfig.secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000, // 10秒タイムアウト
        socketTimeout: 10000
      }

      try {
        console.log(`  ${portConfig.name} テスト中...`)
        const transporter = nodemailer.createTransport(config)
        await transporter.verify()
        console.log(`  ✅ ${portConfig.name}: 接続成功`)
        
        successfulConfigs.push({
          host: host,
          port: portConfig.port,
          secure: portConfig.secure,
          description: `${host}:${portConfig.port} (${portConfig.name})`
        })
      } catch (error) {
        console.log(`  ❌ ${portConfig.name}: ${error.message}`)
      }
    }
  }

  // 結果サマリー
  console.log('\n' + '='.repeat(60))
  console.log('📊 テスト結果サマリー')
  console.log('='.repeat(60))
  
  if (successfulConfigs.length > 0) {
    console.log('✅ 成功した設定:')
    successfulConfigs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.description}`)
    })
    
    console.log('\n🔧 推奨.env.local設定:')
    const recommendedConfig = successfulConfigs[0]
    console.log(`SMTP_HOST=${recommendedConfig.host}`)
    console.log(`SMTP_PORT=${recommendedConfig.port}`)
    console.log(`SMTP_SECURE=${recommendedConfig.secure}`)
  } else {
    console.log('❌ 成功した設定がありませんでした')
    console.log('\n🔍 確認事項:')
    console.log('1. メールアドレスのパスワードが正しいか')
    console.log('2. さくらのコントロールパネルでSMTP設定を確認')
    console.log('3. SMTP-AUTHが有効になっているか')
    console.log('4. IP制限やファイアウォール設定')
  }
}

// テスト実行
testMultipleSMTPHosts()
  .then(() => console.log('\n🎉 SMTPホストテスト完了'))
  .catch(error => console.error('💥 テストエラー:', error))