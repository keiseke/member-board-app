// scripts/test-sakura-smtp-detailed.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function testSakuraDetailedSMTP() {
  console.log('🔬 さくらインターネット詳細SMTPテスト\n')
  console.log('=' .repeat(60))

  // Webメールログイン成功確認済みのパラメータ
  console.log('✅ Webメールログイン: 成功確認済み')
  console.log('🔑 ユーザー:', process.env.SMTP_USER)
  console.log('🏠 ホスト: mkpapa.sakura.ne.jp')
  console.log('')

  // さくらインターネット特有の設定パターンをテスト
  const testConfigs = [
    {
      name: 'さくら推奨 STARTTLS + AUTH LOGIN',
      config: {
        host: 'mkpapa.sakura.ne.jp',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        authMethod: 'LOGIN',
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        debug: true, // 詳細ログ有効
        logger: true
      }
    },
    {
      name: 'さくら SSL/TLS + AUTH PLAIN',
      config: {
        host: 'mkpapa.sakura.ne.jp',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        authMethod: 'PLAIN',
        tls: {
          rejectUnauthorized: false
        },
        debug: true,
        logger: true
      }
    },
    {
      name: 'さくら STARTTLS（TLS無効）',
      config: {
        host: 'mkpapa.sakura.ne.jp',
        port: 587,
        secure: false,
        ignoreTLS: true, // TLS無効
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'さくら ポート25（平文）',
      config: {
        host: 'mkpapa.sakura.ne.jp',
        port: 25,
        secure: false,
        ignoreTLS: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      }
    }
  ]

  for (const { name, config } of testConfigs) {
    console.log(`\n🧪 ${name} テスト中...`)
    console.log(`   設定: ${config.host}:${config.port} (secure: ${config.secure})`)
    
    try {
      const transporter = nodemailer.createTransport(config)
      
      // 接続テスト
      console.log('   🔌 接続テスト中...')
      await transporter.verify()
      
      console.log(`   ✅ ${name}: 接続成功!`)
      
      // 成功した設定を保存
      console.log('\n🎯 成功した設定詳細:')
      console.log(`SMTP_HOST=mkpapa.sakura.ne.jp`)
      console.log(`SMTP_PORT=${config.port}`)
      console.log(`SMTP_SECURE=${config.secure}`)
      console.log(`SMTP_USER=${config.auth.user}`)
      if (config.requireTLS) console.log(`REQUIRE_TLS=true`)
      if (config.ignoreTLS) console.log(`IGNORE_TLS=true`)
      if (config.authMethod) console.log(`AUTH_METHOD=${config.authMethod}`)
      
      // 簡単なテストメール送信
      console.log('\n📧 テストメール送信中...')
      const testResult = await transporter.sendMail({
        from: {
          name: 'SMTP接続テスト',
          address: process.env.EMAIL_FROM
        },
        to: process.env.EMAIL_ADMIN,
        subject: '【成功】SMTP接続テスト',
        text: `SMTP設定テストが成功しました！\n\n設定: ${name}\nホスト: ${config.host}\nポート: ${config.port}\n送信日時: ${new Date().toLocaleString('ja-JP')}`
      })
      
      console.log(`   ✅ テストメール送信成功! ID: ${testResult.messageId}`)
      console.log(`   📬 ${process.env.EMAIL_ADMIN} を確認してください`)
      
      return { success: true, config: config, name: name }
      
    } catch (error) {
      console.log(`   ❌ ${name}: ${error.message}`)
      
      // 詳細エラー分析
      if (error.message.includes('authentication failed')) {
        console.log('     💡 認証エラー → SMTP-AUTHが無効の可能性')
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('     💡 ホストエラー → サーバー名確認')
      } else if (error.message.includes('timeout')) {
        console.log('     💡 タイムアウト → ファイアウォール/ポート制限')
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('     💡 接続拒否 → SMTP機能が無効の可能性')
      }
    }
  }
  
  console.log('\n❌ 全ての設定パターンで失敗')
  return { success: false }
}

testSakuraDetailedSMTP()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 SMTP設定が確定しました!')
      console.log(`推奨設定: ${result.name}`)
    } else {
      console.log('\n🔍 次のステップ:')
      console.log('1. さくらのコントロールパネルでSMTP機能を有効化')
      console.log('2. メール送信制限・IP制限を確認')
      console.log('3. サポートにSMTP-AUTH設定を問い合わせ')
      console.log('   📞 0120-775-664 (平日 10:00～18:00)')
    }
  })
  .catch(console.error)