// scripts/debug-password.js
require('dotenv').config({ path: '.env.local' })

console.log('🔍 パスワードデバッグ情報')
console.log('=' .repeat(50))
console.log('Raw SMTP_PASSWORD:', JSON.stringify(process.env.SMTP_PASSWORD))
console.log('Length:', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 'undefined')
console.log('First 3 chars:', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.substring(0, 3) : 'undefined')
console.log('Last 3 chars:', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.substring(process.env.SMTP_PASSWORD.length - 3) : 'undefined')
console.log('Contains special chars:', process.env.SMTP_PASSWORD ? /[&#()]/g.test(process.env.SMTP_PASSWORD) : 'undefined')

// Base64エンコードテスト（SMTPで使用される）
if (process.env.SMTP_PASSWORD) {
  console.log('\n📧 SMTP認証テスト:')
  console.log('Base64 encoded:', Buffer.from(process.env.SMTP_PASSWORD).toString('base64'))
  
  // 特殊文字のエスケープが必要かチェック
  const specialChars = ['&', '#', '(', ')', '<', '>', '"', "'", '\\']
  const foundSpecialChars = specialChars.filter(char => process.env.SMTP_PASSWORD.includes(char))
  if (foundSpecialChars.length > 0) {
    console.log('⚠️  特殊文字検出:', foundSpecialChars.join(', '))
  }
}