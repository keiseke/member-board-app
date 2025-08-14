// scripts/test-sakura-auth-patterns.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function testSakuraAuthPatterns() {
  console.log('🔐 さくらインターネット認証パターンテスト\n')
  console.log('=' .repeat(60))

  // さくらインターネットで使用される可能性のある認証パターン
  const authPatterns = [
    {
      name: 'フルメールアドレス',
      user: 'noreply@mkpapa.com'
    },
    {
      name: 'ローカル部のみ',
      user: 'noreply'
    },
    {
      name: 'ドメイン付き（サブドメインなし）',
      user: 'noreply@mkpapa.com'
    },
    {
      name: 'アカウント名（もしある場合）',
      user: 'mkpapa'
    }
  ]

  const portConfigs = [
    { port: 587, secure: false, name: 'STARTTLS' },
    { port: 465, secure: true, name: 'SSL/TLS' }
  ]

  console.log('🔑 テストするパスワード:', process.env.SMTP_PASSWORD.substring(0, 3) + '***')
  
  for (const authPattern of authPatterns) {
    console.log(`\n👤 認証パターン: ${authPattern.name} (${authPattern.user})`)
    console.log('-'.repeat(50))
    
    for (const portConfig of portConfigs) {
      const config = {
        host: 'mkpapa.sakura.ne.jp',
        port: portConfig.port,
        secure: portConfig.secure,
        auth: {
          user: authPattern.user,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        socketTimeout: 15000
      }

      try {
        console.log(`  🧪 ${portConfig.name} (${portConfig.port}) テスト中...`)
        const transporter = nodemailer.createTransport(config)
        await transporter.verify()
        
        console.log(`  ✅ 成功! ${authPattern.name} + ${portConfig.name}`)
        console.log('\n🎯 成功した設定:')
        console.log(`    SMTP_HOST=mkpapa.sakura.ne.jp`)
        console.log(`    SMTP_PORT=${portConfig.port}`)
        console.log(`    SMTP_SECURE=${portConfig.secure}`)
        console.log(`    SMTP_USER=${authPattern.user}`)
        console.log(`    認証方式=${portConfig.name}`)
        
        return { success: true, config: config }
        
      } catch (error) {
        if (error.message.includes('authentication failed')) {
          console.log(`  ❌ ${portConfig.name}: 認証失敗`)
        } else if (error.message.includes('ENOTFOUND')) {
          console.log(`  ❌ ${portConfig.name}: ホスト不明`)
        } else if (error.message.includes('timeout')) {
          console.log(`  ❌ ${portConfig.name}: 接続タイムアウト`)
        } else {
          console.log(`  ❌ ${portConfig.name}: ${error.message}`)
        }
      }
    }
  }

  console.log('\n❌ 全ての認証パターンで失敗しました')
  
  // 追加の診断情報
  console.log('\n🔍 診断情報:')
  console.log('1. メールアドレスがコントロールパネルで有効か確認')
  console.log('2. パスワードが正確か確認（特殊文字に注意）')
  console.log('3. SMTP-AUTH が有効になっているか確認')
  console.log('4. IP制限やセキュリティ設定を確認')
  console.log('5. メールソフト用パスワードが別途必要な場合があります')
  
  return { success: false }
}

testSakuraAuthPatterns()
  .then((result) => {
    if (!result.success) {
      console.log('\n📞 次のステップ:')
      console.log('• さくらインターネットサポートに連絡')
      console.log('• メールソフト設定例を確認')
      console.log('• Webメールでのログインテスト')
    }
  })
  .catch(console.error)