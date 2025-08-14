// scripts/test-email-templates.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

// 簡易版テンプレート関数
function createTestVerificationEmail(verificationUrl, userName) {
  return {
    subject: '【テスト】メールアドレス確認',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: #ec4899; color: white; padding: 20px; text-align: center;">
          <h1>🎉 メールアドレス確認テスト</h1>
        </div>
        <div style="padding: 30px; background: #fdf2f8;">
          <h2>テスト送信成功！</h2>
          ${userName ? `<p>${userName} 様</p>` : '<p>こんにちは！</p>'}
          <p>メール送信機能が正常に動作しています。</p>
          <p><strong>テスト用確認URL:</strong><br>
          <a href="${verificationUrl}" style="color: #ec4899;">${verificationUrl}</a></p>
          <hr>
          <p><strong>送信情報:</strong></p>
          <ul>
            <li>From: ${process.env.EMAIL_FROM}</li>
            <li>Admin: ${process.env.EMAIL_ADMIN}</li>
            <li>Support: ${process.env.EMAIL_SUPPORT}</li>
            <li>送信日時: ${new Date().toLocaleString('ja-JP')}</li>
          </ul>
        </div>
        <div style="padding: 20px; font-size: 12px; color: #666; text-align: center;">
          <p>お問い合わせ: <a href="mailto:${process.env.EMAIL_SUPPORT}">${process.env.EMAIL_SUPPORT}</a></p>
        </div>
      </div>
    `,
    text: `
メールアドレス確認テスト

${userName ? userName + ' 様' : 'こんにちは！'}

メール送信機能が正常に動作しています。

テスト用確認URL: ${verificationUrl}

お問い合わせ: ${process.env.EMAIL_SUPPORT}
    `.trim()
  }
}

function createTestSupportEmail() {
  return {
    subject: '【テスト】サポートメール送信確認',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1>📧 サポートメール機能テスト</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>サポートメール送信テスト成功！</h2>
          <p>support@mkpapa.com からのメール送信が正常に動作しています。</p>
          
          <h3>📋 確認済み機能:</h3>
          <ul>
            <li>✅ SMTP接続</li>
            <li>✅ メール送信</li>
            <li>✅ HTMLメール表示</li>
            <li>✅ 日本語エンコーディング</li>
            <li>✅ 複数メールアドレス設定</li>
          </ul>
          
          <h3>📧 設定済みメールアドレス:</h3>
          <ul>
            <li><strong>自動送信:</strong> ${process.env.EMAIL_FROM}</li>
            <li><strong>管理者:</strong> ${process.env.EMAIL_ADMIN}</li>
            <li><strong>サポート:</strong> ${process.env.EMAIL_SUPPORT}</li>
          </ul>
        </div>
      </div>
    `,
    text: `
サポートメール機能テスト

support@mkpapa.com からのメール送信が正常に動作しています。

設定済みメールアドレス:
- 自動送信: ${process.env.EMAIL_FROM}
- 管理者: ${process.env.EMAIL_ADMIN}  
- サポート: ${process.env.EMAIL_SUPPORT}
    `.trim()
  }
}

async function getWorkingTransporter() {
  const configs = [
    {
      name: 'STARTTLS',
      config: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: { rejectUnauthorized: false }
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
        },
        tls: { rejectUnauthorized: false }
      }
    }
  ]

  for (const { name, config } of configs) {
    try {
      const transporter = nodemailer.createTransport(config)
      await transporter.verify()
      console.log(`✅ ${name}接続で準備完了`)
      return transporter
    } catch (error) {
      console.log(`❌ ${name}接続失敗: ${error.message}`)
    }
  }
  
  throw new Error('利用可能な接続方法がありません')
}

async function testEmailTemplates() {
  console.log('📧 メールテンプレートテスト開始\n')
  console.log('=' .repeat(50))

  try {
    const transporter = await getWorkingTransporter()
    const testEmail = process.env.EMAIL_ADMIN || process.env.EMAIL_SUPPORT
    
    // テスト1: 認証メールテンプレート
    console.log('\n🧪 テスト1: メール認証テンプレート')
    const verificationTemplate = createTestVerificationEmail(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify?token=test123`,
      'テストユーザー'
    )
    
    const result1 = await transporter.sendMail({
      from: {
        name: '掲示板システム',
        address: process.env.EMAIL_FROM
      },
      to: testEmail,
      subject: verificationTemplate.subject,
      html: verificationTemplate.html,
      text: verificationTemplate.text,
      replyTo: process.env.EMAIL_SUPPORT
    })
    console.log(`✅ 認証メール送信成功! ID: ${result1.messageId}`)
    
    // 5秒待機
    console.log('📝 5秒待機中...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // テスト2: サポートメールテンプレート
    console.log('\n🧪 テスト2: サポートメールテンプレート')
    const supportTemplate = createTestSupportEmail()
    
    const result2 = await transporter.sendMail({
      from: {
        name: '掲示板システム サポート',
        address: process.env.EMAIL_SUPPORT
      },
      to: testEmail,
      subject: supportTemplate.subject,
      html: supportTemplate.html,
      text: supportTemplate.text
    })
    console.log(`✅ サポートメール送信成功! ID: ${result2.messageId}`)
    
    console.log('\n🎉 全てのテンプレートテスト完了!')
    console.log(`📬 ${testEmail} の受信ボックスを確認してください。`)
    
  } catch (error) {
    console.error('💥 テンプレートテスト失敗:', error.message)
    process.exit(1)
  }
}

testEmailTemplates().catch(console.error)