// scripts/test-clean.js - 完全にクリーンなテスト
const nodemailer = require('nodemailer')

// 環境変数を一切使わない完全なハードコード
const cleanConfig = {
  host: 'mkpapa.sakura.ne.jp',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@mkpapa.com',
    pass: 'Q&#ezF(L6299'
  },
  tls: {
    rejectUnauthorized: false
  }
}

console.log('🧹 完全クリーンテスト')
console.log('=' .repeat(50))
console.log('設定確認:')
console.log(`Host: ${cleanConfig.host}`)
console.log(`Port: ${cleanConfig.port}`)  
console.log(`User: ${cleanConfig.auth.user}`)
console.log(`Pass: ${cleanConfig.auth.pass}`)
console.log(`Pass (Base64): ${Buffer.from(cleanConfig.auth.pass).toString('base64')}`)

async function cleanTest() {
  try {
    console.log('\n🔌 接続テスト開始...')
    const transporter = nodemailer.createTransport(cleanConfig)
    await transporter.verify()
    
    console.log('✅ 認証成功!')
    return true
    
  } catch (error) {
    console.log('❌ 認証失敗:', error.message)
    return false
  }
}

cleanTest()
  .then(success => {
    if (success) {
      console.log('\n🎉 パスワードと設定は正しいです')
    } else {
      console.log('\n❌ パスワードまたは設定に問題があります')
    }
  })