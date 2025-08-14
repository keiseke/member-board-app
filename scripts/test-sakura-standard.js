// scripts/test-sakura-standard.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function testSakuraStandardSettings() {
  console.log('🌸 さくらインターネット標準設定テスト\n')
  console.log('=' .repeat(60))

  // さくらインターネットの標準設定パターン
  const standardConfigs = [
    {
      name: 'さくら標準 STARTTLS (587)',
      config: {
        host: 'mkpapa.sakura.ne.jp',
        port: 587,
        secure: false, // STARTTLS
        requireTLS: true,
        auth: {
          user: process.env.SMTP_USER, // フルメールアドレス
          pass: 'TEMP_PASSWORD' // 実際のパスワードに置き換え必要
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'さくら標準 SSL/TLS (465)',
      config: {
        host: 'mkpapa.sakura.ne.jp',
        port: 465,
        secure: true, // SSL/TLS
        auth: {
          user: process.env.SMTP_USER,
          pass: 'TEMP_PASSWORD'
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    }
  ]

  console.log('⚠️  重要: SMTP_PASSWORDを実際の値に更新してください')
  console.log('現在のSMTP_USER:', process.env.SMTP_USER)
  console.log('現在のSMTP_PASSWORD:', process.env.SMTP_PASSWORD)
  
  if (process.env.SMTP_PASSWORD === 'your-actual-password-here') {
    console.log('\n❌ パスワードがまだプレースホルダーです')
    console.log('📝 .env.localのSMTP_PASSWORDを実際の値に更新してください')
    return
  }

  for (const { name, config } of standardConfigs) {
    console.log(`\n🧪 ${name} テスト中...`)
    
    // 実際のパスワードを使用
    const testConfig = {
      ...config,
      auth: {
        user: config.auth.user,
        pass: process.env.SMTP_PASSWORD
      }
    }
    
    try {
      const transporter = nodemailer.createTransport(testConfig)
      await transporter.verify()
      console.log(`✅ ${name}: 接続成功!`)
      
      console.log('\n🔧 成功した設定:')
      console.log(`  SMTP_HOST=${config.host}`)
      console.log(`  SMTP_PORT=${config.port}`)
      console.log(`  SMTP_SECURE=${config.secure}`)
      console.log(`  SMTP_USER=${config.auth.user}`)
      
      return true
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`)
      
      // 詳細なエラー分析
      if (error.message.includes('authentication failed')) {
        console.log('   💡 認証エラー → パスワードを確認してください')
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('   💡 ホスト名エラー → サーバー情報を確認してください')
      } else if (error.message.includes('timeout')) {
        console.log('   💡 接続タイムアウト → ポート設定を確認してください')
      }
    }
  }
  
  console.log('\n❌ 全ての標準設定で接続に失敗しました')
  return false
}

testSakuraStandardSettings()
  .then((success) => {
    if (success) {
      console.log('\n🎉 SMTP設定が確認できました!')
    } else {
      console.log('\n📞 さくらインターネットサポートに問い合わせることをお勧めします')
      console.log('   電話: 0120-775-664 (平日 10:00～18:00)')
      console.log('   https://help.sakura.ad.jp/')
    }
  })
  .catch(console.error)