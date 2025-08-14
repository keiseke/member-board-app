// scripts/test-email-send.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

// 働くトランスポーターを取得
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

async function testEmailSend() {
  console.log('📧 メール送信テスト開始\n')
  console.log('=' .repeat(50))

  try {
    const transporter = await getWorkingTransporter()
    
    // テストメール設定
    const testEmails = [
      {
        name: '基本テスト',
        options: {
          from: {
            name: process.env.EMAIL_FROM_NAME || '掲示板システム',
            address: process.env.EMAIL_FROM
          },
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: '【テスト】メール送信機能確認',
          html: `
            <h2>🎉 メール送信テスト成功！</h2>
            <p>さくらレンタルサーバーからのメール送信が正常に動作しています。</p>
            <hr>
            <p><strong>送信情報:</strong></p>
            <ul>
              <li>送信者: ${process.env.EMAIL_FROM}</li>
              <li>SMTP Host: ${process.env.SMTP_HOST}</li>
              <li>送信日時: ${new Date().toLocaleString('ja-JP')}</li>
            </ul>
          `,
          text: 'メール送信テスト成功！さくらレンタルサーバーからのメール送信が正常に動作しています。'
        }
      },
      {
        name: '日本語件名テスト',
        options: {
          from: process.env.EMAIL_FROM,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: '【重要】パスワードリセット🔑 - 会員制掲示板',
          html: `
            <h2>パスワードリセットのお知らせ</h2>
            <p>パスワードリセットのリクエストを受け付けました。</p>
            <p><a href="https://example.com/reset">こちらをクリック</a>してパスワードを再設定してください。</p>
            <p>※このリンクは1時間後に無効になります。</p>
          `,
          text: 'パスワードリセットのお知らせ。リンクをクリックしてパスワードを再設定してください。'
        }
      }
    ]

    // テスト実行
    for (let i = 0; i < testEmails.length; i++) {
      const test = testEmails[i]
      console.log(`\n🧪 ${test.name} (${i + 1}/${testEmails.length})`)
      
      try {
        const result = await transporter.sendMail(test.options)
        console.log(`✅ 送信成功! Message ID: ${result.messageId}`)
        console.log(`   宛先: ${test.options.to}`)
        console.log(`   件名: ${test.options.subject}`)
        
        // 送信間隔を設ける
        if (i < testEmails.length - 1) {
          console.log('   📝 5秒待機中...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      } catch (error) {
        console.log(`❌ 送信失敗: ${error.message}`)
      }
    }

  } catch (error) {
    console.error('💥 メール送信テスト失敗:', error.message)
    process.exit(1)
  }
}

testEmailSend()
  .then(() => {
    console.log('\n🎉 メール送信テスト完了!')
    console.log('📬 受信ボックスを確認してください。')
  })
  .catch(error => {
    console.error('💥 予期しないエラー:', error)
  })