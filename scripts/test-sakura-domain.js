// scripts/test-sakura-domain.js
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function testSakuraDomain() {
  console.log('🌸 さくらドメイン認証テスト\n')
  console.log('=' .repeat(60))

  // 初期ドメイン（mkpapa.sakura.ne.jp）でのテスト
  const sakuraConfig = {
    host: 'mkpapa.sakura.ne.jp',
    port: 587,
    secure: false,
    auth: {
      user: 'noreply@mkpapa.com', // 初期ドメインを使用
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true,
    logger: true
  }

  // カスタムドメイン（mkpapa.com）でのテスト
  const customConfig = {
    host: 'mkpapa.sakura.ne.jp',
    port: 587,
    secure: false,
    auth: {
      user: 'noreply@mkpapa.com', // カスタムドメインを使用
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  }

  console.log('🧪 テスト1: 初期ドメイン認証 (noreply@mkpapa.com)')
  console.log('-'.repeat(50))
  
  try {
    const transporter1 = nodemailer.createTransport(sakuraConfig)
    await transporter1.verify()
    
    console.log('✅ 初期ドメイン認証: 成功!')
    console.log('💡 この認証方式が正しい可能性があります')
    
    // テストメール送信
    console.log('\n📧 テストメール送信中...')
    const result = await transporter1.sendMail({
      from: 'noreply@mkpapa.com',
      to: process.env.EMAIL_ADMIN,
      subject: '【成功】初期ドメイン認証テスト',
      text: `初期ドメイン (mkpapa.sakura.ne.jp) での認証が成功しました。\n\n送信日時: ${new Date().toLocaleString('ja-JP')}`
    })
    
    console.log(`✅ メール送信成功: ${result.messageId}`)
    return { success: true, domain: 'sakura.ne.jp', config: sakuraConfig }
    
  } catch (error) {
    console.log(`❌ 初期ドメイン認証失敗: ${error.message}`)
  }

  console.log('\n🧪 テスト2: カスタムドメイン認証 (noreply@mkpapa.com)')
  console.log('-'.repeat(50))
  
  try {
    const transporter2 = nodemailer.createTransport(customConfig)
    await transporter2.verify()
    
    console.log('✅ カスタムドメイン認証: 成功!')
    return { success: true, domain: 'mkpapa.com', config: customConfig }
    
  } catch (error) {
    console.log(`❌ カスタムドメイン認証失敗: ${error.message}`)
  }

  console.log('\n📋 診断結果')
  console.log('-'.repeat(50))
  console.log('両方のドメイン認証が失敗しました。')
  console.log('以下を確認してください：')
  console.log('1. コントロールパネル → ドメイン設定 → デフォルトドメイン設定')
  console.log('2. メールアドレスが正しく作成されているか')
  console.log('3. SMTP-AUTH設定が有効か')
  
  return { success: false }
}

testSakuraDomain()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 解決策が見つかりました!')
      console.log(`推奨ドメイン: ${result.domain}`)
      console.log('\n.env.local更新推奨設定:')
      if (result.domain === 'sakura.ne.jp') {
        console.log('SMTP_USER=noreply@mkpapa.com')
        console.log('EMAIL_FROM=noreply@mkpapa.com')
      }
    } else {
      console.log('\n❌ さらなる設定確認が必要です')
      console.log('コントロールパネルでドメイン・メール設定を確認してください')
    }
  })
  .catch(console.error)