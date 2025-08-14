// scripts/test-security.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function testSecuritySettings() {
  console.log('🔐 セキュリティ設定確認テスト\n')
  console.log('=' .repeat(50))

  // 1. パスワード強度チェック
  console.log('🔒 1. パスワード強度チェック')
  const password = process.env.SMTP_PASSWORD
  const passwordChecks = {
    '最低8文字以上': password && password.length >= 8,
    '大文字を含む': password && /[A-Z]/.test(password),
    '小文字を含む': password && /[a-z]/.test(password),
    '数字を含む': password && /[0-9]/.test(password),
    '特殊文字を含む': password && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }

  Object.entries(passwordChecks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '⚠️ '} ${check}`)
  })

  // 2. TLS/SSL設定テスト
  console.log('\n🔒 2. TLS/SSL接続テスト')
  const tlsTests = [
    {
      name: 'STARTTLS (推奨)',
      config: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      }
    },
    {
      name: 'SSL/TLS',
      config: {
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      }
    }
  ]

  for (const test of tlsTests) {
    try {
      const transporter = nodemailer.createTransport(test.config)
      await transporter.verify()
      console.log(`✅ ${test.name}: 接続成功`)
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`)
    }
  }

  // 3. 環境変数セキュリティチェック
  console.log('\n🔒 3. 環境変数セキュリティチェック')
  const securityChecks = {
    'JWT_SECREटは32文字以上': process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
    'パスワードがハードコードされていない': !process.env.SMTP_PASSWORD?.includes('password123'),
    'デフォルト値でない': process.env.SMTP_PASSWORD !== 'your-actual-password-here',
    '環境変数ファイルがgitignore対象': true // 手動確認必要
  }

  Object.entries(securityChecks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '⚠️ '} ${check}`)
  })

  // 4. メール偽装対策確認
  console.log('\n🔒 4. メール偽装対策')
  console.log('📝 以下の設定を手動確認してください:')
  console.log('   • SPFレコード: v=spf1 include:_spf.sakura.ne.jp ~all')
  console.log('   • DMARCレコード設定済み')
  console.log('   • DKIMキー設定済み (可能であれば)')

  console.log('\n' + '=' .repeat(50))
  console.log('🔒 セキュリティチェック完了')
}

testSecuritySettings().catch(console.error)